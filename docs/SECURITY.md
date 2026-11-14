# Security decisions and remaining work

## Implemented in this build

- Passwords hashed with Argon2id using OWASP's minimum recommended baseline (19 MiB memory, 2 iterations, parallelism 1).
- Session JWT stored in an HttpOnly cookie; role is loaded from MongoDB on each authenticated request.
- Separate CSRF token cookie/header check on unsafe HTTP methods.
- Production cookie Secure flag; same-origin production deployment uses SameSite=Lax.
- Explicit CORS allow-list, Helmet security headers/CSP, JSON body limit and global/auth rate limits.
- Zod request validation and centralized error handling.
- Public registration cannot choose the admin role.
- Admin APIs require server-verified admin role.
- Checkout reads current product prices/stock from MongoDB, uses a MongoDB transaction and conditional stock decrement.
- Coupon usage limit is conditionally incremented within the checkout transaction.
- Order status transitions are restricted; cancellation restores stock; COD is marked paid only at delivery.

## Not a complete production security audit

- No automated penetration test or dependency vulnerability scan has been run.
- Add email verification, password reset, session revocation, account lockout/abuse detection and audit logs before real customer launch.
- Tune Argon2 parameters on the actual host and load profile.
- Add request correlation IDs, structured logs, monitoring and alerting.
- Add upload scanning/validation if image upload is implemented. Current admin product API accepts externally hosted image URLs only.
- Re-check CSP whenever new analytics, payment or image providers are added.
- Add idempotency keys to checkout before supporting retries from real clients/mobile networks.
- Add integration tests for transaction rollback, stock races, coupon usage races and cancellation idempotency.
