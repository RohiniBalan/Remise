'use client';
import { useState, useRef, useContext, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Tag, MapPin, Satellite, RotateCcw, CheckCircle, Image as ImgIcon,
         ScanLine, Upload, RefreshCw, AlertCircle, CheckCircle2, Sparkles, X, Plus } from 'lucide-react';
import UserAvatarMenu from '../../../components-main/UserAvatarMenu';
import { AuthContext } from '../../../context/AuthContext';
import { storeApi }  from '../../../api-services/storeApi';
import { offersApi } from '../../../api-services/offersApi';

// Palette: #F5F5F5 bg · #DFF1F1 mint · #BBD5DA steel border · #FF0000 danger

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
        outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition ${props.className ?? ''}`}
    />
  );
}

function Textarea({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
        outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition resize-none"
    />
  );
}

// ── Offer Scan Modal ──────────────────────────────────────────────────────────
type ScanStep = 'idle' | 'scanning' | 'done' | 'error';

function OfferScanModal({ onClose, onFilled }: {
  onClose: () => void;
  onFilled: (data: {
    title: string; category: string; description: string;
    originalPrice: string; offerPrice: string; validUntil: string;
    imageFile: File | null; imagePreview: string;
  }) => void;
}) {
  const [file,     setFile]     = useState<File | null>(null);
  const [preview,  setPreview]  = useState('');
  const [step,     setStep]     = useState<ScanStep>('idle');
  const [errMsg,   setErrMsg]   = useState('');
  const [dragging, setDragging] = useState(false);
  const [engine,   setEngine]   = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const pickFile = (f: File) => { setFile(f); setPreview(URL.createObjectURL(f)); setStep('idle'); setErrMsg(''); };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f && f.type.startsWith('image/')) pickFile(f);
  };

  const handleScan = async () => {
    if (!file) return;
    setStep('scanning'); setErrMsg('');
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res  = await fetch('/api/smart-offer-scan', { method: 'POST', body: fd });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Scan failed.');

      const x = data.extracted;
      setEngine(data.engine || 'ocr');

      // Convert image dataURI to File for the offer upload
      let imageFile: File | null = null;
      let imagePreview = '';
      if (x.imageUrl) {
        try {
          const blob = await fetch(x.imageUrl).then(r => r.blob());
          const ext  = blob.type === 'image/png' ? 'png' : 'jpg';
          imageFile    = new File([blob], `offer-scan.${ext}`, { type: blob.type });
          imagePreview = URL.createObjectURL(blob);
        } catch { /* image optional */ }
      }

      onFilled({
        title:         x.title         || '',
        category:      x.category      || 'General',
        description:   x.description   || '',
        originalPrice: String(x.originalPrice || ''),
        offerPrice:    String(x.offerPrice    || x.originalPrice || ''),
        validUntil:    x.validUntil    || '',
        imageFile,
        imagePreview,
      });
      setStep('done');
    } catch (err: any) {
      setErrMsg(err.message || 'Something went wrong.');
      setStep('error');
    }
  };

  const inputCls = 'w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-md shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="border-b border-[#BBD5DA] px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ScanLine size={18} className="text-teal-600" />
            <h2 className="text-base font-bold text-gray-900">Scan Paper Offer</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700"><X size={20} /></button>
        </div>

        <div className="p-6 space-y-4">
          {/* Drop zone */}
          {step !== 'done' && (
            <div
              className={`border-2 border-dashed rounded-2xl transition cursor-pointer
                ${dragging ? 'border-teal-500 bg-teal-50' : 'border-[#BBD5DA] hover:border-teal-400 hover:bg-[#F5F5F5]'}
                ${preview ? 'p-2' : 'p-8'}`}
              onDragOver={e => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => !preview && inputRef.current?.click()}
            >
              <input ref={inputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) pickFile(f); }} />
              {preview
                ? <div className="relative">
                    <img src={preview} alt="Paper" className="w-full max-h-48 object-contain rounded-xl" />
                    <button onClick={e => { e.stopPropagation(); setFile(null); setPreview(''); setStep('idle'); }}
                      className="absolute top-2 right-2 bg-white/90 border border-gray-200 rounded-full p-1 shadow">
                      <X size={13} className="text-gray-600" />
                    </button>
                  </div>
                : <div className="flex flex-col items-center gap-3 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-[#DFF1F1] flex items-center justify-center">
                      <Upload size={22} className="text-teal-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">Drop your offer paper here</p>
                      <p className="text-xs text-gray-400 mt-0.5">Supports all Indian regional languages</p>
                    </div>
                  </div>
              }
            </div>
          )}

          {/* States */}
          {step === 'scanning' && (
            <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-xl p-4">
              <RefreshCw size={16} className="text-teal-600 animate-spin shrink-0" />
              <div>
                <p className="text-sm font-semibold text-teal-800">Reading paper…</p>
                <p className="text-xs text-teal-600 mt-0.5">Extracting offer details using AI</p>
              </div>
            </div>
          )}
          {step === 'error' && (
            <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl p-4">
              <AlertCircle size={15} className="text-[#FF0000] shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{errMsg}</p>
            </div>
          )}
          {step === 'done' && (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle2 size={26} className="text-green-600" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Details extracted!</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Form is pre-filled — review and publish.
                  {engine && <span className={`ml-1.5 inline-block text-[10px] font-bold px-1.5 py-0.5 rounded-full ${engine === 'google+indictrans2' ? 'bg-teal-100 text-teal-700' : engine === 'claude' ? 'bg-purple-100 text-purple-700' : 'bg-amber-100 text-amber-700'}`}>via {engine}</span>}
                </p>
              </div>
              <button onClick={onClose}
                className="px-6 py-2 bg-teal-600 hover:bg-teal-700 rounded-xl text-sm font-semibold text-white transition">
                Review & Publish →
              </button>
            </div>
          )}

          {/* Scan button */}
          {step !== 'done' && (
            <button onClick={handleScan} disabled={!file || step === 'scanning'}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition">
              {step === 'scanning'
                ? <><RefreshCw size={14} className="animate-spin" /> Scanning…</>
                : <><Sparkles size={14} /> Scan & Fill Offer Details</>}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewOfferPage() {
  const ctx   = useContext(AuthContext) as any;
  const token: string | null =
    ctx?.token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const router = useRouter();
  const imgRef = useRef<HTMLInputElement>(null);

  const [store, setStore]         = useState<any>(null);
  const [imgFile, setImgFile]     = useState<File | null>(null);
  const [imgPreview, setImgPrev]  = useState<string | null>(null);
  const [loading, setLoading]     = useState(false);
  const [detecting, setDetecting] = useState(false);
  const [error, setError]         = useState('');
  const [showScan, setShowScan]   = useState(false);

  const [form, setForm] = useState({
    title: '', description: '', category: 'General',
    originalPrice: '', offerPrice: '', validUntil: '',
  });

  const [latitude,  setLatitude]  = useState('');
  const [longitude, setLongitude] = useState('');
  const [locSource, setLocSource] = useState<'store' | 'gps' | 'manual'>('store');

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const handleScanFilled = (data: {
    title: string; category: string; description: string;
    originalPrice: string; offerPrice: string; validUntil: string;
    imageFile: File | null; imagePreview: string;
  }) => {
    setForm({
      title:         data.title,
      description:   data.description,
      category:      data.category,
      originalPrice: data.originalPrice,
      offerPrice:    data.offerPrice,
      validUntil:    data.validUntil,
    });
    if (data.imageFile)    setImgFile(data.imageFile);
    if (data.imagePreview) setImgPrev(data.imagePreview);
    setShowScan(false);
  };

  useEffect(() => {
    if (!token) return;
    storeApi.getMyStore(token)
      .then(r => {
        const s = r.data.data;
        setStore(s);
        setLongitude(String(s.location.coordinates[0]));
        setLatitude(String(s.location.coordinates[1]));
        setLocSource('store');
      })
      .catch(() => router.push('/store/register'));
  }, [token]);

  const resetToStoreLocation = () => {
    if (!store) return;
    setLongitude(String(store.location.coordinates[0]));
    setLatitude(String(store.location.coordinates[1]));
    setLocSource('store');
  };

  const detectGPS = () => {
    setDetecting(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLatitude(String(pos.coords.latitude));
        setLongitude(String(pos.coords.longitude));
        setLocSource('gps');
        setDetecting(false);
      },
      () => {
        setError('Could not detect GPS location. Enter coordinates manually.');
        setDetecting(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const discount = form.originalPrice && form.offerPrice
    ? Math.max(0, Math.round(((+form.originalPrice - +form.offerPrice) / +form.originalPrice) * 100))
    : 0;

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImgFile(f);
    setImgPrev(URL.createObjectURL(f));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imgFile) { setError('Please upload an offer image.'); return; }
    if (!store)   { setError('Store not found.'); return; }
    if (!latitude || !longitude) { setError('Notification coordinates are required.'); return; }
    if (+form.offerPrice >= +form.originalPrice) {
      setError('Offer price must be less than original price.'); return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('image',     imgFile);
      fd.append('storeId',   store._id);
      fd.append('storeName', store.name);
      fd.append('latitude',  latitude);
      fd.append('longitude', longitude);
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      await offersApi.create(fd, token);
      router.push('/store/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to publish offer.');
    } finally {
      setLoading(false);
    }
  };

  if (!store) return (
    <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-full border-4 border-[#BBD5DA] border-t-teal-500 animate-spin" />
        <p className="text-gray-500 text-sm">Loading store info…</p>
      </div>
    </div>
  );

  const minDate = new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);

  const locSourceLabel: Record<string, { icon: React.ReactNode; text: string }> = {
    store:  { icon: <MapPin size={13} />,     text: 'Store registered location' },
    gps:    { icon: <Satellite size={13} />,  text: 'Your current GPS position' },
    manual: { icon: <Tag size={13} />,        text: 'Manually entered' },
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#BBD5DA] sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/store/dashboard"
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 font-medium transition">
            <ArrowLeft size={16} /> Dashboard
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => setShowScan(true)}
              className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition">
              <ScanLine size={15} /> Scan Paper
            </button>
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">Publish New Offer</span>
            <UserAvatarMenu theme="light" compact />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero text */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Publish New Offer</h1>
            <p className="text-gray-500 text-sm">
              Customers near <span className="font-semibold text-gray-700">{store.name}</span> will be notified instantly.
            </p>
          </div>
          <button onClick={() => setShowScan(true)}
            className="flex items-center gap-2 bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shrink-0 shadow-sm">
            <ScanLine size={16} /> Scan Paper to Auto-fill
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Offer image ──────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden shadow-sm">
            <div
              onClick={() => imgRef.current?.click()}
              className="relative w-full aspect-video bg-[#F5F5F5] border-b border-[#BBD5DA] flex items-center justify-center cursor-pointer hover:bg-[#DFF1F1] transition overflow-hidden group"
            >
              {imgPreview
                ? <img src={imgPreview} alt="offer" className="w-full h-full object-cover" />
                : (
                  <div className="text-center">
                    <ImgIcon size={40} className="text-[#BBD5DA] mx-auto mb-3 group-hover:text-teal-400 transition" />
                    <p className="text-gray-600 font-medium">Click to upload offer image</p>
                    <p className="text-gray-400 text-sm mt-0.5">JPG / PNG / GIF · up to 10 MB</p>
                  </div>
                )}
              {discount > 0 && (
                <div className="absolute top-3 right-3 bg-[#FF0000] text-white text-sm font-bold px-3 py-1 rounded-xl shadow">
                  {discount}% OFF
                </div>
              )}
            </div>
            <div className="px-5 py-3 flex items-center justify-between">
              <span className="text-xs text-gray-400">{imgPreview ? '✓ Image selected' : 'No image selected'}</span>
              {imgPreview && (
                <button type="button" onClick={() => imgRef.current?.click()}
                  className="text-xs text-teal-600 hover:underline">Change</button>
              )}
            </div>
          </div>
          <input ref={imgRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />

          {/* ── Details ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Offer Details</h2>

            <div>
              <Label>Offer Title *</Label>
              <Input required value={form.title} onChange={e => set('title', e.target.value)}
                placeholder="e.g. Buy 1 Get 1 Free on all toys!" />
            </div>

            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={e => set('category', e.target.value)}
                placeholder="Food, Clothes, Electronics…" />
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="More details about the offer…" />
            </div>
          </div>

          {/* ── Pricing ──────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Pricing</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Original Price (₹) *</Label>
                <Input required type="number" min="0" value={form.originalPrice}
                  onChange={e => set('originalPrice', e.target.value)} placeholder="e.g. 500" />
              </div>
              <div>
                <Label>Offer Price (₹) *</Label>
                <Input required type="number" min="0" value={form.offerPrice}
                  onChange={e => set('offerPrice', e.target.value)} placeholder="e.g. 299" />
              </div>
            </div>

            {discount > 0 && (
              <div className="flex items-center gap-2 bg-[#DFF1F1] border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm">
                <CheckCircle size={15} className="text-teal-600 shrink-0" />
                <span className="text-teal-700 font-medium">
                  Customers save ₹{(+form.originalPrice - +form.offerPrice).toFixed(0)} &nbsp;·&nbsp; {discount}% off
                </span>
              </div>
            )}

            <div>
              <Label>Valid Until *</Label>
              <Input required type="datetime-local" min={minDate} value={form.validUntil}
                onChange={e => set('validUntil', e.target.value)} />
            </div>
          </div>

          {/* ── Notification location ─────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800 mb-0.5">Notification Target Location</h2>
              <p className="text-gray-400 text-xs">
                Users near these coordinates will receive a push notification. Defaults to your store's location.
              </p>
            </div>

            {/* Source badge */}
            {latitude && longitude && (
              <div className="flex items-center gap-1.5 text-xs text-teal-700 font-medium">
                {locSourceLabel[locSource].icon}
                {locSourceLabel[locSource].text}
              </div>
            )}

            {/* Coordinate inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude *</Label>
                <Input required type="number" step="any" value={latitude}
                  onChange={e => { setLatitude(e.target.value); setLocSource('manual'); }}
                  placeholder="e.g. 13.0827" className="font-mono" />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input required type="number" step="any" value={longitude}
                  onChange={e => { setLongitude(e.target.value); setLocSource('manual'); }}
                  placeholder="e.g. 80.2707" className="font-mono" />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={resetToStoreLocation}
                className="flex items-center gap-1.5 bg-[#DFF1F1] hover:bg-teal-100 border border-[#BBD5DA] text-teal-700 text-xs font-medium px-3 py-2 rounded-xl transition">
                <RotateCcw size={12} /> Use Store Location
              </button>
              <button type="button" onClick={detectGPS} disabled={detecting}
                className="flex items-center gap-1.5 bg-[#F5F5F5] hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 text-xs font-medium px-3 py-2 rounded-xl transition disabled:opacity-50">
                {detecting
                  ? <><span className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Detecting…</>
                  : <><Satellite size={12} /> Use My Current GPS</>
                }
              </button>
            </div>

            {/* Live coords preview */}
            {latitude && longitude && (
              <div className="bg-[#F5F5F5] border border-[#BBD5DA] rounded-xl px-4 py-2.5 flex items-center justify-between text-xs font-mono text-gray-500">
                <span>{parseFloat(latitude).toFixed(6)}, {parseFloat(longitude).toFixed(6)}</span>
                <a href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="text-teal-600 hover:underline ml-3 whitespace-nowrap not-italic">
                  View on map ↗
                </a>
              </div>
            )}
          </div>

          {/* ── Submit ───────────────────────────────────────────────────── */}
          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition text-base shadow-sm flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Publishing…</>
              : '🚀 Publish Offer & Notify Nearby Users'
            }
          </button>

        </form>
      </main>

      {showScan && (
        <OfferScanModal
          onClose={() => setShowScan(false)}
          onFilled={handleScanFilled}
        />
      )}
    </div>
  );
}
