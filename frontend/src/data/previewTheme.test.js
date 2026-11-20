import test from 'node:test';
import assert from 'node:assert/strict';
import { initialDraft } from './customizationDraft.js';
import { resolvePreviewTheme } from './previewTheme.js';

test('inactive preview uses the default theme', () => {
  assert.deepEqual(resolvePreviewTheme(false, initialDraft), { active: false, draft: initialDraft });
});

test('active preview uses a validated saved draft', () => {
  const draft = { ...initialDraft, storeName: 'Client Demo' };
  assert.deepEqual(resolvePreviewTheme(true, draft), { active: true, draft });
});

test('active preview rejects invalid saved config and falls back', () => {
  assert.deepEqual(resolvePreviewTheme(true, { ...initialDraft, primaryColor: 'invalid' }), { active: false, draft: initialDraft });
});
