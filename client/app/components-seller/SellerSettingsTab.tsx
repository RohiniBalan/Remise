// /components-seller/dashboard/SellerSettingsTab.tsx
"use client";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Save, RefreshCw, CheckCircle, QrCode } from "lucide-react";
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
  });
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
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
    </div>
  );
}