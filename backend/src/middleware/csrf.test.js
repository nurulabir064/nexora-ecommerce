import test from 'node:test';
import assert from 'node:assert/strict';
import { requireCsrf } from './csrf.js';

function runMiddleware({ method = 'POST', cookie, header, origin, referer } = {}) {
  let nextCalled = false;
  let statusCode = 200;
  let body;
  const req = {
    method,
    cookies: cookie === undefined ? {} : { nexora_csrf: cookie },
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

test('CSRF middleware allows safe HTTP methods without a token', () => {
  for (const method of ['GET', 'HEAD', 'OPTIONS']) {
    assert.equal(runMiddleware({ method }).nextCalled, true);
  }
});

test('CSRF middleware accepts matching cookie and request header', () => {
  const token = 'a'.repeat(64);
  assert.equal(runMiddleware({ cookie: token, header: token }).nextCalled, true);
});

test('CSRF middleware rejects missing and mismatched tokens', () => {
  assert.equal(runMiddleware().statusCode, 403);
  assert.equal(runMiddleware({ cookie: 'a'.repeat(64), header: 'b'.repeat(64) }).statusCode, 403);
});

test('CSRF middleware rejects equal UTF-16 lengths with unequal UTF-8 byte lengths safely', () => {
  const result = runMiddleware({ cookie: 'é', header: 'a' });
  assert.equal(result.statusCode, 403);
  assert.equal(result.nextCalled, false);
});

test('CSRF middleware rejects an untrusted Origin before token validation', () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://shop.example.com';
  try {
    const result = runMiddleware({ cookie: 'a'.repeat(64), header: 'a'.repeat(64), origin: 'https://evil.example' });
    assert.equal(result.statusCode, 403);
    assert.equal(result.nextCalled, false);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});

test('CSRF middleware accepts a matching Origin with a valid token', () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://shop.example.com';
  try {
    const token = 'a'.repeat(64);
    assert.equal(runMiddleware({ cookie: token, header: token, origin: 'https://shop.example.com' }).nextCalled, true);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});

test('CSRF middleware uses Referer when Origin is absent', () => {
  const previous = process.env.APP_ORIGIN;
  process.env.APP_ORIGIN = 'https://shop.example.com';
  try {
    const token = 'a'.repeat(64);
    assert.equal(runMiddleware({ cookie: token, header: token, referer: 'https://shop.example.com/account' }).nextCalled, true);
    assert.equal(runMiddleware({ cookie: token, header: token, referer: 'https://evil.example/account' }).statusCode, 403);
  } finally {
    if (previous === undefined) delete process.env.APP_ORIGIN;
    else process.env.APP_ORIGIN = previous;
  }
});
