import test from 'node:test';
import assert from 'node:assert/strict';
import { hashCheckoutRequest, assertSameIdempotencyRequest } from './idempotency.js';

test('same normalized checkout payload produces the same request fingerprint', () => {
  const payload = { shippingAddress: { recipient: 'A User', city: 'Dhaka' }, couponCode: 'SAVE10' };
  assert.equal(hashCheckoutRequest(payload), hashCheckoutRequest(payload));
});

test('an existing order can be replayed for the same request fingerprint', () => {
  const order = { _id: 'order-1', requestHash: hashCheckoutRequest({ city: 'Dhaka' }) };
  assert.equal(assertSameIdempotencyRequest(order, hashCheckoutRequest({ city: 'Dhaka' })), order);
});

test('reusing an idempotency key with different checkout details returns a conflict', () => {
  const order = { _id: 'order-1', requestHash: hashCheckoutRequest({ city: 'Dhaka' }) };
  assert.throws(
    () => assertSameIdempotencyRequest(order, hashCheckoutRequest({ city: 'Gazipur' })),
    error => error.statusCode === 409
  );
});
