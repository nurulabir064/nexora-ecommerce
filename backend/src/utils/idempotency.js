import { createHash } from 'node:crypto';

export function hashCheckoutRequest(payload) {
  return createHash('sha256').update(JSON.stringify(payload)).digest('hex');
}

export function assertSameIdempotencyRequest(order, requestHash) {
  if (order.requestHash && order.requestHash !== requestHash) {
    const error = new Error('This Idempotency-Key was already used with different checkout details.');
    error.statusCode = 409;
    throw error;
  }
  return order;
}
