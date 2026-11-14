# NEXORA Release Audit

## Release status

**Development preview/source package only — not production-ready.**

## Work completed in this pass

- Connected the React storefront catalogue to the Express product/category API using TanStack Query. Product cards now link to a dedicated slug-based product detail page with image selection, stock-aware quantity selection, cart/wishlist actions and published reviews. Cart recovery exposes unavailable products for removal and blocks checkout when cart stock is invalid.
- Added customer register/login/session restoration/logout screens backed by the HttpOnly-cookie auth API.
- Added COD checkout UI that syncs the browser cart to the authenticated server cart, then submits the order to the server-side transactional checkout endpoint.
- Added authenticated order-history UI.
- Added guest-to-account cart/wishlist merging and signed-in synchronization to the server API.
- Expanded the admin dashboard with product create/edit/archive, category create/archive, coupon create/disable, review moderation and customer listing.
- Added customer display-name editing and an order-detail view. Checkout accepts optional coupon codes.
- Fixed account-sync gating so guest cart/wishlist writes do not race ahead of the initial signed-in account merge.
- Added stock-aware add-to-cart controls and capped each line quantity at the API's maximum of 20.
- Corrected `/api/health` so it reflects the real MongoDB connection state and returns HTTP 503 when disconnected.
- Configured the Render Blueprint for the Free plan so a paid service is not selected without the project owner's approval.
- Kept the demo checkout separate and non-functional; it does not claim payment success.
- Removed the obsolete product-modal implementation so Home, Shop and Wishlist product cards consistently open the dedicated Product Details route.
- Added `docs/RELEASE-READINESS-CHECKLIST.md` with customer/admin acceptance tests, security checks, deployment gates and current evidence.

## Earlier deployment fixes retained

- Vite development server has a configurable `/api` proxy to `http://localhost:5000` (`API_PROXY_TARGET` can override it).
- Same-origin production deployment does not enable CORS by default. An explicit `CLIENT_ORIGIN` allow-list is only used for a split-origin setup.
- Project status and deployment notes are updated to distinguish implemented source from verified live behavior.

## Checks

- Backend JavaScript syntax: passed with `node --check` on all `backend/src/**/*.js` files using Node.js 22.16.0.
- Dependency install: not completed; npm registry DNS resolution is unavailable in this execution environment. A bounded npm install retry and `npx node@26.13.1` both failed to complete.
- Frontend production build: not run because dependencies could not be installed.
- TypeScript JSX/JavaScript transpile parser: no syntax diagnostics across 35 frontend and backend source files. Root/frontend/backend package JSON and `render.yaml` parse successfully. This is not a Vite production build, lint, or type check.
- MongoDB/API integration: not run (no configured database service/credentials).
- Browser/responsive/accessibility tests: not run.
- Deployment/HTTPS health check: not run; the dedicated private `nexora-ecommerce` repository was not found in the connected GitHub account, and no Render service has been created.

## Remaining release blockers

1. Complete customer review submission UX, password-change/email-verification flows and product image upload; review admin workflows for usability.
2. Install dependencies under the configured Node.js 26 runtime; run a production build, lint and automated API/browser tests.
3. Review the API/security flows and fix any findings from runtime/integration tests.
4. Provision MongoDB Atlas, configure secrets safely, seed the initial admin/catalogue, deploy via Render and verify the resulting public URL and complete customer/admin flows.

## Safety boundary

Do not use this source package to accept real customer orders until the remaining release blockers, integration tests, backups and deployment acceptance checklist are complete. No online payment integration exists.


## Follow-up source audit — 14 November 2026
- Rechecked the full 60-file source package. Backend JavaScript syntax checks pass; the dependency-free Node test suite passes 2/2 tests.
- Found and corrected a COD accounting issue: delivery status previously marked COD payment as paid automatically. Payment now requires an explicit admin confirmation after delivery. The admin dashboard exposes this action only for delivered, pending COD orders.
- `npm install` remains blocked by DNS resolution failure (`EAI_AGAIN` for registry.npmjs.org); offline lockfile generation is unavailable because the required package metadata is not cached. No production build or database integration test is claimed.
- No production credentials, database, GitHub source deployment, Render service or public live URL have been provisioned in this environment.
- Release remains **NOT READY FOR PRODUCTION** pending target-runtime install/build, database integration tests, source publication, infrastructure setup and public acceptance testing.


## Additional source hardening — 14 November 2026
- Coupon PATCH validates the resulting full coupon state, not only submitted fields; invalid date order and percentage discounts above 100 are rejected.
- Review moderation and product aggregate recalculation run in a MongoDB transaction. Review listing validates IDs and active product existence; submission is tied to an active product and a delivered order.
- Product details now include a verified-order review submission form.
- Admin product/category image URLs require HTTPS. Cookie SameSite values are allow-listed and `SameSite=None` requires production mode.
- Dependency-free test suite at that checkpoint was 2/2 passing; all 37 JavaScript/JSX files parsed without diagnostics and all backend JavaScript passes `node --check`.
- These are source-level fixes only. No dependency install, Vite build, MongoDB transaction test, browser test or live deployment has been completed.

## Final source review — 14 November 2026
- Rechecked authentication, CSRF middleware, cart validation, transactional COD checkout/cancellation, admin order transitions, coupon validation, review eligibility/moderation and deployment configuration.
- Fixed an initial-admin provisioning edge case: the seed script now refuses to silently treat an existing customer account as the admin account. It creates a new admin only when the configured email is unused and leaves an existing admin account unchanged.
- Re-ran the dependency-free test suite (2/2 passing at that checkpoint) and `node --check` across all backend source files.
- This remains a source-level review. The project has not been installed/built with its declared dependencies, connected to a replica-set database, browser-tested, pushed to GitHub, or deployed. The project must not accept real orders until those checks pass.


## CSRF middleware edge-case hardening — 14 November 2026
- Hardened CSRF token comparison to compare UTF-8 byte lengths before calling `timingSafeEqual`; malformed Unicode values now receive a normal HTTP 403 instead of potentially throwing a `RangeError`.
- Added dependency-free middleware tests for safe methods, matching tokens, missing/mismatched tokens and malformed Unicode input.
- These are middleware-level tests, not a substitute for browser-origin or end-to-end CSRF verification.


## Latest QA evidence — 14 November 2026
- Root test suite now passes **6/6** tests, including four CSRF middleware edge-case tests.
- Backend `node --check` passes for every backend JavaScript source file.
- TypeScript transpile parser reports 0 diagnostics across 38 JS/JSX files.
- Root/frontend/backend package manifests parse as JSON; `render.yaml` parses as YAML.
- Source credential-pattern scan found no private-key blocks, common cloud access keys, GitHub personal access tokens or credentialed MongoDB connection strings.
- The latest release ZIP passes `unzip -t` integrity validation.
- `npm install --ignore-scripts --no-audit --no-fund` timed out; no dependencies were installed and no Vite production build was run. No API/database/browser test or deployment is claimed.
