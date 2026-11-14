# NEXORA Architecture Notes

## Current application boundary

- `frontend/` is a React + Vite + Tailwind CSS storefront. It uses React Router for navigation and TanStack Query for API-backed server state.
- `backend/` is an Express 5 REST API backed by MongoDB/Mongoose.
- Production is designed as a single-origin deployment: Express serves the built frontend and `/api` endpoints.
- `demo/` contains standalone visual-only previews. It is not connected to MongoDB and must not be used to place orders.

## Customer experience

1. Home and Shop load active products/categories from `GET /api/products` and `GET /api/categories`.
2. Product cards navigate to `/products/:slug`; the detail page fetches the live product, supports image selection, quantity selection, cart/wishlist actions and published reviews.
3. Guest cart/wishlist selections are kept in browser storage. After authentication, the app merges them with the customer's server-side cart/wishlist and then syncs subsequent changes.
4. Authentication uses a signed JWT in an HttpOnly cookie. Unsafe requests include the CSRF token returned by `GET /api/auth/csrf`.
5. Checkout sends product IDs, quantities, address and optional coupon only. The server reloads prices and stock from MongoDB, calculates totals and creates a COD order transactionally.
6. Customers can view order history and authorized order details. The admin dashboard uses role-protected API routes to manage catalogue, categories, orders, coupons and review moderation.

## Commerce invariants

- Never trust prices, discounts, totals, roles or stock values submitted by the browser.
- Store money as BDT taka and calculate order totals on the server.
- Order item/address snapshots preserve the historical order record.
- Inventory decrement and order creation happen in a MongoDB transaction. Admin cancellation restores stock and coupon usage.
- MongoDB transactions require a replica-set deployment (MongoDB Atlas is suitable).
- Online payments are not integrated. A payment may only be marked paid after a verified provider confirmation; this project currently supports COD only.

## Operational work still required before production

- Run a clean install under the pinned Node.js runtime, production build, automated unit/API/browser tests and accessibility checks.
- Add checkout idempotency and test concurrent stock/coupon contention and transaction rollback.
- Complete customer review submission UI, email verification, password reset/change, session revocation/rotation and admin MFA/audit logging.
- Add a managed image-upload service with file type/size validation instead of relying on arbitrary image URLs.
- Configure production secrets, database backups, monitoring, alerts and deployment rollback.
- Review applicable Bangladesh consumer, privacy, tax and payment-provider requirements before accepting real orders.
