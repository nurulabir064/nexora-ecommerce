import { initialDraft, STORAGE_KEY, validateDraft } from './customizationDraft.js';

export const PREVIEW_ACTIVE_KEY = 'nexora-customization-preview-active-v1';

export function resolvePreviewTheme(active, savedDraft) {
  return active && validateDraft(savedDraft)
    ? { active: true, draft: savedDraft }
    : { active: false, draft: initialDraft };
}

export function readPreviewTheme() {
  try {
    const active = localStorage.getItem(PREVIEW_ACTIVE_KEY) === 'true';
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
    return resolvePreviewTheme(active, saved?.draft);
  } catch {
    return resolvePreviewTheme(false, null);
  }
}

export function clearPreviewTheme() {
  try { localStorage.removeItem(PREVIEW_ACTIVE_KEY); } catch { /* storage may be unavailable */ }
}
