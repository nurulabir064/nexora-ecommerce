import crypto from 'node:crypto';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);
const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const tokenSecret = () => process.env.CSRF_SECRET;

function hasTrustedOrigin(req) {
  const configuredOrigin = process.env.APP_ORIGIN;
  if (!configuredOrigin) return process.env.NODE_ENV !== 'production';
  const origin = req.get('origin');
  const referer = req.get('referer');
  const source = origin || referer;
  if (!source) return process.env.NODE_ENV !== 'production';
  try {
    return new URL(source).origin === new URL(configuredOrigin).origin;
  } catch {
    return false;
  }
}

function bindingFor(req, res) {
  const session = req.cookies?.nexora_session;
  if (session) return session;
  let anonymousBinding = req.cookies?.nexora_csrf_binding;
  if (!anonymousBinding) {
    anonymousBinding = crypto.randomBytes(32).toString('hex');
    res.cookie('nexora_csrf_binding', anonymousBinding, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.COOKIE_SAME_SITE || 'lax',
      path: '/',
      maxAge: TOKEN_TTL_MS
    });
  }
  return anonymousBinding;
}

function createToken(binding) {
  const nonce = crypto.randomBytes(32).toString('hex');
  const issuedAt = Date.now().toString();
  const mac = crypto.createHmac('sha256', tokenSecret()).update(binding).update('.').update(nonce).update('.').update(issuedAt).digest('hex');
  return `${nonce}.${issuedAt}.${mac}`;
}

function isValidToken(token, binding) {
  if (typeof token !== 'string' || token.length !== 143) return false;
  const parts = token.split('.');
  if (parts.length !== 3 || !/^[a-f0-9]{64}$/.test(parts[0]) || !/^\d{13}$/.test(parts[1]) || !/^[a-f0-9]{64}$/.test(parts[2])) return false;
  const issuedAt = Number(parts[1]);
  if (!Number.isSafeInteger(issuedAt) || issuedAt > Date.now() + 60_000 || Date.now() - issuedAt > TOKEN_TTL_MS) return false;
  const expected = crypto.createHmac('sha256', tokenSecret()).update(binding).update('.').update(parts[0]).update('.').update(parts[1]).digest();
  const actual = Buffer.from(parts[2], 'hex');
  return actual.length === expected.length && crypto.timingSafeEqual(actual, expected);
}

export function issueCsrfToken(req, res) {
  const binding = bindingFor(req, res);
  const token = createToken(binding);
  res.cookie('nexora_csrf', token, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
    maxAge: TOKEN_TTL_MS
  });
  res.set('Cache-Control', 'no-store');
  res.json({ csrfToken: token });
}

export function requireCsrf(req, res, next) {
  if (SAFE_METHODS.has(req.method)) return next();
  if (!hasTrustedOrigin(req)) return res.status(403).json({ message: 'Request origin is not allowed.' });
  const cookie = req.cookies?.nexora_csrf;
  const header = req.get('x-csrf-token');
  const binding = req.cookies?.nexora_session || req.cookies?.nexora_csrf_binding;
  if (!binding || typeof cookie !== 'string' || typeof header !== 'string' || cookie !== header || !isValidToken(header, binding)) {
    return res.status(403).json({ message: 'CSRF validation failed. Refresh and try again.' });
  }
  next();
}
