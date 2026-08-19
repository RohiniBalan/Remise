"use client";

import { useState, FormEvent, useEffect, useContext, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../../context/AuthContext";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import {
  validateLoginForm,
  normalizeAuthErrorMessage,
} from "../../utils/authValidation";
import { getRoleRedirectUrl } from "../../utils/authRedirect";

const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api`;

// TODO: confirm this matches your real admin dashboard route (check authRedirect.ts).
const ADMIN_DASHBOARD_ROUTE = "/admin/dashboard";

interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    _id: string;
    fullname: string;
    email: string;
    mobilenumber: string;
    role: string;
    token: string;
  };
}

function AdminLoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  const router = useRouter();
  const searchParams = useSearchParams();
  const ctx = useContext(AuthContext) as any;

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "not_admin") {
      setError("That account doesn't have admin access.");
    }
  }, [searchParams]);

  // Already logged in as admin → skip straight to dashboard.
  // If logged in as something else, leave them on this page rather than
  // bouncing them into their own (non-admin) dashboard from an admin URL.
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.role === "admin") {
          router.push(ADMIN_DASHBOARD_ROUTE);
        }
      } catch {
        // ignore malformed local data, let them log in fresh
      }
    }
  }, [router]);

  const validateForm = () => {
    const errors = validateLoginForm({ email, password });
    setFieldErrors(errors);
    setError("");
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data: AuthResponse = await response.json();
      if (!response.ok) {
        const normalizedMessage = normalizeAuthErrorMessage(data.message);
        throw new Error(normalizedMessage || "Authentication failed");
      }

      if (!data.success || !data.data) {
        throw new Error("Authentication failed");
      }

      // This endpoint authenticates any valid account — it doesn't know
      // which portal called it. Enforce the admin-only boundary here:
      // reject and DON'T persist a session for non-admin accounts.
      if (data.data.role !== "admin") {
        setError("This login is for admin accounts only.");
        setLoading(false);
        return;
      }

      if (ctx?.login) {
        ctx.login(data.data, data.data.token);
      } else {
        localStorage.setItem("token", data.data.token);
        localStorage.setItem("user", JSON.stringify(data.data));
      }
      window.dispatchEvent(new CustomEvent("authChange"));

      setSuccessMessage("Logged in successfully!");
      setShowSuccess(true);
      setTimeout(() => router.push(ADMIN_DASHBOARD_ROUTE), 1500);
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-red-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute top-0 right-0 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />

      {/* Error toast */}
      {error && (
        <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-full bg-red-500/90 px-6 py-3 text-sm text-white backdrop-blur-sm animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </div>
        </div>
      )}

      {/* Success popup */}
      {showSuccess && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm rounded-3xl bg-white p-8 text-center shadow-2xl animate-in zoom-in-95 duration-300">
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-10 w-10 text-green-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth="3"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h3 className="mb-2 text-2xl font-bold text-gray-900">Success!</h3>
            <p className="text-gray-500">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Auth card */}
      <div
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] bg-gray-900/40 p-6 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 sm:p-8 transition-all duration-500 ${showSuccess ? "scale-95 opacity-50 blur-sm" : "scale-100 opacity-100"}`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FF0000]/10 border border-[#FF0000]/30 text-[#FF0000] text-xs font-semibold uppercase tracking-wider mb-2">
            <ShieldCheck size={12} />
            Admin Portal
          </div>
          <h2 className="text-3xl font-medium tracking-tight text-white/90">
            Admin Sign In
          </h2>
          <p className="mt-1 text-sm text-gray-400">
            Restricted access. Authorized personnel only.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setFieldErrors((prev) => ({ ...prev, email: "" }));
              }}
              placeholder="Admin Email Address"
              className="w-full rounded-full border border-white/10 bg-black/20 px-6 py-4 text-sm text-white placeholder-gray-500 focus:border-[#FF0000]/50 focus:bg-black/40 focus:outline-none transition-colors"
            />
            {fieldErrors.email && (
              <p className="mt-2 text-xs text-red-300">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password + submit arrow */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setFieldErrors((prev) => ({ ...prev, password: "" }));
              }}
              placeholder="Password"
              className="w-full rounded-full border border-white/10 bg-black/20 px-6 py-4 pr-24 text-sm text-white placeholder-gray-500 focus:border-[#FF0000]/50 focus:bg-black/40 focus:outline-none transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-12 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition hover:text-white"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-[#FF0000] text-white shadow-lg transition-transform hover:scale-105 hover:bg-[#e00000] disabled:opacity-70"
            >
              {loading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                  />
                </svg>
              )}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs text-red-300">{fieldErrors.password}</p>
          )}

          <div className="text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-[#FF0000] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}

export default function AdminLoginPage() {
  return (
    <section className="fixed inset-0 z-[9999] flex h-screen w-full items-center justify-center bg-black px-4 text-white overflow-hidden">
      <Suspense
        fallback={
          <div className="flex flex-col items-center justify-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#FF0000] border-t-transparent" />
            <p className="text-sm text-gray-400 tracking-widest uppercase">
              Loading...
            </p>
          </div>
        }
      >
        <AdminLoginPageContent />
      </Suspense>
    </section>
  );
}