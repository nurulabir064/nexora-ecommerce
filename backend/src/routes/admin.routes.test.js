import test, { before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../app.js';
import { requireRole } from '../middleware/auth.js';

let server;
let baseUrl;

before(async () => {
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve, reject) => {
    server.once('listening', resolve);
    server.once('error', reject);
  });
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(async () => {
  if (!server) return;
  await new Promise((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve());
  });
});

test('all admin read endpoints reject requests without an authenticated session', async () => {
  const paths = [
    '/api/admin/overview',
    '/api/admin/products',
    '/api/admin/categories',
    '/api/admin/customers',
    '/api/admin/reviews',
    '/api/admin/coupons',
    '/api/admin/orders'
  ];

  for (const path of paths) {
    const response = await fetch(`${baseUrl}${path}`);
    assert.equal(response.status, 401, `${path} must reject unauthenticated requests`);
    assert.deepEqual(await response.json(), { message: 'Authentication required' });
  }
});

test('admin endpoints reject an invalid session cookie', async () => {
  const response = await fetch(`${baseUrl}/api/admin/overview`, {
    headers: { Cookie: 'nexora_session=not-a-valid-jwt' }
  });

  assert.equal(response.status, 401);
  assert.deepEqual(await response.json(), { message: 'Invalid or expired session' });
});

test('role middleware denies customer access to admin-only routes', () => {
  let nextCalled = false;
  let statusCode;
  let body;
  const req = { user: { role: 'customer' } };
  const res = {
    status(code) { statusCode = code; return this; },
    json(value) { body = value; return this; }
  };

  requireRole('admin')(req, res, () => { nextCalled = true; });

  assert.equal(statusCode, 403);
  assert.deepEqual(body, { message: 'You do not have permission' });
  assert.equal(nextCalled, false);
});

test('role middleware allows an admin to continue', () => {
  let nextCalled = false;

  requireRole('admin')({ user: { role: 'admin' } }, {}, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});
