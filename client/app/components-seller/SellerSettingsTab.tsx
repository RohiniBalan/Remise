// /components-seller/dashboard/SellerSettingsTab.tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Save, RefreshCw, CheckCircle, CheckCircle2, QrCode } from "lucide-react";
import { storeApi } from "../api-services/storeApi";
import { Input, TextArea, Select } from "./FormComponents";
import { mergeCategories, normalizeLoc, lookupPincode } from "./shared-utils";
import { indianStates, getCities } from "../utils/indiaLocation";

export function SellerSettingsTab({ store, token, onRefresh, categories }: any) {
  const [form, setForm] = useState({
    name: store?.name || "",
    description: store?.description || "",
    phone: store?.phone || "",
    email: store?.email || "",
    category: store?.category || "",
    street: store?.address?.street || "",
    city: store?.address?.city || "",
    state: store?.address?.state || "",
    pinCode: store?.address?.pinCode || "",
    targetRevenue: store?.targetRevenue ? String(store.targetRevenue) : "",
    pan: store?.pan || store?.businessDetails?.pan || "",
    gstin: store?.gstin || store?.businessDetails?.gstin || "",
    legalBusinessName: store?.businessDetails?.legalBusinessName || "",
    bankAccountNumber: store?.businessDetails?.bankAccount?.accountNumber || "",
    bankIfsc: store?.businessDetails?.bankAccount?.ifscCode || "",
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [onboardingRoute, setOnboardingRoute] = useState(false);
  const [error, setError] = useState("");
  const [showRazorpaySuccess, setShowRazorpaySuccess] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const [upiId, setUpiId] = useState(store?.upiId || "");
  const [fssai, setFssai] = useState(store?.fssai || "");
  const UPI_ID_REGEX = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;
  const upiError =
    upiId.trim() && !UPI_ID_REGEX.test(upiId.trim())
      ? "Invalid UPI ID format (expected e.g. name@bank)."
      : "";

  const categoryOptions = useMemo(
    () =>
      mergeCategories(categories || []).map((c) => ({
        key: c.name,
        label: c.name,
      })),
    [categories],
  );

  const stateOptions = useMemo(
    () => indianStates.map((s: any) => ({ key: s.isoCode, label: s.name })),
    [],
  );

  const findState = useCallback((value: string) => {
    const v = normalizeLoc(value);
    if (!v) return undefined;
    return indianStates.find(
      (s: any) => normalizeLoc(s.name) === v || normalizeLoc(s.isoCode) === v,
    );
  }, []);

  const [cities, setCities] = useState<any[]>([]);
  useEffect(() => {
    if (!form.state) {
      setCities([]);
      return;
    }
    const state = findState(form.state);
    setCities(state ? getCities(state.isoCode) : []);
  }, [form.state, findState]);

  const cityOptions = useMemo(
    () => cities.map((c: any) => ({ key: c.name, label: c.name })),
    [cities],
  );

  const handleStateSelect = (isoCode: string) => {
    const label = stateOptions.find((s) => s.key === isoCode)?.label || "";
    setForm((f) => ({ ...f, state: label, city: "", pinCode: "" }));
    setCities(getCities(isoCode));
  };

  const handleCitySelect = async (cityName: string) => {
    set("city", cityName);
    if (!cityName) return;
    const pin = await lookupPincode(cityName);
    if (pin) set("pinCode", pin);
  };

  const isFoodCategory = form.category === "Food & Beverages";

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (upiError) {
      setError(upiError);
      return;
    }
    setSaving(true);
    setError("");
    setSaved(false);
    try {
      const fd = new FormData();
      fd.append("name", form.name);
      fd.append("description", form.description);
      fd.append("phone", form.phone);
      fd.append("email", form.email);
      fd.append("category", form.category);
      fd.append("address[street]", form.street);
      fd.append("address[city]", form.city);
      fd.append("address[state]", form.state);
      fd.append("address[pinCode]", form.pinCode);
      fd.append("targetRevenue", form.targetRevenue);
      fd.append("pan", form.pan.trim().toUpperCase());
      fd.append("gstin", form.gstin.trim().toUpperCase());
      fd.append("upiId", upiId.trim());
      fd.append("fssai", isFoodCategory ? fssai.trim() : "");
      await storeApi.update(store._id, fd, token);
      setSaved(true);
      onRefresh();
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to save settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl border border-[#BBD5DA] p-6 shadow-sm space-y-4"
      >
        <h3 className="text-base font-bold text-gray-900 mb-2">
          Business Profile
        </h3>
        {error && (
          <p className="text-sm text-[#FF0000] bg-red-50 border border-red-200 rounded-xl px-4 py-3">
            {error}
          </p>
        )}
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input
              label="Business Name *"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              required
            />
          </div>
          <div className="sm:col-span-2">
            <Input
              label="Monthly Revenue Target (₹)"
              type="number"
              min="0"
              step="0.01"
              placeholder="e.g. 50000"
              value={form.targetRevenue}
              onChange={(e) => set("targetRevenue", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Description"
              rows={3}
              value={form.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
          <Input
            label="Phone"
            value={form.phone}
            onChange={(e) => set("phone", e.target.value)}
          />
          <Input
            label="Email"
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
          />

          <Select
            label="Category"
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Select Category</option>
            {categoryOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>

          {isFoodCategory && (
            <Input
              label="FSSAI License Number"
              value={fssai}
              maxLength={14}
              inputMode="numeric"
              placeholder="14-digit FSSAI number"
              onChange={(e) => setFssai(e.target.value)}
            />
          )}

          <Input
            label="Pin Code"
            value={form.pinCode}
            onChange={(e) => set("pinCode", e.target.value)}
          />
          <Input
            label="Street"
            value={form.street}
            onChange={(e) => set("street", e.target.value)}
          />

          <Select
            label="State"
            value={findState(form.state)?.isoCode || ""}
            onChange={(e) => handleStateSelect(e.target.value)}
          >
            <option value="">Select State</option>
            {stateOptions.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </Select>

          <Select
            label="City"
            value={form.city}
            onChange={(e) => handleCitySelect(e.target.value)}
            disabled={!form.state}
          >
            <option value="">
              {form.state ? "Select City" : "Select state first"}
            </option>
            {cityOptions.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
              </option>
            ))}
          </Select>
        </div>

        {/* Tax & Legal Identification */}
        <div className="pt-2 border-t border-[#F5F5F5]">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Tax & Legal Identification
          </p>
          <p className="text-xs text-gray-400 mb-3">
            PAN is mandatory for marketplace compliance and payouts.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="PAN Number * (Mandatory)"
              placeholder="e.g. ABCDE1234F"
              value={form.pan}
              maxLength={10}
              onChange={(e) => set("pan", e.target.value.toUpperCase())}
            />
            <Input
              label="GSTIN Number (Optional)"
              placeholder="e.g. 22AAAAA0000A1Z5"
              value={form.gstin}
              maxLength={15}
              onChange={(e) => set("gstin", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* UPI Payment QR Code */}
        <div className="pt-2 border-t border-[#F5F5F5]">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            UPI Payment QR Code
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Enter your UPI ID to generate a scannable QR code for order
            payments.
          </p>
          <div className="flex items-start gap-4">
            <div className="w-24 h-24 rounded-xl border-2 border-dashed border-[#BBD5DA] bg-[#F5F5F5] flex items-center justify-center overflow-hidden shrink-0">
              {store?.qrCodeImage ? (
                <img
                  src={store.qrCodeImage}
                  alt="UPI QR code"
                  className="w-full h-full object-contain bg-white"
                />
              ) : (
                <QrCode size={22} className="text-gray-300" />
              )}
            </div>
            <div className="flex-1">
              <Input
                label="UPI ID"
                placeholder="merchant@upi"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
              {upiError && (
                <p className="text-xs text-[#FF0000] mt-1">{upiError}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {store?.qrCodeImage
                  ? "Save changes to regenerate the QR code."
                  : "Save a valid UPI ID to generate your QR code."}
              </p>
            </div>
          </div>
        </div>

        {/* Bank & Payment Accounts */}
        <div className="pt-4 border-t border-[#F5F5F5]">
          <p className="text-sm font-semibold text-gray-800 mb-1">
            Settlement Bank Account Details
          </p>
          <p className="text-xs text-gray-400 mb-3">
            Used for automated payouts via Razorpay Route and Cashfree Easy Split.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Legal Business / Entity Name"
              placeholder="e.g. John Doe Enterprises"
              value={form.legalBusinessName || store?.businessDetails?.legalBusinessName || ""}
              onChange={(e) => set("legalBusinessName", e.target.value)}
            />
            <Input
              label="Bank Account Number"
              placeholder="Account Number"
              value={form.bankAccountNumber || store?.businessDetails?.bankAccount?.accountNumber || ""}
              onChange={(e) => set("bankAccountNumber", e.target.value)}
            />
            <Input
              label="Bank IFSC Code"
              placeholder="e.g. HDFC0001234"
              value={form.bankIfsc || store?.businessDetails?.bankAccount?.ifscCode || ""}
              onChange={(e) => set("bankIfsc", e.target.value.toUpperCase())}
            />
          </div>
        </div>

        {/* Razorpay Route Marketplace Account Setup */}
        <div className="pt-4 border-t border-[#F5F5F5] bg-blue-50/30 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-sm font-bold text-gray-900">
                Razorpay Route Marketplace Account
              </p>
              <p className="text-xs text-gray-500">
                Mandatory to accept online Razorpay payments. Customer payments are split directly to your linked account.
              </p>
            </div>
            <span
              className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                store?.razorpayRouteStatus === 'active'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : store?.razorpayRouteStatus === 'under_review' || store?.razorpayRouteStatus === 'created'
                  ? 'bg-amber-50 text-amber-700 border-amber-200'
                  : 'bg-rose-50 text-rose-700 border-rose-200'
              }`}
            >
              {store?.razorpayRouteStatus === 'active'
                ? 'Razorpay: ACTIVE'
                : store?.razorpayRouteStatus === 'under_review'
                ? 'Razorpay: UNDER REVIEW'
                : store?.razorpayRouteStatus === 'created'
                ? 'Razorpay: PENDING KYC'
                : 'Razorpay: NOT CONNECTED'}
            </span>
          </div>

          {store?.razorpayAccountId ? (
            <div className="mb-3 p-3 bg-white border border-blue-200 rounded-lg text-xs text-gray-700 flex flex-wrap items-center justify-between gap-2">
              <div>
                <span className="font-semibold text-blue-900">Razorpay Linked Account ID:</span>{' '}
                <code className="font-mono bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{store.razorpayAccountId}</code>
              </div>
              <div>
                <span className="font-semibold text-blue-900">Route Status:</span>{' '}
                <span className="font-bold text-emerald-700 uppercase">{store.razorpayRouteStatus || 'active'}</span>
              </div>
            </div>
          ) : (
            <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800">
              ⚠️ Complete Razorpay payment onboarding to accept online Razorpay payments.
            </div>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={async () => {
                setOnboardingRoute(true);
                setError("");
                try {
                  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
                  const res = await fetch(`${API}/api/stores/me/razorpay-onboard`, {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      Authorization: `Bearer ${token}`,
                    },
                    body: JSON.stringify({
                      legalBusinessName: form.legalBusinessName || store?.businessDetails?.legalBusinessName || form.name,
                      businessType: "individual",
                      pan: form.pan,
                      gstin: form.gstin,
                      bankAccount: {
                        accountNumber: form.bankAccountNumber || store?.businessDetails?.bankAccount?.accountNumber,
                        ifscCode: form.bankIfsc || store?.businessDetails?.bankAccount?.ifscCode,
                        beneficiaryName: form.name,
                      },
                    }),
                  });
                  const data = await res.json();
                  if (res.ok && data.success) {
                    onRefresh();
                    setShowRazorpaySuccess(true);
                  } else {
                    setError(data.message || "Failed to onboard with Razorpay Route.");
                  }
                } catch (err: any) {
                  setError(`Razorpay Onboarding error: ${err.message}`);
                } finally {
                  setOnboardingRoute(false);
                }
              }}
              disabled={onboardingRoute}
              className="px-4 py-2 bg-[#0C2340] hover:bg-[#1E3A5F] disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition shadow-sm"
            >
              {onboardingRoute ? "Connecting…" : store?.razorpayAccountId ? "Sync / Update Razorpay Account" : "Connect Razorpay Route Account"}
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
          >
            {saving ? (
              <>
                <RefreshCw size={14} className="animate-spin" /> Saving…
              </>
            ) : (
              <>
                <Save size={14} /> Save Changes
              </>
            )}
          </button>
          {saved && (
            <span className="flex items-center gap-1 text-sm text-green-600 font-medium">
              <CheckCircle size={14} /> Saved!
            </span>
          )}
        </div>
            </form>

      {showRazorpaySuccess && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
          onClick={() => setShowRazorpaySuccess(false)}
        >
          <div
            className="bg-white rounded-2xl border border-[#BBD5DA] w-full max-w-sm shadow-2xl p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 size={28} className="text-green-600" />
            </div>
            <p className="font-bold text-gray-900 mb-1">
              Razorpay Route Connected
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Your linked account has been configured successfully. Customer
              payments will now route directly to your bank account.
            </p>
            <button
              onClick={() => setShowRazorpaySuccess(false)}
              className="w-full py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-xl text-sm transition"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}