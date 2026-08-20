'use client';

import React, { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { CheckCircle, XCircle, Loader2, RefreshCw, ShoppingBag, Download, FileText } from 'lucide-react';
import { useCart } from '@/app/components-main/CartContext';
import { smartOrderApi } from '@/app/api-services/smartOrderApi';
import InvoiceViewModal from '@/app/components-main/InvoiceViewModal';

function PaymentStatusContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  
  const { setBuyNowItem } = useCart();
  const [status, setStatus] = useState<'LOADING' | 'SUCCESS' | 'FAILED' | 'PENDING'>('LOADING');
  const [errorMessage, setErrorMessage] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const checkPaymentStatus = async () => {
    if (!orderId) {
      setStatus('FAILED');
      setErrorMessage("No Order ID provided.");
      return;
    }

    setStatus('LOADING');
    try {
      const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
      // Attempt status check via gateway or fallback to monolith
      let response = await fetch(`${BASE}/api/payment/status/${orderId}`);
      if (!response.ok) {
        response = await fetch(`http://localhost:5000/api/payment/status/${orderId}`);
      }
      const data = await response.json();

      if (response.ok && data.success) {
        if (data.status === 'SUCCESS') {
          setStatus('SUCCESS');
          setBuyNowItem(null); 
          // localStorage.removeItem('cart');
        } else if (data.status === 'PENDING') {
          setStatus('PENDING');
        } else {
          setStatus('FAILED');
          setErrorMessage(data.message || 'Payment was declined by the bank.');
        }
      } else {
        setStatus('FAILED');
        setErrorMessage(data.message || 'Failed to verify payment status.');
      }
    } catch (error) {
      console.error("Error checking status:", error);
      setStatus('FAILED');
      setErrorMessage('Server unreachable. Please contact support if amount was deducted.');
    }
  };

  useEffect(() => {
    checkPaymentStatus();
  }, [orderId, setBuyNowItem]);

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex flex-col items-center justify-center p-6 font-sans">
      <div className="bg-white max-w-md w-full rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        
        {status === 'LOADING' && (
          <div className="flex flex-col items-center">
            <Loader2 size={64} className="animate-spin text-[#C9A84C] mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Verifying Payment</h2>
            <p className="text-gray-500">Please wait while we securely confirm your transaction with PhonePe.</p>
          </div>
        )}

        {status === 'SUCCESS' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-5 border border-green-200">
              <CheckCircle size={48} className="text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Order Placed Successfully!</h2>
            <p className="text-gray-500 text-sm mb-6">
              Thank you for your purchase. Your payment was successful and your order <strong>{orderId}</strong> has been confirmed.
            </p>

            {/* Bill Summary Actions */}
            {orderId && (
              <div className="w-full space-y-3 mb-6">
                <a
                  href={smartOrderApi.getInvoicePdfUrl(orderId)}
                  download={`Invoice-${orderId}.pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-bold uppercase tracking-wider rounded-xl transition shadow-md shadow-teal-600/20 text-xs"
                >
                  <Download size={16} /> Download Bill (PDF)
                </a>

                <button 
                  onClick={() => setShowInvoiceModal(true)}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded-xl transition border border-teal-200 text-xs"
                >
                  <FileText size={16} /> View Invoice Details
                </button>
              </div>
            )}

            <button 
              onClick={() => router.push('/category/art')}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-[#C9A84C] text-black font-bold uppercase tracking-widest rounded-xl hover:bg-[#E2BE6A] transition-colors text-xs"
            >
              <ShoppingBag size={18} /> Continue Shopping
            </button>
          </div>
        )}


        {status === 'FAILED' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
              <XCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Failed</h2>
            <p className="text-gray-500 mb-6">{errorMessage}</p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => router.push('/checkout')}
                className="flex-1 py-4 bg-gray-100 text-gray-800 font-bold uppercase tracking-wide rounded-xl hover:bg-gray-200 transition-colors"
              >
                Try Again
              </button>
              <button 
                onClick={() => router.push('/')}
                className="flex-1 py-4 bg-[#C9A84C] text-black font-bold uppercase tracking-wide rounded-xl hover:bg-[#E2BE6A] transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        )}

        {status === 'PENDING' && (
          <div className="flex flex-col items-center">
            <div className="w-20 h-20 bg-yellow-50 rounded-full flex items-center justify-center mb-6">
              <Loader2 size={48} className="text-yellow-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Pending</h2>
            <p className="text-gray-500 mb-8">Your payment is processing at the bank. Please check back in a moment.</p>
            <div className="flex gap-4 w-full">
              <button 
                onClick={checkPaymentStatus}
                className="flex-1 flex items-center justify-center gap-2 py-4 bg-gray-100 text-gray-800 font-bold uppercase tracking-wide rounded-xl hover:bg-gray-200 transition-colors"
              >
                <RefreshCw size={18} /> Refresh
              </button>
              <button 
                onClick={() => router.push('/')}
                className="flex-1 py-4 bg-[#C9A84C] text-black font-bold uppercase tracking-wide rounded-xl hover:bg-[#E2BE6A] transition-colors"
              >
                Home
              </button>
            </div>
          </div>
        )}

      </div>

      {orderId && (
        <InvoiceViewModal
          orderId={orderId}
          isOpen={showInvoiceModal}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}
    </div>
  );
}


export default function PaymentStatusPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#F9F9F9] flex items-center justify-center"><Loader2 className="animate-spin text-[#C9A84C]" size={48}/></div>}>
      <PaymentStatusContent />
    </Suspense>
  );
}