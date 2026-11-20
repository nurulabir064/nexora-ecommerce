import { useEffect, useState } from 'react';
import { initialDraft, STORAGE_KEY, validateDraft, parseImportedDraft } from '../data/customizationDraft.js';
import { Eye, RotateCcw, Store, LayoutDashboard, ShieldCheck, Image as ImageIcon, Palette, Save, Download, Upload } from 'lucide-react';

const demoProducts = [
  { name: 'Everyday Essential', category: 'Lifestyle', price: '৳1,250', color: '#e8edf5' },
  { name: 'Modern Carry', category: 'Accessories', price: '৳890', color: '#f2eae4' },
  { name: 'Daily Companion', category: 'Lifestyle', price: '৳1,590', color: '#e9eee8' },
  { name: 'Simple Design', category: 'Home', price: '৳2,100', color: '#eeeaf4' }
];

function Field({ label, hint, children }) {
  return <label className="block"><span className="mb-1.5 block text-xs font-semibold text-slate-700">{label}</span>{children}{hint && <span className="mt-1 block text-[10px] text-slate-400">{hint}</span>}</label>;
}

function TextField({ label, value, onChange, hint, maxLength = 120, type = 'text', min, step }) {
  return <Field label={label} hint={hint}><input type={type} min={min} step={step} value={value} maxLength={maxLength} onChange={event => onChange(event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-400"/></Field>;
}

function ColorField({ label, value, onChange }) {
  return <Field label={label}><div className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-2"><input aria-label={label} type="color" value={value} onChange={event => onChange(event.target.value)} className="h-8 w-10 cursor-pointer border-0 bg-transparent p-0"/><span className="font-mono text-xs uppercase text-slate-600">{value}</span></div></Field>;
}

function ToggleField({ label, checked, onChange }) {
  return <label className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3 text-xs font-medium text-slate-700"><span>{label}</span><input type="checkbox" checked={checked} onChange={event => onChange(event.target.checked)} className="h-4 w-4 accent-blue-600"/></label>;
}

function StorePreview({ draft }) {
  const imageUrl = (() => {
    try {
      const parsed = new URL(draft.heroImage);
      return parsed.protocol === 'https:' ? parsed.href : '';
    } catch { return ''; }
  })();

  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm" style={{ '--demo-brand': draft.primaryColor, '--demo-dark': draft.darkColor }}>
    <div className="px-3 py-2 text-center text-[9px] font-semibold tracking-wider text-white sm:px-5 sm:text-[10px]" style={{ background: 'var(--demo-dark)' }}>{draft.announcement || 'Your store announcement'}</div>
    <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4 sm:px-6">
      <div className="text-lg font-black tracking-tight sm:text-xl" style={{ color: 'var(--demo-dark)' }}>{draft.storeName || 'YOUR STORE'}<span style={{ color: 'var(--demo-brand)' }}>.</span></div>
      <nav className="hidden gap-4 text-[10px] font-semibold text-slate-500 sm:flex"><span>Shop</span><span>Categories</span><span>Our story</span></nav>
      <div className="rounded-full border border-slate-200 px-3 py-1.5 text-[9px] font-semibold">Bag · 0</div>
    </header>
    <div className="grid sm:grid-cols-2">
      <div className="flex flex-col justify-center px-5 py-8 sm:px-8 sm:py-10">
        <p className="text-[9px] font-bold tracking-[.18em]" style={{ color: 'var(--demo-brand)' }}>{draft.heroEyebrow}</p>
        <h3 className="mt-3 text-2xl font-black leading-tight tracking-tight text-slate-900 sm:text-3xl">{draft.heroTitle}</h3>
        <p className="mt-3 text-xs leading-6 text-slate-500">{draft.heroDescription}</p>
        <span className="mt-5 inline-flex w-fit rounded-full px-5 py-3 text-[10px] font-bold text-white" style={{ background: 'var(--demo-brand)' }}>Explore collection ↗</span>
      </div>
      <div className="min-h-44 bg-slate-100 sm:min-h-64">{imageUrl ? <img src={imageUrl} alt="Demo storefront hero" className="h-full min-h-44 w-full object-cover sm:min-h-64" onError={event => { event.currentTarget.style.display = 'none'; }}/> : <div className="grid h-full min-h-44 place-items-center text-xs text-slate-400"><ImageIcon size={22}/>Add a valid HTTPS image URL</div>}</div>
    </div>
    {draft.showCategories && <section className="border-t border-slate-100 px-4 py-5 sm:px-6"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-extrabold text-slate-900">Shop by category</h4><span className="text-[9px]" style={{ color: 'var(--demo-brand)' }}>View all ↗</span></div><div className="grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3 text-center text-[10px] font-semibold">Lifestyle</div><div className="rounded-xl bg-slate-50 p-3 text-center text-[10px] font-semibold">Accessories</div><div className="rounded-xl bg-slate-50 p-3 text-center text-[10px] font-semibold">Home</div></div></section>}
    {draft.showFeatured && <section className="border-t border-slate-100 px-4 py-5 sm:px-6"><div className="mb-3 flex items-center justify-between"><h4 className="text-sm font-extrabold text-slate-900">Picked for your everyday</h4><span className="text-[9px]" style={{ color: 'var(--demo-brand)' }}>Shop all ↗</span></div><div className={`grid gap-2 ${draft.productColumns === '4' ? 'grid-cols-2 sm:grid-cols-4' : draft.productColumns === '3' ? 'grid-cols-2 sm:grid-cols-3' : 'grid-cols-2' }`}>{demoProducts.slice(0, Number(draft.productColumns)).map(product => <article key={product.name} className="min-w-0"><div className="aspect-square rounded-xl" style={{ background: product.color }}></div><p className="mt-2 truncate text-[9px] font-semibold text-slate-800">{product.name}</p><p className="text-[9px] text-slate-400">{product.category}</p><p className="mt-1 text-[9px] font-bold text-slate-800">{product.price}</p></article>)}</div></section>}
    {draft.showBenefits && <div className="grid grid-cols-3 gap-2 border-t border-slate-100 px-4 py-4 text-center text-[9px] font-semibold text-slate-500 sm:px-6"><span>✓ Quality first</span><span>↺ Easy returns</span><span>♡ Customer care</span></div>}
    {draft.showPromoStrip && <div className="px-4 py-3 text-center text-[10px] font-semibold text-white" style={{ background: 'var(--demo-brand)' }}>{draft.promoText || 'Your promotional message'}</div>}
    <div className="border-t border-slate-100 px-4 py-4 sm:px-6"><p className="text-[10px] font-bold text-slate-800">Delivery preview (sample only)</p><div className="mt-2 flex flex-wrap justify-between gap-2 text-[9px] text-slate-500"><span>Delivery fee: ৳{draft.demoShippingFee || '0'}</span><span>Free delivery from ৳{draft.demoFreeShippingThreshold || '0'}</span></div></div>
    <footer className="px-4 py-4 text-center text-[9px] text-slate-400" style={{ background: '#f8fafc' }}>© 2026 {draft.storeName || 'YOUR STORE'} · Preview only</footer>
  </div>;
}

function AdminPreview({ draft }) {
  return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
    <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4"><div><p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: draft.adminAccent }}>ADMIN PREVIEW</p><h3 className="mt-1 text-lg font-black text-slate-900">{draft.adminTitle || 'Store management'}</h3></div><span className="rounded-full px-3 py-1.5 text-[9px] font-bold text-white" style={{ background: draft.adminAccent }}>Admin</span></div>
    <div className={draft.compactAdmin ? 'grid grid-cols-2 gap-2 p-3' : 'grid grid-cols-2 gap-3 p-5'}>
      {['Products','Orders','Customers','Revenue'].map((label,index)=><div key={label} className={draft.compactAdmin?'rounded-lg border border-slate-100 p-3':'rounded-xl border border-slate-100 p-4'}><p className="text-[10px] text-slate-500">{label}</p><p className="mt-2 text-xl font-black text-slate-900">{['08','00','01','৳0'][index]}</p><div className="mt-2 h-1.5 rounded-full bg-slate-100"><div className="h-1.5 w-2/3 rounded-full" style={{ background: draft.adminAccent }}></div></div></div>)}
    </div>
    {draft.showAdminQuickActions && <div className="mx-3 mb-3 grid grid-cols-2 gap-2"><div className="rounded-lg border border-slate-100 p-3 text-[9px] font-semibold text-slate-600">＋ Add product</div><div className="rounded-lg border border-slate-100 p-3 text-[9px] font-semibold text-slate-600">↗ View orders</div></div>}
    <div className="mx-3 mb-3 rounded-xl border border-slate-100 p-3"><p className="text-[10px] font-bold text-slate-800">Recent activity</p><p className="mt-2 text-[9px] text-slate-400">Demo content only · no customer or order data loaded</p></div>
  </div>;
}

export default function CustomizationStudio() {
  const [draft, setDraft] = useState(initialDraft);
  const [preview, setPreview] = useState('store');
  const [notice, setNotice] = useState('');
  const [savedAt, setSavedAt] = useState('');
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;
      const parsed = JSON.parse(saved);
      if (validateDraft(parsed?.draft)) {
        setDraft(parsed.draft);
        setSavedAt(parsed.savedAt || '');
      } else localStorage.removeItem(STORAGE_KEY);
    } catch { localStorage.removeItem(STORAGE_KEY); }
  }, []);
  const update = (key, value) => { setDraft(current => ({ ...current, [key]: value })); setSavedAt(''); setNotice(''); };
  const saveDraft = () => {
    try {
      if (!validateDraft(draft)) { setNotice('Please correct the invalid values before saving.'); return; }
      const timestamp = new Date().toISOString();
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ schemaVersion: 1, savedAt: timestamp, draft }));
      setSavedAt(timestamp);
      setNotice('Draft saved in this browser. It is not published or applied to the live store.');
    } catch { setNotice('Could not save in this browser. Check storage availability.'); }
  };
  const exportDraft = () => {
    const payload = { schemaVersion: 1, exportedAt: new Date().toISOString(), draft };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'nexora-customization-demo.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Configuration exported. It is a proposal file, not a live-store update.');
  };
  const importDraft = async event => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    if (file.size > 100_000) { setNotice('Configuration file is too large.'); return; }
    try {
      const imported = parseImportedDraft(await file.text());
      setDraft(imported);
      setSavedAt('');
      setNotice('Configuration imported into preview. Save it locally if you want to keep it in this browser.');
    } catch { setNotice('Import failed. Choose a valid NEXORA configuration JSON file.'); }
  };
  const reset = () => {
    setDraft(initialDraft);
    setSavedAt('');
    setNotice('Preview reset to the default demo.');
    try { localStorage.removeItem(STORAGE_KEY); } catch { /* storage may be unavailable */ }
  };

  return <section className="mt-5 space-y-5">
    <div className="flex flex-wrap items-start justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4">
      <div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={18}/><div><p className="text-xs font-bold text-amber-900">Demo mode · Changes are temporary</p><p className="mt-1 max-w-2xl text-[11px] leading-5 text-amber-800">This studio uses sample preview data. Drafts may be saved only in this browser or exported as JSON; it does not call the API, publish settings, or modify products, orders, delivery fees, or the database.</p></div></div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={saveDraft} className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-2 text-[10px] font-bold text-amber-900"><Save size={13}/> Save draft</button>
        <button type="button" onClick={exportDraft} className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-2 text-[10px] font-bold text-amber-900"><Download size={13}/> Export JSON</button>
        <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-2 text-[10px] font-bold text-amber-900"><Upload size={13}/> Import JSON<input type="file" accept="application/json,.json" onChange={importDraft} className="sr-only"/></label>
        <button type="button" onClick={reset} className="inline-flex items-center gap-2 rounded-full border border-amber-300 bg-white px-3 py-2 text-[10px] font-bold text-amber-900"><RotateCcw size={13}/> Reset demo</button>
      </div>
    </div>
    {notice && <p role="status" className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">{notice}</p>}
    {savedAt && <p className="text-[10px] text-slate-400">Saved locally in this browser: {new Date(savedAt).toLocaleString()}</p>}

    <div className="grid gap-5 xl:grid-cols-[minmax(260px,.72fr)_minmax(0,1.28fr)]">
      <div className="space-y-5">
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><Store size={16} className="text-blue-600"/><h2 className="text-sm font-extrabold">Storefront identity</h2></div>
          <div className="space-y-4">
            <TextField label="Store name / logo text" value={draft.storeName} onChange={value=>update('storeName',value)} maxLength={32}/>
            <TextField label="Announcement bar" value={draft.announcement} onChange={value=>update('announcement',value)} maxLength={100}/>
            <div className="grid grid-cols-2 gap-3"><ColorField label="Primary color" value={draft.primaryColor} onChange={value=>update('primaryColor',value)}/><ColorField label="Dark brand color" value={draft.darkColor} onChange={value=>update('darkColor',value)}/></div>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><ImageIcon size={16} className="text-blue-600"/><h2 className="text-sm font-extrabold">Homepage content</h2></div>
          <div className="space-y-4">
            <TextField label="Hero eyebrow" value={draft.heroEyebrow} onChange={value=>update('heroEyebrow',value)} maxLength={70}/>
            <TextField label="Hero heading" value={draft.heroTitle} onChange={value=>update('heroTitle',value)} maxLength={90}/>
            <Field label="Hero description"><textarea rows={3} maxLength={240} value={draft.heroDescription} onChange={event=>update('heroDescription',event.target.value)} className="w-full resize-y rounded-xl border border-slate-200 px-3 py-2.5 text-xs outline-none focus:border-blue-400"/></Field>
            <TextField label="Hero image URL" value={draft.heroImage} onChange={value=>update('heroImage',value)} hint="Preview accepts HTTPS image URLs only." maxLength={500}/>
          </div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><Palette size={16} className="text-blue-600"/><h2 className="text-sm font-extrabold">Store sections & product layout</h2></div>
          <div className="space-y-2">
            <ToggleField label="Show categories section" checked={draft.showCategories} onChange={value=>update('showCategories',value)}/>
            <ToggleField label="Show featured products" checked={draft.showFeatured} onChange={value=>update('showFeatured',value)}/>
            <ToggleField label="Show benefits row" checked={draft.showBenefits} onChange={value=>update('showBenefits',value)}/>
            <ToggleField label="Show promotional strip" checked={draft.showPromoStrip} onChange={value=>update('showPromoStrip',value)}/>
          </div>
          <div className="mt-4 space-y-3"><Field label="Product columns"><select value={draft.productColumns} onChange={event=>update('productColumns',event.target.value)} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-xs"><option value="2">2 columns</option><option value="3">3 columns</option><option value="4">4 columns</option></select></Field><TextField label="Promo strip text" value={draft.promoText} onChange={value=>update('promoText',value)} maxLength={90}/><div className="grid grid-cols-2 gap-3"><TextField label="Demo delivery fee (BDT)" type="number" min="0" step="1" value={draft.demoShippingFee} onChange={value=>update('demoShippingFee',value)}/><TextField label="Demo free delivery threshold (BDT)" type="number" min="0" step="1" value={draft.demoFreeShippingThreshold} onChange={value=>update('demoFreeShippingThreshold',value)}/></div><p className="text-[10px] leading-4 text-amber-700">These delivery values are preview examples only. Checkout continues using the existing backend rules.</p></div>
        </div>
        <div className="rounded-2xl border border-slate-100 bg-white p-5">
          <div className="mb-4 flex items-center gap-2"><LayoutDashboard size={16} className="text-blue-600"/><h2 className="text-sm font-extrabold">Admin appearance</h2></div>
          <div className="space-y-4">
            <TextField label="Admin heading" value={draft.adminTitle} onChange={value=>update('adminTitle',value)} maxLength={50}/>
            <ColorField label="Admin accent color" value={draft.adminAccent} onChange={value=>update('adminAccent',value)}/>
            <ToggleField label="Compact dashboard cards" checked={draft.compactAdmin} onChange={value=>update('compactAdmin',value)}/>
            <ToggleField label="Show admin quick actions" checked={draft.showAdminQuickActions} onChange={value=>update('showAdminQuickActions',value)}/>
          </div>
        </div>
      </div>

      <div className="min-w-0">
        <div className="sticky top-32">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Live demo</p><h2 className="mt-1 text-xl font-extrabold">Preview changes</h2></div><div className="flex rounded-full border border-slate-200 bg-white p-1"><button type="button" aria-pressed={preview==='store'} onClick={()=>setPreview('store')} className={preview==='store'?'rounded-full bg-slate-900 px-3 py-2 text-[10px] font-bold text-white':'rounded-full px-3 py-2 text-[10px] font-bold text-slate-500'}><Store size={12} className="mr-1 inline"/> Store</button><button type="button" aria-pressed={preview==='admin'} onClick={()=>setPreview('admin')} className={preview==='admin'?'rounded-full bg-slate-900 px-3 py-2 text-[10px] font-bold text-white':'rounded-full px-3 py-2 text-[10px] font-bold text-slate-500'}><LayoutDashboard size={12} className="mr-1 inline"/> Admin</button></div></div>
          <div className="mb-3 flex items-center gap-2 text-[10px] text-slate-400"><Eye size={13}/> Sample preview · not connected to live storefront</div>
          {preview==='store' ? <StorePreview draft={draft}/> : <AdminPreview draft={draft}/>}
        </div>
      </div>
    </div>
  </section>;
}
