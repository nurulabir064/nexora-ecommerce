import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { requireCsrf } from './csrf.js';

process.env.CSRF_SECRET = 'test-csrf-secret-that-is-long-enough-for-hmac';
process.env.NODE_ENV = 'test';

function signedToken(binding, issuedAt = Date.now()) {
  const nonce = 'a'.repeat(64);
  const timestamp = String(issuedAt);
  const mac = crypto.createHmac('sha256', process.env.CSRF_SECRET)
    .update(binding).update('.').update(nonce).update('.').update(timestamp).digest('hex');
  return `${nonce}.${timestamp}.${mac}`;
}

function runMiddleware({ method = 'POST', cookie, header, binding, origin, referer } = {}) {
  let nextCalled = false;
  let statusCode = 200;
  let body;
  const req = {
    method,
    cookies: {
      ...(cookie === undefined ? {} : { nexora_csrf: cookie }),
      ...(binding === undefined ? {} : { nexora_session: binding })
    },
    get: name => {
      const key = name.toLowerCase();
      if (key === 'x-csrf-token') return header;
      if (key === 'origin') return origin;
      if (key === 'referer') return referer;
      return undefined;
    }
  };
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; }
  };
  requireCsrf(req, res, () => { nextCalled = true; });
  return { nextCalled, statusCode, body };
}

test('safe HTTP methods do not require a CSRF token', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) assert.equal(runMiddleware({ method }).nextCalled, true);
});

test('accepts a valid HMAC token bound to the current session cookie', () => {
  const session = 'session-cookie-value';
  const token = signedToken(session);
  assert.equal(runMiddleware({ cookie: token, header: token, binding: session }).nextCalled, true);
});

test('rejects a token signed for a different session', () => {
  const token = signedToken('session-A');
  const result = runMiddleware({ cookie: token, header: token, binding: 'session-B' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.nextCalled, false);
});

test('rejects missing, mismatched, malformed and expired tokens', () => {
  assert.equal(runMiddleware().statusCode, 403);
  const session = 'session-cookie-value';
  const token = signedToken(session);
  assert.equal(runMiddleware({ cookie: token, header: 'different', binding: session }).statusCode, 403);
  assert.equal(runMiddleware({ cookie: 'malformed', header: 'malformed', binding: session }).statusCode, 403);
  const expired = signedToken(session, Date.now() - 24 * 60 * 60 * 1000 - 1);
  assert.equal(runMiddleware({ cookie: expired, header: expired, binding: session }).statusCode, 403);
});

test('rejects an untrusted Origin and accepts the configured Origin', () => {
  process.env.APP_ORIGIN = 'https://shop.example.com';
  const session = 'session-cookie-value';
  const token = signedToken(session);
  assert.equal(runMiddleware({ cookie: token, header: token, binding: session, origin: 'https://evil.example' }).statusCode, 403);
  assert.equal(runMiddleware({ cookie: token, header: token, binding: session, origin: 'https://shop.example.com' }).nextCalled, true);
});

test('uses Referer as the origin fallback and rejects a missing source in production', () => {
  process.env.APP_ORIGIN = 'https://shop.example.com';
  const session = 'session-cookie-value';
  const token = signedToken(session);
  assert.equal(runMiddleware({ cookie: token, header: token, binding: session, referer: 'https://shop.example.com/account' }).nextCalled, true);
  assert.equal(runMiddleware({ cookie: token, header: token, binding: session, referer: 'https://evil.example/account' }).statusCode, 403);
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  try {
    assert.equal(runMiddleware({ cookie: token, header: token, binding: session }).statusCode, 403);
  } finally {
    process.env.NODE_ENV = previous;
  }
});
