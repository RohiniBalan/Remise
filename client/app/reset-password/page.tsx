"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Lock,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import { validateResetPasswordForm } from "../utils/authValidation";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api`;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [token, setToken] = useState("");

  useEffect(() => {
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateResetPasswordForm({
      password,
      confirmPassword,
    });
    if (Object.keys(validationErrors).length > 0) {
      setError(
        validationErrors.password ||
          validationErrors.confirmPassword ||
          "Please fix the highlighted issues.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Unable to reset password");
      setMessage(data.message || "Password reset successfully.");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">
      <header className="bg-white border-b border-[#BBD5DA] h-16 flex items-center px-6">
        <Link
          href="/login"
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition"
        >
          <ArrowLeft size={16} /> Back to Sign In
        </Link>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl border border-[#BBD5DA] shadow-xl overflow-hidden">
            <div className="h-2 bg-gradient-to-r from-[#FF0000] via-[#ff6666] to-[#0FA3B1]" />
            <div className="p-8">
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#DFF1F1] flex items-center justify-center">
                <Lock size={36} className="text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Reset your password
              </h1>
              <p className="text-gray-500 text-sm mb-6 text-center">
                Choose a new password for your Remise account.
              </p>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#FF0000] flex items-start gap-2">
                  <XCircle size={16} className="mt-0.5" /> {error}
                </div>
              ) : null}
              {message ? (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle size={16} /> {message}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    required
                    className="w-full rounded-full border border-[#BBD5DA] bg-[#F5F5F5] px-6 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF0000] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition hover:text-gray-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="relative">
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    required
                    className="w-full rounded-full border border-[#BBD5DA] bg-[#F5F5F5] px-6 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF0000] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-gray-400 transition hover:text-gray-600"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#FF0000] py-3 font-semibold text-white transition hover:bg-[#e00000] disabled:opacity-70"
                >
                  {loading ? "Resetting…" : "Reset password"}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
