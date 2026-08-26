"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  ShieldCheck,
  Smartphone,
  CreditCard,
  Building2,
  Wallet,
  CheckCircle2,
  AlertCircle,
  Lock,
  RefreshCw,
  QrCode,
  Copy,
  Check,
  Zap,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

export interface CashfreeModalProps {
  isOpen: boolean;
  orderId: string; // Internal merchant order ID (e.g. TXN1234...)
  paymentSessionId?: string; // Cashfree payment session ID
  cashfreeOrderId?: string;
  razorpayOrderId?: string;
  amount: number; // in INR
  amountInRupees?: number;
  currency?: string;
  name?: string;
  description?: string;
  payeeVpa?: string; // Store / merchant UPI VPA
  customer?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  initialSubMethod?: "upi" | "card" | "netbanking" | "wallet";
  onSuccess: (orderId: string) => void;
  onFailure: (errorMsg: string) => void;
  onClose: () => void;
}

export default function CashfreeModal({
  isOpen,
  orderId,
  paymentSessionId,
  cashfreeOrderId,
  amount,
  amountInRupees,
  currency = "INR",
  name = "WOW Lifestyle Marketplace",
  description,
  payeeVpa,
  customer,
  initialSubMethod = "upi",
  onSuccess,
  onFailure,
  onClose,
}: CashfreeModalProps) {
  const [activeTab, setActiveTab] = useState<"upi" | "card" | "netbanking" | "wallet">(initialSubMethod);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [selectedBank, setSelectedBank] = useState("HDFC");
  const [selectedWallet, setSelectedWallet] = useState("Paytm");
  const [upiId, setUpiId] = useState("customer@okaxis");
  const [selectedUpiApp, setSelectedUpiApp] = useState("Google Pay");
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [isAutoVerified, setIsAutoVerified] = useState(false);

  const initialVpa = payeeVpa || process.env.NEXT_PUBLIC_MERCHANT_UPI_ID || "rohinibalan529@oksbi";
  const [currentPayeeVpa, setCurrentPayeeVpa] = useState(initialVpa);
  const [isEditingVpa, setIsEditingVpa] = useState(false);
  const [customVpaInput, setCustomVpaInput] = useState(initialVpa);

  const [upiMode, setUpiMode] = useState<"qr" | "app">("qr");
  const [qrTimeLeft, setQrTimeLeft] = useState(600); // 10 mins countdown

  useEffect(() => {
    if (payeeVpa) {
      setCurrentPayeeVpa(payeeVpa);
      setCustomVpaInput(payeeVpa);
    }
  }, [payeeVpa]);

  useEffect(() => {
    if (!isOpen) return;
    setQrTimeLeft(600);
    const interval = setInterval(() => {
      setQrTimeLeft((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab]);

  // Real-time automatic polling verification for Dynamic QR code payment
  useEffect(() => {
    if (!isOpen || !orderId || isProcessing || isAutoVerified) return;

    let isMounted = true;
    const pollStatus = async () => {
      try {
        const res = await fetch(`${API}/api/payment/status/${orderId}`);
        const data = await res.json();
        if (
          isMounted &&
          data.success &&
          (data.paymentStatus === "SUCCESS" || data.status === "SUCCESS")
        ) {
          setIsAutoVerified(true);
          setIsProcessing(false);
          setTimeout(() => {
            onSuccess(orderId);
          }, 800);
        }
      } catch (e) {
        // silent polling
      }
    };

    const pollInterval = setInterval(pollStatus, 2500);
    return () => {
      isMounted = false;
      clearInterval(pollInterval);
    };
  }, [isOpen, orderId, isProcessing, isAutoVerified, onSuccess]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Card state
  const [cardNumber, setCardNumber] = useState("4111 2222 3333 4444");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvv, setCardCvv] = useState("123");
  const [cardHolder, setCardHolder] = useState(customer?.name || "Customer");

  useEffect(() => {
    if (initialSubMethod) {
      setActiveTab(initialSubMethod);
    }
  }, [initialSubMethod]);

  if (!isOpen) return null;

  const rawAmt = typeof amount === "number" ? amount : parseFloat(amount) || 0;
  const displayAmount =
    typeof amountInRupees === "number" && amountInRupees > 0
      ? amountInRupees
      : rawAmt;

  // Dynamic NPCI standard UPI URI with exact order amount
  const upiParams = new URLSearchParams({
    pa: currentPayeeVpa,
    pn: name || "WOW Lifestyle Marketplace",
    am: displayAmount.toFixed(2),
    cu: "INR",
    tn: `Order_${orderId}`,
  });
  const dynamicUpiUri = `upi://pay?${upiParams.toString()}`;
  const dynamicQrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(dynamicUpiUri)}&margin=4`;

  const handleCopyUpi = () => {
    navigator.clipboard?.writeText(currentPayeeVpa);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2200);
  };

  const handleSimulatePayment = async (status: "SUCCESS" | "FAILED") => {
    setErrorText("");
    setIsProcessing(true);

    if (status === "FAILED") {
      fetch(`${API}/api/payment/cancel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, reason: "test_simulator_failed" }),
      }).catch(() => {});

      setTimeout(() => {
        setIsProcessing(false);
        onFailure("Payment was declined by the bank/issuer (Test Simulator).");
      }, 700);
      return;
    }

    try {
      const mockPayId = "cf_pay_mock_" + Math.random().toString(36).substring(2, 12);

      const verifyRes = await fetch(`${API}/api/payment/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: orderId,
          cashfree_order_id: cashfreeOrderId || orderId,
          paymentSessionId: paymentSessionId || `session_mock_${Date.now()}`,
          cf_payment_id: mockPayId,
        }),
      });

      const verifyData = await verifyRes.json();

      if (verifyRes.ok && verifyData.success) {
        setIsAutoVerified(true);
        setIsProcessing(false);
        setTimeout(() => {
          onSuccess(orderId);
        }, 500);
      } else {
        setIsProcessing(false);
        setErrorText(verifyData.message || "Payment verification failed.");
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorText(err.message || "Network error during payment verification.");
    }
  };

  const handleClose = () => {
    fetch(`${API}/api/payment/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, reason: "web_modal_closed" }),
    }).catch(() => {});
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-[300] flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-150">
        
        {/* Cashfree Top Header */}
        <div className="bg-[#0c2340] text-white px-5 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center font-black text-white text-base shadow-sm">
              ₹
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-wide text-white">Cashfree Payments</span>
                <span className="bg-teal-400/20 text-teal-300 border border-teal-400/30 text-[10px] font-bold px-1.5 py-0.2 rounded uppercase">
                  Easy Split
                </span>
              </div>
              <p className="text-[11px] text-slate-300 truncate max-w-[240px]">
                {name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Total Payable</span>
              <span className="text-base font-black text-white tracking-tight">₹{displayAmount.toFixed(2)}</span>
            </div>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
              title="Close payment window"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Order Details Mini Banner */}
        <div className="bg-slate-50 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs text-slate-600">
          <div className="flex items-center gap-1.5">
            <Lock size={12} className="text-teal-600" />
            <span className="font-medium">Order #{orderId}</span>
          </div>
          <div className="text-slate-500 truncate max-w-[200px] text-[11px]">
            {customer?.name || "Customer"} · {customer?.contact || ""}
          </div>
        </div>

        {/* Payment Instruments Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 p-1.5 gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab("upi")}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === "upi"
                ? "bg-white text-teal-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Smartphone size={14} /> UPI / QR
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("card")}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === "card"
                ? "bg-white text-teal-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <CreditCard size={14} /> Cards
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("netbanking")}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === "netbanking"
                ? "bg-white text-teal-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Building2 size={14} /> Net Banking
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("wallet")}
            className={`flex-1 py-2 px-1 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
              activeTab === "wallet"
                ? "bg-white text-teal-800 shadow-xs border border-slate-200"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            <Wallet size={14} /> Wallets
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="overflow-y-auto px-5 py-4 space-y-4 flex-1">
          {errorText && (
            <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 px-3.5 py-2.5 rounded-xl text-xs animate-in fade-in">
              <AlertCircle size={15} className="shrink-0 mt-0.5" />
              <span>{errorText}</span>
            </div>
          )}

          {isAutoVerified && (
            <div className="flex items-center gap-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 px-4 py-3 rounded-xl text-xs animate-in fade-in">
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
              <div>
                <p className="font-bold">Payment Verified Successfully!</p>
                <p className="text-[11px] text-emerald-600">Completing your order confirmation...</p>
              </div>
            </div>
          )}

          {/* 1. UPI TAB */}
          {activeTab === "upi" && (
            <div className="space-y-4">
              <div className="flex bg-slate-100 p-1 rounded-xl gap-1">
                <button
                  type="button"
                  onClick={() => setUpiMode("qr")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    upiMode === "qr"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <QrCode size={13} /> ⚡ Scan QR Code
                </button>
                <button
                  type="button"
                  onClick={() => setUpiMode("app")}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition ${
                    upiMode === "app"
                      ? "bg-white text-teal-800 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  <Smartphone size={13} /> 📱 UPI Apps / ID
                </button>
              </div>

              {/* A. DYNAMIC QR CODE VIEW */}
              {upiMode === "qr" && (
                <div className="flex flex-col items-center text-center space-y-3.5 bg-gradient-to-b from-teal-50/60 via-slate-50 to-slate-50 border border-teal-200/80 rounded-2xl p-4 shadow-xs">
                  <div className="w-full flex items-center justify-between text-[11px] px-1">
                    <div className="flex items-center gap-1.5 text-teal-700 font-bold bg-teal-100/60 px-2 py-0.5 rounded-full border border-teal-200">
                      <span className="w-2 h-2 rounded-full bg-teal-600 animate-pulse"></span>
                      <span>Real-time Dynamic QR</span>
                    </div>
                    <div className="text-slate-600 font-mono font-semibold bg-white border border-slate-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <span>⏱️ Expires:</span>
                      <span className={`font-bold ${qrTimeLeft < 60 ? "text-red-600" : "text-amber-700"}`}>
                        {formatTimer(qrTimeLeft)}
                      </span>
                    </div>
                  </div>

                  <div className="relative p-3.5 bg-white rounded-2xl shadow-md border-2 border-teal-500/30 group">
                    <img
                      src={dynamicQrUrl}
                      alt="Cashfree Dynamic UPI QR Code"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="bg-white/95 px-2.5 py-0.5 rounded-md border border-teal-500/40 shadow-xs flex items-center gap-1">
                        <span className="text-[10px] font-black tracking-tight text-teal-800">UPI · Cashfree</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-xs font-bold text-slate-900">
                      Scan with any UPI App to pay <span className="text-teal-700 font-black text-sm">₹{displayAmount.toFixed(2)}</span>
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Open Google Pay, PhonePe, Paytm, CRED or BHIM on your mobile phone & scan.
                    </p>
                  </div>

                  <div className="w-full bg-white border border-slate-200 rounded-xl p-2.5 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left truncate">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block">Merchant UPI ID</span>
                        <span className="font-mono font-bold text-teal-800 text-[11px]">{currentPayeeVpa}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setIsEditingVpa(!isEditingVpa)}
                          className="px-2 py-1 text-[10px] font-bold text-teal-700 hover:bg-teal-50 rounded border border-teal-200 transition"
                        >
                          {isEditingVpa ? "Done" : "Custom VPA"}
                        </button>
                        <button
                          type="button"
                          onClick={handleCopyUpi}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded-lg transition flex items-center gap-1 shrink-0"
                        >
                          {copiedUpi ? <><Check size={12} className="text-green-600" /> Copied!</> : <><Copy size={12} /> Copy</>}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSimulatePayment("SUCCESS")}
                    disabled={isProcessing}
                    className="w-full py-3 bg-gradient-to-r from-teal-600 via-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-800 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" /> Verifying Payment…
                      </>
                    ) : (
                      <>
                        <Zap size={14} className="text-amber-300 fill-amber-300 animate-pulse" /> ⚡ Simulate Instant Payment (Approve ₹{displayAmount.toFixed(2)})
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* B. UPI APPS & ID VIEW */}
              {upiMode === "app" && (
                <div className="space-y-3.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-2">Select Installed UPI App</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: "Google Pay", color: "bg-blue-50 text-blue-700 border-blue-200" },
                        { name: "PhonePe", color: "bg-purple-50 text-purple-700 border-purple-200" },
                        { name: "Paytm", color: "bg-sky-50 text-sky-700 border-sky-200" },
                        { name: "BHIM", color: "bg-amber-50 text-amber-700 border-amber-200" },
                      ].map((app) => (
                        <button
                          key={app.name}
                          type="button"
                          onClick={() => setSelectedUpiApp(app.name)}
                          className={`border rounded-xl p-2 text-center transition flex flex-col items-center gap-1 ${
                            selectedUpiApp === app.name
                              ? "border-teal-600 bg-teal-50 ring-2 ring-teal-500/20"
                              : "border-slate-200 bg-white hover:border-slate-300"
                          }`}
                        >
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${app.color}`}>
                            {app.name.split(" ")[0]}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-700">{app.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                    <label className="block text-xs font-bold text-slate-700">Or enter UPI ID / VPA</label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        placeholder="username@bank"
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-teal-500"
                      />
                      <button
                        type="button"
                        onClick={() => setUpiId("success@cashfree")}
                        className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-lg text-[11px] transition"
                      >
                        Auto Fill
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 2. CARD TAB */}
          {activeTab === "card" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Card Details (Test Mode)</label>
                <button
                  type="button"
                  onClick={() => {
                    setCardNumber("4111 2222 3333 4444");
                    setCardExpiry("12/28");
                    setCardCvv("123");
                  }}
                  className="text-[11px] font-bold text-teal-700 hover:underline"
                >
                  ⚡ Use Test Card
                </button>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Card Number</label>
                <div className="relative">
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4111 2222 3333 4444"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono tracking-wider outline-none focus:border-teal-500"
                  />
                  <span className="absolute right-3 top-2 text-[10px] font-bold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                    VISA / RUPAY
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">Valid Thru (MM/YY)</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={(e) => setCardExpiry(e.target.value)}
                    placeholder="12/28"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">CVV</label>
                  <input
                    type="password"
                    maxLength={4}
                    value={cardCvv}
                    onChange={(e) => setCardCvv(e.target.value)}
                    placeholder="123"
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-mono outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">Cardholder Name</label>
                <input
                  type="text"
                  value={cardHolder}
                  onChange={(e) => setCardHolder(e.target.value)}
                  placeholder="Cardholder Name"
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-teal-500"
                />
              </div>
            </div>
          )}

          {/* 3. NETBANKING TAB */}
          {activeTab === "netbanking" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Popular Indian Banks</label>
              <div className="grid grid-cols-3 gap-2">
                {["HDFC", "ICICI", "SBI", "Axis", "Kotak", "PNB"].map((bank) => (
                  <button
                    key={bank}
                    type="button"
                    onClick={() => setSelectedBank(bank)}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition ${
                      selectedBank === bank
                        ? "border-teal-600 bg-teal-50 text-teal-800 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white text-slate-700 hover:border-slate-300"
                    }`}
                  >
                    {bank} Bank
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. WALLET TAB */}
          {activeTab === "wallet" && (
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700 mb-1">Select Digital Wallet</label>
              <div className="space-y-2">
                {[
                  { name: "Paytm", desc: "Link and pay via Paytm balance" },
                  { name: "PhonePe Wallet", desc: "Instant checkout with PhonePe balance" },
                  { name: "Amazon Pay", desc: "Fast 1-click payment with Amazon Pay" },
                  { name: "Mobikwik", desc: "Pay with Mobikwik wallet balance" },
                ].map((wallet) => (
                  <button
                    key={wallet.name}
                    type="button"
                    onClick={() => setSelectedWallet(wallet.name)}
                    className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                      selectedWallet === wallet.name
                        ? "border-teal-600 bg-teal-50 ring-2 ring-teal-500/20"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div>
                      <p className="font-bold text-xs text-slate-900">{wallet.name}</p>
                      <p className="text-[11px] text-slate-500">{wallet.desc}</p>
                    </div>
                    <span className="text-[10px] font-bold text-teal-700 bg-white border border-teal-200 px-2 py-0.5 rounded">
                      Linked
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Security & Action Footer */}
        <div className="bg-slate-50 border-t border-slate-200 px-5 py-4 space-y-3 shrink-0">
          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
            <ShieldCheck size={14} className="text-teal-600" />
            <span>256-bit SSL Encrypted · Cashfree Easy Split Verified</span>
          </div>

          <div className="flex gap-2.5">
            <button
              type="button"
              onClick={() => handleSimulatePayment("FAILED")}
              disabled={isProcessing}
              className="px-3 py-2.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition disabled:opacity-50"
              title="Test payment failure handling"
            >
              Test Fail
            </button>

            <button
              type="button"
              onClick={() => handleSimulatePayment("SUCCESS")}
              disabled={isProcessing}
              className="flex-1 bg-[#0d9488] hover:bg-teal-700 disabled:opacity-60 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-sm"
            >
              {isProcessing ? (
                <>
                  <RefreshCw size={15} className="animate-spin" /> Verifying Payment…
                </>
              ) : (
                <>
                  <Lock size={13} /> Pay ₹{displayAmount.toFixed(2)} (Instant Success)
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
