"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Mail, CheckCircle } from "lucide-react";

const API = `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000"}/api`;

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      const res = await fetch(`${API}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Unable to send reset instructions");
      setMessage(data.message || "Password reset instructions sent.");
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
                <Mail size={36} className="text-teal-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">
                Forgot your password?
              </h1>
              <p className="text-gray-500 text-sm mb-6 text-center">
                Enter the email address connected to your account and we’ll send
                a secure reset link.
              </p>

              {error ? (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-[#FF0000]">
                  {error}
                </div>
              ) : null}
              {message ? (
                <div className="mb-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  <CheckCircle size={16} /> {message}
                </div>
              ) : null}

              <form onSubmit={handleSubmit} className="space-y-4">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email address"
                  required
                  className="w-full rounded-full border border-[#BBD5DA] bg-[#F5F5F5] px-6 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-[#FF0000] focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-[#FF0000] py-3 font-semibold text-white transition hover:bg-[#e00000] disabled:opacity-70"
                >
                  {loading ? "Sending…" : "Send reset link"}
                </button>
              </form>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
