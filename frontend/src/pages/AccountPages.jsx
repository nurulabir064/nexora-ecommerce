import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useStore } from '../context/StoreContext';
import { formatBDT } from '../data/products';
import { buildOrderWhatsAppUrl, STORE_PHONE_LOCAL } from '../data/storeContact';

function ErrorMessage({ children }) {
  return children ? <p role="alert" className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-xs text-rose-700">{children}</p> : null;
}

export function AccountPage() {
  const { user, loading, login, register, updateProfile, logout } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '' });
  const [profileNotice, setProfileNotice] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (user) setProfileForm({ name: user.name });
  }, [user?.id, user?.name, user?.email]);

  const submit = async event => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      if (mode === 'register') await register(form);
      else await login({ email: form.email, password: form.password });
      navigate('/');
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not complete your request. Please try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <main className="container py-20 text-center text-sm text-slate-500">Checking your account…</main>;
  if (user) return <main className="container min-h-[55vh] max-w-xl py-16"><div className="rounded-3xl border border-slate-100 p-8 md:p-10"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Your account</p><h1 className="display mt-3 text-3xl font-extrabold">Welcome, {user.name}</h1><p className="mt-2 text-sm text-slate-500">Manage your profile and orders.</p><form className="mt-7 space-y-4" onSubmit={async event => { event.preventDefault(); setError(''); setProfileNotice(''); setSubmitting(true); try { const updated = await updateProfile(profileForm); setProfileForm({ name: updated.name }); setProfileNotice('Your profile was updated.'); } catch (requestError) { setError(requestError.response?.data?.message || 'Could not update your profile.'); } finally { setSubmitting(false); } }}><label className="block text-xs font-semibold">Full name<input required minLength={2} maxLength={80} value={profileForm.name} onChange={event => setProfileForm({ ...profileForm, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><p className="text-xs text-slate-500">Email address: <b>{user.email}</b> <span className="text-slate-400">(email changes require verification and are not enabled yet)</span></p>{profileNotice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-xs text-emerald-800">{profileNotice}</p>}<ErrorMessage>{error}</ErrorMessage><button disabled={submitting} className="w-full rounded-full bg-blue-600 py-3.5 text-xs font-bold text-white disabled:opacity-60">{submitting ? 'Saving…' : 'Save profile'}</button></form><div className="mt-6 flex flex-wrap gap-3"><Link to="/orders" className="rounded-full border border-slate-200 px-5 py-3 text-xs font-bold">View orders</Link>{user.role === 'admin' && <Link to="/admin" className="rounded-full border border-slate-200 px-5 py-3 text-xs font-bold">Admin dashboard</Link>}<button onClick={async () => { await logout(); }} className="rounded-full border border-slate-200 px-5 py-3 text-xs font-bold">Sign out</button></div></div></main>;

  return <main className="container grid min-h-[65vh] place-items-center py-12"><section className="w-full max-w-md rounded-3xl border border-slate-100 bg-white p-7 shadow-sm md:p-9"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">NEXORA account</p><h1 className="display mt-3 text-3xl font-extrabold">{mode === 'login' ? 'Welcome back.' : 'Create your account.'}</h1><p className="mt-2 text-sm text-slate-500">{mode === 'login' ? 'Sign in to continue to your account.' : 'A few details to get started.'}</p>
    <form onSubmit={submit} className="mt-7 space-y-4">{mode === 'register' && <label className="block text-xs font-semibold">Full name<input required minLength={2} maxLength={80} autoComplete="name" value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"/></label>}<label className="block text-xs font-semibold">Email address<input required type="email" autoComplete="email" value={form.email} onChange={event => setForm({ ...form, email: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"/></label><label className="block text-xs font-semibold">Password<input required type="password" minLength={mode === 'register' ? 12 : 1} maxLength={128} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={form.password} onChange={event => setForm({ ...form, password: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal outline-none focus:border-blue-400"/>{mode === 'register' && <small className="mt-1 block font-normal text-slate-400">Use at least 12 characters.</small>}</label><ErrorMessage>{error}</ErrorMessage><button disabled={submitting} className="w-full rounded-full bg-blue-600 py-4 text-xs font-bold text-white disabled:opacity-60">{submitting ? 'Please wait…' : mode === 'login' ? 'Sign in' : 'Create account'}</button></form>
    <p className="mt-6 text-center text-xs text-slate-500">{mode === 'login' ? "Don't have an account?" : 'Already have an account?'} <button onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); }} className="font-bold text-blue-600">{mode === 'login' ? 'Create one' : 'Sign in'}</button></p>
  </section></main>;
}

export function CheckoutPage() {
  const { user, loading } = useAuth();
  const { cart, clearCart } = useStore();
  const [form, setForm] = useState({ recipient: '', phone: '', addressLine: '', district: '', city: 'Dhaka', postalCode: '' });
  const [couponCode, setCouponCode] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const idempotencyKeyRef = useRef(crypto.randomUUID());
  const navigate = useNavigate();

  const submit = async event => {
    event.preventDefault(); setError(''); setSubmitting(true);
    try {
      await api.put('/cart', { items: cart.map(item => ({ productId: item.id, quantity: item.quantity })) });
      const { data } = await api.post('/orders', { shippingAddress: form, ...(couponCode.trim() ? { couponCode: couponCode.trim().toUpperCase() } : {}) }, { headers: { 'Idempotency-Key': idempotencyKeyRef.current } });
      clearCart();
      navigate('/orders', { state: { placedOrder: data.order } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'We could not place your order. Please review your details and try again.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <main className="container py-20 text-center text-sm text-slate-500">Checking your account…</main>;
  if (!user) return <main className="container py-20 text-center"><h1 className="display text-3xl font-extrabold">Sign in to continue</h1><p className="mt-3 text-sm text-slate-500">You need an account before placing a COD order.</p><Link to="/account" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white">Sign in or create account</Link></main>;
  if (!cart.length) return <main className="container py-20 text-center"><h1 className="display text-3xl font-extrabold">Your bag is empty</h1><Link to="/shop" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white">Explore products</Link></main>;

  return <main className="container max-w-3xl py-12"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Cash on delivery</p><h1 className="display mt-2 text-4xl font-extrabold">Delivery details</h1><p className="mt-3 text-sm text-slate-500">Your order will be confirmed by NEXORA. Payment is collected on delivery.</p><form onSubmit={submit} className="mt-8 grid gap-5 rounded-3xl border border-slate-100 p-6 md:grid-cols-2 md:p-8"><label className="text-xs font-semibold">Recipient name<input required minLength={2} maxLength={80} value={form.recipient} onChange={event => setForm({ ...form, recipient: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="text-xs font-semibold">Bangladesh mobile number<input required inputMode="tel" placeholder="01XXXXXXXXX" value={form.phone} onChange={event => setForm({ ...form, phone: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="text-xs font-semibold md:col-span-2">Full address<input required minLength={8} maxLength={240} value={form.addressLine} onChange={event => setForm({ ...form, addressLine: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="text-xs font-semibold">District<input required minLength={2} maxLength={60} value={form.district} onChange={event => setForm({ ...form, district: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="text-xs font-semibold">City / Upazila<input required minLength={2} maxLength={60} value={form.city} onChange={event => setForm({ ...form, city: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="text-xs font-semibold">Postal code (optional)<input maxLength={12} value={form.postalCode} onChange={event => setForm({ ...form, postalCode: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><label className="text-xs font-semibold">Coupon code (optional)<input maxLength={32} value={couponCode} onChange={event => setCouponCode(event.target.value.toUpperCase())} placeholder="Enter coupon code" className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 text-sm font-normal"/></label><div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 md:col-span-2">Signed in as <b>{user.email}</b>. Payment method: <b>Cash on delivery</b>.</div><div className="md:col-span-2"><ErrorMessage>{error}</ErrorMessage><button disabled={submitting} className="w-full rounded-full bg-blue-600 py-4 text-xs font-bold text-white disabled:opacity-60">{submitting ? 'Placing order…' : 'Place COD order'}</button><p className="mt-3 text-center text-[10px] text-slate-400">Prices and stock are revalidated by the server. No online payment is collected.</p></div></form></main>;
}

export function OrdersPage() {
  const { user, loading } = useAuth();
  const location = useLocation();
  const placedOrder = location.state?.placedOrder;
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const query = useQuery({ queryKey: ['my-orders', user?.id], queryFn: async () => (await api.get('/orders/mine')).data.orders, enabled: Boolean(user) });
  const detail = useQuery({ queryKey: ['my-order', selectedOrderId], queryFn: async () => (await api.get(`/orders/mine/${selectedOrderId}`)).data.order, enabled: Boolean(user && selectedOrderId) });
  if (loading) return <main className="container py-20 text-center text-sm text-slate-500">Checking your account…</main>;
  if (!user) return <main className="container py-20 text-center"><h1 className="display text-3xl font-extrabold">Sign in to view orders</h1><Link to="/account" className="mt-6 inline-block rounded-full bg-blue-600 px-6 py-3 text-xs font-bold text-white">Sign in</Link></main>;
  if (query.isLoading) return <main className="container py-20 text-center text-sm text-slate-500">Loading your orders…</main>;
  if (query.isError) return <main className="container py-20 text-center text-sm text-rose-600">We couldn't load your orders. Please refresh and try again.</main>;
  const orders = query.data || [];
  const selectedOrder = detail.data;
  return <main className="container min-h-[55vh] py-12"><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Your account</p><h1 className="display mt-2 text-4xl font-extrabold">Order history</h1>
    {placedOrder && <div className="mt-7 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><p className="text-xs font-bold text-emerald-800">Your order was placed successfully.</p><p className="mt-1 text-sm text-emerald-700">Order number: {placedOrder.orderNumber}</p><p className="mt-1 text-sm text-emerald-700">Total: {formatBDT(placedOrder.total)} · Cash on delivery</p><p className="mt-2 text-xs text-emerald-800">Your order has been saved. NEXORA admins can view it in the dashboard.</p><a href={buildOrderWhatsAppUrl(placedOrder)} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex rounded-full bg-emerald-600 px-5 py-3 text-xs font-bold text-white">Send order details on WhatsApp · {STORE_PHONE_LOCAL}</a><p className="mt-2 text-[10px] text-emerald-700">WhatsApp opens with a prepared message; tap Send to notify the store.</p></div>}
    {!orders.length ? <p className="mt-8 rounded-2xl bg-slate-50 p-10 text-center text-sm text-slate-500">You haven't placed an order yet.</p> : <div className="mt-8 space-y-4">{orders.map(order => <article key={order._id} className="rounded-2xl border border-slate-100 p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><b className="text-sm">{order.orderNumber}</b><p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('en-BD')}</p></div><span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-bold capitalize text-blue-700">{order.status}</span></div><div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 text-xs"><span>{order.items.length} item(s) · Cash on delivery</span><b>{formatBDT(order.total)}</b><button onClick={() => setSelectedOrderId(current => current === order._id ? null : order._id)} className="rounded-full border border-slate-200 px-4 py-2 font-bold">{selectedOrderId === order._id ? 'Hide details' : 'View details'}</button></div></article>)}</div>}
    {selectedOrderId && <section className="mt-7 rounded-3xl border border-slate-100 p-6 md:p-8">{detail.isLoading ? <p className="text-sm text-slate-500">Loading order details…</p> : detail.isError ? <p className="text-sm text-rose-600">Could not load this order. Please try again.</p> : selectedOrder && <><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Order details</p><h2 className="display mt-1 text-2xl font-extrabold">{selectedOrder.orderNumber}</h2></div><button onClick={() => setSelectedOrderId(null)} className="rounded-full border border-slate-200 px-4 py-2 text-xs font-bold">Close</button></div><div className="mt-6 divide-y divide-slate-100">{selectedOrder.items.map((item, index) => <div key={`${item.product}-${index}`} className="flex items-center justify-between gap-4 py-4"><div><b className="text-sm">{item.name}</b><p className="mt-1 text-xs text-slate-400">Qty {item.quantity} · {formatBDT(item.unitPrice)} each</p></div><b className="text-sm">{formatBDT(item.unitPrice * item.quantity)}</b></div>)}</div><div className="mt-5 grid gap-6 border-t border-slate-100 pt-5 md:grid-cols-2"><div><h3 className="text-xs font-bold">Delivery address</h3><p className="mt-2 text-xs leading-6 text-slate-500">{selectedOrder.shippingAddress.recipient}<br/>{selectedOrder.shippingAddress.phone}<br/>{selectedOrder.shippingAddress.addressLine}<br/>{selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.district} {selectedOrder.shippingAddress.postalCode}</p></div><div className="space-y-2 text-xs"><div className="flex justify-between"><span>Subtotal</span><b>{formatBDT(selectedOrder.subtotal)}</b></div><div className="flex justify-between"><span>Shipping</span><b>{formatBDT(selectedOrder.shippingFee)}</b></div><div className="flex justify-between"><span>Discount</span><b>−{formatBDT(selectedOrder.discount)}</b></div><div className="flex justify-between border-t border-slate-100 pt-3 text-sm"><b>Total</b><b>{formatBDT(selectedOrder.total)}</b></div><p className="pt-2 text-[10px] text-slate-400">Payment: Cash on delivery · {selectedOrder.paymentStatus}</p></div></div></>}</section>}
  </main>;
}
