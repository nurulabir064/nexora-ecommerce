import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router';
import { Heart, Search, ShoppingBag, Menu, X, UserRound } from 'lucide-react';
import { useStore } from '../context/StoreContext';
import { useAuth } from '../context/AuthContext';

export default function SiteLayout() {
  const { cartCount, wishlist } = useStore();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  return <>
    <div className="bg-[#172b4d] px-4 py-2.5 text-center text-[10px] tracking-widest text-blue-50">WELCOME TO NEXORA · <b className="text-blue-200">FREE SHIPPING</b> ON ORDERS OVER ৳3,000</div>
    <header className="sticky top-0 z-30 border-b border-slate-100 bg-white/90 backdrop-blur-xl">
      <div className="container flex h-[76px] items-center gap-5 md:gap-8">
        <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)} aria-label="Toggle navigation">{menuOpen ? <X/> : <Menu/>}</button>
        <Link to="/" className="display text-2xl font-extrabold tracking-tight text-[#172b4d]">NEX<span className="text-blue-600">O</span>RA.</Link>
        <nav className="hidden items-center gap-7 text-xs font-semibold text-slate-600 md:flex"><NavLink to="/shop">Shop</NavLink><a href="/#categories">Categories</a><a href="/#story">Our story</a></nav>
        <form action="/shop" className="ml-auto hidden max-w-md flex-1 items-center gap-3 rounded-full border border-slate-200 bg-slate-50 px-4 py-3 md:flex"><Search size={16} className="text-slate-400"/><input name="q" placeholder="Search products, brands and more..." className="w-full bg-transparent text-xs outline-none"/></form>
        <div className="ml-auto flex items-center gap-4 md:ml-0">
          <Link to="/account" aria-label={user ? 'Your account' : 'Sign in'} title={user ? 'Account' : 'Sign in'}><UserRound size={19}/></Link>
          {user && <Link to="/orders" className="hidden text-xs font-semibold text-slate-600 lg:block">Orders</Link>}
          {user?.role === 'admin' && <Link to="/admin" className="hidden text-xs font-semibold text-blue-600 lg:block">Admin</Link>}
          <Link to="/wishlist" aria-label="Wishlist" className="relative"><Heart size={20}/>{wishlist.length > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[9px] text-white">{wishlist.length}</span>}</Link>
          <Link to="/cart" aria-label="Shopping bag" className="relative"><ShoppingBag size={20}/>{cartCount > 0 && <span className="absolute -right-2 -top-2 grid h-4 min-w-4 place-items-center rounded-full bg-blue-600 px-1 text-[9px] text-white">{cartCount}</span>}</Link>
        </div>
      </div>
      {menuOpen && <nav className="container flex flex-col gap-4 border-t border-slate-100 py-5 text-sm md:hidden"><Link onClick={() => setMenuOpen(false)} to="/shop">Shop all</Link><Link onClick={() => setMenuOpen(false)} to="/account">{user ? 'My account' : 'Sign in / Register'}</Link>{user && <Link onClick={() => setMenuOpen(false)} to="/orders">My orders</Link>}{user?.role === 'admin' && <Link onClick={() => setMenuOpen(false)} to="/admin">Admin dashboard</Link>}<Link onClick={() => setMenuOpen(false)} to="/wishlist">Wishlist</Link><Link onClick={() => setMenuOpen(false)} to="/cart">Shopping bag</Link></nav>}
    </header>
    <Outlet/>
    <footer id="story" className="mt-20 bg-slate-50 py-12"><div className="container grid gap-9 sm:grid-cols-2 lg:grid-cols-4"><div><Link to="/" className="display text-2xl font-extrabold">NEX<span className="text-blue-600">O</span>RA.</Link><p className="mt-3 max-w-xs text-xs leading-6 text-slate-500">Thoughtfully picked essentials for modern everyday living. A better way to discover the things you love.</p></div><div><b className="text-xs">Explore</b><Link className="mt-4 block text-xs text-slate-500" to="/shop">Shop all</Link><Link className="mt-3 block text-xs text-slate-500" to="/wishlist">Wishlist</Link></div><div><b className="text-xs">Customer care</b><p className="mt-4 text-xs text-slate-500">Shipping & delivery</p><p className="mt-3 text-xs text-slate-500">Returns & refunds</p></div><div><b className="text-xs">Get in touch</b><p className="mt-4 text-xs text-slate-500">Dhaka, Bangladesh</p></div></div><div className="container mt-10 border-t border-slate-200 pt-5 text-[10px] text-slate-400">© 2026 NEXORA · Portfolio project. Cash on delivery demo; no online payment is collected.</div></footer>
  </>;
}
