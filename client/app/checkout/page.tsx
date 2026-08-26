"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  CreditCard,
  ShieldCheck,
  CheckCircle,
  Plus,
  Minus,
  Trash2,
  Loader2,
  AlertCircle,
  QrCode,
  Copy,
  Check,
  Upload,
  Store,
  ExternalLink,
} from "lucide-react";

import { CartProvider, useCart } from "@/app/components-main/CartContext";
import UserAvatarMenu from "@/app/components-main/UserAvatarMenu";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";
import CashfreeModal from "@/app/components-main/CashfreeModal";

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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

// Helper: Dynamically load Cashfree checkout SDK script
const loadCashfreeScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Cashfree) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://sdk.cashfree.com/js/v3/cashfree.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

// Product-service stores uploaded-image URLs as relative paths

// (e.g. "/uploads/products/xxx.jpg"); AI-generated/external images are
// already absolute. Same prefixing rule as store/dashboard/page.tsx.
const resolveImageUrl = (image: unknown) => {
  if (typeof image !== "string" || !image) return "";
  return image.startsWith("http") || image.startsWith("data:")
    ? image
    : `${API}${image}`;
};

// ⚠️ MOVED OUTSIDE: This prevents the component from re-rendering and losing focus while typing!
const AddressForm = ({
  data,
  onChange,
  inputBaseClass,
}: {
  data: AddressData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => void;
  inputBaseClass: string;
}) => (
  <div className="space-y-4">
    <select
      name="country"
      value={data.country}
      onChange={onChange}
      className={inputBaseClass}
    >
      <option value="India">India</option>
    </select>
    <div className="grid grid-cols-2 gap-4">
      <input
        type="text"
        name="firstName"
        value={data.firstName}
        onChange={onChange}
        placeholder="First name"
        required
        className={inputBaseClass}
      />
      <input
        type="text"
        name="lastName"
        value={data.lastName}
        onChange={onChange}
        placeholder="Last name"
        required
        className={inputBaseClass}
      />
    </div>
    <input
      type="text"
      name="address"
      value={data.address}
      onChange={onChange}
      placeholder="Address"
      required
      className={inputBaseClass}
    />
    <input
      type="text"
      name="apartment"
      value={data.apartment}
      onChange={onChange}
      placeholder="Apartment, suite, etc. (optional)"
      className={inputBaseClass}
    />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <input
        type="text"
        name="city"
        value={data.city}
        onChange={onChange}
        placeholder="City"
        required
        className={inputBaseClass}
      />
      <select
        name="state"
        value={data.state}
        onChange={onChange}
        className={inputBaseClass}
      >
        <option value="Tamil Nadu">Tamil Nadu</option>
        <option value="Karnataka">Karnataka</option>
        <option value="Kerala">Kerala</option>
        <option value="Maharashtra">Maharashtra</option>
      </select>
      <input
        type="text"
        name="pinCode"
        value={data.pinCode}
        onChange={onChange}
        placeholder="PIN code"
        required
        className={inputBaseClass}
      />
    </div>
    <input
      type="tel"
      name="phone"
      value={data.phone}
      onChange={onChange}
      placeholder="Phone"
      required
      className={inputBaseClass}
    />
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
    removeFromCart,
    clearCart,
  } = useCart() as any;

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [paymentMethod, setPaymentMethod] = useState<"cashfree" | "razorpay" | "qr" | "cod">(
    "cashfree",
  );
  const [storeUpiInfo, setStoreUpiInfo] = useState<{
    storeName: string;
    upiId: string;
    qrCodeImage: string | null;
  } | null>(null);
  const [storeQrLoading, setStoreQrLoading] = useState(false);
  const [utrNumber, setUtrNumber] = useState("");
  const [screenshotFile, setScreenshotFile] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copiedStoreUpi, setCopiedStoreUpi] = useState(false);
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: "success" | "error" | "info";
  }>({ show: false, message: "", type: "info" });
  const [showCashfreeModal, setShowCashfreeModal] = useState(false);
  const [cashfreeModalData, setCashfreeModalData] = useState<any>(null);

  // --- CUSTOM TOAST STATE ---
  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "error" | "success";
  }>({
    show: false,
    message: "",
    type: "error",
  });

  // --- FORM STATE MANAGEMENT ---
  const [contactEmail, setContactEmail] = useState("");
  const [shippingAddress, setShippingAddress] = useState<AddressData>({
    country: "India",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "Tamil Nadu",
    pinCode: "",
    phone: "",
  });
  const [billingAddress, setBillingAddress] = useState<AddressData>({
    country: "India",
    firstName: "",
    lastName: "",
    address: "",
    apartment: "",
    city: "",
    state: "Tamil Nadu",
    pinCode: "",
    phone: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      redirectToLogin("/checkout");
      return;
    }

    const handleThemeChange = (event: CustomEvent) => {
      if (event.detail) setTheme(event.detail as "dark" | "light");
    };
    window.addEventListener("theme-change", handleThemeChange as EventListener);
    const currentTheme = document.documentElement.getAttribute("data-theme") as
      | "dark"
      | "light";
    if (currentTheme) setTheme(currentTheme);
    return () =>
      window.removeEventListener(
        "theme-change",
        handleThemeChange as EventListener,
      );
  }, []);

  const itemsToCheckout = buyNowItem ? [buyNowItem] : cart;
  const subtotal = itemsToCheckout.reduce(
    (total: number, item: { price: number; quantity: number }) =>
      total + item.price * item.quantity,
    0,
  );

  // --- FORM VALIDATION LOGIC ---
  const isShippingValid =
    contactEmail.trim() !== "" &&
    shippingAddress.firstName.trim() !== "" &&
    shippingAddress.lastName.trim() !== "" &&
    shippingAddress.address.trim() !== "" &&
    shippingAddress.city.trim() !== "" &&
    shippingAddress.pinCode.trim() !== "" &&
    shippingAddress.phone.trim() !== "";

  const isBillingValid =
    billingSameAsShipping ||
    (billingAddress.firstName.trim() !== "" &&
      billingAddress.lastName.trim() !== "" &&
      billingAddress.address.trim() !== "" &&
      billingAddress.city.trim() !== "" &&
      billingAddress.pinCode.trim() !== "" &&
      billingAddress.phone.trim() !== "");

  const isFormValid = isShippingValid && isBillingValid;

  // --- CUSTOM NOTIFICATION HANDLER ---
  const showNotification = (
    message: string,
    type: "error" | "success" = "error",
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000);
  };

  // --- Handlers for Input Changes ---
  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleBillingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setBillingAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleIncrease = (item: any) => {
    if (item.quantity >= item.totalStock) {
      showNotification("Out of stock", "error");
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

  const handleScreenshotChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScreenshotFile(file);
    setScreenshotPreview(URL.createObjectURL(file));
  };

  const handleCopyStoreUpi = (vpa: string) => {
    navigator.clipboard?.writeText(vpa);
    setCopiedStoreUpi(true);
    showNotification("Merchant UPI ID copied to clipboard!", "success");
    setTimeout(() => setCopiedStoreUpi(false), 2000);
  };

  useEffect(() => {
    if (paymentMethod !== "qr") return;
    const firstItem: any = itemsToCheckout[0];
    const storeId = firstItem?.storeId || null;
    const productId = firstItem?.id || firstItem?._id || firstItem?.productId || null;

    let cancelled = false;
    setStoreQrLoading(true);

    const loadStoreDetails = async () => {
      try {
        let foundStoreId = storeId;
        if (!foundStoreId && productId) {
          try {
            const pRes = await fetch(`${API}/api/products/${productId}`);
            const pData = await pRes.json();
            if (pData?.success && pData?.data?.storeId) {
              foundStoreId = pData.data.storeId;
            }
          } catch (e) {
            // ignore product lookup error
          }
        }

        if (foundStoreId) {
          const sRes = await fetch(`${API}/api/stores/${foundStoreId}`);
          const sData = await sRes.json();
          if (!cancelled && sData?.success && sData?.data) {
            setStoreUpiInfo({
              storeName: sData.data.name || "Merchant Store",
              upiId: sData.data.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi",
              qrCodeImage: sData.data.qrCodeImage || null,
            });
            setStoreQrLoading(false);
            return;
          }
        }

        if (!cancelled) {
          setStoreUpiInfo({
            storeName: "Verified Store Merchant",
            upiId: process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi",
            qrCodeImage: null,
          });
          setStoreQrLoading(false);
        }
      } catch (e) {
        if (!cancelled) {
          setStoreUpiInfo({
            storeName: "Verified Store Merchant",
            upiId: process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi",
            qrCodeImage: null,
          });
          setStoreQrLoading(false);
        }
      }
    };

    loadStoreDetails();
    return () => {
      cancelled = true;
    };
  }, [paymentMethod, itemsToCheckout]);

  // --- PAYMENT HANDLER (SAVES TO DB, CREATES RAZORPAY ROUTE ORDER, VERIFIES SIGNATURE) ---
  const handlePayment = async () => {
    if (!isAuthenticated()) {
      redirectToLogin("/checkout");
      return;
    }

    if (!isFormValid) return;

    setIsProcessing(true);

    try {
      // Get Logged-in user data
      const userStr = localStorage.getItem("user");
      const userData = userStr ? JSON.parse(userStr) : null;

      // Prepare ALL order details to send to the backend
      const orderPayload = {
        amount: subtotal,
        userId: userData?._id || userData?.id,
        redirectUrl: `${window.location.origin}/payment-status`,
        cartItems: itemsToCheckout,
        contactEmail: contactEmail,
        shippingAddress: shippingAddress,
        billingAddress: billingSameAsShipping
          ? shippingAddress
          : billingAddress,
        paymentMethod: paymentMethod,
      };

      // 1. Create order on backend (calculates multi-vendor split, creates Razorpay Route order)
      const response = await fetch(`${API}/api/payment/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        showNotification(
          data.message || "Failed to initialize payment gateway.",
          "error"
        );
        setIsProcessing(false);
        return;
      }

      // 2. COD / Direct Store QR Code Flow
      if (paymentMethod === "cod" || paymentMethod === "qr" || data.isCod || data.isQr) {
        if ((paymentMethod === "qr" || data.isQr) && (screenshotFile || utrNumber)) {
          try {
            const formData = new FormData();
            if (screenshotFile) formData.append("screenshot", screenshotFile);
            if (utrNumber) formData.append("utr", utrNumber);
            await fetch(`${API}/api/orders/${data.orderId}/confirm-payment`, {
              method: "PATCH",
              body: formData,
            });
          } catch (qrErr) {
            console.warn("QR proof upload note:", qrErr);
          }
        }

        if (!buyNowItem) {
          clearCart();
          localStorage.removeItem("cart");
        }
        router.push(`/payment-status?orderId=${data.orderId}&status=SUCCESS`);
        return;
      }

      // 3. Cashfree Easy Split & Standard Checkout Flow
      if ((paymentMethod === "cashfree" || paymentMethod === "razorpay") && (data.paymentSessionId || data.cashfreeOrderId)) {
        const isLoaded = await loadCashfreeScript();
        if (isLoaded && (window as any).Cashfree && data.paymentSessionId) {
          try {
            const isSandbox = Boolean(
              data.isSandbox ||
              data.paymentSessionId?.includes("paymentpayment") ||
              process.env.NEXT_PUBLIC_CASHFREE_MODE === "sandbox"
            );
            const cashfreeMode = isSandbox ? "sandbox" : "production";
            const cashfree = (window as any).Cashfree({ mode: cashfreeMode });

            cashfree.checkout({
              paymentSessionId: data.paymentSessionId,
              redirectTarget: "_modal",
            }).then(async (result: any) => {
              if (result.error) {
                setIsProcessing(false);
                showNotification(result.error.message || "Payment was cancelled or dismissed.", "error");
                fetch(`${API}/api/payment/cancel`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ orderId: data.orderId, reason: "cashfree_modal_dismissed" }),
                }).catch(() => {});
                return;
              }

              if (result.paymentDetails || result.redirect) {
                try {
                  const verifyRes = await fetch(`${API}/api/payment/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: data.orderId,
                      paymentSessionId: data.paymentSessionId,
                      cashfree_order_id: data.cashfreeOrderId,
                    }),
                  });

                  const verifyData = await verifyRes.json();
                  if (verifyRes.ok && verifyData.success) {
                    if (!buyNowItem) {
                      clearCart();
                      localStorage.removeItem("cart");
                    }
                    router.push(`/payment-status?orderId=${data.orderId}&status=SUCCESS`);
                  } else {
                    showNotification(verifyData.message || "Payment verification pending.", "error");
                    router.push(`/payment-status?orderId=${data.orderId}&status=FAILED`);
                  }
                } catch (vErr: any) {
                  showNotification(vErr.message || "Payment verification error.", "error");
                  router.push(`/payment-status?orderId=${data.orderId}&status=FAILED`);
                } finally {
                  setIsProcessing(false);
                }
              }
            });
            return;
          } catch (sdkErr: any) {
            console.error("Cashfree SDK initiation error:", sdkErr);
            setIsProcessing(false);
            showNotification("Failed to launch Cashfree checkout. Please try again.", "error");
            return;
          }
        }

        setIsProcessing(false);
        showNotification("Cashfree Payment SDK could not be loaded. Please check your internet connection.", "error");
        return;
      }

      // Fallback redirect URL if returned
      if (data.url) {
        if (!buyNowItem) {
          clearCart();
          localStorage.removeItem("cart");
        }
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment Error:", error);
      showNotification(
        "Server unreachable. Please check your backend connection.",
        "error"
      );
      setIsProcessing(false);
    }
  };

  const inputBaseClass = `w-full p-3.5 rounded-md border text-sm transition-all focus:outline-none ${
    theme === "light"
      ? "bg-white border-gray-300 text-black focus:border-amber-500 shadow-sm"
      : "bg-[#111] border-[#333] text-white focus:border-[#D4AF37] focus:shadow-[0_0_10px_rgba(212,175,55,0.2)] placeholder-gray-600"
  }`;

  // EMPTY CART SCREEN
  if (itemsToCheckout.length === 0) {
    return (
      <div
        className={`min-h-screen flex flex-col items-center justify-center p-6 ${theme === "light" ? "bg-white text-black" : "bg-[#0a0a0a] text-white"}`}
      >
        <h1 className="text-2xl font-bold mb-4">
          There is nothing to checkout.
        </h1>
        <button
          onClick={() => router.push("/category/collectors")}
          className={`px-6 py-2 rounded font-bold uppercase tracking-widest ${theme === "light" ? "bg-amber-500 text-white" : "bg-[#D4AF37] text-black"}`}
        >
          Return to Shop
        </button>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen font-sans relative overflow-hidden ${theme === "light" ? "bg-white" : "bg-[#0a0a0a]"}`}
    >
      {/* UNIQUE CUSTOM TOAST NOTIFICATION */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-6 py-3.5 rounded-full shadow-2xl backdrop-blur-md font-semibold tracking-wide border ${
              theme === "light"
                ? "bg-white/90 border-gray-200 text-gray-900 shadow-black/10"
                : "bg-black/80 border-[#333] text-white shadow-[#D4AF37]/10"
            }`}
          >
            {toast.type === "error" ? (
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

      <div
        className={`w-full px-6 py-4 border-b flex items-center gap-4 ${theme === "light" ? "border-gray-200" : "border-[#222]"}`}
      >
        <button
          onClick={() => {
            setBuyNowItem(null);
            router.back();
          }}
          className={`p-2 rounded-full transition-colors ${theme === "light" ? "hover:bg-gray-100 text-gray-800" : "hover:bg-[#222] text-white"}`}
        >
          <ChevronLeft size={24} />
        </button>
        <h2
          className={`text-xl font-black tracking-widest uppercase ${theme === "light" ? "text-gray-900" : "text-white"}`}
        >
          Secure Checkout {buyNowItem ? "(Buy Now)" : ""}
        </h2>
        <div className="ml-auto">
          <UserAvatarMenu theme={theme} compact />
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row min-h-[calc(100vh-80px)]">
        <div className="flex-1 p-6 md:p-10 lg:pr-16 order-2 lg:order-1">
          <div className="mb-10">
            <h3
              className={`text-xl font-medium tracking-wide mb-4 ${theme === "light" ? "text-gray-900" : "text-[#D4AF37]"}`}
            >
              Contact
            </h3>
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
              <div
                className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors ${theme === "light" ? "border-gray-300 bg-amber-500 border-amber-500" : "bg-[#D4AF37] border-[#D4AF37]"}`}
              >
                <CheckCircle
                  size={12}
                  className={theme === "light" ? "text-white" : "text-black"}
                />
              </div>
              <span
                className={`text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}
              >
                Email me with news and offers
              </span>
            </label>
          </div>

          <div className="mb-10">
            <h3
              className={`text-xl font-medium tracking-wide mb-5 ${theme === "light" ? "text-gray-900" : "text-[#D4AF37]"}`}
            >
              Delivery
            </h3>
            <AddressForm
              data={shippingAddress}
              onChange={handleShippingChange}
              inputBaseClass={inputBaseClass}
            />
          </div>

          <div className="mb-10">
            <h3
              className={`text-xl font-medium tracking-wide mb-2 ${theme === "light" ? "text-gray-900" : "text-[#D4AF37]"}`}
            >
              Payment
            </h3>
            <p
              className={`text-sm mb-5 ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}
            >
              All transactions are secure and encrypted.
            </p>
            <div
              className={`border rounded-lg overflow-hidden ${theme === "light" ? "border-gray-200" : "border-[#333]"}`}
            >
              {/* Option 1: Razorpay Online Gateway */}
              <div
                className={`p-5 flex flex-col border-b transition-colors ${paymentMethod === "razorpay" ? (theme === "light" ? "bg-amber-50/50 border-amber-200" : "bg-[#1a1a1a] border-[#D4AF37]/50") : theme === "light" ? "bg-white border-gray-200" : "bg-[#111] border-[#333]"}`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setPaymentMethod("cashfree")}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cashfree" || paymentMethod === "razorpay" ? (theme === "light" ? "border-amber-500" : "border-[#D4AF37]") : "border-gray-500"}`}
                    >
                      {(paymentMethod === "cashfree" || paymentMethod === "razorpay") && (
                        <div
                          className={`w-2 h-2 rounded-full ${theme === "light" ? "bg-amber-500" : "bg-[#D4AF37]"}`}
                        />
                      )}
                    </div>
                    <div>
                      <span
                        className={`font-medium tracking-wide block ${theme === "light" ? "text-gray-900" : "text-white"}`}
                      >
                        Online Payment Gateway (Cashfree Easy Split)
                      </span>
                      <span className="text-xs text-gray-500">
                        Dynamic UPI QR, UPI Apps, Cards & NetBanking (Instant Verified)
                      </span>
                    </div>
                  </label>
                  <CreditCard
                    size={20}
                    className={
                      theme === "light" ? "text-gray-400" : "text-[#D4AF37]/70"
                    }
                  />
                </div>
                <AnimatePresence>
                  {(paymentMethod === "cashfree" || paymentMethod === "razorpay") && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-xl border border-teal-500/20 bg-teal-500/5 flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                          <ShieldCheck size={18} className="text-teal-600 shrink-0" />
                          <span className="text-xs font-bold text-teal-800">
                            Instant Real-time Verification · Cashfree Easy Split
                          </span>
                        </div>
                        <p
                          className={`text-xs leading-relaxed ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}
                        >
                          Generates a live dynamic UPI QR code or native Cashfree checkout. Scan with GPay, PhonePe, Paytm, CRED or BHIM to complete and verify instantly.
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Option 2: Direct Store QR Code (Merchant UPI) */}
              <div
                className={`p-5 flex flex-col border-b transition-colors ${paymentMethod === "qr" ? (theme === "light" ? "bg-amber-50/50 border-amber-200" : "bg-[#1a1a1a] border-[#D4AF37]/50") : theme === "light" ? "bg-white border-gray-200" : "bg-[#111] border-[#333]"}`}
              >
                <div
                  className="flex items-center justify-between cursor-pointer"
                  onClick={() => setPaymentMethod("qr")}
                >
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "qr" ? (theme === "light" ? "border-amber-500" : "border-[#D4AF37]") : "border-gray-500"}`}
                    >
                      {paymentMethod === "qr" && (
                        <div
                          className={`w-2 h-2 rounded-full ${theme === "light" ? "bg-amber-500" : "bg-[#D4AF37]"}`}
                        />
                      )}
                    </div>
                    <div>
                      <span
                        className={`font-medium tracking-wide block ${theme === "light" ? "text-gray-900" : "text-white"}`}
                      >
                        Direct Store QR Code (Merchant UPI)
                      </span>
                      <span className="text-xs text-gray-500">
                        Scan & pay directly to the merchant's verified UPI VPA
                      </span>
                    </div>
                  </label>
                  <QrCode
                    size={20}
                    className={
                      theme === "light" ? "text-teal-600" : "text-[#D4AF37]"
                    }
                  />
                </div>

                <AnimatePresence>
                  {paymentMethod === "qr" && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-4 p-4 rounded-xl border border-teal-200 bg-white dark:bg-[#151515] space-y-4">
                        {storeQrLoading ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-xs text-gray-500">
                            <Loader2 size={16} className="animate-spin text-teal-600" />
                            <span>Loading store merchant QR details...</span>
                          </div>
                        ) : (
                          <>
                            {/* Merchant Store Header */}
                            <div className="flex items-center justify-between border-b border-gray-100 dark:border-[#2a2a2a] pb-2.5">
                              <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                                  <Store size={14} />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-gray-900 dark:text-white">
                                    {storeUpiInfo?.storeName || "Verified Store Merchant"}
                                  </p>
                                  <span className="text-[10px] text-teal-700 font-semibold bg-teal-50 dark:bg-teal-950/40 px-1.5 py-0.2 rounded border border-teal-200 dark:border-teal-800">
                                    ● Verified Direct UPI
                                  </span>
                                </div>
                              </div>
                              <div className="text-right">
                                <span className="text-[10px] text-gray-400 block">Amount Payable</span>
                                <span className="text-sm font-black text-teal-700 dark:text-teal-400">
                                  ₹{subtotal.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>

                            {/* Direct Store QR Image Box */}
                            <div className="flex flex-col sm:flex-row items-center gap-4 bg-slate-50 dark:bg-[#0c0c0c] p-3.5 rounded-xl border border-slate-200 dark:border-[#2a2a2a]">
                              <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 shrink-0">
                                <img
                                  src={
                                    storeUpiInfo?.qrCodeImage ||
                                    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                                      `upi://pay?pa=${storeUpiInfo?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi"}&pn=${encodeURIComponent(storeUpiInfo?.storeName || "Store Merchant")}&am=${subtotal.toFixed(2)}&cu=INR&tn=Order_Checkout`
                                    )}&margin=4`
                                  }
                                  alt="Store UPI QR Code"
                                  className="w-36 h-36 object-contain"
                                />
                              </div>

                              <div className="flex-1 space-y-2.5 text-center sm:text-left">
                                <div className="bg-white dark:bg-[#181818] border border-gray-200 dark:border-[#333] rounded-lg p-2 flex items-center justify-between gap-2">
                                  <div className="text-left truncate">
                                    <span className="text-[10px] text-gray-400 font-semibold block uppercase">Merchant UPI VPA</span>
                                    <span className="text-xs font-mono font-bold text-gray-800 dark:text-gray-200 truncate">
                                      {storeUpiInfo?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi"}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyStoreUpi(storeUpiInfo?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi")}
                                    className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-[11px] font-semibold rounded transition shrink-0 flex items-center gap-1"
                                  >
                                    {copiedStoreUpi ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
                                    <span>{copiedStoreUpi ? "Copied" : "Copy"}</span>
                                  </button>
                                </div>

                                <p className="text-[11px] text-gray-500 leading-snug">
                                  Scan using <strong>Google Pay</strong>, <strong>PhonePe</strong>, <strong>Paytm</strong>, <strong>CRED</strong> or <strong>BHIM</strong> to pay directly.
                                </p>

                                <div className="flex flex-wrap gap-1 justify-center sm:justify-start">
                                  {["GPay", "PhonePe", "Paytm", "CRED", "BHIM"].map((app) => (
                                    <span key={app} className="text-[9px] font-bold bg-white dark:bg-[#222] border border-gray-200 dark:border-[#444] text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded-full">
                                      {app}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* UTR / Transaction Reference Number Input */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                UPI Ref / UTR Number (Optional / Recommended)
                              </label>
                              <input
                                type="text"
                                value={utrNumber}
                                onChange={(e) => setUtrNumber(e.target.value)}
                                placeholder="e.g. 12-digit UTR No. (3245XXXXXXXX)"
                                className="w-full bg-white dark:bg-[#111] border border-gray-300 dark:border-[#333] rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-teal-500 text-gray-900 dark:text-white"
                              />
                            </div>

                            {/* Payment Screenshot Proof Upload */}
                            <div className="space-y-1.5">
                              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300">
                                Upload Payment Screenshot (Optional)
                              </label>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={handleScreenshotChange}
                                className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:text-xs file:font-semibold"
                              />
                              {screenshotPreview && (
                                <div className="mt-2 flex items-center gap-2">
                                  <img
                                    src={screenshotPreview}
                                    alt="Payment Screenshot Preview"
                                    className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                  />
                                  <span className="text-[11px] text-green-600 font-semibold">
                                    Screenshot attached ✓
                                  </span>
                                </div>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Option 3: Cash on Delivery (COD) */}
              <div
                className={`p-5 flex items-center cursor-pointer transition-colors ${paymentMethod === "cod" ? (theme === "light" ? "bg-amber-50/50" : "bg-[#1a1a1a]") : theme === "light" ? "bg-white" : "bg-[#111]"}`}
                onClick={() => setPaymentMethod("cod")}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "cod" ? (theme === "light" ? "border-amber-500" : "border-[#D4AF37]") : "border-gray-500"}`}
                  >
                    {paymentMethod === "cod" && (
                      <div
                        className={`w-2 h-2 rounded-full ${theme === "light" ? "bg-amber-500" : "bg-[#D4AF37]"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`font-medium tracking-wide ${theme === "light" ? "text-gray-900" : "text-white"}`}
                  >
                    Cash on Delivery (COD)
                  </span>
                </label>
              </div>
            </div>
          </div>

          <div className="mb-10">
            <h3
              className={`text-xl font-medium tracking-wide mb-5 ${theme === "light" ? "text-gray-900" : "text-[#D4AF37]"}`}
            >
              Billing address
            </h3>
            <div
              className={`border rounded-lg overflow-hidden ${theme === "light" ? "border-gray-200" : "border-[#333]"}`}
            >
              <div
                className={`p-5 border-b flex items-center cursor-pointer transition-colors ${
                  billingSameAsShipping
                    ? theme === "light"
                      ? "bg-amber-50/50 border-amber-200"
                      : "bg-[#1a1a1a] border-[#D4AF37]/50"
                    : theme === "light"
                      ? "bg-white border-gray-200"
                      : "bg-[#111] border-[#333]"
                }`}
                onClick={() => setBillingSameAsShipping(true)}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      billingSameAsShipping
                        ? theme === "light"
                          ? "border-amber-500"
                          : "border-[#D4AF37]"
                        : "border-gray-500"
                    }`}
                  >
                    {billingSameAsShipping && (
                      <div
                        className={`w-2 h-2 rounded-full ${theme === "light" ? "bg-amber-500" : "bg-[#D4AF37]"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`font-medium tracking-wide ${theme === "light" ? "text-gray-900" : "text-white"}`}
                  >
                    Same as shipping address
                  </span>
                </label>
              </div>

              <div
                className={`p-5 flex flex-col cursor-pointer transition-colors ${
                  !billingSameAsShipping
                    ? theme === "light"
                      ? "bg-amber-50/50"
                      : "bg-[#1a1a1a]"
                    : theme === "light"
                      ? "bg-white"
                      : "bg-[#111]"
                }`}
                onClick={() => setBillingSameAsShipping(false)}
              >
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      !billingSameAsShipping
                        ? theme === "light"
                          ? "border-amber-500"
                          : "border-[#D4AF37]"
                        : "border-gray-500"
                    }`}
                  >
                    {!billingSameAsShipping && (
                      <div
                        className={`w-2 h-2 rounded-full ${theme === "light" ? "bg-amber-500" : "bg-[#D4AF37]"}`}
                      />
                    )}
                  </div>
                  <span
                    className={`font-medium tracking-wide ${theme === "light" ? "text-gray-900" : "text-white"}`}
                  >
                    Use a different billing address
                  </span>
                </label>

                <AnimatePresence>
                  {!billingSameAsShipping && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-6">
                        <AddressForm
                          data={billingAddress}
                          onChange={handleBillingChange}
                          inputBaseClass={inputBaseClass}
                        />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>

          {!isFormValid && (
            <div className="flex items-center gap-2 mb-3 text-red-500 text-sm font-medium">
              <AlertCircle size={16} /> Please fill in all mandatory details to
              proceed.
            </div>
          )}

          {/* Trigger Handle Payment */}
          <button
            onClick={handlePayment}
            disabled={!isFormValid || isProcessing}
            className={`w-full py-5 font-black uppercase tracking-[0.15em] rounded-md transition-all flex items-center justify-center gap-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
              theme === "light"
                ? "bg-amber-500 text-white hover:bg-amber-600 shadow-md"
                : "bg-gradient-to-r from-[#BF953F] via-[#FCF6BA] to-[#B38728] text-black hover:shadow-[0_0_20px_rgba(212,175,55,0.4)]"
            }`}
          >
            {isProcessing ? (
              <>
                <Loader2 size={22} className="animate-spin" /> Processing...
              </>
            ) : paymentMethod === "cashfree" || paymentMethod === "razorpay" ? (
              <>
                <ShieldCheck size={22} /> Pay with Cashfree
              </>
            ) : paymentMethod === "qr" ? (
              <>
                <QrCode size={22} /> Confirm & Place Order via Store QR
              </>
            ) : (
              <>
                <CheckCircle size={22} /> Complete order (COD)
              </>
            )}
          </button>
        </div>

        <div
          className={`lg:w-[450px] p-6 md:p-10 order-1 lg:order-2 border-b lg:border-b-0 lg:border-l ${theme === "light" ? "bg-gray-50 border-gray-200" : "bg-[#050505] border-[#222]"}`}
        >
          <div className="sticky top-10">
            <div className="space-y-6 mb-8">
              {itemsToCheckout.map(
                (item: {
                  id: React.Key | null | undefined;
                  image: string | Blob | undefined;
                  title:
                    | string
                    | number
                    | bigint
                    | boolean
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactPortal
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                  quantity:
                    | string
                    | number
                    | bigint
                    | boolean
                    | React.ReactElement<
                        unknown,
                        string | React.JSXElementConstructor<any>
                      >
                    | Iterable<React.ReactNode>
                    | Promise<
                        | string
                        | number
                        | bigint
                        | boolean
                        | React.ReactPortal
                        | React.ReactElement<
                            unknown,
                            string | React.JSXElementConstructor<any>
                          >
                        | Iterable<React.ReactNode>
                        | null
                        | undefined
                      >
                    | null
                    | undefined;
                  totalStock: any;
                  price: number;
                }) => (
                  <div key={item.id} className="flex gap-4 items-start group">
                    <div className="relative flex-shrink-0">
                      <div
                        className={`w-20 h-20 rounded-md border flex items-center justify-center p-1 ${theme === "light" ? "bg-white border-gray-200" : "bg-[#111] border-[#333]"}`}
                      >
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={String(item.title) || "Product image"}
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                    <div className="flex-1 flex flex-col justify-between h-20">
                      <h4
                        className={`text-sm font-medium line-clamp-2 ${theme === "light" ? "text-gray-900" : "text-gray-200"}`}
                      >
                        {item.title}
                      </h4>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex items-center rounded-md border ${theme === "light" ? "border-gray-200 bg-white" : "border-[#333] bg-[#111]"}`}
                          >
                            <button
                              onClick={() => handleDecrease(item)}
                              className={`p-1.5 transition-colors ${theme === "light" ? "text-gray-600 hover:bg-gray-50" : "text-gray-400 hover:text-white hover:bg-[#222]"}`}
                            >
                              <Minus size={14} />
                            </button>
                            <span
                              className={`w-8 text-center text-xs font-bold ${theme === "light" ? "text-gray-900" : "text-white"}`}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleIncrease(item)}
                              disabled={
                                (item.quantity ?? 0) >=
                                (item.totalStock || Infinity)
                              }
                              className={`p-1.5 transition-colors ${(item.quantity ?? 0) >= (item.totalStock || Infinity) ? "opacity-30 cursor-not-allowed" : theme === "light" ? "text-gray-600 hover:bg-gray-50" : "text-gray-400 hover:text-[#D4AF37] hover:bg-[#222]"}`}
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => handleRemove(item)}
                            className={`p-1.5 rounded transition-colors ${theme === "light" ? "text-gray-400 hover:text-red-500" : "text-gray-500 hover:text-red-400"}`}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                        <p
                          className={`text-sm font-bold tracking-wide ${theme === "light" ? "text-gray-900" : "text-white"}`}
                        >
                          ₹
                          {(
                            item.price *
                            (typeof item.quantity === "number"
                              ? item.quantity
                              : 0)
                          ).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ),
              )}
            </div>
            <div
              className={`py-6 border-y ${theme === "light" ? "border-gray-200" : "border-[#222]"}`}
            >
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="Discount code or gift card"
                  className={inputBaseClass}
                />
                <button
                  className={`px-6 py-3 rounded-md font-bold uppercase tracking-wider text-xs transition-colors ${theme === "light" ? "bg-gray-200 hover:bg-gray-300 text-gray-800" : "bg-[#222] hover:bg-[#333] text-[#D4AF37] border border-[#333]"}`}
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="pt-6 space-y-4">
              <div
                className={`flex justify-between text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}
              >
                <span>Subtotal</span>
                <span
                  className={`font-medium ${theme === "light" ? "text-gray-900" : "text-white"}`}
                >
                  ₹{subtotal.toLocaleString()}
                </span>
              </div>
              <div
                className={`flex justify-between text-sm ${theme === "light" ? "text-gray-600" : "text-gray-400"}`}
              >
                <span>Shipping</span>
                <span className="text-xs tracking-wide uppercase">
                  Calculated at checkout
                </span>
              </div>
              <div
                className={`flex justify-between items-end pt-6 mt-2 border-t ${theme === "light" ? "border-gray-200" : "border-[#222]"}`}
              >
                <span
                  className={`text-lg font-medium ${theme === "light" ? "text-gray-900" : "text-[#D4AF37]"}`}
                >
                  Total
                </span>
                <div className="flex items-end gap-2">
                  <span
                    className={`text-xs font-medium mb-1 ${theme === "light" ? "text-gray-500" : "text-gray-500"}`}
                  >
                    INR
                  </span>
                  <span
                    className={`text-3xl font-black tracking-wide ${theme === "light" ? "text-gray-900" : "text-white"}`}
                  >
                    ₹{subtotal.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCashfreeModal && cashfreeModalData && (
        <CashfreeModal
          isOpen={showCashfreeModal}
          orderId={cashfreeModalData.orderId}
          paymentSessionId={cashfreeModalData.paymentSessionId}
          cashfreeOrderId={cashfreeModalData.cashfreeOrderId}
          amount={cashfreeModalData.amount}
          currency={cashfreeModalData.currency}
          name={cashfreeModalData.name}
          description={cashfreeModalData.description}
          customer={cashfreeModalData.customer}
          onSuccess={(targetOrderId) => {
            setShowCashfreeModal(false);
            if (!buyNowItem) {
              clearCart();
              localStorage.removeItem("cart");
            }
            router.push(`/payment-status?orderId=${targetOrderId}&status=SUCCESS`);
          }}
          onFailure={(err) => {
            setShowCashfreeModal(false);
            showNotification(err || "Payment failed", "error");
          }}
          onClose={() => {
            setShowCashfreeModal(false);
          }}
        />
      )}
    </div>
  );
}
