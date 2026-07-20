"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { normalizeAuthErrorMessage, validatePasswordChangeForm } from "../utils/authValidation";
import {
  ArrowLeft,
  Camera,
  CheckCircle,
  AlertCircle,
  CreditCard,
  Heart,
  ShoppingBag,
  Gift,
  MapPin,
  Shield,
  Store,
  BadgeCheck,
  Trash2,
  Plus,
  Save,
  LogOut,
  ChevronRight,
  Clock3,
  Eye,
  EyeOff,
} from "lucide-react";

type TabKey = "overview" | "addresses" | "security" | "store";

type Address = {
  id: string;
  label: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pinCode: string;
  isDefault?: boolean;
};

interface ProfileForm {
  fullname: string;
  email: string;
  mobilenumber: string;
  dob: string;
  gender: string;
  avatar: string;
  profileData: Record<string, any>;
}

function getInitialForm(): ProfileForm {
  return {
    fullname: "",
    email: "",
    mobilenumber: "",
    dob: "",
    gender: "",
    avatar: "",
    profileData: {},
  };
}

function getInitialAddress(): Address {
  return {
    id: `${Date.now()}`,
    label: "Home",
    fullName: "",
    phone: "",
    street: "",
    city: "",
    state: "",
    pinCode: "",
    isDefault: true,
  };
}

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; ok: boolean } | null>(
    null,
  );
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [user, setUser] = useState<any>(null);
  const [form, setForm] = useState<ProfileForm>(getInitialForm());
  const [addressDraft, setAddressDraft] =
    useState<Address>(getInitialAddress());
  const [isAddressEditorOpen, setIsAddressEditorOpen] = useState(false);
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";
  const isStoreOwner = user?.role === "store_owner";

  const tabs = useMemo(() => {
    const base: Array<{ id: TabKey; label: string }> = [
      { id: "overview", label: "Overview" },
      { id: "addresses", label: "Addresses" },
      { id: "security", label: "Security" },
    ];
    if (isStoreOwner) {
      base.push({ id: "store", label: "Store" });
    }
    return base;
  }, [isStoreOwner]);

  useEffect(() => {
    const loadProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login?redirect=/profile");
        return;
      }

      try {
        const res = await fetch(`${API}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Failed to load profile");

        const profileData = data.data?.profileData || {};
        setUser(data.data);
        setForm({
          fullname: data.data.fullname || "",
          email: data.data.email || "",
          mobilenumber: data.data.mobilenumber || "",
          dob: profileData.dob || "",
          gender: profileData.gender || "",
          avatar: data.data.avatar || profileData.avatar || "",
          profileData,
        });
      } catch (error: any) {
        setToast({
          message: error.message || "Unable to load profile",
          ok: false,
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [API, router]);

  const updateProfile = async (
    payload: Partial<ProfileForm> & Record<string, any> = {},
  ) => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.push("/login?redirect=/profile");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Profile update failed");

      const nextUser = data.data;
      setUser(nextUser);
      setForm((prev) => ({
        ...prev,
        ...payload,
        profileData: nextUser.profileData || prev.profileData,
      }));
      localStorage.setItem("user", JSON.stringify(nextUser));
      window.dispatchEvent(new CustomEvent("authChange"));
      setToast({ message: "Profile updated successfully", ok: true });
    } catch (error: any) {
      setToast({
        message: error.message || "Profile update failed",
        ok: false,
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const avatar = typeof reader.result === "string" ? reader.result : "";
      setForm((prev) => ({ ...prev, avatar }));
      updateProfile({ avatar });
    };
    reader.readAsDataURL(file);
  };

  const saveBasicDetails = async () => {
    await updateProfile({
      fullname: form.fullname,
      email: form.email,
      mobilenumber: form.mobilenumber,
      dob: form.dob,
      gender: form.gender,
      profileData: {
        ...form.profileData,
        dob: form.dob,
        gender: form.gender,
      },
    });
  };

  const saveProfileData = async (nextProfileData: Record<string, any>) => {
    await updateProfile({ profileData: nextProfileData });
  };

  const handleAddressSave = async () => {
    const addresses = [...(form.profileData.addresses || [])];
    const existingIndex = addresses.findIndex(
      (item) => item.id === addressDraft.id,
    );
    const nextAddress = { ...addressDraft };
    if (!nextAddress.id) nextAddress.id = `${Date.now()}`;
    if (existingIndex >= 0) {
      addresses[existingIndex] = nextAddress;
    } else {
      addresses.push(nextAddress);
    }
    if (!addresses.some((item) => item.isDefault)) {
      nextAddress.isDefault = true;
    }
    const nextProfileData = { ...form.profileData, addresses };
    setForm((prev) => ({ ...prev, profileData: nextProfileData }));
    await saveProfileData(nextProfileData);
    setIsAddressEditorOpen(false);
    setAddressDraft(getInitialAddress());
  };

  const handleAddressDelete = async (id: string) => {
    const addresses = (form.profileData.addresses || []).filter(
      (item: Address) => item.id !== id,
    );
    const nextProfileData = { ...form.profileData, addresses };
    setForm((prev) => ({ ...prev, profileData: nextProfileData }));
    await saveProfileData(nextProfileData);
  };

  const handleAddressDefault = async (id: string) => {
    const addresses = (form.profileData.addresses || []).map(
      (item: Address) => ({ ...item, isDefault: item.id === id }),
    );
    const nextProfileData = { ...form.profileData, addresses };
    setForm((prev) => ({ ...prev, profileData: nextProfileData }));
    await saveProfileData(nextProfileData);
  };

  const handlePasswordChange = async () => {
    const errors = validatePasswordChangeForm({
      currentPassword: security.currentPassword,
      newPassword: security.newPassword,
      confirmPassword: security.confirmPassword,
    });
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: security.currentPassword,
          newPassword: security.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(normalizeAuthErrorMessage(data.message) || "Password change failed");
      setToast({ message: "Password updated successfully", ok: true });
      setFieldErrors({});
      setSecurity({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setToast({
        message: error.message || "Password change failed",
        ok: false,
      });
    }
  };

  const handleLogoutAll = async () => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${API}/api/auth/logout-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Logout failed");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      window.dispatchEvent(new CustomEvent("authChange"));
      router.push("/login");
    } catch (error: any) {
      setToast({ message: error.message || "Logout failed", ok: false });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F5] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#BBD5DA] border-t-[#FF0000]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F5F5]">
      <header className="border-b border-[#BBD5DA] bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-teal-700"
          >
            <ArrowLeft size={16} /> Back
          </Link>
          <h1 className="ml-2 text-base font-bold text-gray-900">My Profile</h1>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="rounded-3xl border border-[#BBD5DA] bg-white p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative">
                {form.avatar ? (
                  <img
                    src={form.avatar}
                    alt="profile"
                    className="h-24 w-24 rounded-full border-4 border-[#FF0000]/20 object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#FF0000] text-2xl font-bold text-white">
                    {(form.fullname || user?.email || "U")
                      .split(" ")
                      .map((part: string) => part[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                )}
                <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-[#BBD5DA] bg-white shadow-sm">
                  <Camera size={14} className="text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">
                    {form.fullname || "Your Profile"}
                  </h2>
                  {user?.isEmailVerified !== false ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[11px] font-semibold text-green-700">
                      <CheckCircle size={10} /> Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-semibold text-amber-700">
                      <AlertCircle size={10} /> Verify email
                    </span>
                  )}
                </div>
                <p className="mt-1 text-sm text-gray-500">{user?.email}</p>
                <p className="mt-1 text-sm text-gray-500">
                  {user?.role === "store_owner" ? "Store Owner" : "Customer"}
                </p>
              </div>
            </div>
            <button
              onClick={() => saveBasicDetails()}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#FF0000] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#e00000]"
            >
              <Save size={15} /> Save Profile
            </button>
          </div>

          <div className="mt-7 flex flex-wrap gap-2 border-b border-[#F5F5F5] pb-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-3.5 py-2 text-sm font-semibold transition ${activeTab === tab.id ? "bg-[#DFF1F1] text-teal-700" : "bg-[#F5F5F5] text-gray-600 hover:bg-[#EDF7F7]"}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-6">
            {activeTab === "overview" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-4 rounded-2xl border border-[#BBD5DA] bg-[#FCFCFC] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Personal details
                  </h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Full Name
                      </span>
                      <input
                        value={form.fullname}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            fullname: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">Email</span>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            email: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Mobile Number
                      </span>
                      <input
                        value={form.mobilenumber}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            mobilenumber: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Date of Birth
                      </span>
                      <input
                        type="date"
                        value={form.dob}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            dob: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600 sm:col-span-2">
                      <span className="mb-1.5 block font-semibold">Gender</span>
                      <select
                        value={form.gender}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            gender: event.target.value,
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "addresses" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Saved addresses
                  </h3>
                  <button
                    onClick={() => {
                      setAddressDraft(getInitialAddress());
                      setIsAddressEditorOpen(true);
                    }}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#FF0000] px-3.5 py-2 text-sm font-semibold text-white"
                  >
                    <Plus size={15} /> Add address
                  </button>
                </div>
                {isAddressEditorOpen && (
                  <div className="rounded-2xl border border-[#BBD5DA] bg-[#FCFCFC] p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <label className="text-sm text-gray-600">
                        <span className="mb-1.5 block font-semibold">
                          Label
                        </span>
                        <input
                          value={addressDraft.label}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              label: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                      <label className="text-sm text-gray-600">
                        <span className="mb-1.5 block font-semibold">
                          Full Name
                        </span>
                        <input
                          value={addressDraft.fullName}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              fullName: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                      <label className="text-sm text-gray-600">
                        <span className="mb-1.5 block font-semibold">
                          Phone
                        </span>
                        <input
                          value={addressDraft.phone}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              phone: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                      <label className="text-sm text-gray-600">
                        <span className="mb-1.5 block font-semibold">
                          Street
                        </span>
                        <input
                          value={addressDraft.street}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              street: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                      <label className="text-sm text-gray-600">
                        <span className="mb-1.5 block font-semibold">City</span>
                        <input
                          value={addressDraft.city}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              city: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                      <label className="text-sm text-gray-600">
                        <span className="mb-1.5 block font-semibold">
                          State
                        </span>
                        <input
                          value={addressDraft.state}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              state: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                      <label className="text-sm text-gray-600 sm:col-span-2">
                        <span className="mb-1.5 block font-semibold">
                          Pin Code
                        </span>
                        <input
                          value={addressDraft.pinCode}
                          onChange={(event) =>
                            setAddressDraft((prev) => ({
                              ...prev,
                              pinCode: event.target.value,
                            }))
                          }
                          className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                        />
                      </label>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={handleAddressSave}
                        className="rounded-xl bg-[#FF0000] px-4 py-2 text-sm font-semibold text-white"
                      >
                        Save address
                      </button>
                      <button
                        onClick={() => {
                          setIsAddressEditorOpen(false);
                          setAddressDraft(getInitialAddress());
                        }}
                        className="rounded-xl border border-[#BBD5DA] px-4 py-2 text-sm font-semibold text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                <div className="grid gap-3">
                  {(form.profileData.addresses || []).map((item: Address) => (
                    <div
                      key={item.id}
                      className="rounded-2xl border border-[#BBD5DA] bg-white p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {item.label}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.fullName} · {item.phone}
                          </p>
                          <p className="text-sm text-gray-600">
                            {item.street}, {item.city}, {item.state} -{" "}
                            {item.pinCode}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {!item.isDefault && (
                            <button
                              onClick={() => handleAddressDefault(item.id)}
                              className="rounded-full bg-[#DFF1F1] px-2.5 py-1 text-xs font-semibold text-teal-700"
                            >
                              Set default
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setAddressDraft(item);
                              setIsAddressEditorOpen(true);
                            }}
                            className="rounded-full border border-[#BBD5DA] px-2.5 py-1 text-xs font-semibold text-gray-700"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleAddressDelete(item.id)}
                            className="rounded-full border border-[#BBD5DA] px-2.5 py-1 text-xs font-semibold text-[#FF0000]"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === "security" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#BBD5DA] bg-[#FCFCFC] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Change password
                  </h3>
                  <div className="mt-4 space-y-3">
                    {[
                      {
                        key: "current",
                        label: "Current password",
                        value: security.currentPassword,
                      },
                      {
                        key: "new",
                        label: "New password",
                        value: security.newPassword,
                      },
                      {
                        key: "confirm",
                        label: "Confirm password",
                        value: security.confirmPassword,
                      },
                    ].map((item) => (
                      <label
                        key={item.key}
                        className="block text-sm text-gray-600"
                      >
                        <span className="mb-1.5 block font-semibold">
                          {item.label}
                        </span>
                        <div className="flex items-center rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5">
                          <input
                            type={
                              showPasswords[
                                item.key as "current" | "new" | "confirm"
                              ]
                                ? "text"
                                : "password"
                            }
                            value={item.value}
                            onChange={(event) => {
                              setSecurity((prev) => ({
                                ...prev,
                                [item.key === "current"
                                  ? "currentPassword"
                                  : item.key === "new"
                                    ? "newPassword"
                                    : "confirmPassword"]: event.target.value,
                              }));
                              const fieldKey = item.key === "current" ? "currentPassword" : item.key === "new" ? "newPassword" : "confirmPassword";
                              setFieldErrors((prev) => ({ ...prev, [fieldKey]: "" }));
                            }}
                            className="w-full bg-transparent text-sm outline-none"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowPasswords((prev) => ({
                                ...prev,
                                [item.key as "current" | "new" | "confirm"]:
                                  !prev[
                                    item.key as "current" | "new" | "confirm"
                                  ],
                              }))
                            }
                            className="ml-2 text-gray-500"
                          >
                            {showPasswords[
                              item.key as "current" | "new" | "confirm"
                            ] ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </button>
                        </div>
                        {fieldErrors[item.key === "current" ? "currentPassword" : item.key === "new" ? "newPassword" : "confirmPassword"] && (
                          <p className="mt-2 text-sm text-[#FF0000]">
                            {fieldErrors[item.key === "current" ? "currentPassword" : item.key === "new" ? "newPassword" : "confirmPassword"]}
                          </p>
                        )}
                      </label>
                    ))}
                  </div>
                  <button
                    onClick={handlePasswordChange}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FF0000] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Update password
                  </button>
                </div>

                <div className="rounded-2xl border border-[#BBD5DA] bg-[#FCFCFC] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Security actions
                  </h3>
                  <div className="mt-4 space-y-3 text-sm text-gray-700">
                    <button
                      onClick={() =>
                        updateProfile({
                          email: form.email,
                          mobilenumber: form.mobilenumber,
                        })
                      }
                      className="flex w-full items-center justify-between rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-3"
                    >
                      <span className="flex items-center gap-2">
                        <Shield size={15} className="text-[#FF0000]" /> Save
                        email and mobile changes
                      </span>
                      <ChevronRight size={15} />
                    </button>
                    <button
                      onClick={handleLogoutAll}
                      className="flex w-full items-center justify-between rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-3 text-[#FF0000]"
                    >
                      <span className="flex items-center gap-2">
                        <LogOut size={15} /> Logout from all devices
                      </span>
                      <ChevronRight size={15} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "store" && (
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="rounded-2xl border border-[#BBD5DA] bg-[#FCFCFC] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Store profile
                  </h3>
                  <div className="mt-4 grid gap-4 sm:grid-cols-2">
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Store name
                      </span>
                      <input
                        value={form.profileData.storeProfile?.name || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                name: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Category
                      </span>
                      <input
                        value={form.profileData.storeProfile?.category || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                category: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Address
                      </span>
                      <input
                        value={form.profileData.storeProfile?.address || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                address: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Working hours
                      </span>
                      <input
                        value={
                          form.profileData.storeProfile?.workingHours || ""
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                workingHours: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Delivery radius
                      </span>
                      <input
                        value={
                          form.profileData.storeProfile?.deliveryRadius || ""
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                deliveryRadius: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Minimum order
                      </span>
                      <input
                        value={
                          form.profileData.storeProfile?.minimumOrderAmount ||
                          ""
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                minimumOrderAmount: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="text-sm text-gray-600 sm:col-span-2">
                      <span className="mb-1.5 block font-semibold">
                        Store description
                      </span>
                      <textarea
                        value={form.profileData.storeProfile?.description || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                description: event.target.value,
                              },
                            },
                          }))
                        }
                        className="min-h-[90px] w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => saveProfileData(form.profileData)}
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#FF0000] px-4 py-2.5 text-sm font-semibold text-white"
                  >
                    Save store info
                  </button>
                </div>

                <div className="space-y-4 rounded-2xl border border-[#BBD5DA] bg-[#FCFCFC] p-5">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-500">
                    Payment & verification
                  </h3>
                  <div className="space-y-3">
                    <label className="block text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">UPI ID</span>
                      <input
                        value={form.profileData.upiId || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              upiId: event.target.value,
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        GST number
                      </span>
                      <input
                        value={form.profileData.businessDetails?.gst || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              businessDetails: {
                                ...(prev.profileData.businessDetails || {}),
                                gst: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        License
                      </span>
                      <input
                        value={form.profileData.businessDetails?.license || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              businessDetails: {
                                ...(prev.profileData.businessDetails || {}),
                                license: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Tax details
                      </span>
                      <input
                        value={
                          form.profileData.businessDetails?.taxDetails || ""
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              businessDetails: {
                                ...(prev.profileData.businessDetails || {}),
                                taxDetails: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                    <label className="block text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Store status
                      </span>
                      <select
                        value={form.profileData.storeProfile?.status || ""}
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              storeProfile: {
                                ...(prev.profileData.storeProfile || {}),
                                status: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      >
                        <option value="">Select</option>
                        <option value="Open">Open</option>
                        <option value="Closed">Closed</option>
                        <option value="Paused">Paused</option>
                      </select>
                    </label>
                    <label className="block text-sm text-gray-600">
                      <span className="mb-1.5 block font-semibold">
                        Verification status
                      </span>
                      <input
                        value={
                          form.profileData.verificationStatus?.status || ""
                        }
                        onChange={(event) =>
                          setForm((prev) => ({
                            ...prev,
                            profileData: {
                              ...prev.profileData,
                              verificationStatus: {
                                ...(prev.profileData.verificationStatus || {}),
                                status: event.target.value,
                              },
                            },
                          }))
                        }
                        className="w-full rounded-xl border border-[#BBD5DA] bg-white px-3.5 py-2.5 text-sm outline-none"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl px-5 py-3.5 text-sm font-medium text-white shadow-2xl ${toast.ok ? "bg-green-500" : "bg-[#FF0000]"}`}
        >
          {toast.ok ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {toast.message}
        </div>
      )}
    </div>
  );
}
