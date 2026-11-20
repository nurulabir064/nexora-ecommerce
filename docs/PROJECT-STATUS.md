# NEXORA — Verified project status

Last source inspection: 20 November 2026. This update includes a code/CI review of the Customization Studio demo branch; it is not a browser or production acceptance test. This is a source-code review, not a successful production deployment or end-to-end test report.

## Implemented in source

- React + Vite + Tailwind storefront with home, shop, cart and wishlist screens.
- Storefront product catalogue and categories are fetched from the Express API through TanStack Query; the UI maps MongoDB product documents into card/detail data.
- Guest cart and wishlist are stored locally; after sign-in, guest selections merge with the customer’s server cart/wishlist and signed-in changes synchronize to MongoDB. Cart line quantities are capped at 20 in the UI; the API revalidates available stock when the signed-in cart is saved and again during checkout.
- Express 5 API with product/category listing, customer registration/login/logout/session lookup, CSRF token issuance and validation.
- Mongoose models for users, products, categories, carts, wishlists, orders, reviews and coupons.
- Server-side cart validation, COD checkout with server-calculated prices/shipping/discounts, transactional stock decrement and order history.
- Admin-protected API routes and dashboard UI for overview, product create/edit/archive, category create/archive, customer listing, order status transitions, coupon create/disable and review publish/unpublish.
- Argon2id password hashing, HttpOnly session cookie, role checks, Helmet, request validation, rate limiting and error handling.
- Render Blueprint configuration for a single-origin deployment, currently set to the Free plan to avoid unapproved paid hosting.
- Health endpoint reports the actual Mongoose connection state rather than always claiming the database is connected.

## Not complete / not verified

- Frontend home, shop, dedicated product details, cart, wishlist, checkout, account, order history and admin screens are implemented in source but still need browser/API integration tests. Product cards now consistently navigate to the dedicated Product Details route; obsolete modal code has been removed.
- Guest-to-account sync now gates writes by the active account identity to avoid an initial render overwriting the account cart before the merge completes; this fix still needs runtime verification.
- Signed-in cart/wishlist synchronization is implemented in source but still needs runtime and multi-account testing.
- COD checkout form accepts optional coupon codes; order history includes server-authorized order details. Customer display-name editing is implemented. Email changes are intentionally disabled until an email-verification flow exists.
- Product details include image selection, stock-aware quantity selection, wishlist/cart actions, published customer reviews, and a review submission form gated by the customer’s delivered order history. Cart also exposes unavailable saved items for removal and blocks checkout while product/stock issues remain. The standalone demo checkout is intentionally non-functional; it does not create a server order or take payment. Use the React storefront for the API-backed flows.
- No online payment, bKash/Nagad integration, shipping-provider integration, email/SMS, password reset, email verification or image-upload service is connected.
- Dependency-free unit tests cover CSRF middleware edge cases, Bangladesh support-contact normalization and WhatsApp order-link encoding (6/6 passing); API/database integration, browser, accessibility, load and penetration tests have not been run.
- Dependencies could not be installed in the current environment: `npm install --ignore-scripts --no-audit --no-fund` timed out and the npm cache has no required packages; frontend production build and runtime verification therefore remain unverified.
- The GitHub repository contains the source and CI workflow. The Customization Studio demo is on draft PR #3 and has not been merged or deployed. The Render service and Atlas database are separate infrastructure; live runtime and production acceptance are not established by CI.

## Source checks actually performed

- Inspected frontend routes, components, API client, local state, backend app, auth/product/cart/order/admin routes, models, seed script and deployment configuration.
- `node --check` passed for all backend `.js` source files using the available Node.js 22.16.0 runtime.
- Updated frontend catalogue screens to fetch products/categories from the API; added a dedicated API-backed product detail route, image gallery, stock-aware quantity selection, published review display, unavailable-cart-item recovery and checkout gating, alongside auth/session, signed-in cart/wishlist sync, COD checkout submission, profile-name editing, order detail and expanded admin screens.
- Updated the API health endpoint to return HTTP 503 while MongoDB is disconnected.
- `npm install --ignore-scripts --no-audit --no-fund` and a bounded retry did not complete because this environment cannot resolve `registry.npmjs.org`; `npx node@26.13.1` also could not complete. No successful frontend build or dependency/runtime test is claimed.
- TypeScript's JSX/JavaScript transpile parser reported no syntax diagnostics across 38 frontend and backend source files; this is a syntax check, not a Vite build or type check. Root/frontend/backend package JSON and `render.yaml` also parse successfully.

## Release decision

**Not production-ready.** The main customer catalogue, authentication, cart/wishlist sync and COD order submission now have frontend source integration, but they have not been built or tested end-to-end. Automated tests and live infrastructure remain release blockers; several advanced account and review features are intentionally out of scope for this iteration. Do not accept real orders or payments.


## Order handling and store contact (2026-11-14)
- Customer checkout creates an Order document inside the MongoDB transaction; the server validates current stock and price, decrements stock, and clears the cart in the same transaction.
- Admin-only `GET /api/admin/orders` lists recent orders with customer account details; order records include the delivery phone/address and item/price snapshots.
- Admin overview and order list now refresh every 30 seconds while the dashboard is open.
- Admin order rows include a tap-to-call link for the customer's delivery phone. The dashboard also exposes the store contact number `01304302201` by phone and WhatsApp links.
- The customer order-success panel offers a WhatsApp click-to-chat link with the order number and total prefilled. The customer must tap Send; this is not an automatic WhatsApp notification.
- Orders are stored in MongoDB and visible in the admin dashboard after successful deployment with a configured MongoDB replica-set connection. This behavior has not been runtime-tested against a live database yet.


## Payment accounting correction (14 November 2026)
- COD orders remain `pending` after delivery status is set. Admin must explicitly confirm cash collection before the payment status becomes `paid`; revenue reporting counts only paid orders. This prevents delivery status from being treated as payment evidence. The source change is syntax-checked but awaits live database/API verification.


## Additional source hardening (14 November 2026)
- Admin coupon updates now validate the merged coupon state, including start/expiry ordering and the 100% percentage cap; empty coupon patches are rejected.
- Admin review moderation updates the review publication state and product rating aggregate in one MongoDB transaction.
- Public review listing validates product IDs and only returns reviews for active products. Review submission verifies both a delivered order and an active product; the product page now exposes a verified-order review form.
- Admin product/category image URLs are restricted to HTTPS. Cookie SameSite configuration is validated, and `SameSite=None` is rejected outside production HTTPS.
- These source changes passed syntax parsing; runtime/database behavior still requires target-environment tests.


## Latest source QA pass — 14 November 2026
- Hardened CSRF middleware so mismatched UTF-8 byte lengths return HTTP 403 instead of allowing `timingSafeEqual` to throw on malformed Unicode input.
- Added four dependency-free CSRF middleware tests. Full root test suite: **6/6 passed**.
- Backend `node --check`: passed for all backend JavaScript files.
- TypeScript transpile parser: **38 JS/JSX files, 0 diagnostics**.
- Root/frontend/backend package manifests parsed as JSON; `render.yaml` parsed as YAML; common private-key, cloud-key, GitHub-token and credentialed MongoDB URI patterns were not found in source files.
- ZIP integrity check passed. These checks do not establish a production build, API/database integration, browser behavior or deployment readiness.


## Customization Studio demo (20 November 2026)
- Draft PR #3: [safe customization studio demo](https://github.com/nurulabir064/nexora-ecommerce/pull/3). It adds a local-only Store/Admin preview inside the admin dashboard; no settings persistence, publishing, API writes, database writes or commerce mutations are added.
- Demo controls include store identity, brand colors, hero copy/image, homepage section visibility, responsive sample product columns, sample delivery display values and admin preview appearance. Reset returns the sample draft to its defaults.
- QA review fixed the Admin quick-actions preview default and improved the sample product-grid responsiveness and numeric delivery-value inputs.
- Added [Customization demo guide](CUSTOMIZATION-DEMO.md) describing local run steps, demo boundaries and a client customization/handoff workflow.
- PR CI run [#44400286659](https://github.com/nurulabir064/nexora-ecommerce/actions/runs/44400286659) completed successfully for commit `eef70ce86faac40499ca578917896bd8c7e69205`. PR #3's latest head (`3f8ae89`) passed CI run [#44688622239](https://github.com/nurulabir064/nexora-ecommerce/actions/runs/44688622239), including production audit, tests and frontend build. No browser/mobile visual inspection has been performed here.
- **Not a production theme editor:** customization values do not save/export and are not applied to the real storefront. Client customization requires implementing approved values in the storefront, then integration testing and deployment.


## Customization draft workflow (20 November 2026)
- Follow-up branch `feat/customization-draft-save-export` adds browser-local Save Draft, versioned JSON export/import, validation and reset-clears-local-draft.
- Settings are stored only in this browser's localStorage; no API/database mutation or live publish. Export/import is a handoff mechanism for preview values, not a production theme deployment.
- Added pure validation/import tests for valid defaults, malformed colors, invalid columns/numbers/URLs, missing or extra keys, and unsupported import versions. CI still needs to run for the latest commit; browser storage and file-download/import behavior still need real browser verification. The branch has not been merged or deployed.


## Local storefront theme preview (20 November 2026)
- Follow-up PR #4 extends the demo with a browser-local Apply storefront preview. It applies saved configuration to the actual Home page/layout in the same browser and shows a banner with Back to customization/Exit preview controls.
- Preview changes store name, announcement bar, brand colors, hero content/image, category/featured/benefit/promo visibility, product-grid columns and sample delivery display. Checkout and backend delivery calculations remain unchanged.
- Preview flag and draft use localStorage only. No public visitors, backend/database settings, production theme, product/order data or deployment are changed.
- Latest follow-up CI is pending after this code update; manual browser/mobile acceptance is still required.
