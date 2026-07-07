'use client';
import { useState, useRef, useContext } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Store, MapPin, Camera, CheckCircle } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { storeApi } from '../../api-services/storeApi';
import UserAvatarMenu from '../../components-main/UserAvatarMenu';

// Palette: #F5F5F5 bg · #DFF1F1 mint · #BBD5DA steel border · #FF0000 danger

const CATEGORIES = [
  'Food & Beverages','Grocery','Fashion','Electronics',
  'Pharmacy','Toys','Home & Living','Beauty','Sports','Other'
];

const isValidLatLng = (lat: number, lng: number) =>
  Number.isFinite(lat) && lat >= -90  && lat <= 90 &&
  Number.isFinite(lng) && lng >= -180 && lng <= 180;

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">{children}</label>;
}

function Input({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800 placeholder-gray-400
        outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
    />
  );
}

function Select({ children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800
        outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition cursor-pointer"
    >
      {children}
    </select>
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

export default function StoreRegisterPage() {
  const ctx   = useContext(AuthContext) as any;
  const user  = ctx?.user;
  const token: string | null = ctx?.token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const router = useRouter();
  const logoRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    name: '', description: '', phone: '', email: user?.email || '',
    category: 'Other',
    street: '', city: '', state: '', pinCode: '',
    latitude: '', longitude: ''
  });
  const [logoFile, setLogoFile]       = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState('');
  const [detecting, setDetecting]     = useState(false);

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const detectLocation = () => {
    setDetecting(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      pos => {
        const { latitude: lat, longitude: lng } = pos.coords;
        setDetecting(false);
        // Some Windows/Wi-Fi-based location providers occasionally report a
        // corrupted reading outside valid GeoJSON ranges — catch it here
        // instead of silently filling the form with a bad value.
        if (!isValidLatLng(lat, lng)) {
          setError(`Detected location looks invalid (lat: ${lat}, lng: ${lng}). Please enter your coordinates manually.`);
          return;
        }
        set('latitude',  String(lat));
        set('longitude', String(lng));
      },
      () => { setDetecting(false); setError('Could not detect location. Enter manually.'); }
    );
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) { setError('You must be logged in.'); return; }
    if (!form.latitude || !form.longitude) { setError('Store location is required.'); return; }
    if (!isValidLatLng(parseFloat(form.latitude), parseFloat(form.longitude))) {
      setError(`Invalid location coordinates (lat: ${form.latitude}, lng: ${form.longitude}). Latitude must be between -90 and 90, longitude between -180 and 180 — please re-detect or re-enter your location.`);
      return;
    }
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (!['street','city','state','pinCode'].includes(k)) fd.append(k, v);
      });
      fd.append('address', JSON.stringify({ street: form.street, city: form.city, state: form.state, pinCode: form.pinCode }));
      fd.append('ownerName', user?.fullname || 'Owner');
      if (logoFile) fd.append('logo', logoFile);
      const res = await storeApi.register(fd, token);

      // The backend upgrades the user's role to store_owner and returns a fresh token.
      // Save it so product/category APIs work immediately without re-login.
      const newToken = res.data?.token;
      if (newToken && ctx?.login) {
        const updatedUser = { ...user, role: 'store_owner' };
        ctx.login(updatedUser, newToken);
      }

      router.push('/store/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#BBD5DA] sticky top-0 z-20 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-4">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 font-medium transition">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">Register Your Store</span>
            <UserAvatarMenu theme="light" compact />
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10">

        {/* Hero text */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">Register Your Store</h1>
          <p className="text-gray-500 text-sm">Start publishing offers to nearby customers.</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl mb-6 text-sm">
            <span className="mt-0.5">⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* ── Logo ────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm">
            <h2 className="font-semibold text-gray-800 mb-4">Store Logo</h2>
            <div className="flex items-center gap-5">
              <div
                onClick={() => logoRef.current?.click()}
                className="w-24 h-24 rounded-2xl border-2 border-dashed border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-center cursor-pointer hover:border-teal-400 hover:bg-[#DFF1F1] transition overflow-hidden"
              >
                {logoPreview
                  ? <img src={logoPreview} alt="logo" className="w-full h-full object-cover" />
                  : <Camera size={24} className="text-[#BBD5DA]" />
                }
              </div>
              <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
              <div>
                <p className="text-sm font-medium text-gray-700">
                  {logoPreview ? 'Logo selected ✓' : 'Upload your store logo'}
                </p>
                <p className="text-gray-400 text-xs mt-0.5">Optional · JPG / PNG up to 5 MB</p>
                {logoPreview && (
                  <button type="button" onClick={() => logoRef.current?.click()}
                    className="mt-2 text-xs text-teal-600 hover:underline">
                    Change
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* ── Basic info ──────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Basic Information</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label>Store Name *</Label>
                <Input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Fresh Mart" />
              </div>
              <div>
                <Label>Category *</Label>
                <Select required value={form.category} onChange={e => set('category', e.target.value)}>
                  {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                </Select>
              </div>
              <div>
                <Label>Contact Phone *</Label>
                <Input required type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+91 98765 43210" />
              </div>
              <div>
                <Label>Contact Email *</Label>
                <Input required type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="store@email.com" />
              </div>
            </div>

            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => set('description', e.target.value)} rows={3}
                placeholder="Tell customers what you sell…" />
            </div>
          </div>

          {/* ── Address ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-gray-800">Store Address</h2>

            <div>
              <Label>Street</Label>
              <Input value={form.street} onChange={e => set('street', e.target.value)} placeholder="123 Main Street" />
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <Label>City</Label>
                <Input value={form.city} onChange={e => set('city', e.target.value)} placeholder="Chennai" />
              </div>
              <div>
                <Label>State</Label>
                <Input value={form.state} onChange={e => set('state', e.target.value)} placeholder="Tamil Nadu" />
              </div>
              <div>
                <Label>PIN Code</Label>
                <Input value={form.pinCode} onChange={e => set('pinCode', e.target.value)} placeholder="600001" />
              </div>
            </div>
          </div>

          {/* ── Location ────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4">
            <div>
              <h2 className="font-semibold text-gray-800 mb-0.5">Store Location *</h2>
              <p className="text-gray-400 text-xs">Used to show your offers to customers nearby.</p>
            </div>

            <button type="button" onClick={detectLocation} disabled={detecting}
              className="flex items-center gap-2 bg-[#DFF1F1] hover:bg-teal-100 border border-[#BBD5DA] text-teal-700 text-sm font-medium px-4 py-2.5 rounded-xl transition disabled:opacity-60">
              {detecting
                ? <><span className="w-3.5 h-3.5 border-2 border-teal-400 border-t-transparent rounded-full animate-spin" /> Detecting…</>
                : <><MapPin size={15} /> Use My Current Location</>
              }
            </button>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Latitude *</Label>
                <Input required value={form.latitude} onChange={e => set('latitude', e.target.value)}
                  placeholder="e.g. 13.0827" type="number" step="any" />
              </div>
              <div>
                <Label>Longitude *</Label>
                <Input required value={form.longitude} onChange={e => set('longitude', e.target.value)}
                  placeholder="e.g. 80.2707" type="number" step="any" />
              </div>
            </div>

            {form.latitude && form.longitude && (
              <div className="flex items-center gap-2 bg-[#DFF1F1] border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm">
                <CheckCircle size={15} className="text-teal-600 shrink-0" />
                <span className="text-teal-700 font-medium">
                  Location set: {parseFloat(form.latitude).toFixed(4)}, {parseFloat(form.longitude).toFixed(4)}
                </span>
                <a href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                  target="_blank" rel="noopener noreferrer"
                  className="ml-auto text-teal-600 hover:underline text-xs whitespace-nowrap">
                  View on map ↗
                </a>
              </div>
            )}
          </div>

          {/* ── Submit ─────────────────────────────────────────── */}
          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3.5 rounded-xl disabled:opacity-50 transition text-base shadow-sm flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registering…</>
              : <><Store size={18} /> Register Store</>
            }
          </button>

        </form>
      </main>
    </div>
  );
}
