import React from 'react';
import ReactDOM from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SiteLayout from './components/SiteLayout';
import { AuthProvider } from './context/AuthContext';
import { StoreProvider } from './context/StoreContext';
import { HomePage, ShopPage, CartPage, WishlistPage, NotFound } from './pages/StorePages';
import { AccountPage, CheckoutPage, OrdersPage } from './pages/AccountPages';
import { AdminPage } from './pages/AdminPage';
import { ProductDetailsPage } from './pages/ProductDetailsPage';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 30_000, retry: 1 } }
});

const router = createBrowserRouter([{
  path: '/',
  Component: SiteLayout,
  children: [
    { index: true, Component: HomePage },
    { path: 'shop', Component: ShopPage },
    { path: 'products/:slug', Component: ProductDetailsPage },
    { path: 'cart', Component: CartPage },
    { path: 'wishlist', Component: WishlistPage },
    { path: 'account', Component: AccountPage },
    { path: 'checkout', Component: CheckoutPage },
    { path: 'orders', Component: OrdersPage },
    { path: 'admin', Component: AdminPage },
    { path: '*', Component: NotFound }
  ]
}]);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <RouterProvider router={router}/>
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
