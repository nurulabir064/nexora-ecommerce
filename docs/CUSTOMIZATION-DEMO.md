# NEXORA customization demo

## Purpose
The Customization Studio is a **local-only demonstration** of store branding and layout options. It helps show a prospective client what could be customized before a separate implementation scope is agreed.

## Run the demo
1. Use Node.js 26.13.1 (see `.node-version`).
2. From the repository root, install dependencies: `npm install`.
3. Create `backend/.env` from `backend/.env.example` and configure the local API/MongoDB settings. Never share or commit secrets.
4. In terminal 1 run `npm run dev:backend`.
5. In terminal 2 run `npm run dev:frontend`.
6. Open the Vite local URL, sign in using an existing admin account, and go to **Admin → Customization**.

The admin page still uses the existing API for its other dashboard data. The Studio's draft controls and previews themselves do not call the API or write to the database.

## Demo controls
- Store name, announcement text and brand colors
- Hero eyebrow, heading, description and HTTPS image URL
- Visibility of category, featured-product, benefits and promo sections
- Sample product-grid columns (responsive preview)
- Sample delivery fee and free-delivery threshold (display only)
- Admin preview title/accent, compact cards and quick-action visibility
- Store/Admin preview switch and Reset Demo

## Important boundaries
- Changes are in React state only. Refreshing or leaving the page resets the draft.
- The preview uses sample products and sample admin metrics, not actual customer/store data.
- Delivery values are sample text only. Checkout pricing and backend settings are not changed.
- It does not save, publish, export settings, or modify the actual storefront.
- It is not a tenant/multi-store system and does not provide a customer-facing theme editor.
- External hero image previews accept HTTPS URLs. Confirm image licensing and availability before using an image in a client deliverable.
- Do not describe the demo as a production customization feature or promise persistence.

## Customizing it for a client
1. Gather the client's logo, brand colors, store name, product categories, copy, images and required pages.
2. Agree on the exact scope (design, product data, content, integrations, hosting, support and revisions).
3. Use the Studio to illustrate the proposed visual direction. Record the selected values; the demo does not export them.
4. Implement approved values in the actual React storefront and its theme/layout components. Do not simply change demo state and claim the live store is customized.
5. Add and verify client-owned product images and content; test all API-backed commerce flows and admin permissions.
6. Deploy to a client-approved environment, test mobile and desktop, and hand over documented credentials through a secure method (never in source control).

## Before selling/deploying
This repository is a development/portfolio template, not a production-ready turnkey commerce service. Run the project checks, browser and API integration tests, security review, deployment acceptance checklist, and verify backups, payment/courier/email integrations and legal/content requirements as applicable. See [Project status](PROJECT-STATUS.md) and [Deployment](DEPLOYMENT.md).
