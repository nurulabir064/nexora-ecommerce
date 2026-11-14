import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Heart, Minus, Plus, ShoppingBag, Star } from 'lucide-react';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';
import { formatBDT } from '../data/products';

const fallbackImage = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1000&q=80';

export function ProductDetailsPage() {
  const { slug } = useParams();
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reviewForm, setReviewForm] = useState({ orderId: '', rating: '5', title: '', comment: '' });
  const [reviewNotice, setReviewNotice] = useState('');
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const productQuery = useQuery({
    queryKey: ['product', slug],
    queryFn: async () => (await api.get(`/products/${encodeURIComponent(slug)}`)).data.item,
    enabled: Boolean(slug),
    staleTime: 60_000
  });
  const product = productQuery.data;
  const reviewsQuery = useQuery({
    queryKey: ['product-reviews', product?._id],
    queryFn: async () => (await api.get(`/reviews/product/${product._id}`)).data.reviews,
    enabled: Boolean(product?._id),
    staleTime: 60_000
  });
  const ordersQuery = useQuery({
    queryKey: ['my-orders-for-review', user?.id],
    queryFn: async () => (await api.get('/orders/mine')).data.orders,
    enabled: Boolean(user?.id),
    staleTime: 30_000
  });
  const eligibleOrders = (ordersQuery.data || []).filter(order => order.status === 'delivered' && order.items?.some(item => String(item.product) === String(product?._id)));
  const reviewMutation = useMutation({
    mutationFn: async () => (await api.post('/reviews', {
      productId: product._id,
      orderId: reviewForm.orderId,
      rating: Number(reviewForm.rating),
      title: reviewForm.title.trim() || undefined,
      comment: reviewForm.comment.trim()
    })).data,
    onSuccess: () => {
      setReviewNotice('Your review was submitted and is awaiting moderation.');
      setReviewForm({ orderId: '', rating: '5', title: '', comment: '' });
      queryClient.invalidateQueries({ queryKey: ['product-reviews', product._id] });
    },
    onError: error => setReviewNotice(error.response?.data?.message || 'Could not submit your review. Please try again.')
  });

  if (productQuery.isLoading) return <main className="container py-24 text-center text-sm text-slate-500">Loading product details…</main>;
  if (productQuery.isError || !product) return <main className="container min-h-[55vh] py-20 text-center"><p className="text-xs font-bold uppercase tracking-widest text-blue-600">Product unavailable</p><h1 className="display mt-3 text-3xl font-extrabold">We couldn't find this product.</h1><p className="mt-3 text-sm text-slate-500">It may have been removed or the link may be incorrect.</p><Link to="/shop" className="mt-7 inline-flex items-center gap-2 rounded-full bg-slate-900 px-6 py-3 text-xs font-bold text-white"><ArrowLeft size={15}/> Back to shop</Link></main>;

  const images = product.images?.length ? product.images : [{ url: fallbackImage, alt: product.name }];
  const available = Math.max(0, product.stock || 0);
  const saved = wishlist.includes(product._id);
  const reviews = reviewsQuery.data || [];

  return <main className="container py-8 md:py-12">
    <nav aria-label="Breadcrumb" className="mb-7 flex flex-wrap items-center gap-2 text-xs text-slate-400"><Link to="/" className="hover:text-blue-600">Home</Link><span>/</span><Link to="/shop" className="hover:text-blue-600">Shop</Link><span>/</span><span className="max-w-[55vw] truncate text-slate-700">{product.name}</span></nav>
    <section className="grid gap-8 lg:grid-cols-[1.05fr_.95fr] lg:gap-14">
      <div className="min-w-0">
        <div className="overflow-hidden rounded-3xl bg-slate-100"><img src={images[activeImage]?.url || fallbackImage} alt={images[activeImage]?.alt || product.name} className="aspect-square w-full object-cover"/></div>
        {images.length > 1 && <div className="mt-3 grid grid-cols-4 gap-3">{images.map((image, index) => <button key={`${image.url}-${index}`} onClick={() => setActiveImage(index)} aria-label={`View image ${index + 1}`} aria-pressed={activeImage === index} className={`overflow-hidden rounded-xl border-2 ${activeImage === index ? 'border-blue-600' : 'border-transparent'}`}><img src={image.url} alt={image.alt || `${product.name} ${index + 1}`} className="aspect-square w-full object-cover"/></button>)}</div>}
      </div>
      <div className="lg:py-5">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">{product.category?.name || 'NEXORA collection'}</p>
        <h1 className="display mt-3 text-3xl font-extrabold leading-tight md:text-4xl">{product.name}</h1>
        <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-slate-500"><span className="flex items-center gap-1 text-amber-500"><Star size={14} fill="currentColor"/>{Number(product.ratingAverage || 0).toFixed(1)}</span><span>{product.ratingCount || 0} customer reviews</span>{product.brand && <span>Brand: {product.brand}</span>}</div>
        <div className="mt-7 flex items-baseline gap-3"><strong className="text-2xl">{formatBDT(product.price)}</strong>{product.compareAtPrice > product.price && <><del className="text-sm text-slate-400">{formatBDT(product.compareAtPrice)}</del><span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-bold text-emerald-700">Save {Math.round((1 - product.price / product.compareAtPrice) * 100)}%</span></>}</div>
        <p className="mt-6 whitespace-pre-line text-sm leading-7 text-slate-600">{product.description}</p>
        <div className="mt-6 flex items-center gap-2 text-xs"><span className={`h-2 w-2 rounded-full ${available ? 'bg-emerald-500' : 'bg-rose-500'}`}/><b className={available ? 'text-emerald-700' : 'text-rose-600'}>{available ? `${available} in stock` : 'Currently out of stock'}</b></div>
        {available > 0 && <div className="mt-7 flex flex-wrap items-center gap-3"><div className="flex items-center rounded-full border border-slate-200 p-1"><button onClick={() => setQuantity(value => Math.max(1, value - 1))} disabled={quantity <= 1} aria-label="Decrease quantity" className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-30"><Minus size={15}/></button><span className="w-9 text-center text-sm font-semibold" aria-live="polite">{quantity}</span><button onClick={() => setQuantity(value => Math.min(Math.min(available, 20), value + 1))} disabled={quantity >= Math.min(available, 20)} aria-label="Increase quantity" className="grid h-9 w-9 place-items-center rounded-full disabled:opacity-30"><Plus size={15}/></button></div><span className="text-[10px] text-slate-400">Maximum 20 per order</span></div>}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><button disabled={!available} onClick={() => addToCart(product._id, Math.min(available, 20), quantity)} className="flex flex-1 items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-4 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"><ShoppingBag size={16}/> Add to bag</button><button onClick={() => toggleWishlist(product._id)} aria-pressed={saved} className={`flex items-center justify-center gap-2 rounded-full border px-6 py-4 text-xs font-bold ${saved ? 'border-rose-200 bg-rose-50 text-rose-600' : 'border-slate-200 text-slate-700'}`}><Heart size={16} fill={saved ? 'currentColor' : 'none'}/>{saved ? 'Saved' : 'Add to wishlist'}</button></div>
        <div className="mt-8 grid grid-cols-2 gap-3 border-y border-slate-100 py-5 text-xs"><div><b>Delivery</b><p className="mt-1 text-slate-500">৳80 · Free over ৳3,000</p></div><div><b>Payment</b><p className="mt-1 text-slate-500">Cash on delivery</p></div></div>
      </div>
    </section>
    <section className="mt-14 border-t border-slate-100 pt-9"><div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Customer feedback</p><h2 className="display mt-2 text-2xl font-extrabold">Product reviews</h2></div><span className="text-xs text-slate-400">{product.ratingCount || 0} total</span></div>
      {reviewsQuery.isLoading ? <p className="py-8 text-sm text-slate-500">Loading reviews…</p> : reviewsQuery.isError ? <p className="py-8 text-sm text-slate-500">Reviews are temporarily unavailable.</p> : !reviews.length ? <p className="mt-5 rounded-2xl bg-slate-50 p-7 text-sm text-slate-500">No published reviews yet. Be the first to share your experience after a delivered order.</p> : <div className="mt-5 grid gap-4 md:grid-cols-2">{reviews.map(review => <article key={review._id} className="rounded-2xl border border-slate-100 p-5"><div className="flex items-center justify-between gap-3"><b className="text-sm">{review.user?.name || 'Verified customer'}</b><span className="flex items-center gap-1 text-xs text-amber-500"><Star size={13} fill="currentColor"/>{review.rating}/5</span></div>{review.title && <h3 className="mt-3 text-sm font-semibold">{review.title}</h3>}<p className="mt-2 text-sm leading-6 text-slate-600">{review.comment}</p><p className="mt-3 text-[10px] text-slate-400">{new Date(review.createdAt).toLocaleDateString('en-BD')}</p></article>)}</div>}
      {user && eligibleOrders.length > 0 && <form onSubmit={event => { event.preventDefault(); setReviewNotice(''); reviewMutation.mutate(); }} className="mt-8 max-w-2xl space-y-3 rounded-2xl border border-slate-100 p-5"><h3 className="text-sm font-bold">Share your experience</h3><label className="block text-xs text-slate-500">Delivered order<select required value={reviewForm.orderId} onChange={event => setReviewForm(current => ({ ...current, orderId: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800"><option value="">Select an order</option>{eligibleOrders.map(order => <option key={order._id} value={order._id}>{order.orderNumber}</option>)}</select></label><label className="block text-xs text-slate-500">Rating<select value={reviewForm.rating} onChange={event => setReviewForm(current => ({ ...current, rating: event.target.value }))} className="mt-2 w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800">{[5,4,3,2,1].map(value => <option key={value} value={value}>{value} / 5</option>)}</select></label><input maxLength={120} placeholder="Review title (optional)" value={reviewForm.title} onChange={event => setReviewForm(current => ({ ...current, title: event.target.value }))} className="w-full rounded-xl border border-slate-200 p-3 text-sm"/><textarea required minLength={5} maxLength={2000} rows={4} placeholder="What did you think about this product?" value={reviewForm.comment} onChange={event => setReviewForm(current => ({ ...current, comment: event.target.value }))} className="w-full rounded-xl border border-slate-200 p-3 text-sm"/><button disabled={reviewMutation.isPending} className="rounded-full bg-slate-900 px-6 py-3 text-xs font-bold text-white disabled:opacity-50">{reviewMutation.isPending ? 'Submitting…' : 'Submit review'}</button>{reviewNotice && <p role="status" className="text-xs text-slate-600">{reviewNotice}</p>}</form>}
      {!user && <p className="mt-6 text-xs text-slate-500">Sign in and complete a delivery to submit a verified review.</p>}
      {user && ordersQuery.isLoading && <p className="mt-5 text-xs text-slate-400">Checking your delivered orders…</p>}
      {user && !ordersQuery.isLoading && !eligibleOrders.length && <p className="mt-5 text-xs text-slate-400">A review form becomes available after this product has been delivered to you.</p>}
    </section>
  </main>;
}
