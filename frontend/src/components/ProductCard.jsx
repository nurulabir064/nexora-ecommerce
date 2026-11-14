import { Heart, Star, Plus } from 'lucide-react';
import { Link } from 'react-router';
import { formatBDT } from '../data/products';
import { useStore } from '../context/StoreContext';

export default function ProductCard({ product }) {
  const { addToCart, wishlist, toggleWishlist } = useStore();
  const saved = wishlist.includes(product.id);
  const unavailable = product.stock < 1;

  return <article className="product-card group min-w-0">
    <div className="product-image relative aspect-[.92] overflow-hidden rounded-2xl bg-slate-100">
      <Link to={`/products/${product.slug}`} className="block h-full w-full text-left" aria-label={`View ${product.name}`}>
        <img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover"/>
        <span className="absolute left-3 top-3 rounded-md bg-white px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wide">{product.tag}</span>
      </Link>
      <button aria-label={saved ? 'Remove from wishlist' : 'Add to wishlist'} onClick={() => toggleWishlist(product.id)} className={`focus-ring absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-white shadow-sm ${saved ? 'text-rose-500' : 'text-slate-600'}`}><Heart size={17} fill={saved ? 'currentColor' : 'none'}/></button>
    </div>
    <div className="pt-3">
      <div className="flex justify-between text-[10px] uppercase tracking-wider text-slate-400"><span>{product.category}</span><span className="flex items-center gap-1 text-amber-500">{product.reviews > 0 ? <><Star size={12} fill="currentColor"/>{Number(product.rating).toFixed(1)} <span className="text-slate-400">({product.reviews})</span></> : <span className="text-slate-400">New</span>}</span></div>
      <Link to={`/products/${product.slug}`} className="mt-2 block text-left text-sm font-semibold text-slate-800 hover:text-blue-600">{product.name}</Link>
      <div className="mt-2 flex items-center gap-2"><b className="text-sm">{formatBDT(product.price)}</b>{product.compareAt > product.price && <s className="text-xs text-slate-400">{formatBDT(product.compareAt)}</s>}</div>
      <button disabled={unavailable} onClick={() => addToCart(product.id, product.stock)} className="focus-ring mt-3 flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 py-2.5 text-xs font-bold transition hover:border-slate-900 hover:bg-slate-900 hover:text-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400">{unavailable ? 'Out of stock' : 'Add to bag'} {!unavailable && <Plus size={14}/>}</button>
    </div>
  </article>;
}
