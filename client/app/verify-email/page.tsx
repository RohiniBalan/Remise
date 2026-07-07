'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Mail, RefreshCw, CheckCircle, ArrowLeft, ShoppingBag } from 'lucide-react';

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api`;

export default function VerifyEmailPage() {
  const [email,     setEmail]     = useState('');
  const [sending,   setSending]   = useState(false);
  const [sent,      setSent]      = useState(false);
  const [error,     setError]     = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.email) setEmail(user.email);
    } catch {}
  }, []);

  // Countdown for resend cooldown
  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const handleResend = async () => {
    if (countdown > 0 || sending) return;
    setSending(true); setError(''); setSent(false);
    try {
      const token = localStorage.getItem('token');
      const res   = await fetch(`${API}/auth/resend-verification`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to send email');
      setSent(true);
      setCountdown(60); // 60 s cooldown
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      {/* Slim header */}
      <header className="bg-white border-b border-[#BBD5DA] h-16 flex items-center px-6">
        <Link href="/" className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-800 font-medium transition">
          <ArrowLeft size={16} /> Back to Home
        </Link>
        <div className="ml-auto flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[#FF0000] flex items-center justify-center">
            <ShoppingBag size={16} className="text-white" />
          </div>
          <span className="text-base font-black text-gray-900 hidden sm:block">
            R<span className="text-[#FF0000]">E</span>mise
          </span>
        </div>
      </header>

      {/* Body */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <div className="bg-white rounded-3xl border border-[#BBD5DA] shadow-xl overflow-hidden">

            {/* Top accent */}
            <div className="h-2 bg-gradient-to-r from-[#FF0000] via-[#ff6666] to-[#0FA3B1]" />

            <div className="p-8 text-center">
              {/* Icon */}
              <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#DFF1F1] flex items-center justify-center">
                <Mail size={36} className="text-teal-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h1>
              <p className="text-gray-500 text-sm mb-1">We've sent a verification link to:</p>
              <p className="font-semibold text-gray-900 mb-6 break-all">{email || 'your email address'}</p>

              <div className="bg-[#F5F5F5] rounded-2xl p-4 text-left mb-6 space-y-2 text-sm text-gray-600">
                <p className="flex items-start gap-2"><span className="text-teal-600 font-bold mt-0.5">1.</span> Open the email from Remise</p>
                <p className="flex items-start gap-2"><span className="text-teal-600 font-bold mt-0.5">2.</span> Click the "Verify Email" button inside</p>
                <p className="flex items-start gap-2"><span className="text-teal-600 font-bold mt-0.5">3.</span> You'll be redirected back and logged in automatically</p>
              </div>

              {/* Success banner */}
              {sent && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center gap-2 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium"
                >
                  <CheckCircle size={16} /> Verification email sent! Check your inbox.
                </motion.div>
              )}

              {/* Error banner */}
              {error && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 text-[#FF0000] px-4 py-3 rounded-xl mb-4 text-sm">
                  {error}
                </div>
              )}

              {/* Resend button */}
              <button
                onClick={handleResend}
                disabled={countdown > 0 || sending}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#FF0000] hover:bg-[#e00000] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition mb-3"
              >
                <RefreshCw size={16} className={sending ? 'animate-spin' : ''} />
                {sending ? 'Sending…' : countdown > 0 ? `Resend in ${countdown}s` : 'Resend Verification Email'}
              </button>

              <p className="text-xs text-gray-400">
                Didn't get the email? Check your spam folder or{' '}
                <Link href="/login" className="text-[#FF0000] hover:underline font-medium">try logging in again</Link>.
              </p>
            </div>
          </div>

          {/* Skip link for now */}
          <p className="text-center mt-5 text-sm text-gray-500">
            Want to explore first?{' '}
            <Link href="/" className="text-[#FF0000] hover:underline font-medium">
              Continue to homepage
            </Link>
          </p>
        </motion.div>
      </main>
    </div>
  );
}
