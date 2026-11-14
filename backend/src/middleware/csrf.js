import crypto from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
export function issueCsrfToken(req, res) {
  const token = crypto.randomBytes(32).toString('hex');
  res.cookie('nexora_csrf', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
    maxAge: 24 * 60 * 60 * 1000
  });
  res.json({ csrfToken: token });
}
export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  const cookie = req.cookies?.nexora_csrf;
  const header = req.get('x-csrf-token');
  if (typeof cookie !== 'string' || typeof header !== 'string' || !cookie || !header) {
    return res.status(403).json({ message: 'CSRF validation failed. Refresh and try again.' });
  }
  const cookieBytes = Buffer.from(cookie, 'utf8');
  const headerBytes = Buffer.from(header, 'utf8');
  // timingSafeEqual throws when byte lengths differ. Compare UTF-8 byte lengths,
  // not JavaScript string lengths, so malformed Unicode input still gets a 403.
  if (cookieBytes.length !== headerBytes.length || !crypto.timingSafeEqual(cookieBytes, headerBytes)) {
    return res.status(403).json({ message: 'CSRF validation failed. Refresh and try again.' });
  }
  next();
}
