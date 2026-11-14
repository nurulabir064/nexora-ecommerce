# NEXORA Release Readiness Checklist

This checklist separates source implementation from verified runtime and release evidence. A checked source item does not imply a successful browser test or production deployment.

## 1. Source and architecture

- [x] React + Vite + Tailwind frontend and Express API workspace structure.
- [x] Same-origin production routing: Express serves `frontend/dist` and `/api`.
- [x] Environment examples are committed; real `.env` files are excluded by `.gitignore`.
- [x] Storefront routes include Home, Shop, Product Details, Cart, Wishlist, Account, Checkout and Orders.
- [x] Admin route is protected in the UI and API; server-side role checks remain authoritative.
- [x] Remove obsolete product-modal implementation; product cards consistently navigate to the dedicated details route.
- [ ] Dependency lockfile generated and reviewed under the target Node.js runtime.
- [ ] Production build completed successfully.

## 2. Customer flow acceptance tests

Run these after dependencies and a test database are available:

- [ ] Guest: browse Home and Shop; search and sort; open product details.
- [ ] Guest: add/remove wishlist items and cart items; refresh and verify local persistence.
- [ ] Guest: change cart quantities; verify stock limits and unavailable-item recovery.
- [ ] Customer: register, sign in, refresh session, update display name, and sign out.
- [ ] Customer: guest cart and wishlist merge into the correct account without overwriting existing account data.
- [ ] Customer: account A cannot read or mutate account B's cart, wishlist, or orders.
- [ ] Customer: checkout rejects invalid Bangladesh phone/address data and stale/out-of-stock cart lines.
- [ ] Customer: COD order total is recalculated by the server; cart is cleared only after successful order creation.
- [ ] Customer: coupon expiry, minimum spend, usage limit, and maximum discount are enforced server-side.
- [ ] Customer: order history and order details are restricted to the signed-in owner.
- [ ] Customer: published reviews are visible; only a customer with a delivered order containing the product can submit a review.

## 3. Admin acceptance tests

- [ ] Non-admin receives HTTP 403 for every admin API route, even if the UI is bypassed.
- [ ] Admin can create, edit, and archive products; invalid price, stock, slug, image URL and category are rejected.
- [ ] Admin can create and archive categories without breaking existing historical orders.
- [ ] Admin can move orders only through allowed status transitions.
- [ ] Cancelling an eligible order restores stock and releases its coupon usage exactly once.
- [ ] Admin can create and disable coupons; invalid date ranges and invalid discount values are rejected.
- [ ] Admin can publish and unpublish reviews; aggregate rating/count stays correct.
- [ ] Customer listing does not expose password hashes, session tokens, or other secrets.

## 4. Security and operational checks

- [ ] Use a MongoDB Atlas replica-set deployment; checkout and cancellation rely on transactions.
- [ ] Set a unique random `JWT_SECRET` of at least 32 characters in the hosting secret manager.
- [ ] Set `ADMIN_EMAIL` and a unique strong `ADMIN_PASSWORD` only in Render environment settings; never commit them.
- [ ] Verify Argon2id password hashing, HttpOnly session cookie, CSRF protection, rate limits, Helmet headers and role checks in runtime tests.
- [ ] Verify production cookie flags (`Secure`, `HttpOnly`, `SameSite`) over HTTPS.
- [ ] Confirm Render `TRUST_PROXY=true` matches the platform proxy topology.
- [ ] Confirm health endpoint returns 200 only when MongoDB is connected and 503 otherwise.
- [ ] Configure database backups and test a restore before accepting real orders.
- [ ] Add monitoring/log review and a documented incident/rollback process.

## 5. Build, deployment and final verification

- [ ] Install the pinned Node.js 26.x runtime and dependencies from a committed lockfile.
- [ ] Run production build and inspect generated assets.
- [ ] Run automated API tests, browser end-to-end tests, accessibility checks and responsive viewport checks.
- [ ] Create/use the dedicated private GitHub repository `nexora-ecommerce`; do not reuse unrelated repositories.
- [ ] Connect the private repository to Render and review the Blueprint before applying it.
- [ ] Provision MongoDB Atlas and configure Render secrets without sharing credentials in chat.
- [ ] Deploy and verify `/api/health` over the actual public HTTPS URL.
- [ ] Run the full customer and admin acceptance suites against the deployed service.
- [ ] Keep the release in preview until all critical checks pass; do not accept real orders or claim payment success before then.

## Current environment evidence (13 November 2026)

- Backend JavaScript `node --check`: passed on Node.js 22.16.0.
- TypeScript parser pass: no syntax diagnostics across 35 frontend/backend JS and JSX files.
- Root/frontend/backend package JSON: valid.
- `render.yaml`: valid YAML; one web service configured.
- `npm install --ignore-scripts --no-audit --no-fund --fetch-retries=0 --fetch-timeout=30000`: did not complete because the execution environment could not resolve `registry.npmjs.org` (network/DNS unavailable).
- `npx node@26.13.1`: did not complete for the same environment limitation.
- No dependencies were installed, no Vite build or runtime test was run, and no database, dedicated NEXORA repository, Render service or public URL is currently verified.

**Release decision: NOT READY FOR PRODUCTION.** This is a development source package pending dependency installation, integration testing, infrastructure setup and deployment verification.


## Order notification/contact checks
- [ ] Confirm the public support phone `01304302201` is the correct store contact before production launch.
- [ ] Confirm `tel:` and WhatsApp click-to-chat open the expected number on Android and desktop.
- [ ] Place a test COD order against a non-production MongoDB replica-set database.
- [ ] Verify the order persists after reload and appears in the admin Orders tab within 30 seconds.
- [ ] Verify admin can call the customer's delivery phone and update order status.
- [ ] Verify WhatsApp prefilled order details and ensure the customer explicitly taps Send.

## Additional automated checks (14 November 2026)
- [x] Add dependency-free Node.js tests for Bangladesh support-phone normalization and WhatsApp order-message URL encoding.
- [ ] Run the full workspace test suite after installing dependencies in the target Node.js 26.x environment.


## Additional payment-accounting correction (14 November 2026)
- [x] COD delivery status no longer automatically marks an order as paid. Delivery completion is not proof that cash was collected.
- [x] Admin API exposes an authenticated, role-protected payment confirmation action that only marks a delivered, pending COD order as paid.
- [x] Admin Orders UI shows payment status and offers `Confirm cash received` only for delivered, unpaid COD orders.
- [ ] Runtime-test the payment confirmation action against a disposable MongoDB replica-set database, including repeated requests and non-delivered orders.


## Source hardening follow-up (14 November 2026)
- [x] Add verified-order review submission UI; API checks the delivered order and active product.
- [x] Validate full coupon state after partial updates, including date order and percentage cap.
- [x] Keep review moderation and product rating aggregate in one database transaction.
- [x] Validate review product IDs and require an active product for public reviews.
- [x] Restrict admin product/category image URLs to HTTPS.
- [x] Validate cookie SameSite configuration and reject insecure `SameSite=None`.
- [ ] Run the new flows against a disposable MongoDB replica-set database and browser.

## Alternative build and deployment paths (14 November 2026)
- [x] Add GitHub Actions CI to install dependencies, run tests and build using Node 26.13.1 on a hosted runner.
- [x] Add a Dockerfile and `.dockerignore` for container-capable deployment platforms.
- [ ] Execute the GitHub Actions workflow after source is pushed to the private repository.
- [ ] Build and smoke-test the Docker image in a Docker-capable runner.
- [ ] Configure Render to deploy only after CI checks pass, or use the Docker image on a container host after equivalent checks.


## CSRF middleware edge-case hardening (14 November 2026)
- [x] Compare token byte lengths before constant-time comparison to prevent malformed Unicode input from throwing.
- [x] Add tests for safe methods, valid tokens, missing/mismatched tokens and malformed Unicode input.
- [ ] Verify CSRF behavior with real browser cookies, same-origin requests and production HTTPS.


## Latest QA evidence (14 November 2026)
- [x] Dependency-free Node test suite: 6/6 passing.
- [x] Backend JavaScript syntax check: passed.
- [x] TypeScript JS/JSX transpile parser: 38 files, 0 diagnostics.
- [x] Package JSON and Render YAML parse checks passed.
- [x] Source credential-pattern scan found no matching private-key/API-token/credentialed MongoDB URI patterns.
- [x] Release ZIP integrity test passed.
- [ ] Dependency install and frontend production build remain blocked/unverified; `npm install` timed out in this environment.
- [ ] Database/API integration, browser, accessibility and deployment acceptance remain outstanding.
