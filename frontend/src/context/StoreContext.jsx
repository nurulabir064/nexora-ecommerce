import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

const StoreContext = createContext(null);

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

const isObjectId = value => typeof value === 'string' && /^[a-f\d]{24}$/i.test(value);

function readArrayStorage(key) {
  const value = readStorage(key, []);
  return Array.isArray(value) ? value : [];
}

function mergeCart(localItems, remoteItems) {
  const quantities = new Map();
  for (const item of [...remoteItems, ...localItems]) {
    const id = item.id || item.product?._id || item.product;
    const quantity = Number(item.quantity);
    if (!isObjectId(id) || !Number.isInteger(quantity) || quantity < 1) continue;
    quantities.set(id, Math.min(20, (quantities.get(id) || 0) + quantity));
  }
  return [...quantities].map(([id, quantity]) => ({ id, quantity }));
}

export function StoreProvider({ children }) {
  const { user, loading: authLoading } = useAuth();
  const [cart, setCart] = useState(() => readArrayStorage('nexora-cart').filter(item => isObjectId(item?.id) && Number.isInteger(item?.quantity) && item.quantity > 0).map(item => ({ id: item.id, quantity: Math.min(20, item.quantity) })));
  const [wishlist, setWishlist] = useState(() => readArrayStorage('nexora-wishlist').filter(isObjectId));
  const [syncReady, setSyncReady] = useState(false);
  const [syncOwner, setSyncOwner] = useState(null);
  const syncOwnerKey = user?.id ?? 'guest';
  const isSyncReady = syncReady && syncOwner === syncOwnerKey;
  const cartRef = useRef(cart);
  const wishlistRef = useRef(wishlist);
  const previousWishlistRef = useRef([]);
  const previousUserIdRef = useRef(null);

  cartRef.current = cart;
  wishlistRef.current = wishlist;

  // When a customer signs in, merge their guest selections with their saved server data.
  useEffect(() => {
    if (authLoading) return undefined;
    let cancelled = false;

    if (!user) {
      if (previousUserIdRef.current) {
        setCart([]);
        setWishlist([]);
        localStorage.removeItem('nexora-cart');
        localStorage.removeItem('nexora-wishlist');
      }
      previousUserIdRef.current = null;
      previousWishlistRef.current = [];
      setSyncOwner('guest');
      setSyncReady(true);
      return undefined;
    }

    previousUserIdRef.current = user.id;
    setSyncReady(false);
    Promise.all([api.get('/cart'), api.get('/wishlist')]).then(([cartResponse, wishlistResponse]) => {
      if (cancelled) return;
      const remoteCart = (cartResponse.data.items || []).map(item => ({ id: item.product?._id, quantity: item.quantity })).filter(item => item.id);
      const remoteWishlist = (wishlistResponse.data.products || []).map(product => product._id).filter(Boolean);
      const merged = mergeCart(cartRef.current, remoteCart);
      const mergedWishlist = [...new Set([...remoteWishlist, ...wishlistRef.current])];
      previousWishlistRef.current = remoteWishlist;
      setCart(merged);
      setWishlist(mergedWishlist);
      setSyncOwner(user.id);
      setSyncReady(true);
    }).catch(() => {
      // Do not overwrite server data if the initial account sync fails.
      if (!cancelled) setSyncReady(false);
    });

    return () => { cancelled = true; };
  }, [user?.id, authLoading]);

  // Guest data stays on this browser. Signed-in cart data is stored in MongoDB.
  useEffect(() => {
    if (authLoading || !isSyncReady) return;
    if (!user) {
      localStorage.setItem('nexora-cart', JSON.stringify(cart));
      return;
    }
    api.put('/cart', { items: cart.map(item => ({ productId: item.id, quantity: item.quantity })) }).catch(() => {});
  }, [cart, user?.id, authLoading, isSyncReady]);

  useEffect(() => {
    if (authLoading || !isSyncReady) return;
    if (!user) {
      localStorage.setItem('nexora-wishlist', JSON.stringify(wishlist));
      return;
    }
    const previous = previousWishlistRef.current;
    const additions = wishlist.filter(id => !previous.includes(id));
    const removals = previous.filter(id => !wishlist.includes(id));
    previousWishlistRef.current = wishlist;
    Promise.all([
      ...additions.map(productId => api.put('/wishlist', { productId, action: 'add' })),
      ...removals.map(productId => api.put('/wishlist', { productId, action: 'remove' }))
    ]).catch(() => {});
  }, [wishlist, user?.id, authLoading, isSyncReady]);

  const addToCart = (id, stock = 20, quantity = 1) => setCart(current => {
    const maxQuantity = Math.min(stock, 20);
    const requestedQuantity = Math.max(1, Math.min(20, Number(quantity) || 1));
    const existing = current.find(item => item.id === id);
    if (existing) return current.map(item => item.id === id ? { ...item, quantity: Math.min(item.quantity + requestedQuantity, maxQuantity) } : item);
    return maxQuantity > 0 ? [...current, { id, quantity: Math.min(requestedQuantity, maxQuantity) }] : current;
  });

  const updateQuantity = (id, quantity, stock = 20) => setCart(current => {
    if (quantity < 1) return current.filter(item => item.id !== id);
    const maxQuantity = Math.min(stock, 20);
    return current.map(item => item.id === id ? { ...item, quantity: Math.min(quantity, maxQuantity) } : item);
  });

  const toggleWishlist = id => setWishlist(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  const value = useMemo(() => ({
    cart, wishlist, addToCart, updateQuantity, toggleWishlist,
    clearCart: () => setCart([]),
    cartCount: cart.reduce((total, item) => total + item.quantity, 0)
  }), [cart, wishlist]);

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export const useStore = () => {
  const value = useContext(StoreContext);
  if (!value) throw new Error('useStore must be used inside StoreProvider');
  return value;
};
