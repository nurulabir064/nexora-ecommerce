# API outline

Base path: `/api`. JSON requests. Cookie-based session. All state-changing requests require the CSRF token returned by `GET /api/auth/csrf` in the `X-CSRF-Token` header and the matching cookie.

## Public

- `GET /health` — service health (actual full path `/api/health`).
- `GET /auth/csrf` — issue CSRF cookie/token.
- `POST /auth/register` — create customer account.
- `POST /auth/login` — create session.
- `POST /auth/logout` — clear session.
- `GET /auth/me` — current user.
- `PATCH /auth/me` — update the authenticated customer's display name; email changes are intentionally not enabled without an email-verification flow.
- `GET /products` — search, category, brand, price range, sort and pagination.
- `GET /products/:slug` — active product details.
- `GET /categories` — active categories.
- `GET /reviews/product/:productId` — published product reviews.

## Authenticated customer

- `GET /cart`, `PUT /cart`, `DELETE /cart`.
- `GET /wishlist`, `PUT /wishlist` (`action: add|remove`).
- `POST /orders` — COD checkout from server-side cart; shipping address and optional coupon code only. Product prices and stock are read on the server.
- `GET /orders/mine`, `GET /orders/mine/:id`.
- `POST /reviews` — review only for a product in a delivered order; new reviews await Admin moderation.

## Admin (admin role required)

- `GET /admin/overview`.
- `GET/POST/PATCH/DELETE /admin/products` (product delete is a soft archive).
- `GET/POST/PATCH/DELETE /admin/categories` (archive is soft).
- `GET /admin/customers`.
- `GET /admin/orders`, `PATCH /admin/orders/:id/status`.
- `GET/POST/PATCH/DELETE /admin/coupons` (delete disables coupon).
- `GET /admin/reviews`, `PATCH /admin/reviews/:id`.

Admin access is bootstrapped only by the seed script using `ADMIN_EMAIL` and `ADMIN_PASSWORD`. Public registration always creates the `customer` role.
