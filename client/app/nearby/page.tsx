'use client';
import { useEffect, useState, useContext, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Bell, BellOff, Clock, ShoppingBag } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { offersApi } from '../api-services/offersApi';
import { useNotifications } from '../hooks/useNotifications';
import UserAvatarMenu from '../components-main/UserAvatarMenu';

// Palette: #F5F5F5 bg · #DFF1F1 mint · #BBD5DA steel border · #FF0000 danger

interface Offer {
  _id: string; title: string; description: string; image: string;
  storeName: string; storeId: string; category: string;
  originalPrice: number; offerPrice: number; discountPercent: number;
  validUntil: string; distanceKm: number; orderCount: number;
}

function OrderModal({ offer, onClose, onSuccess }: { offer: Offer; onClose: ()=>void; onSuccess: ()=>void }) {
  const [form, setForm] = useState({ customerName:'', customerPhone:'', customerEmail:'', deliveryAddress:'', quantity:'1', notes:'' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const set = (k: string, v: string) => setForm(f => ({...f, [k]: v}));

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await offersApi.placeOrder(offer._id, { ...form, quantity: parseInt(form.quantity) });
      onSuccess();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Order failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-md border border-[#BBD5DA] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#BBD5DA] bg-[#DFF1F1] flex items-start justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-900">{offer.title}</h2>
            <p className="text-gray-500 text-xs mt-0.5">{offer.storeName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-700 text-2xl leading-none ml-4">×</button>
        </div>

        {/* Price strip */}
        <div className="px-6 py-3 bg-[#F5F5F5] border-b border-[#BBD5DA] flex justify-between items-center">
          <span className="text-gray-500 text-sm">Price per unit</span>
          <div>
            <span className="font-bold text-teal-700 text-lg">₹{offer.offerPrice}</span>
            {offer.originalPrice !== offer.offerPrice && (
              <span className="text-gray-400 text-sm line-through ml-2">₹{offer.originalPrice}</span>
            )}
          </div>
        </div>

        {error && <p className="text-[#FF0000] text-sm px-6 pt-3">{error}</p>}

        <form onSubmit={handleOrder} className="px-6 py-5 space-y-3">
          {[
            { label:'Your Name *',   key:'customerName',  type:'text',  required:true },
            { label:'Phone *',       key:'customerPhone', type:'tel',   required:true },
            { label:'Email',         key:'customerEmail', type:'email', required:false },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">{f.label}</label>
              <input required={f.required} type={f.type} value={(form as any)[f.key]}
                onChange={e => set(f.key, e.target.value)}
                className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800
                  outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition" />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Delivery Address *</label>
            <textarea required value={form.deliveryAddress} onChange={e => set('deliveryAddress', e.target.value)} rows={2}
              className="w-full bg-white border border-[#BBD5DA] rounded-xl px-4 py-2.5 text-sm text-gray-800
                outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition resize-none" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Quantity</label>
              <input type="number" min="1" max="99" value={form.quantity} onChange={e => set('quantity', e.target.value)}
                className="w-24 bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800
                  outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition" />
            </div>
            <div className="pt-5">
              <span className="text-gray-500 text-sm">Total: </span>
              <span className="font-bold text-teal-700">₹{(offer.offerPrice * parseInt(form.quantity||'1')).toFixed(0)}</span>
            </div>
          </div>
          <button type="submit" disabled={loading}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-3 rounded-xl disabled:opacity-50 transition flex items-center justify-center gap-2">
            {loading
              ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Placing Order…</>
              : <><ShoppingBag size={16} /> Place Order</>
            }
          </button>
        </form>
      </div>
    </div>
  );
}

function NearbyContent() {
  const ctx             = useContext(AuthContext) as any;
  const token: string | null = ctx?.token ?? (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const searchParams    = useSearchParams();
  const { subscribe, permission, subscribed } = useNotifications(token);

  const [location, setLocation]   = useState<{lat:number;lng:number}|null>(null);
  const [radius, setRadius]       = useState(10);
  const [offers, setOffers]       = useState<Offer[]>([]);
  const [loading, setLoading]         = useState(false);
  const [locError, setLocError]       = useState('');
  const [subError, setSubError]       = useState('');
  const [subLoading, setSubLoading]   = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);
  const [orderSuccess, setOrderSuccess]   = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      pos => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      ()  => setLocError('Location access denied. Enable location to see nearby offers.')
    );
  }, []);

  const loadOffers = useCallback(async () => {
    if (!location) return;
    setLoading(true);
    try {
      const res = await offersApi.getNearby(location.lat, location.lng, radius);
      setOffers(res.data.data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [location, radius]);

  useEffect(() => { loadOffers(); }, [loadOffers]);

  useEffect(() => {
    const offerId = searchParams.get('offer');
    if (offerId) {
      setTimeout(() => {
        document.getElementById(`offer-${offerId}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 500);
    }
  }, [offers, searchParams]);

  const handleSubscribe = async () => {
    if (!location) return;
    setSubLoading(true); setSubError('');
    const result = await subscribe(location.lat, location.lng);
    setSubLoading(false);
    if (!result.success) setSubError(result.message || 'Failed to enable alerts.');
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5]">

      {/* ── Top bar ──────────────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[#BBD5DA] sticky top-0 z-30 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-teal-700 font-medium transition">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="ml-auto flex items-center gap-3">
            <span className="text-sm font-semibold text-gray-700 hidden sm:block">Nearby Offers</span>
            <UserAvatarMenu theme="light" compact />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">

        {/* Hero */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">📍 Nearby Offers</h1>
          <p className="text-gray-500 text-sm">Exclusive deals from stores around you</p>
        </div>

        {/* Location error */}
        {locError && (
          <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl mb-5 text-sm">
            <span className="mt-0.5 shrink-0">⚠️</span>
            <span>{locError}</span>
          </div>
        )}

        {/* Push notification banner */}
        {token && !subscribed && permission !== 'denied' && location && (
          <div className="mb-5">
            <div className="bg-[#DFF1F1] border border-[#BBD5DA] rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-white border border-[#BBD5DA] flex items-center justify-center shrink-0 mt-0.5">
                  <Bell size={16} className="text-teal-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">Get notified about new nearby offers</p>
                  <p className="text-gray-500 text-xs mt-0.5">We'll alert you when stores near you post deals.</p>
                </div>
              </div>
              <button onClick={handleSubscribe} disabled={subLoading}
                className="shrink-0 bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-2">
                {subLoading && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {subLoading ? 'Enabling…' : 'Enable Alerts'}
              </button>
            </div>
            {subError && (
              <div className="mt-2 flex items-start gap-2 bg-red-50 border border-red-200 text-red-600 px-4 py-2.5 rounded-xl text-sm">
                <span className="mt-0.5 shrink-0">⚠️</span>
                <span>{subError}</span>
              </div>
            )}
          </div>
        )}

        {subscribed && (
          <div className="flex items-center gap-2 bg-[#DFF1F1] border border-[#BBD5DA] rounded-xl px-4 py-3 mb-5 text-sm">
            <Bell size={15} className="text-teal-600 shrink-0" />
            <span className="text-teal-700 font-medium">You'll be notified about new offers within {radius} km</span>
          </div>
        )}

        {/* Radius filter */}
        {location && (
          <div className="bg-white rounded-xl border border-[#BBD5DA] p-4 mb-6 flex items-center gap-3 flex-wrap shadow-sm">
            <p className="text-sm text-gray-500 shrink-0 font-medium">Search radius:</p>
            {[2, 5, 10, 20].map(r => (
              <button key={r} onClick={() => setRadius(r)}
                className={`px-4 py-1.5 rounded-full text-sm font-semibold transition ${
                  radius === r
                    ? 'bg-[#DFF1F1] text-teal-700 border border-[#BBD5DA]'
                    : 'bg-[#F5F5F5] text-gray-500 border border-transparent hover:border-[#BBD5DA]'
                }`}>
                {r} km
              </button>
            ))}
            <p className="text-xs text-gray-400 ml-auto font-mono">
              {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="bg-white rounded-2xl border border-[#BBD5DA] overflow-hidden animate-pulse">
                <div className="aspect-video bg-[#F5F5F5]" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-[#F5F5F5] rounded w-3/4" />
                  <div className="h-3 bg-[#F5F5F5] rounded w-1/2" />
                  <div className="h-8 bg-[#F5F5F5] rounded mt-3" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {!loading && offers.length === 0 && location && (
          <div className="bg-white rounded-2xl border border-[#BBD5DA] py-20 text-center shadow-sm">
            <p className="text-5xl mb-4">🔍</p>
            <p className="text-xl font-semibold text-gray-700 mb-1">No offers found within {radius} km</p>
            <p className="text-gray-400 text-sm">Try increasing the radius or check back later.</p>
          </div>
        )}

        {/* Offers grid */}
        {!loading && offers.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {offers.map(offer => {
              const highlighted = searchParams.get('offer') === offer._id;
              const timeLeft = new Date(offer.validUntil).getTime() - Date.now();
              const hoursLeft = Math.max(0, Math.floor(timeLeft / 3_600_000));

              return (
                <div key={offer._id} id={`offer-${offer._id}`}
                  className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${
                    highlighted ? 'border-teal-400 ring-2 ring-teal-100' : 'border-[#BBD5DA]'
                  }`}>
                  {/* Image */}
                  <div className="relative aspect-video bg-[#F5F5F5]">
                    <img src={`${process.env.NEXT_PUBLIC_API_URL}${offer.image}`} alt={offer.title}
                      className="w-full h-full object-cover" />
                    {offer.discountPercent > 0 && (
                      <span className="absolute top-2 right-2 bg-[#FF0000] text-white text-xs font-bold px-2 py-1 rounded-lg shadow">
                        {offer.discountPercent}% OFF
                      </span>
                    )}
                    <span className="absolute bottom-2 left-2 bg-black/50 text-white text-xs px-2.5 py-1 rounded-full flex items-center gap-1">
                      <MapPin size={10} /> {offer.distanceKm} km away
                    </span>
                  </div>

                  {/* Body */}
                  <div className="p-4">
                    <p className="text-xs text-teal-600 font-semibold mb-0.5">{offer.storeName}</p>
                    <h3 className="font-semibold text-gray-900 leading-tight mb-1 truncate">{offer.title}</h3>
                    {offer.description && (
                      <p className="text-gray-400 text-xs mb-2 line-clamp-2">{offer.description}</p>
                    )}

                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <span className="text-teal-700 font-bold text-lg">₹{offer.offerPrice}</span>
                        {offer.originalPrice !== offer.offerPrice && (
                          <span className="text-gray-400 text-sm line-through ml-2">₹{offer.originalPrice}</span>
                        )}
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full flex items-center gap-1 font-medium ${
                        hoursLeft < 24 ? 'bg-red-50 text-[#FF0000] border border-red-200' : 'bg-[#F5F5F5] text-gray-500 border border-[#BBD5DA]'
                      }`}>
                        <Clock size={10} />
                        {hoursLeft < 1 ? '< 1h left' : hoursLeft < 24 ? `${hoursLeft}h left` : `${Math.floor(hoursLeft/24)}d left`}
                      </span>
                    </div>

                    <button
                      onClick={() => { setSelectedOffer(offer); setOrderSuccess(false); }}
                      className="w-full bg-teal-600 hover:bg-teal-700 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                      <ShoppingBag size={14} /> Order Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Order modal */}
      {selectedOffer && !orderSuccess && (
        <OrderModal
          offer={selectedOffer}
          onClose={() => setSelectedOffer(null)}
          onSuccess={() => setOrderSuccess(true)}
        />
      )}

      {/* Success overlay */}
      {orderSuccess && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-8 text-center border border-[#BBD5DA] max-w-sm w-full shadow-2xl">
            <p className="text-5xl mb-4">🎉</p>
            <h2 className="text-xl font-bold text-teal-700 mb-2">Order Placed!</h2>
            <p className="text-gray-500 mb-6 text-sm">The store will confirm your order shortly.</p>
            <button onClick={() => { setSelectedOffer(null); setOrderSuccess(false); }}
              className="w-full bg-[#F5F5F5] hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 font-semibold py-2.5 rounded-xl transition text-sm">
              Back to Offers
            </button>
          </div>
        </div>
      )}
    </div>
  );
}


export default function NearbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <p className="text-gray-500">Loading nearby offers...</p>
      </div>
    }>
      <NearbyContent />
    </Suspense>
  );
}
