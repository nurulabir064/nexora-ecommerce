# NEXORA — Full-stack e-commerce portfolio project

NEXORA is a Bangladesh-focused, single-vendor store concept (BDT / ৳, English, cash on delivery). This repository contains a React storefront demo, an Express + MongoDB API foundation, and deployment configuration.

## Important status

**This repository is still under development and is not production-ready.** The React storefront now reads products/categories from the Express API and includes source implementations for customer authentication, server-synchronized cart/wishlist, dedicated product-detail pages, COD checkout and order history. These flows still require build and end-to-end verification. Customer display-name editing, order details and the core admin management screens are implemented in source but still need runtime verification. The order-success screen includes a WhatsApp click-to-chat link to the store contact; customers must explicitly tap Send. The admin dashboard refreshes orders every 30 seconds while open. Password changes, email verification and product image upload are not included yet. The standalone demo checkout does not create a real order or accept payment. See [`docs/PROJECT-STATUS.md`](docs/PROJECT-STATUS.md) for the current verified scope.

## Repository map

- `frontend/` — React, Vite, Tailwind CSS customer storefront (home, shop, product details, cart, wishlist, checkout, account and orders).
- `backend/` — Express 5 API, Mongoose models, authentication, validation, commerce and admin routes.
- `demo/` — standalone visual storefront and local-only admin preview.
- `docs/` — architecture, API, security, deployment, release audit and [Customization demo guide](docs/CUSTOMIZATION-DEMO.md) (including local save/import/export).
- `render.yaml` — Render Blueprint for a single-origin Node web service.

## Runtime and development

- Node.js 26.13.1 is pinned in `.node-version` and `render.yaml`.
- Install dependencies from the repository root with `npm install`.
- Create `backend/.env` from `backend/.env.example` and configure a MongoDB replica-set URI plus a JWT secret of at least 32 characters.
- Start the API with `npm run dev:backend`.
- Start the frontend in another terminal with `npm run dev:frontend`; Vite proxies `/api` to `http://localhost:5000` by default. Set `API_PROXY_TARGET` to override it.
- Build the frontend with `npm run build`.

## Production boundary

The backend COD checkout and admin APIs are source implementations, not a verified live commerce service. Use MongoDB Atlas or another replica-set deployment because checkout uses MongoDB transactions. Never commit `.env`, database credentials, JWT secrets or admin passwords. Do not accept real orders/payments until the frontend/API integration, automated tests, security review, backups and deployment acceptance checklist are complete.

## Deployment

See [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md). A public URL can only be reported after a hosting service is actually connected, deployed and verified. Hosting/database prices and availability can change; check provider terms before choosing a plan.
