# Validation performed in the ChatGPT build environment

- Parsed both standalone HTML files with an HTML parser and confirmed document titles/scripts are present.
- Extracted and ran `node --check` on the standalone storefront JavaScript and admin preview JavaScript: passed.
- Ran `node --check` on every backend `.js` module: passed.
- Reviewed the project tree and package manifests.
- Verified the Bangladesh mobile number format and generated WhatsApp international number (`01304302201` → `8801304302201`).
- Confirmed order creation is persisted via the existing MongoDB transaction and exposed through the admin-only orders endpoint; added 30-second dashboard polling and customer/admin phone contact links.

Not performed:
- React/Vite production build and dependency installation. The new JSX changes have not been compiler-verified because frontend dependencies are not installed. The package installation attempt timed out because package registry access was unavailable in the build environment.
- Browser screenshot/E2E test. Chromium could not complete a headless screenshot in this environment.
- MongoDB/API integration tests; no database credentials or live database are configured.

Do not interpret the checks above as production certification. Run a full install/build/test pipeline before deployment.

## Local automated checks (14 November 2026)

- Added Node.js built-in tests for Bangladesh store-phone normalization and order WhatsApp click-to-chat URL/message encoding. Run with `npm test` (or `node --test frontend/src/data/storeContact.test.js`).
- These tests verify link construction only. They do not verify WhatsApp delivery, customer consent, a live order, MongoDB persistence, or the admin dashboard.
- A dependency installation retry with `--prefer-offline` also did not complete in this environment. The production build and browser/API integration tests remain blocked until the declared dependencies can be installed under Node.js 26.x.
