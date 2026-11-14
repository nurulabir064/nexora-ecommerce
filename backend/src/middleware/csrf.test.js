import test from 'node:test';
import assert from 'node:assert/strict';
import { requireCsrf } from './csrf.js';

function runMiddleware({ method = 'POST', cookie, header } = {}) {
  let nextCalled = false;
  let statusCode = 200;
  let body;
  const req = {
    method,
    cookies: cookie === undefined ? {} : { nexora_csrf: cookie },
    get: name => name.toLowerCase() === 'x-csrf-token' ? header : undefined
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
