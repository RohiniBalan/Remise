'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  ChevronLeft, CreditCard, ShieldCheck, CheckCircle,
  Plus, Minus, Trash2, Loader2, AlertCircle
} from 'lucide-react';

import { CartProvider, useCart } from '@/app/components-main/CartContext';
import UserAvatarMenu from '@/app/components-main/UserAvatarMenu';

// Define cart item interface
interface CartItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  image: string;
  totalStock: number;
}

// Define the shape of our address data
interface AddressData {
  country: string;
  firstName: string;
  lastName: string;
  address: string;
  apartment: string;
  city: string;
  state: string;
  pinCode: string;
  phone: string;
}

// ⚠️ MOVED OUTSIDE: This prevents the component from re-rendering and losing focus while typing!
const AddressForm = ({ 
  data, 
  onChange, 
  inputBaseClass 
}: { 
  data: AddressData; 
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => void;
  inputBaseClass: string;
}) => (
  <div className="space-y-4">
    <select name="country" value={data.country} onChange={onChange} className={inputBaseClass}>
      <option value="India">India</option>
    </select>
    <div className="grid grid-cols-2 gap-4">
      <input type="text" name="firstName" value={data.firstName} onChange={onChange} placeholder="First name" required className={inputBaseClass} />
      <input type="text" name="lastName" value={data.lastName} onChange={onChange} placeholder="Last name" required className={inputBaseClass} />
    </div>
    <input type="text" name="address" value={data.address} onChange={onChange} placeholder="Address" required className={inputBaseClass} />
    <input type="text" name="apartment" value={data.apartment} onChange={onChange} placeholder="Apartment, suite, etc. (optional)" className={inputBaseClass} />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input type="text" name="city" value={data.city} onChange={onChange} placeholder="City" required className={inputBaseClass} />
      <select name="state" value={data.state} onChange={onChange} className={inputBaseClass}>
        <option value="Tamil Nadu">Tamil Nadu</option>
        <option value="Karnataka">Karnataka</option>
        <option value="Kerala">Kerala</option>
        <option value="Maharashtra">Maharashtra</option>
      </select>
      <input type="text" name="pinCode" value={data.pinCode} onChange={onChange} placeholder="PIN code" required className={inputBaseClass} />
    </div>
    <input type="tel" name="phone" value={data.phone} onChange={onChange} placeholder="Phone" required className={inputBaseClass} />
  </div>
);

export default function CheckoutPage() {
  const router = useRouter();
  
  const { 
    cart, 
    buyNowItem, 
    setBuyNowItem,
    addToCart,
    decreaseQuantity,
    removeFromCart
  } = useCart() as any;
  
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [paymentMethod, setPaymentMethod] = useState<'phonepe' | 'cod'>('phonepe');
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // --- CUSTOM TOAST STATE ---
  const [toast, setToast] = useState<{ show: boolean; message: string; type: 'error' | 'success' }>({ 
    show: false, message: '', type: 'error' 
  });

  // --- FORM STATE MANAGEMENT ---
  const [contactEmail, setContactEmail] = useState('');
  const [shippingAddress, setShippingAddress] = useState<AddressData>({
    country: 'India', firstName: '', lastName: '', address: '', apartment: '', city: '', state: 'Tamil Nadu', pinCode: '', phone: ''
  });
  const [billingAddress, setBillingAddress] = useState<AddressData>({
    country: 'India', firstName: '', lastName: '', address: '', apartment: '', city: '', state: 'Tamil Nadu', pinCode: '', phone: ''
  });

  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) setTheme(event.detail as 'dark' | 'light');
    };
    window.addEventListener('theme-change', handleThemeChange as EventListener);
    const currentTheme = document.documentElement.getAttribute('data-theme') as 'dark' | 'light';
    if (currentTheme) setTheme(currentTheme);
    return () => window.removeEventListener('theme-change', handleThemeChange as EventListener);
  }, []);

  const itemsToCheckout = buyNowItem ? [buyNowItem] : cart;
  const subtotal = itemsToCheckout.reduce((total: number, item: { price: number; quantity: number; }) => total + (item.price * item.quantity), 0);

  // --- FORM VALIDATION LOGIC ---
  const isShippingValid = 
    contactEmail.trim() !== '' &&
    shippingAddress.firstName.trim() !== '' &&
    shippingAddress.lastName.trim() !== '' &&
    shippingAddress.address.trim() !== '' &&
    shippingAddress.city.trim() !== '' &&
    shippingAddress.pinCode.trim() !== '' &&
    shippingAddress.phone.trim() !== '';

  const isBillingValid = billingSameAsShipping || (
    billingAddress.firstName.trim() !== '' &&
    billingAddress.lastName.trim() !== '' &&
    billingAddress.address.trim() !== '' &&
    billingAddress.city.trim() !== '' &&
    billingAddress.pinCode.trim() !== '' &&
    billingAddress.phone.trim() !== ''
  );

  const isFormValid = isShippingValid && isBillingValid;

  // --- CUSTOM NOTIFICATION HANDLER ---
  const showNotification = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000);
  };

  // --- Handlers for Input Changes ---
  const handleShippingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setShippingAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setBillingAddress(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleIncrease = (item: any) => {
    if (item.quantity >= item.totalStock) {
      showNotification('Out of stock', 'error');
      return;
    }
    if (buyNowItem) {
      setBuyNowItem({ ...buyNowItem, quantity: buyNowItem.quantity + 1 });
    } else {
      addToCart(item);
    }
  };

  const handleDecrease = (item: any) => {
    if (buyNowItem) {
      if (buyNowItem.quantity > 1) {
        setBuyNowItem({ ...buyNowItem, quantity: buyNowItem.quantity - 1 });
      } else {
        setBuyNowItem(null); 
      }
    } else {
      decreaseQuantity(item.id);
    }
  };

  const handleRemove = (item: any) => {
    if (buyNowItem) {
      setBuyNowItem(null);
    } else {
      removeFromCart(item.id);
    }
  };

  // --- PAYMENT HANDLER (SAVES TO DB & INITIATES PHONEPE/COD) ---
  const handlePayment = async () => {
    if (!isFormValid) return; 

    setIsProcessing(true);
    
    try {
      // Get Logged-in user data
      const userStr = localStorage.getItem('user');
      const userData = userStr ? JSON.parse(userStr) : null;

      // Prepare ALL order details to send to the backend
      const orderPayload = {
        amount: subtotal,
        userId: userData?._id || userData?.id, // Added User ID
        redirectUrl: `${window.location.origin}/payment-status`,
        cartItems: itemsToCheckout,
        contactEmail: contactEmail,
        shippingAddress: shippingAddress,
        billingAddress: billingSameAsShipping ? shippingAddress : billingAddress,
        paymentMethod: paymentMethod
      };

      // Send order to backend (This saves to MongoDB & initiates PhonePe if needed)
      const response = await fetch('http://localhost:5000/api/payment/initiate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload)
      });

      const data = await response.json();

      if (response.ok && data.success && data.url) {
        // Clear global cart after creating the order
        if (!buyNowItem) {
          // Clear cart from localStorage if needed
          localStorage.removeItem('cart');
        }
        window.location.href = data.url;
      } else {
        showNotification(`Payment Error: ${data.message || 'Failed to initialize payment gateway.'}`, 'error');
        setIsProcessing(false);
      }
    } catch (error) {
      console.error('Payment Error:', error);
      showNotification('Server unreachable. Please check your backend connection.', 'error');
      setIsProcessing(false);
    }
  };

  const inputBaseClass = `w-full p-3.5 rounded-md border text-sm transition-all focus:outline-none ${
    theme === 'light'
      ? 'bg-white border-gray-300 text-black focus:border-amber-500 shadow-sm'
      : 'bg-[#111] border-[#333] text-white focus:border-[#D4AF37] focus:shadow-[0_0_10px_rgba(212,175,55,0.2)] placeholder-gray-600'
  }`;

  // EMPTY CART SCREEN
  if (itemsToCheckout.length === 0) {
    return (
      <div className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === 'light' ? 'bg-white text-black' : 'bg-[#0a0a0a] text-white'}`}>
        <h1 className="text-2xl font-bold mb-4">There is nothing to checkout.</h1>
        <button 
          onClick={() => router.push('/category/collectors')} 
          className={`px-6 py-2 rounded font-bold uppercase tracking-widest ${theme === 'light' ? 'bg-amber-500 text-white' : 'bg-[#D4AF37] text-black'}`}
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans relative overflow-hidden ${theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]'}`}>
      
      {/* UNIQUE CUSTOM TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div 
            initial={{ opacity: 0, y: -40, scale: 0.95 }} 
            animate={{ opacity: 1, y: 0, scale: 1 }} 
            exit={{ opacity: 0, y: -20, scale: 0.95 }} 
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md font-semibold tracking-wide border ${
              theme === 'light' 
                ? 'bg-white/90 border-gray-200 text-gray-900 shadow-black/10' 
                : 'bg-black/80 border-[#333] text-white shadow-[#D4AF37]/10'
            }`}
          >
            {toast.type === 'error' ? (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/10 text-red-500">
                <AlertCircle size={16} strokeWidth={2.5} />
              </div>
            ) : (
              <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500/10 text-green-500">
                <CheckCircle size={16} strokeWidth={2.5} />
              </div>
            )}
            <span className="text-sm">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className={`w-full px-6 py-4 border-b flex items-center gap-4 ${theme === 'light' ? 'border-gray-200' : 'border-[#222]'}`}>
        <button onClick={() => { setBuyNowItem(null); router.back(); }} className={`p-2 rounded-full transition-colors ${theme === 'light' ? 'hover:bg-gray-100 text-gray-800' : 'hover:bg-[#222] text-white'}`}>
          <ChevronLeft size={24} />
        </button>
        <h2 className={`text-xl font-black tracking-widest uppercase ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>
          Secure Checkout {buyNowItem ? "(Buy Now)" : ""}
        </h2>
        <div className="ml-auto">
          <UserAvatarMenu theme={theme} compact />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        <div className="flex-1 p-6 md:p-10 lg:pr-16 order-2 lg:order-1">
          <div className="mb-10">
            <h3 className={`text-xl font-medium tracking-wide mb-4 ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Contact</h3>
            <input 
              type="email" 
              name="email"
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              placeholder="Email or mobile phone number" 
              required
              className={inputBaseClass} 
            />
            <label className="flex items-center gap-3 mt-4 cursor-pointer group w-fit">
              <div className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${theme === 'light' ? 'border-gray-300 bg-amber-500 border-amber-500' : 'bg-[#D4AF37] border-[#D4AF37]'}`}>
                <CheckCircle size={12} className={theme === 'light' ? 'text-white' : 'text-black'} />
              </div>
              <span className={`text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>Email me with news and offers</span>
            </label>
          </div>

          <div className="mb-10">
            <h3 className={`text-xl font-medium tracking-wide mb-5 ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Delivery</h3>
            <AddressForm data={shippingAddress} onChange={handleShippingChange} inputBaseClass={inputBaseClass} />
          </div>

          <div className="mb-10">
            <h3 className={`text-xl font-medium tracking-wide mb-2 ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Payment</h3>
            <p className={`text-sm mb-5 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>All transactions are secure and encrypted.</p>
            <div className={`border rounded-lg overflow-hidden ${theme === 'light' ? 'border-gray-200' : 'border-[#333]'}`}>
              <div className={`p-5 flex flex-col border-b transition-colors ${paymentMethod === 'phonepe' ? (theme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-[#1a1a1a] border-[#D4AF37]/50') : (theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#111] border-[#333]')}`}>
                <div className="flex items-center justify-between cursor-pointer" onClick={() => setPaymentMethod('phonepe')}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'phonepe' ? (theme === 'light' ? 'border-amber-500' : 'border-[#D4AF37]') : 'border-gray-500'}`}>
                      {paymentMethod === 'phonepe' && <div className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-amber-500' : 'bg-[#D4AF37]'}`} />}
                    </div>
                    <span className={`font-medium tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Secure Online Payment (PhonePe)</span>
                  </label>
                  <CreditCard size={20} className={theme === 'light' ? 'text-gray-400' : 'text-[#D4AF37]/70'} />
                </div>
                <AnimatePresence>
                  {paymentMethod === 'phonepe' && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-5 flex flex-col items-center justify-center p-6 text-center bg-black/20 rounded-md">
                        <ShieldCheck size={32} className={`mb-3 ${theme === 'light' ? 'text-amber-500' : 'text-[#D4AF37]'}`} />
                        <p className={`text-sm leading-relaxed ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}>You will be redirected securely to complete your purchase via UPI, Cards, or Netbanking.</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className={`p-5 flex items-center cursor-pointer transition-colors ${paymentMethod === 'cod' ? (theme === 'light' ? 'bg-amber-50/50' : 'bg-[#1a1a1a]') : (theme === 'light' ? 'bg-white' : 'bg-[#111]')}`} onClick={() => setPaymentMethod('cod')}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? (theme === 'light' ? 'border-amber-500' : 'border-[#D4AF37]') : 'border-gray-500'}`}>
                    {paymentMethod === 'cod' && <div className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-amber-500' : 'bg-[#D4AF37]'}`} />}
                  </div>
                  <span className={`font-medium tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Cash on Delivery (COD)</span>
                </label>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3 className={`text-xl font-medium tracking-wide mb-5 ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Billing address</h3>
            <div className={`border rounded-lg overflow-hidden ${theme === 'light' ? 'border-gray-200' : 'border-[#333]'}`}>
              
              <div className={`p-5 border-b flex items-center cursor-pointer transition-colors ${
                billingSameAsShipping ? (theme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-[#1a1a1a] border-[#D4AF37]/50') : (theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#111] border-[#333]')
              }`} onClick={() => setBillingSameAsShipping(true)}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingSameAsShipping ? (theme === 'light' ? 'border-amber-500' : 'border-[#D4AF37]') : 'border-gray-500'
                    }`}>
                    {billingSameAsShipping && <div className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-amber-500' : 'bg-[#D4AF37]'}`} />}
                  </div>
                  <span className={`font-medium tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Same as shipping address</span>
                </label>
              </div>

              <div className={`p-5 flex flex-col cursor-pointer transition-colors ${
                !billingSameAsShipping ? (theme === 'light' ? 'bg-amber-50/50' : 'bg-[#1a1a1a]') : (theme === 'light' ? 'bg-white' : 'bg-[#111]')
              }`} onClick={() => setBillingSameAsShipping(false)}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      !billingSameAsShipping ? (theme === 'light' ? 'border-amber-500' : 'border-[#D4AF37]') : 'border-gray-500'
                    }`}>
                    {!billingSameAsShipping && <div className={`w-2 h-2 rounded-full ${theme === 'light' ? 'bg-amber-500' : 'bg-[#D4AF37]'}`} />}
                  </div>
                  <span className={`font-medium tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>Use a different billing address</span>
                </label>
                
                <AnimatePresence>
                  {!billingSameAsShipping && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="mt-6">
                        <AddressForm data={billingAddress} onChange={handleBillingChange} inputBaseClass={inputBaseClass} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {!isFormValid && (
             <div className="flex items-center gap-2 mb-3 text-red-500 text-sm font-medium">
               <AlertCircle size={16} /> Please fill in all mandatory details to proceed.
             </div>
          )}

          {/* Trigger Handle Payment */}
          <button 
            onClick={handlePayment}
            disabled={!isFormValid || isProcessing}
            className={`w-full py-5 font-black uppercase tracking-[0.15em] rounded-md transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
            theme === 'light'
              ? 'bg-amber-500 text-white hover:bg-amber-600 shadow-md'
              : 'bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]'
          }`}>
            {isProcessing ? (
               <><Loader2 size={22} className="animate-spin" /> Redirecting...</>
            ) : paymentMethod === 'phonepe' ? (
              <><ShieldCheck size={22} /> Pay now</>
            ) : (
              <><CheckCircle size={22} /> Complete order</>
            )}
          </button>
        </div>

        <div className={`lg:w-[450px] p-6 md:p-10 order-1 lg:order-2 border-b lg:border-b-0 lg:border-l ${theme === 'light' ? 'bg-gray-50 border-gray-200' : 'bg-[#050505] border-[#222]'}`}>
          <div className="sticky top-10">
            <div className="space-y-6 mb-8">
              {itemsToCheckout.map((item: { id: React.Key | null | undefined; image: string | Blob | undefined; title: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; quantity: string | number | bigint | boolean | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | Promise<string | number | bigint | boolean | React.ReactPortal | React.ReactElement<unknown, string | React.JSXElementConstructor<any>> | Iterable<React.ReactNode> | null | undefined> | null | undefined; totalStock: any; price: number; }) => (
                <div key={item.id} className="flex gap-4 items-start group">
                  <div className="relative flex-shrink-0">
                    <div className={`w-20 h-20 rounded-md border flex items-center justify-center p-1 ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-[#111] border-[#333]'}`}>
                      <img src={item.image} alt={String(item.title) || 'Product image'} className="w-full h-full object-contain" />
                    </div>
                  </div>
                  <div className="flex-1 flex flex-col justify-between h-20">
                    <h4 className={`text-sm font-medium line-clamp-2 ${theme === 'light' ? 'text-gray-900' : 'text-gray-200'}`}>{item.title}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-3">
                        <div className={`flex items-center rounded-md border ${theme === 'light' ? 'border-gray-200 bg-white' : 'border-[#333] bg-[#111]'}`}>
                          <button onClick={() => handleDecrease(item)} className={`p-1.5 transition-colors ${theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:text-white hover:bg-[#222]'}`}><Minus size={14} /></button>
                          <span className={`w-8 text-center text-xs font-bold ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>{item.quantity}</span>
                          <button onClick={() => handleIncrease(item)} disabled={(item.quantity ?? 0) >= (item.totalStock || Infinity)} className={`p-1.5 transition-colors ${(item.quantity ?? 0) >= (item.totalStock || Infinity) ? 'opacity-30 cursor-not-allowed' : (theme === 'light' ? 'text-gray-600 hover:bg-gray-50' : 'text-gray-400 hover:text-[#D4AF37] hover:bg-[#222]')}`}><Plus size={14} /></button>
                        </div>
                        <button onClick={() => handleRemove(item)} className={`p-1.5 rounded transition-colors ${theme === 'light' ? 'text-gray-400 hover:text-red-500' : 'text-gray-500 hover:text-red-400'}`}><Trash2 size={16} /></button>
                      </div>
                      <p className={`text-sm font-bold tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>₹{(item.price * (typeof item.quantity === 'number' ? item.quantity : 0)).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className={`py-6 border-y ${theme === 'light' ? 'border-gray-200' : 'border-[#222]'}`}>
              <div className="flex gap-3">
                <input type="text" placeholder="Discount code or gift card" className={inputBaseClass} />
                <button className={`px-6 py-3 rounded-md font-bold uppercase tracking-wider text-xs transition-colors ${theme === 'light' ? 'bg-gray-200 hover:bg-gray-300 text-gray-800' : 'bg-[#222] hover:bg-[#333] text-[#D4AF37] border border-[#333]'}`}>Apply</button>
              </div>
            </div>
            <div className="pt-6 space-y-4">
              <div className={`flex justify-between text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}><span>Subtotal</span><span className={`font-medium ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>₹{subtotal.toLocaleString()}</span></div>
              <div className={`flex justify-between text-sm ${theme === 'light' ? 'text-gray-600' : 'text-gray-400'}`}><span>Shipping</span><span className="text-xs tracking-wide uppercase">Calculated at checkout</span></div>
              <div className={`flex justify-between items-end pt-6 mt-2 border-t ${theme === 'light' ? 'border-gray-200' : 'border-[#222]'}`}>
                <span className={`text-lg font-medium ${theme === 'light' ? 'text-gray-900' : 'text-[#D4AF37]'}`}>Total</span>
                <div className="flex items-end gap-2"><span className={`text-xs font-medium mb-1 ${theme === 'light' ? 'text-gray-500' : 'text-gray-500'}`}>INR</span><span className={`text-3xl font-black tracking-wide ${theme === 'light' ? 'text-gray-900' : 'text-white'}`}>₹{subtotal.toLocaleString()}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}