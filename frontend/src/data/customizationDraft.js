export const initialDraft = {
  storeName: 'NEXORA',
  announcement: 'WELCOME TO NEXORA · FREE SHIPPING ON ORDERS OVER ৳3,000',
  primaryColor: '#315efb',
  darkColor: '#172b4d',
  heroEyebrow: 'THE EVERYDAY EDIT · NEXORA COLLECTION',
  heroTitle: 'Find your next favourite thing.',
  heroDescription: 'Thoughtfully picked essentials for the way you live, work and move. Good design. Better everyday.',
  heroImage: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1100&q=85',
  showCategories: true,
  showFeatured: true,
  showBenefits: true,
  showPromoStrip: true,
  promoText: 'A little extra for your first order · Use NEXORA10',
  demoShippingFee: '80',
  demoFreeShippingThreshold: '3000',
  productColumns: '4',
  adminTitle: 'NEXORA management',
  adminAccent: '#315efb',
  compactAdmin: false,
  showAdminQuickActions: true
};

export const STORAGE_KEY = 'nexora-customization-demo-v1';

export function validateDraft(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.keys(value).length !== Object.keys(initialDraft).length || Object.keys(value).some(key => !Object.hasOwn(initialDraft, key))) return false;
  for (const [key, defaultValue] of Object.entries(initialDraft)) {
    const item = value[key];
    if (typeof defaultValue === 'boolean') {
      if (typeof item !== 'boolean') return false;
    } else if (typeof defaultValue === 'string') {
      if (typeof item !== 'string') return false;
    } else return false;
  }
  const limits = { storeName: 32, announcement: 100, heroEyebrow: 70, heroTitle: 90, heroDescription: 240, heroImage: 500, promoText: 90, demoShippingFee: 6, demoFreeShippingThreshold: 8, adminTitle: 50 };
  if (Object.entries(limits).some(([key, max]) => value[key].length > max)) return false;
  if (!['2', '3', '4'].includes(value.productColumns)) return false;
  if (![value.primaryColor, value.darkColor, value.adminAccent].every(color => /^#[0-9a-fA-F]{6}$/.test(color))) return false;
  if (!/^\\d{0,6}$/.test(value.demoShippingFee) || !/^\\d{0,8}$/.test(value.demoFreeShippingThreshold)) return false;
  if (value.heroImage) {
    try { if (new URL(value.heroImage).protocol !== 'https:') return false; } catch { return false; }
  }
  return true;
}

export function parseImportedDraft(text) {
  const parsed = JSON.parse(text);
  if (parsed?.schemaVersion !== 1 || !validateDraft(parsed.draft)) throw new Error('This file is not a valid NEXORA demo configuration.');
  return parsed.draft;
}
