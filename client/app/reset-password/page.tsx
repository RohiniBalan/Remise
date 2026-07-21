"use client";

import { Suspense, useEffect, useState } from "react";
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

function ResetPasswordContent() {
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
          "Please fix the highlighted issues."
      );
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API}/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Unable to reset password");
      }

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
          <ArrowLeft size={16} />
          Back to Sign In
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

              <h1 className="text-2xl font-bold text-center">
                Reset your password
              </h1>

              <p className="text-center text-gray-500 mb-6">
                Choose a new password for your Remise account.
              </p>

              {error && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex gap-2">
                  <XCircle size={16} />
                  {error}
                </div>
              )}

              {message && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700 flex gap-2">
                  <CheckCircle size={16} />
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="New password"
                    className="w-full rounded-full border px-6 py-3"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) =>
                      setConfirmPassword(e.target.value)
                    }
                    placeholder="Confirm password"
                    className="w-full rounded-full border px-6 py-3"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <button
                  disabled={loading}
                  className="w-full rounded-full bg-red-600 py-3 text-white"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPasswordContent />
    </Suspense>
  );
}