import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, ArrowUpRight, Minus, Plus, Trash2 } from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { formatBDT } from '../data/products';
import { api } from '../services/api';
import { useStore } from '../context/StoreContext';
import { usePreviewTheme } from '../context/PreviewThemeContext.jsx';

const imageFallback = 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=900&q=80';
const mapProduct = (item) => ({
  id: item._id,
  slug: item.slug,
  name: item.name,
  category: item.category?.name || 'General',
  categoryId: item.category?._id,
  price: item.price,
  compareAt: item.compareAtPrice,
  rating: item.ratingAverage || 0,
  reviews: item.ratingCount || 0,
  tag: item.stock < 1 ? 'Out of stock' : item.compareAtPrice > item.price ? 'Special price' : 'Everyday pick',
  image: item.images?.[0]?.url || imageFallback,
  description: item.description,
  stock: item.stock
});

function useCatalog() {
  return useQuery({
    queryKey: ['catalog'],
    queryFn: async () => {
      const [productResponse, categoryResponse] = await Promise.all([
        api.get('/products', { params: { limit: 48, sort: 'popular' } }),
        api.get('/categories')
      ]);
      return {
        products: productResponse.data.items.map(mapProduct),
        categories: categoryResponse.data.categories
      };
    },
    staleTime: 60_000
  });
}

function CatalogState({ loading, error }) {
  if (loading) return <div className="container py-20 text-center text-sm text-slate-500">Loading the NEXORA collection…</div>;
  if (error) return <div className="container py-20 text-center"><h2 className="text-lg font-bold">We couldn't load the collection.</h2><p className="mt-2 text-sm text-slate-500">Please check your connection and try again.</p></div>;
  return null;
}


export function HomePage() {
  const { data, isLoading, isError } = useCatalog();
  const [active, setActive] = useState('All');
  const theme = usePreviewTheme();
  const draft = theme.draft;
  if (isLoading || isError) return <CatalogState loading={isLoading} error={isError}/>;
  const products = data.products;
  const categories = ['All', ...data.categories.map(category => category.name)];
  const shown = products.filter(product => active === 'All' || product.category === active).slice(0, 4);
  const columns = theme.active && draft.productColumns === '2' ? 'grid-cols-2' : theme.active && draft.productColumns === '3' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2 md:grid-cols-4';
  const heroImage = theme.active && draft.heroImage ? draft.heroImage : imageFallback;
  return <main className="container">
    <section className="my-7 grid overflow-hidden rounded-[26px] md:min-h-[390px] md:grid-cols-[1.05fr_.95fr]" style={{ background: theme.active ? '#f4f6fb' : '#eaf0fb' }}>
      <div className="relative z-10 px-7 py-12 md:px-14 md:py-16"><p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: theme.active ? draft.primaryColor : '#2563eb' }}>{theme.active ? draft.heroEyebrow : 'The everyday edit · NEXORA collection'}</p><h1 className="display mt-5 text-4xl font-extrabold leading-[1.08] md:text-6xl">{theme.active ? draft.heroTitle : <>Find your next<br/>favourite thing.</>}</h1><p className="mt-5 max-w-sm text-sm leading-7 text-slate-500">{theme.active ? draft.heroDescription : 'Thoughtfully picked essentials for the way you live, work and move. Good design. Better everyday.'}</p><Link to="/shop" className="mt-7 inline-flex items-center gap-3 rounded-full px-6 py-4 text-xs font-bold text-white shadow-lg" style={{ background: theme.active ? draft.primaryColor : '#2563eb' }}>Explore collection <ArrowUpRight size={16}/></Link></div>
      <div className="relative min-h-60"><img className="absolute inset-0 h-full w-full object-cover" src={heroImage} alt="Curated seasonal collection"/><div className="absolute bottom-5 right-5 rounded-xl bg-white px-5 py-3 text-[10px] shadow-xl">{theme.active ? draft.storeName : 'THE NEXORA EDIT'} <b className="mt-1 block text-lg">Made for everyday</b></div></div>
    </section>
    {theme.active && draft.showPromoStrip && <div className="mb-7 rounded-xl px-4 py-3 text-center text-xs font-semibold text-white" style={{ background: draft.primaryColor }}>{draft.promoText || 'Your promotional message'}</div>}{theme.active && <p className="mb-7 text-center text-[10px] text-slate-500">Demo delivery: ৳{draft.demoShippingFee || '0'} · Free delivery from ৳{draft.demoFreeShippingThreshold || '0'} (preview only)</p>}
    {(!theme.active || draft.showCategories) && <section id="categories" className="py-9"><div className="mb-6 flex items-end justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: theme.active ? draft.primaryColor : '#2563eb' }}>Curated for you</p><h2 className="display mt-2 text-2xl font-extrabold">Shop by category</h2></div><Link to="/shop" className="text-xs font-bold" style={{ color: theme.active ? draft.primaryColor : '#2563eb' }}>View all ↗</Link></div><div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">{categories.slice(1).map((category, index) => <button key={category} onClick={() => { setActive(category); document.getElementById('featured')?.scrollIntoView({ behavior: 'smooth' }); }} className="rounded-2xl border border-slate-100 p-5 text-center transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg"><span className="mx-auto grid h-12 w-12 place-items-center rounded-2xl text-xl" style={{ background: theme.active ? draft.primaryColor + '15' : '#eff6ff', color: theme.active ? draft.primaryColor : '#2563eb' }}>{['♧','⌁','⌂','✿','◇'][index % 5]}</span><b className="mt-3 block text-xs">{category}</b><span className="mt-1 block text-[10px] text-slate-400">Explore collection</span></button>)}</div></section>}
    {(!theme.active || draft.showFeatured) && <section id="featured" className="py-10"><div className="mb-6 flex flex-wrap items-end justify-between gap-4"><div><p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: theme.active ? draft.primaryColor : '#2563eb' }}>The good stuff</p><h2 className="display mt-2 text-2xl font-extrabold">Picked for your everyday</h2></div><Link to="/shop" className="text-xs font-bold" style={{ color: theme.active ? draft.primaryColor : '#2563eb' }}>Shop all products ↗</Link></div><div className="mb-6 flex flex-wrap gap-2">{categories.map(category => <button key={category} onClick={() => setActive(category)} className={`rounded-full border px-4 py-2 text-[11px] ${active === category ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-500'}`}>{category}</button>)}</div><div className={`grid gap-x-4 gap-y-8 ${columns} md:gap-6`}>{shown.map(product => <ProductCard key={product.id} product={product}/>)}</div>{!shown.length && <p className="py-10 text-center text-sm text-slate-500">No products in this category yet.</p>}</section>}
    <section className="my-12 grid overflow-hidden rounded-3xl bg-slate-100 md:grid-cols-2"><div className="p-8 md:p-12"><p className="text-[10px] font-bold uppercase tracking-[.2em]" style={{ color: theme.active ? draft.primaryColor : '#2563eb' }}>A little something extra</p><h2 className="display mt-4 text-3xl font-extrabold">Make room for<br/>better everyday.</h2><p className="mt-4 max-w-sm text-sm leading-7 text-slate-500">Discover pieces that bring a little more joy to your routine. Thoughtful picks, honest prices and a better way to shop.</p><Link to="/shop" className="mt-6 inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-3 text-xs font-bold text-white">Discover more <ArrowRight size={15}/></Link></div><img className="h-56 w-full object-cover md:h-full" src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1000&q=85" alt="Minimal home interior"/></section>
    {(!theme.active || draft.showBenefits) && <div className="grid grid-cols-2 gap-5 border-y border-slate-100 py-7 md:grid-cols-4">{[['↗','Free delivery','On orders over ৳3,000'],['♧','Quality first','Curated essentials'],['↺','Easy returns','Clear customer policies'],['♡','Here to help','Friendly support']].map(item => <div key={item[1]} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl text-lg" style={{ background: theme.active ? draft.primaryColor + '15' : '#eff6ff', color: theme.active ? draft.primaryColor : '#2563eb' }}>{item[0]}</span><div><b className="block text-xs">{item[1]}</b><small className="text-[10px] text-slate-400">{item[2]}</small></div></div>)}</div>}
  </main>;
}

export function ShopPage() {
  const { data, isLoading, isError } = useCatalog();
  const [params] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') || '');
  const [category, setCategory] = useState('All');
  const [sort, setSort] = useState('featured');
  const list = useMemo(() => {
    const result = (data?.products || []).filter(product => (category === 'All' || product.category === category) && `${product.name} ${product.category}`.toLowerCase().includes(query.toLowerCase()));
    if (sort === 'low') result.sort((a, b) => a.price - b.price);
    if (sort === 'high') result.sort((a, b) => b.price - a.price);
    if (sort === 'rating') result.sort((a, b) => b.rating - a.rating);
    return result;
  }, [data?.products, query, category, sort]);
  if (isLoading || isError) return <CatalogState loading={isLoading} error={isError}/>;
  const categories = ['All', ...data.categories.map(item => item.name)];
  return <main className="container py-12"><p className="text-[10px] font-bold uppercase tracking-[.2em] text-blue-600">Discover something good</p><h1 className="display mt-2 text-4xl font-extrabold">Shop all products</h1><div className="mt-7 flex flex-col justify-between gap-4 md:flex-row"><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search products..." className="w-full rounded-full border border-slate-200 px-5 py-3 text-sm outline-none focus:border-blue-400 md:max-w-sm"/><select value={sort} onChange={event => setSort(event.target.value)} className="rounded-full border border-slate-200 px-4 py-3 text-xs"><option value="featured">Featured</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="rating">Top rated</option></select></div><div className="my-5 flex flex-wrap gap-2">{categories.map(item => <button key={item} onClick={() => setCategory(item)} className={`rounded-full border px-4 py-2 text-[11px] ${category === item ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500'}`}>{item}</button>)}</div><p className="mb-5 text-xs text-slate-400">{list.length} products</p><div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">{list.map(product => <ProductCard key={product.id} product={product}/>)}</div>{!list.length && <p className="rounded-2xl bg-slate-50 p-12 text-center text-sm text-slate-500">No products found. Try another search.</p>}</main>;
}

export function CartPage() {
  const { cart, updateQuantity } = useStore();
  const { data, isLoading, isError } = useCatalog();
  if (isLoading || isError) return <CatalogState loading={isLoading} error={isError}/>;
  const rows = cart.map(item => ({ ...item, product: data.products.find(product => product.id === item.id) })).filter(item => item.product);
  const unavailableItems = cart.filter(item => !data.products.some(product => product.id === item.id));
  const subtotal = rows.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const hasStockIssue = unavailableItems.length > 0 || rows.some(item => item.quantity > item.product.stock || item.product.stock < 1);
  return <main className="container min-h-[55vh] py-12"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Your selection</p><h1 className="display mt-2 text-4xl font-extrabold">Shopping bag</h1>{!rows.length && !unavailableItems.length ? <div className="mt-10 rounded-3xl bg-slate-50 p-12 text-center"><p className="text-sm text-slate-500">Your bag is waiting for something good.</p><Link to="/shop" className="mt-5 inline-block rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white">Explore products</Link></div> : <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_340px]"><div className="divide-y divide-slate-100">{rows.map(({ product, quantity }) => <div key={product.id} className="flex gap-4 py-5"><img src={product.image} alt={product.name} className="h-28 w-24 rounded-xl object-cover"/><div className="flex-1"><h3 className="text-sm font-bold">{product.name}</h3><p className="mt-2 text-xs text-slate-400">{formatBDT(product.price)}</p>{quantity > product.stock && <p className="mt-2 text-[10px] font-semibold text-rose-600">Only {product.stock} currently available. Reduce quantity to continue.</p>}<div className="mt-4 flex items-center gap-3"><button aria-label="Decrease quantity" onClick={() => updateQuantity(product.id, quantity - 1, product.stock)} className="rounded border p-1"><Minus size={13}/></button><span className="text-xs">{quantity}</span><button aria-label="Increase quantity" disabled={quantity >= product.stock} onClick={() => updateQuantity(product.id, quantity + 1, product.stock)} className="rounded border p-1 disabled:opacity-30"><Plus size={13}/></button><button aria-label="Remove item" onClick={() => updateQuantity(product.id, 0)} className="ml-3 text-slate-400"><Trash2 size={15}/></button></div></div><b className="text-sm">{formatBDT(product.price * quantity)}</b></div>)}</div>{unavailableItems.length > 0 && <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4"><h2 className="text-xs font-bold text-amber-900">Items needing attention</h2><p className="mt-1 text-xs text-amber-800">Some saved items are no longer available. Remove them before checkout.</p>{unavailableItems.map(item => <div key={item.id} className="mt-3 flex items-center justify-between gap-3 border-t border-amber-200 pt-3 text-xs"><span className="break-all text-amber-900">Unavailable product · {item.id}</span><button onClick={() => updateQuantity(item.id, 0)} className="shrink-0 font-bold text-rose-700 underline">Remove</button></div>)}</section>}<aside className="h-fit rounded-2xl bg-slate-50 p-6"><h2 className="font-bold">Order summary</h2><div className="mt-5 flex justify-between text-xs"><span>Subtotal</span><b>{formatBDT(subtotal)}</b></div><div className="mt-3 flex justify-between text-xs text-slate-500"><span>Shipping</span><span>{subtotal >= 3000 ? 'Free' : formatBDT(80)}</span></div><div className="mt-5 border-t pt-5"><div className="flex justify-between"><b className="text-sm">Estimated total</b><b>{formatBDT(subtotal + (subtotal >= 3000 ? 0 : 80))}</b></div>{hasStockIssue ? <button disabled className="mt-5 w-full rounded-full bg-slate-300 py-4 text-xs font-bold text-slate-500">Resolve cart items to continue</button> : <Link to="/checkout" className="mt-5 block w-full rounded-full bg-blue-600 py-4 text-center text-xs font-bold text-white">Continue to checkout</Link>}<p className="mt-3 text-center text-[10px] leading-5 text-slate-400">Cash on delivery only. Stock and prices are checked again by the server.</p></div></aside></div>}</main>;
}

export function WishlistPage() {
  const { wishlist } = useStore();
  const { data, isLoading, isError } = useCatalog();
  if (isLoading || isError) return <CatalogState loading={isLoading} error={isError}/>;
  const list = data.products.filter(product => wishlist.includes(product.id));
  return <main className="container min-h-[55vh] py-12"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Saved for later</p><h1 className="display mt-2 text-4xl font-extrabold">Your wishlist</h1>{list.length ? <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4 md:gap-6">{list.map(product => <ProductCard key={product.id} product={product}/>)}</div> : <div className="mt-10 rounded-3xl bg-slate-50 p-12 text-center"><p className="text-sm text-slate-500">You haven't saved anything yet.</p><Link to="/shop" className="mt-5 inline-block rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white">Explore products</Link></div>}</main>;
}

export function NotFound() { return <main className="container grid min-h-[55vh] place-items-center py-20 text-center"><div><p className="display text-7xl font-extrabold text-blue-600">404</p><h1 className="display mt-4 text-3xl font-extrabold">This page wandered off.</h1><Link className="mt-6 inline-block rounded-full bg-slate-900 px-6 py-3 text-xs font-bold text-white" to="/">Back to home</Link></div></main>; }
