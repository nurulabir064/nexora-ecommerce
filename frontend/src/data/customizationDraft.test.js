import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDraft, validateDraft, parseImportedDraft } from './customizationDraft.js';

test('accepts the default customization draft', () => {
  assert.equal(validateDraft(initialDraft), true);
});

test('rejects invalid colors', () => {
  assert.equal(validateDraft({ ...initialDraft, primaryColor: 'not-a-color' }), false);
});

test('rejects unsupported product column counts', () => {
  assert.equal(validateDraft({ ...initialDraft, productColumns: '5' }), false);
});

test('rejects non-numeric delivery preview values', () => {
  assert.equal(validateDraft({ ...initialDraft, demoShippingFee: '80.5' }), false);
  assert.equal(validateDraft({ ...initialDraft, demoFreeShippingThreshold: '3e3' }), false);
});

test('rejects non-HTTPS hero image URLs', () => {
  assert.equal(validateDraft({ ...initialDraft, heroImage: 'http://example.com/image.png' }), false);
});

test('rejects unknown and missing configuration keys', () => {
  assert.equal(validateDraft({ ...initialDraft, unexpected: true }), false);
  const { storeName, ...incomplete } = initialDraft;
  assert.equal(validateDraft(incomplete), false);
});

test('imports a valid versioned configuration', () => {
  const json = JSON.stringify({ schemaVersion: 1, exportedAt: '2026-11-20T00:00:00.000Z', draft: initialDraft });
  assert.deepEqual(parseImportedDraft(json), initialDraft);
});

test('rejects unsupported import versions and malformed JSON', () => {
  assert.throws(() => parseImportedDraft(JSON.stringify({ schemaVersion: 2, draft: initialDraft })));
  assert.throws(() => parseImportedDraft('{invalid'));
});
