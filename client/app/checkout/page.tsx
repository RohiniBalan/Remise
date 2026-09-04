"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Store,
  Lock,
  Truck,
  Mail,
  Tag,
  Wallet,
  ShoppingBag,
} from "lucide-react";

import { useCart } from "@/app/components-main/CartContext";
import NavbarHome from "@/app/components-main/NavbarHome";
import { isAuthenticated, redirectToLogin } from "@/app/utils/authGuard";
import { indianStates, getCities } from "@/app/utils/indiaLocation";

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

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === "undefined") return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

const resolveImageUrl = (image: unknown) => {
  if (typeof image !== "string" || !image) return "";
  return image.startsWith("http") || image.startsWith("data:")
    ? image
    : `${API}${image}`;
};

async function lookupPincode(cityName: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://api.postalpincode.in/postoffice/${encodeURIComponent(cityName)}`
    );
    const data = await res.json();
    if (data[0]?.Status === "Success" && data[0].PostOffice?.length > 0) {
      return data[0].PostOffice[0].Pincode;
    }
  } catch (e) {
    // best-effort
  }
  return null;
}

const AddressForm = ({
  data,
  onChange,
  onStateChange,
  onCityChange,
}: {
  data: AddressData;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => void;
  onStateChange?: (stateName: string, stateCode: string) => void;
  onCityChange?: (cityName: string) => void;
}) => {
  // Find selected state's isoCode
  const selectedState = useMemo(() => {
    return indianStates.find(
      (s) =>
        s.name.toLowerCase() === (data.state || "").toLowerCase() ||
        s.isoCode.toLowerCase() === (data.state || "").toLowerCase()
    );
  }, [data.state]);

  const cities = useMemo(() => {
    if (!selectedState) return [];
    return getCities(selectedState.isoCode) || [];
  }, [selectedState]);

  const handleStateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stateName = e.target.value;
    const found = indianStates.find((s) => s.name === stateName);
    if (onStateChange) {
      onStateChange(stateName, found?.isoCode || "");
    } else {
      onChange(e);
    }
  };

  const handleCitySelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const cityName = e.target.value;
    if (onCityChange) {
      onCityChange(cityName);
    } else {
      onChange(e);
    }
  };

  return (
    <div className="space-y-3.5">
      {/* Country Dropdown */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Country / Region *
        </label>
        <select
          name="country"
          value={data.country || "India"}
          onChange={onChange}
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition cursor-pointer"
        >
          <option value="India">India</option>
        </select>
      </div>

      {/* Name Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            First Name *
          </label>
          <input
            type="text"
            name="firstName"
            value={data.firstName}
            onChange={onChange}
            placeholder="e.g. Rohini"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            Last Name
          </label>
          <input
            type="text"
            name="lastName"
            value={data.lastName}
            onChange={onChange}
            placeholder="e.g. Balan"
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* Street Address */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Street Address *
        </label>
        <input
          type="text"
          name="address"
          value={data.address}
          onChange={onChange}
          placeholder="House/Flat No., Building, Street Area"
          required
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
        />
      </div>

      {/* Apartment / Landmark */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Apartment, Suite, Landmark (Optional)
        </label>
        <input
          type="text"
          name="apartment"
          value={data.apartment}
          onChange={onChange}
          placeholder="e.g. Near City Center / 2nd Floor"
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
        />
      </div>

      {/* State, City & Auto Pincode Dropdown Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* State Dropdown */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            State *
          </label>
          <select
            name="state"
            value={data.state}
            onChange={handleStateSelect}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition cursor-pointer"
          >
            <option value="">Select State</option>
            {indianStates.map((s) => (
              <option key={s.isoCode} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* City Dropdown (Populated based on selected State) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            City *
          </label>
          <select
            name="city"
            value={data.city}
            onChange={handleCitySelect}
            disabled={!data.state || cities.length === 0}
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 font-medium focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition cursor-pointer disabled:bg-gray-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <option value="">
              {!data.state
                ? "Select State First"
                : cities.length === 0
                ? "No Cities Found"
                : "Select City"}
            </option>
            {cities.map((c) => (
              <option key={c.name} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Pin Code Input (Auto-filled on City selection + editable) */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
            PIN Code *
          </label>
          <input
            type="text"
            name="pinCode"
            value={data.pinCode}
            onChange={onChange}
            placeholder="e.g. 641035"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 font-mono placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
          />
        </div>
      </div>

      {/* Phone Number */}
      <div>
        <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
          Phone Number *
        </label>
        <input
          type="tel"
          name="phone"
          value={data.phone}
          onChange={onChange}
          placeholder="10-digit mobile number"
          required
          className="w-full px-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
        />
      </div>
    </div>
  );
};

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

  const [theme, setTheme] = useState<"dark" | "light">("light");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "qr" | "cod">("razorpay");
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
  const [discountCode, setDiscountCode] = useState("");
  const [appliedDiscount, setAppliedDiscount] = useState(0);

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

  const [toast, setToast] = useState<{
    show: boolean;
    message: string;
    type: "error" | "success";
  }>({ show: false, message: "", type: "error" });

  useEffect(() => {
    if (!isAuthenticated()) {
      redirectToLogin("/checkout");
      return;
    }

    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u.email) setContactEmail(u.email);
        if (u.fullname || u.name) {
          const parts = (u.fullname || u.name).split(" ");
          setShippingAddress((prev) => ({
            ...prev,
            firstName: parts[0] || "",
            lastName: parts.slice(1).join(" ") || "",
            phone: u.mobilenumber || prev.phone,
          }));
        }
      }
    } catch (e) {}

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
        handleThemeChange as EventListener
      );
  }, []);

  const itemsToCheckout = buyNowItem ? [buyNowItem] : cart;
  const subtotal = itemsToCheckout.reduce(
    (total: number, item: { price: number; quantity: number }) =>
      total + item.price * item.quantity,
    0
  );
  const totalPayable = Math.max(0, subtotal - appliedDiscount);

  const isShippingValid =
    contactEmail.trim() !== "" &&
    shippingAddress.firstName.trim() !== "" &&
    shippingAddress.address.trim() !== "" &&
    shippingAddress.state.trim() !== "" &&
    shippingAddress.city.trim() !== "" &&
    shippingAddress.pinCode.trim() !== "" &&
    shippingAddress.phone.trim() !== "";

  const isBillingValid =
    billingSameAsShipping ||
    (billingAddress.firstName.trim() !== "" &&
      billingAddress.address.trim() !== "" &&
      billingAddress.state.trim() !== "" &&
      billingAddress.city.trim() !== "" &&
      billingAddress.pinCode.trim() !== "" &&
      billingAddress.phone.trim() !== "");

  const isFormValid = isShippingValid && isBillingValid;

  const showNotification = (
    message: string,
    type: "error" | "success" = "error"
  ) => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3500);
  };

  const handleShippingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setShippingAddress((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleShippingStateChange = (stateName: string) => {
    setShippingAddress((prev) => ({
      ...prev,
      state: stateName,
      city: "",
      pinCode: "",
    }));
  };

  const handleShippingCityChange = async (cityName: string) => {
    setShippingAddress((prev) => ({
      ...prev,
      city: cityName,
    }));
    const pin = await lookupPincode(cityName);
    if (pin) {
      setShippingAddress((prev) => ({
        ...prev,
        pinCode: pin,
      }));
    }
  };

  const handleBillingChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setBillingAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleBillingStateChange = (stateName: string) => {
    setBillingAddress((prev) => ({
      ...prev,
      state: stateName,
      city: "",
      pinCode: "",
    }));
  };

  const handleBillingCityChange = async (cityName: string) => {
    setBillingAddress((prev) => ({
      ...prev,
      city: cityName,
    }));
    const pin = await lookupPincode(cityName);
    if (pin) {
      setBillingAddress((prev) => ({
        ...prev,
        pinCode: pin,
      }));
    }
  };

  const handleIncrease = (item: any) => {
    if (item.quantity >= item.totalStock) {
      showNotification("Maximum available stock reached", "error");
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

  const handleApplyCoupon = () => {
    if (!discountCode.trim()) return;
    if (discountCode.toUpperCase() === "REMISE10") {
      const discount = Math.round(subtotal * 0.1);
      setAppliedDiscount(discount);
      showNotification(`Coupon REMISE10 applied! Saved ₹${discount}`, "success");
    } else {
      showNotification("Invalid discount code. Try REMISE10", "error");
    }
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
          } catch (e) {}
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

  const handlePayment = async () => {
    if (!isAuthenticated()) {
      redirectToLogin("/checkout");
      return;
    }

    if (!isFormValid) {
      showNotification("Please fill in all mandatory fields.", "error");
      return;
    }

    setIsProcessing(true);

    try {
      const userStr = localStorage.getItem("user");
      const userData = userStr ? JSON.parse(userStr) : null;

      const payload = {
        amount: totalPayable,
        userId: userData?._id || userData?.id || null,
        redirectUrl: `${window.location.origin}/payment-status`,
        cartItems: itemsToCheckout.map((item: any) => ({
          id: item.id || item._id,
          title: item.title,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
          storeId: item.storeId || null,
        })),
        contactEmail,
        shippingAddress,
        billingAddress: billingSameAsShipping
          ? shippingAddress
          : billingAddress,
        paymentMethod,
        utrNumber: utrNumber.trim() || undefined,
      };

      const response = await fetch(`${API}/api/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setIsProcessing(false);
        showNotification(
          data.message || "Failed to initiate order. Please try again.",
          "error"
        );
        return;
      }

      // COD or Store QR Direct Flow
      if (paymentMethod === "cod" || paymentMethod === "qr" || data.isCod || data.isQr) {
        if ((paymentMethod === "qr" || data.isQr) && (screenshotFile || utrNumber)) {
          try {
            const formData = new FormData();
            if (screenshotFile) formData.append("screenshot", screenshotFile);
            if (utrNumber) formData.append("utrNumber", utrNumber);
            await fetch(`${API}/api/smart-orders/${data.orderId}/confirm-qr`, {
              method: "POST",
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

      // Razorpay PG Flow
      if (paymentMethod === "razorpay" && data.razorpayOrderId) {
        const isLoaded = await loadRazorpayScript();
        if (isLoaded && (window as any).Razorpay) {
          try {
            const options = {
              key: data.keyId || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
              amount: data.amountPaise,
              currency: data.currency || "INR",
              name: data.name || "Remise Marketplace",
              description: data.description || `Order #${data.orderId}`,
              order_id: data.razorpayOrderId,
              prefill: {
                name: data.customer?.name || `${shippingAddress.firstName} ${shippingAddress.lastName}`.trim(),
                email: data.customer?.email || contactEmail,
                contact: data.customer?.contact || shippingAddress.phone,
              },
              theme: {
                color: "#0D9488",
              },
              modal: {
                ondismiss: () => {
                  setIsProcessing(false);
                  showNotification("Payment was cancelled.", "error");
                  fetch(`${API}/api/payment/cancel`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ orderId: data.orderId, reason: "razorpay_modal_dismissed" }),
                  }).catch(() => {});
                },
              },
              handler: async (resp: {
                razorpay_payment_id: string;
                razorpay_order_id: string;
                razorpay_signature: string;
              }) => {
                try {
                  const verifyRes = await fetch(`${API}/api/payment/verify`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      orderId: data.orderId,
                      razorpay_order_id: resp.razorpay_order_id,
                      razorpay_payment_id: resp.razorpay_payment_id,
                      razorpay_signature: resp.razorpay_signature,
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
                    showNotification(verifyData.message || "Payment verification failed.", "error");
                    router.push(`/payment-status?orderId=${data.orderId}&status=FAILED`);
                  }
                } catch (vErr: any) {
                  showNotification(vErr.message || "Payment verification error.", "error");
                  router.push(`/payment-status?orderId=${data.orderId}&status=FAILED`);
                } finally {
                  setIsProcessing(false);
                }
              },
            };

            const rzp = new (window as any).Razorpay(options);
            rzp.on("payment.failed", (failRes: any) => {
              setIsProcessing(false);
              showNotification(failRes.error?.description || "Payment failed.", "error");
            });
            rzp.open();
            return;
          } catch (sdkErr: any) {
            console.error("Razorpay SDK initiation error:", sdkErr);
            setIsProcessing(false);
            showNotification("Failed to launch Razorpay checkout.", "error");
            return;
          }
        }

        setIsProcessing(false);
        showNotification("Razorpay SDK could not be loaded.", "error");
        return;
      }

      if (data.url) {
        if (!buyNowItem) {
          clearCart();
          localStorage.removeItem("cart");
        }
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Payment Error:", error);
      showNotification("Server unreachable. Please try again.", "error");
      setIsProcessing(false);
    }
  };

  // EMPTY CART SCREEN
  if (itemsToCheckout.length === 0) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans">
        <NavbarHome theme={theme} toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center pt-44">
          <div className="w-16 h-16 rounded-full bg-[#DFF1F1] text-teal-700 flex items-center justify-center mb-4">
            <ShoppingBag size={28} />
          </div>
          <h1 className="text-2xl font-black text-gray-900 mb-2">
            Your Checkout is Empty
          </h1>
          <p className="text-sm text-gray-500 max-w-sm mb-6">
            You haven't selected any items for checkout. Browse categories to discover amazing products.
          </p>
          <button
            onClick={() => router.push("/category")}
            className="px-6 py-3 rounded-xl font-bold bg-teal-600 hover:bg-teal-700 text-white shadow-md transition"
          >
            Explore Categories
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-gray-900">
      {/* ── Fixed Top Navigation Bar ── */}
      <NavbarHome theme={theme} toggleTheme={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} />

      {/* ── Toast Notifications ── */}
      <AnimatePresence>
        {toast.show && (
          <motion.div
            initial={{ opacity: 0, y: -40, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", bounce: 0.4, duration: 0.6 }}
            className={`fixed top-36 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-3 px-5 py-3 rounded-full shadow-2xl backdrop-blur-md font-semibold text-sm border ${
              toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700 shadow-red-500/10"
                : "bg-emerald-50 border-emerald-200 text-emerald-800 shadow-emerald-500/10"
            }`}
          >
            {toast.type === "error" ? (
              <AlertCircle size={18} className="text-red-600 shrink-0" />
            ) : (
              <CheckCircle size={18} className="text-emerald-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Container with top padding to clear the fixed navbar ── */}
      <div className="pt-36 sm:pt-40 lg:pt-44">
        {/* ── Checkout Header Strip ── */}
        <div className="bg-white border-b border-[#E2E8F0] shadow-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBuyNowItem(null);
                  router.back();
                }}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition"
                title="Go back"
              >
                <ChevronLeft size={20} />
              </button>
              <div className="flex items-center gap-2">
                <h1 className="text-base sm:text-lg font-black tracking-tight text-gray-900">
                  Secure Checkout
                </h1>
                {buyNowItem && (
                  <span className="bg-[#DFF1F1] text-teal-800 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border border-teal-200 uppercase tracking-wider">
                    Buy Now
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold text-teal-700 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200/60">
              <ShieldCheck size={16} className="text-teal-600" />
              <span>256-Bit SSL Encrypted Checkout</span>
            </div>
          </div>
        </div>

        {/* ── Main Checkout Form Grid ── */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* ──── LEFT COLUMN: Contact, Delivery & Payment ──── */}
            <div className="lg:col-span-7 space-y-6">
              {/* 1. Contact Information Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#BBD5DA]/60 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                    1
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-gray-900">
                      Contact Information
                    </h2>
                    <p className="text-xs text-gray-500">
                      Where we'll send order receipts & tracking updates
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      name="email"
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@example.com"
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-[#BBD5DA] bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-500/20 outline-none transition"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Delivery Address Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#BBD5DA]/60 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                    2
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-gray-900">
                      Delivery Address
                    </h2>
                    <p className="text-xs text-gray-500">
                      Select your State and City to auto-fill your PIN code
                    </p>
                  </div>
                </div>

                <AddressForm
                  data={shippingAddress}
                  onChange={handleShippingChange}
                  onStateChange={handleShippingStateChange}
                  onCityChange={handleShippingCityChange}
                />
              </div>

              {/* 3. Payment Method Card */}
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#BBD5DA]/60 shadow-xs">
                <div className="flex items-center gap-2.5 mb-4 pb-3 border-b border-gray-100">
                  <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-black text-sm">
                    3
                  </div>
                  <div>
                    <h2 className="text-sm sm:text-base font-black text-gray-900">
                      Payment Method
                    </h2>
                    <p className="text-xs text-gray-500">
                      All payment modes are 100% secure & encrypted
                    </p>
                  </div>
                </div>

                <div className="space-y-3">
                  {/* 1. Online Payment (Razorpay) */}
                  <div
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "razorpay"
                        ? "border-teal-600 bg-teal-50/40 shadow-xs"
                        : "border-[#E2E8F0] bg-white hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "razorpay"
                                ? "border-teal-600 bg-teal-600"
                                : "border-gray-400"
                            }`}
                          >
                            {paymentMethod === "razorpay" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-gray-900">
                              Online Payment (Razorpay)
                            </span>
                            <span className="bg-teal-600 text-white text-[10px] font-extrabold px-2 py-0.5 rounded uppercase tracking-wider">
                              Instant · Secure
                            </span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            UPI (GPay, PhonePe, Paytm), Credit / Debit Cards, Net Banking & Wallets
                          </p>
                          <div className="flex flex-wrap gap-1.5 mt-2">
                            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                              ⚡ UPI
                            </span>
                            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                              💳 All Cards
                            </span>
                            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                              🏦 50+ Banks
                            </span>
                            <span className="text-[10px] font-semibold bg-sky-50 text-sky-700 border border-sky-200 px-2 py-0.5 rounded">
                              👛 Wallets
                            </span>
                          </div>
                        </div>
                      </div>
                      <CreditCard size={20} className="text-teal-600 shrink-0 mt-0.5" />
                    </div>
                  </div>

                  {/* 2. Direct Store QR Code Payment */}
                  <div
                    onClick={() => setPaymentMethod("qr")}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "qr"
                        ? "border-teal-600 bg-teal-50/40 shadow-xs"
                        : "border-[#E2E8F0] bg-white hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "qr"
                                ? "border-teal-600 bg-teal-600"
                                : "border-gray-400"
                            }`}
                          >
                            {paymentMethod === "qr" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-900 block">
                            Direct Store QR Code (Merchant UPI)
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Scan and pay directly using any UPI app with instant merchant verification
                          </p>
                        </div>
                      </div>
                      <QrCode size={20} className="text-teal-600 shrink-0 mt-0.5" />
                    </div>

                    {/* Expanded QR Code Details */}
                    <AnimatePresence>
                      {paymentMethod === "qr" && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="mt-4 pt-4 border-t border-teal-200/60 space-y-3.5">
                            {storeQrLoading ? (
                              <div className="flex items-center justify-center py-4 gap-2 text-xs text-gray-500">
                                <Loader2 size={16} className="animate-spin text-teal-600" />
                                <span>Loading store merchant QR details...</span>
                              </div>
                            ) : (
                              <>
                                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-3.5 rounded-xl border border-teal-200">
                                  <div className="p-2 bg-white rounded-xl shadow-xs border border-gray-200 shrink-0">
                                    <img
                                      src={
                                        storeUpiInfo?.qrCodeImage ||
                                        `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(
                                          `upi://pay?pa=${storeUpiInfo?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi"}&pn=${encodeURIComponent(storeUpiInfo?.storeName || "Store Merchant")}&am=${totalPayable.toFixed(2)}&cu=INR&tn=Remise_Order`
                                        )}&margin=4`
                                      }
                                      alt="Store UPI QR Code"
                                      className="w-32 h-32 object-contain"
                                    />
                                  </div>

                                  <div className="flex-1 space-y-2 text-center sm:text-left">
                                    <div className="bg-teal-50/70 border border-teal-200 rounded-lg p-2.5 flex items-center justify-between gap-2">
                                      <div className="text-left truncate">
                                        <span className="text-[10px] text-teal-700 font-bold block uppercase">Merchant UPI ID</span>
                                        <span className="text-xs font-mono font-bold text-gray-900 truncate">
                                          {storeUpiInfo?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi"}
                                        </span>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => handleCopyStoreUpi(storeUpiInfo?.upiId || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi")}
                                        className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-md border border-teal-200 transition shrink-0 flex items-center gap-1 shadow-2xs"
                                      >
                                        {copiedStoreUpi ? <Check size={13} className="text-teal-700" /> : <Copy size={13} />}
                                        <span>{copiedStoreUpi ? "Copied" : "Copy"}</span>
                                      </button>
                                    </div>

                                    <p className="text-[11px] text-gray-500">
                                      Pay <strong>₹{totalPayable.toLocaleString()}</strong> using Google Pay, PhonePe, Paytm, CRED or BHIM.
                                    </p>
                                  </div>
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-xs font-bold text-gray-700">
                                    UPI Reference / UTR Number (Optional)
                                  </label>
                                  <input
                                    type="text"
                                    value={utrNumber}
                                    onChange={(e) => setUtrNumber(e.target.value)}
                                    placeholder="e.g. 12-digit UTR No. (4329XXXXXXXX)"
                                    className="w-full px-3.5 py-2 rounded-xl border border-[#BBD5DA] bg-white text-xs font-mono text-gray-900 outline-none focus:border-teal-600"
                                  />
                                </div>

                                <div className="space-y-1">
                                  <label className="block text-xs font-bold text-gray-700">
                                    Payment Screenshot Proof (Optional)
                                  </label>
                                  <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleScreenshotChange}
                                    className="w-full text-xs text-gray-500 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-teal-50 file:text-teal-700 file:text-xs file:font-bold cursor-pointer"
                                  />
                                  {screenshotPreview && (
                                    <div className="mt-2 flex items-center gap-2">
                                      <img
                                        src={screenshotPreview}
                                        alt="Screenshot preview"
                                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                                      />
                                      <span className="text-xs text-emerald-600 font-bold">Screenshot attached ✓</span>
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

                  {/* 3. Cash on Delivery (COD) */}
                  <div
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-4 rounded-xl border-2 transition-all cursor-pointer ${
                      paymentMethod === "cod"
                        ? "border-teal-600 bg-teal-50/40 shadow-xs"
                        : "border-[#E2E8F0] bg-white hover:border-teal-300"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                          <div
                            className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              paymentMethod === "cod"
                                ? "border-teal-600 bg-teal-600"
                                : "border-gray-400"
                            }`}
                          >
                            {paymentMethod === "cod" && (
                              <div className="w-1.5 h-1.5 rounded-full bg-white" />
                            )}
                          </div>
                        </div>
                        <div>
                          <span className="font-bold text-sm text-gray-900 block">
                            Cash on Delivery (COD)
                          </span>
                          <p className="text-xs text-gray-500 mt-1">
                            Pay in cash directly to delivery agent upon order arrival
                          </p>
                        </div>
                      </div>
                      <Wallet size={20} className="text-teal-600 shrink-0 mt-0.5" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Address Toggle */}
              <div className="bg-white rounded-2xl p-5 border border-[#BBD5DA]/60 shadow-xs">
                <label
                  onClick={() => setBillingSameAsShipping(!billingSameAsShipping)}
                  className="flex items-center gap-3 cursor-pointer select-none"
                >
                  <div
                    className={`w-5 h-5 rounded-md border flex items-center justify-center transition ${
                      billingSameAsShipping
                        ? "bg-teal-600 border-teal-600 text-white"
                        : "border-gray-300 bg-white"
                    }`}
                  >
                    {billingSameAsShipping && <Check size={14} strokeWidth={3} />}
                  </div>
                  <span className="text-sm font-semibold text-gray-800">
                    Billing address same as delivery address
                  </span>
                </label>

                <AnimatePresence>
                  {!billingSameAsShipping && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 pt-4 border-t border-gray-100"
                    >
                      <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3">
                        Different Billing Address
                      </h3>
                      <AddressForm
                        data={billingAddress}
                        onChange={handleBillingChange}
                        onStateChange={handleBillingStateChange}
                        onCityChange={handleBillingCityChange}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* ──── RIGHT COLUMN: Sticky Order Summary ──── */}
            <div className="lg:col-span-5 sticky top-44 space-y-4">
              <div className="bg-white rounded-2xl p-5 sm:p-6 border border-[#BBD5DA]/60 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-gray-100 mb-4">
                  <h2 className="text-base font-black text-gray-900">
                    Order Summary
                  </h2>
                  <span className="text-xs font-bold text-teal-700 bg-[#DFF1F1] px-2.5 py-0.5 rounded-full">
                    {itemsToCheckout.length} Item{itemsToCheckout.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Items List */}
                <div className="space-y-3.5 max-h-[320px] overflow-y-auto pr-1">
                  {itemsToCheckout.map((item: any) => (
                    <div
                      key={item.id}
                      className="flex gap-3.5 items-center p-2.5 rounded-xl bg-gray-50 border border-gray-100"
                    >
                      <div className="w-16 h-16 rounded-lg bg-white border border-gray-200 p-1 shrink-0 flex items-center justify-center overflow-hidden">
                        <img
                          src={resolveImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-contain"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs font-extrabold text-teal-700 mt-0.5">
                          ₹{item.price?.toLocaleString()}
                        </p>

                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center border border-gray-300 rounded-lg bg-white shadow-2xs">
                            <button
                              onClick={() => handleDecrease(item)}
                              className="p-1 hover:bg-gray-100 text-gray-600 transition rounded-l-lg"
                              title="Decrease quantity"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-gray-900">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => handleIncrease(item)}
                              disabled={item.quantity >= (item.totalStock || Infinity)}
                              className="p-1 hover:bg-gray-100 text-gray-600 transition rounded-r-lg disabled:opacity-30"
                              title="Increase quantity"
                            >
                              <Plus size={12} />
                            </button>
                          </div>

                          <button
                            onClick={() => handleRemove(item)}
                            className="text-gray-400 hover:text-red-500 p-1 transition"
                            title="Remove item"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon / Discount Code Box */}
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={discountCode}
                        onChange={(e) => setDiscountCode(e.target.value)}
                        placeholder="Discount code (e.g. REMISE10)"
                        className="w-full pl-8 pr-3 py-2 rounded-xl border border-[#BBD5DA] bg-white text-xs font-bold uppercase text-gray-900 placeholder:normal-case placeholder:font-normal placeholder:text-gray-400 outline-none focus:border-teal-600"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleApplyCoupon}
                      className="px-4 py-2 bg-gray-100 hover:bg-teal-50 hover:text-teal-800 text-gray-800 font-bold text-xs rounded-xl border border-gray-200 transition"
                    >
                      Apply
                    </button>
                  </div>
                </div>

                {/* Price Calculation */}
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Subtotal</span>
                    <span className="font-bold text-gray-900">₹{subtotal.toLocaleString()}</span>
                  </div>
                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-emerald-700 font-bold">
                      <span>Discount (REMISE10)</span>
                      <span>-₹{appliedDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-gray-600">
                    <span>Shipping & Handling</span>
                    <span className="font-bold text-emerald-700 uppercase tracking-wider text-[11px]">
                      FREE
                    </span>
                  </div>

                  <div className="flex justify-between items-baseline pt-3 mt-2 border-t border-gray-200">
                    <div>
                      <span className="text-sm font-black text-gray-900 block">
                        Total Payable
                      </span>
                      <span className="text-[10px] text-gray-400">Inclusive of all taxes</span>
                    </div>
                    <span className="text-2xl font-black text-teal-700">
                      ₹{totalPayable.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Validation Alert */}
                {!isFormValid && (
                  <div className="mt-4 p-2.5 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-[11px] text-amber-800 font-medium">
                    <AlertCircle size={14} className="shrink-0 text-amber-600" />
                    <span>Please enter your contact details, state, city & delivery address to proceed.</span>
                  </div>
                )}

                {/* Primary Place Order / Pay Button */}
                <button
                  type="button"
                  onClick={handlePayment}
                  disabled={!isFormValid || isProcessing}
                  className="w-full mt-4 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      <span>Processing Order...</span>
                    </>
                  ) : paymentMethod === "razorpay" ? (
                    <>
                      <Lock size={16} />
                      <span>Pay ₹{totalPayable.toLocaleString()} via Razorpay</span>
                    </>
                  ) : paymentMethod === "qr" ? (
                    <>
                      <QrCode size={16} />
                      <span>Confirm Order via Store QR · ₹{totalPayable.toLocaleString()}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} />
                      <span>Confirm Order (COD) · ₹{totalPayable.toLocaleString()}</span>
                    </>
                  )}
                </button>

                {/* Trust & Guarantee Badges */}
                <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 gap-2 text-[11px] text-gray-500 font-medium">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                    <span>Verified Purchase</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Truck size={14} className="text-teal-600 shrink-0" />
                    <span>Fast Door Delivery</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
