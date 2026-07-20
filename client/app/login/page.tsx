"use client";

import { useState, FormEvent, useEffect, useContext, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AuthContext } from "../context/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import {
  validateLoginForm,
  validateSignupForm,
  normalizeAuthErrorMessage,
} from "../utils/authValidation";

// Always talk to the local API gateway
const API_URL = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api`;

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

// Decide where to send the user after login/register
function redirectDestination(role: string): string {
  if (role === "admin") return "/admin/dashboard";
  if (role === "store_owner") return "/store/dashboard";
  return "/";
}

function AuthPageContent() {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [error, setError] = useState("");

  // "Register as" toggle — only visible on sign-up tab
  const [registerAs, setRegisterAs] = useState<"user" | "store_owner">("user");

  const router = useRouter();
  const searchParams = useSearchParams();
  const ctx = useContext(AuthContext) as any;

  const [fullname, setFullname] = useState("");
  const [email, setEmail] = useState("");
  const [mobilenumber, setMobilenumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam === "google_auth_failed") {
      setError("Google authentication failed. Please try again.");
    }
  }, [searchParams]);

  // Already logged in → redirect straight to the right place
  useEffect(() => {
    const token = localStorage.getItem("token");
    const userStr = localStorage.getItem("user");
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        router.push(redirectDestination(user.role));
      } catch {
        router.push("/");
      }
    }
  }, [router]);

  const validateForm = () => {
    const errors = isLogin
      ? validateLoginForm({ email, password })
      : validateSignupForm({
          fullname,
          email,
          mobilenumber,
          password,
        });

    setFieldErrors(errors);
    setError("");

    if (Object.keys(errors).length > 0) {
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError("");
    setFieldErrors({});

    try {
      let response: Response;
      let data: AuthResponse;

      if (isLogin) {
        response = await fetch(`${API_URL}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        });
      } else {
        response = await fetch(`${API_URL}/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fullname: fullname.trim(),
            email: email.trim(),
            mobilenumber: mobilenumber.replace(/\D/g, ""),
            password,
            role: registerAs, // ← send chosen role
          }),
        });
      }

      data = await response.json();
      if (!response.ok) {
        const normalizedMessage = normalizeAuthErrorMessage(data.message);
        throw new Error(normalizedMessage || "Authentication failed");
      }

      if (data.success && data.data) {
        // Go through AuthContext (not just localStorage) so every component
        // reading ctx.token picks up *this* login immediately, instead of
        // keeping whichever account's token the context last held.
        if (ctx?.login) {
          ctx.login(data.data, data.data.token);
        } else {
          localStorage.setItem("token", data.data.token);
          localStorage.setItem("user", JSON.stringify(data.data));
        }
        window.dispatchEvent(new CustomEvent("authChange"));

        if (!isLogin) {
          // After registration → always go to verify-email page
          const msg =
            data.data.role === "store_owner"
              ? "Account created! Please verify your email to continue."
              : "Account created! Please check your inbox to verify your email.";
          setSuccessMessage(msg);
          setShowSuccess(true);
          setTimeout(() => router.push("/verify-email"), 1500);
        } else {
          // Login → go to role-based destination
          const destination = redirectDestination(data.data.role);
          setSuccessMessage("Logged in successfully!");
          setShowSuccess(true);
          setTimeout(() => router.push(destination), 1500);
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${API_URL}/auth/google`;
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setError("");
    setFullname("");
    setMobilenumber("");
    setPassword("");
    setShowPassword(false);
    setFieldErrors({});
    setRegisterAs("user");
  };

  return (
    <>
      {/* Background glows */}
      <div className="pointer-events-none absolute -top-20 -left-20 h-96 w-96 rounded-full bg-yellow-600/20 blur-[100px]" />
      <div className="pointer-events-none absolute top-0 left-0 h-64 w-64 rounded-full bg-orange-500/10 blur-[80px]" />

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
        className={`relative z-10 w-full max-w-md overflow-hidden rounded-[2.5rem] bg-gray-900/40 p-8 shadow-2xl backdrop-blur-xl ring-1 ring-white/10 sm:p-10 transition-all duration-500 ${showSuccess ? "scale-95 opacity-50 blur-sm" : "scale-100 opacity-100"}`}
      >
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-medium tracking-tight text-white/90">
            {isLogin ? "Welcome Back" : "Create Account"}
          </h2>
          <p className="mt-2 text-sm text-gray-400">
            {isLogin ? "Sign in to your account" : "Join us to get started"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ── Register As toggle (sign-up only) ─────────────────── */}
          <div
            className={`transition-all duration-300 ease-in-out ${!isLogin ? "max-h-24 opacity-100 mb-2" : "max-h-0 opacity-0 overflow-hidden"}`}
          >
            <p className="text-xs text-gray-400 mb-2 text-center tracking-wide uppercase">
              I am registering as
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRegisterAs("user")}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border transition-all ${
                  registerAs === "user"
                    ? "bg-[#FF0000] text-white border-[#FF0000]"
                    : "bg-black/20 text-gray-400 border-white/10 hover:border-white/20"
                }`}
              >
                🛍️ Customer
              </button>
              <button
                type="button"
                onClick={() => setRegisterAs("store_owner")}
                className={`flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-medium border transition-all ${
                  registerAs === "store_owner"
                    ? "bg-[#FF0000] text-white border-[#FF0000]"
                    : "bg-black/20 text-gray-400 border-white/10 hover:border-white/20"
                }`}
              >
                🏪 Store Owner
              </button>
            </div>
          </div>

          {/* Full Name (sign-up only) */}
          <div
            className={`transition-all duration-300 ease-in-out ${!isLogin ? "max-h-20 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
          >
            <input
              type="text"
              required={!isLogin}
              value={fullname}
              onChange={(e) => {
                setFullname(e.target.value);
                setFieldErrors((prev) => ({ ...prev, fullname: "" }));
              }}
              placeholder="Full Name"
              className="w-full rounded-full border border-white/10 bg-black/20 px-6 py-4 text-sm text-white placeholder-gray-500 focus:border-[#FF0000]/50 focus:bg-black/40 focus:outline-none transition-colors"
            />
            {fieldErrors.fullname && (
              <p className="mt-2 text-xs text-red-300">
                {fieldErrors.fullname}
              </p>
            )}
          </div>

          {/* Mobile Number (sign-up only) */}
          <div
            className={`transition-all duration-300 ease-in-out ${!isLogin ? "max-h-20 opacity-100" : "max-h-0 opacity-0 overflow-hidden"}`}
          >
            <input
              type="tel"
              required={!isLogin}
              value={mobilenumber}
              onChange={(e) => {
                setMobilenumber(e.target.value);
                setFieldErrors((prev) => ({ ...prev, mobilenumber: "" }));
              }}
              placeholder="Mobile Number"
              maxLength={10}
              className="w-full rounded-full border border-white/10 bg-black/20 px-6 py-4 text-sm text-white placeholder-gray-500 focus:border-[#FF0000]/50 focus:bg-black/40 focus:outline-none transition-colors"
            />
            {fieldErrors.mobilenumber && (
              <p className="mt-2 text-xs text-red-300">
                {fieldErrors.mobilenumber}
              </p>
            )}
          </div>

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
              placeholder="Email Address"
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

          {isLogin && (
            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[#FF0000] hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          )}
        </form>

        {/* Divider */}
        <div className="relative my-8">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs uppercase tracking-widest text-gray-500">
            <span className="bg-transparent px-2 backdrop-blur-xl">
              Or continue with
            </span>
          </div>
        </div>

        {/* Google */}
        <button
          onClick={handleGoogleLogin}
          className="flex w-full items-center justify-between rounded-full border border-white/10 bg-white/5 px-6 py-3.5 text-sm font-medium text-white transition hover:bg-white/10"
        >
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Google</span>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="h-4 w-4 text-gray-500"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8.25 4.5l7.5 7.5-7.5 7.5"
            />
          </svg>
        </button>

        <p className="mt-10 text-center text-sm text-gray-500">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={toggleMode}
            className="font-medium text-[#FF0000] hover:text-red-400 hover:underline transition-colors"
          >
            {isLogin ? "Sign up" : "Log in"}
          </button>
        </p>
      </div>
    </>
  );
}

export default function AuthPage() {
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
        <AuthPageContent />
      </Suspense>
    </section>
  );
}
