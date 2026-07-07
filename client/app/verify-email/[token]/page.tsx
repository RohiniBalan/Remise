'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, ShoppingBag } from 'lucide-react';

const API = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api`;

type Status = 'verifying' | 'success' | 'error';

export default function VerifyEmailTokenPage() {
  const params = useParams();
  const router = useRouter();
  const token  = params?.token as string | undefined;

  const [status,  setStatus]  = useState<Status>('verifying');
  const [message, setMessage] = useState('');

  // Prevent React StrictMode from calling the API twice (double useEffect in dev)
  const called = useRef(false);

  useEffect(() => {
    if (called.current) return;
    called.current = true;
    if (!token) { setStatus('error'); setMessage('Invalid verification link.'); return; }
    verifyToken(token);
  }, [token]);

  const verifyToken = async (t: string) => {
    try {
      const res  = await fetch(`${API}/auth/verify-email/${t}`, { method: 'GET' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Verification failed');

      // Update localStorage so the verification dot turns green
      try {
        const raw  = localStorage.getItem('user');
        if (raw) {
          const user = JSON.parse(raw);
          user.isEmailVerified = true;
          localStorage.setItem('user', JSON.stringify(user));
          window.dispatchEvent(new CustomEvent('authChange'));
        }
      } catch {}

      setStatus('success');
      setMessage(data.message || 'Your email has been verified successfully!');

      // Redirect after 3 seconds
      setTimeout(() => {
        try {
          const user = JSON.parse(localStorage.getItem('user') || '{}');
          if (user.role === 'store_owner') router.push('/store/dashboard');
          else if (user.role === 'admin') router.push('/admin/dashboard');
          else router.push('/');
        } catch {
          router.push('/');
        }
      }, 3000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'The verification link may have expired or is invalid.');
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F5F5] flex flex-col">

      {/* Header */}
      <header className="bg-white border-b border-[#BBD5DA] h-16 flex items-center px-6">
        <div className="flex items-center gap-2">
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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-sm"
        >
          <div className="bg-white rounded-3xl border border-[#BBD5DA] shadow-xl overflow-hidden">
            <div className={`h-2 ${status === 'success' ? 'bg-green-500' : status === 'error' ? 'bg-[#FF0000]' : 'bg-[#0FA3B1]'}`} />

            <div className="p-8 text-center">
              {status === 'verifying' && (
                <>
                  <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-[#DFF1F1] flex items-center justify-center">
                    <Loader2 size={36} className="text-teal-600 animate-spin" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Verifying your email…</h2>
                  <p className="text-gray-500 text-sm">Please wait while we confirm your address.</p>
                </>
              )}

              {status === 'success' && (
                <>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5, duration: 0.6 }}
                    className="mx-auto mb-6 w-20 h-20 rounded-full bg-green-100 flex items-center justify-center"
                  >
                    <CheckCircle size={40} className="text-green-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Email Verified!</h2>
                  <p className="text-gray-500 text-sm mb-6">{message}</p>
                  <div className="flex items-center gap-2 justify-center text-sm text-gray-400">
                    <Loader2 size={14} className="animate-spin" />
                    Redirecting you now…
                  </div>
                </>
              )}

              {status === 'error' && (
                <>
                  <div className="mx-auto mb-6 w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                    <XCircle size={40} className="text-[#FF0000]" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Verification Failed</h2>
                  <p className="text-gray-500 text-sm mb-6">{message}</p>
                  <div className="flex flex-col gap-3">
                    <Link href="/verify-email"
                      className="w-full py-3 bg-[#FF0000] hover:bg-[#e00000] text-white font-semibold rounded-xl text-sm transition text-center">
                      Request a New Link
                    </Link>
                    <Link href="/"
                      className="w-full py-3 bg-[#F5F5F5] hover:bg-[#DFF1F1] border border-[#BBD5DA] text-gray-700 font-semibold rounded-xl text-sm transition text-center">
                      Back to Home
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
