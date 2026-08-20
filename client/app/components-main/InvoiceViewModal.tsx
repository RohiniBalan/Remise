"use client";

import React, { useEffect, useState } from "react";
import {
  FileText,
  Download,
  CheckCircle2,
  X,
  Store,
  User,
  CreditCard,
  Printer,
  Loader2,
  AlertCircle,
  Package,
} from "lucide-react";
import { smartOrderApi } from "@/app/api-services/smartOrderApi";

export interface InvoiceData {
  invoiceNumber: string;
  orderId: string;
  paymentId?: string;
  invoiceDateFormatted: string;
  paymentMethod: string;
  paymentMethodFormatted: string;
  paymentStatus: string;
  orderStatus: string;
  deliveryMethod?: string;
  deliveryMethodFormatted?: string;
  store: {
    name: string;
    email?: string;
    phone?: string;
    upiId?: string;
    address?: any;
  };
  customer: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    productId: string;
    title: string;
    brand?: string;
    price: number;
    quantity: number;
    subtotal: number;
    image?: string;
    tierLabel?: string;
  }>;
  summary: {
    itemCount: number;
    subtotal: number;
    discount?: number;
    tax?: number;
    shipping?: number;
    totalAmount: number;
  };
}

interface Props {
  orderId: string;
  initialInvoiceData?: InvoiceData | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function InvoiceViewModal({
  orderId,
  initialInvoiceData,
  isOpen,
  onClose,
}: Props) {
  const [invoice, setInvoice] = useState<InvoiceData | null>(
    initialInvoiceData || null,
  );
  const [loading, setLoading] = useState(!initialInvoiceData);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isOpen || !orderId) return;

    if (initialInvoiceData) {
      setInvoice(initialInvoiceData);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");

    smartOrderApi
      .getInvoice(orderId)
      .then((res) => {
        if (res.data?.success && res.data.data) {
          setInvoice(res.data.data);
        } else {
          setError(res.data?.message || "Failed to load invoice data.");
        }
      })
      .catch((err) => {
        console.error("Failed to load invoice:", err);
        setError(
          err.response?.data?.message ||
            "Invoice is only available for confirmed successful payments.",
        );
      })
      .finally(() => setLoading(false));
  }, [isOpen, orderId, initialInvoiceData]);

  if (!isOpen) return null;

  const pdfUrl = smartOrderApi.getInvoicePdfUrl(orderId);

  const handleDownload = () => {
    // Open or trigger direct download of the PDF
    const link = document.createElement("a");
    link.href = pdfUrl;
    link.download = `Invoice-${orderId}.pdf`;
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatAddress = (addr: any) => {
    if (!addr) return "";
    if (typeof addr === "string") return addr;
    return [addr.street, addr.city, addr.state, addr.pinCode, addr.country]
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white text-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col my-8 max-h-[90vh]">
        {/* Modal Top Action Bar */}
        <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-700/80 flex items-center justify-center">
              <FileText size={18} className="text-teal-200" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight">
                Tax Invoice & Payment Receipt
              </h3>
              <p className="text-xs text-teal-200">
                Order #{orderId}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              title="Download PDF Invoice"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-teal-900 text-xs font-semibold hover:bg-teal-50 transition shadow-sm"
            >
              <Download size={14} />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg text-teal-200 hover:text-white hover:bg-teal-700 transition"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center space-y-3">
              <Loader2 size={36} className="animate-spin text-teal-600" />
              <p className="text-sm font-medium text-gray-500">
                Generating your verified bill...
              </p>
            </div>
          )}

          {error && !loading && (
            <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
              <AlertCircle size={20} className="shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold">Invoice Unavailable</p>
                <p className="text-xs text-red-600 mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && invoice && (
            <div id="printable-invoice" className="space-y-6">
              {/* Store & Invoice Meta Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-5 border-b border-gray-100 gap-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600 bg-teal-50 px-2 py-0.5 rounded">
                    Official Invoice
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-1">
                    {invoice.store?.name || "Remise Store"}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {formatAddress(invoice.store?.address)}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                    {invoice.store?.phone && (
                      <span>Phone: {invoice.store.phone}</span>
                    )}
                    {invoice.store?.email && (
                      <span>Email: {invoice.store.email}</span>
                    )}
                    {invoice.store?.upiId && (
                      <span className="text-teal-700 font-medium">
                        UPI: {invoice.store.upiId}
                      </span>
                    )}
                  </div>
                </div>

                <div className="sm:text-right">
                  {invoice.paymentStatus === 'SUCCESS' ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-200 text-xs font-bold">
                      <CheckCircle2 size={13} className="text-green-600" />
                      <span>PAID & VERIFIED</span>
                    </div>
                  ) : (invoice.paymentMethod === 'cod' || invoice.paymentMethod === 'cash') ? (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold">
                      <CheckCircle2 size={13} className="text-teal-600" />
                      <span>CASH ON DELIVERY (PLACED)</span>
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
                      <span>PAYMENT PENDING</span>
                    </div>
                  )}
                  <p className="text-xs font-semibold text-gray-700 mt-2">
                    Invoice: {invoice.invoiceNumber}
                  </p>
                  <p className="text-xs text-gray-500">
                    Date: {invoice.invoiceDateFormatted}
                  </p>
                </div>

              </div>

              {/* Billed To & Payment Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
                    <User size={14} /> Billed To (Customer)
                  </div>
                  <p className="text-sm font-semibold text-gray-900">
                    {invoice.customer?.name}
                  </p>
                  {invoice.customer?.phone && (
                    <p className="text-xs text-gray-600">
                      Phone: {invoice.customer.phone}
                    </p>
                  )}
                  {invoice.customer?.email && (
                    <p className="text-xs text-gray-600 truncate">
                      Email: {invoice.customer.email}
                    </p>
                  )}
                  {invoice.customer?.address && (
                    <p className="text-xs text-gray-500 leading-relaxed pt-1">
                      {invoice.customer.address}
                    </p>
                  )}
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-teal-700 mb-2">
                    <CreditCard size={14} /> Payment & Order Info
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Order ID:</span>
                    <span className="font-semibold text-gray-800">
                      {invoice.orderId}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Payment Mode:</span>
                    <span className="font-semibold text-teal-800">
                      {invoice.paymentMethodFormatted}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Delivery Method:</span>
                    <span className="font-semibold text-gray-800">
                      {invoice.deliveryMethodFormatted || "Delivery"}
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-gray-500">Payment Status:</span>
                    <span className="font-bold text-green-600">CONFIRMED (PAID)</span>
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  <Package size={14} /> Order Items
                </div>
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-teal-50/70 border-b border-gray-200 text-teal-900 font-bold uppercase tracking-wider">
                      <tr>
                        <th className="p-3 w-8 text-center">#</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Qty</th>
                        <th className="p-3 text-right">Price</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {invoice.items?.map((item, idx) => (
                        <tr key={idx} className="hover:bg-gray-50/60 transition">
                          <td className="p-3 text-center text-gray-400 font-medium">
                            {idx + 1}
                          </td>
                          <td className="p-3 font-medium text-gray-900">
                            <div>
                              <span>{item.title}</span>
                              {item.brand && (
                                <span className="ml-1.5 text-[11px] text-gray-500 font-normal">
                                  ({item.brand})
                                </span>
                              )}
                              {item.tierLabel && (
                                <span className="ml-1.5 text-[10px] font-semibold text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded">
                                  {item.tierLabel}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-center text-gray-700 font-semibold">
                            {item.quantity}
                          </td>
                          <td className="p-3 text-right text-gray-600">
                            ₹{(item.price || 0).toLocaleString("en-IN")}
                          </td>
                          <td className="p-3 text-right font-bold text-gray-900">
                            ₹{(item.subtotal || 0).toLocaleString("en-IN")}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Summary */}
              <div className="flex justify-end pt-2">
                <div className="w-full sm:w-72 bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex justify-between text-gray-600">
                    <span>Items Subtotal:</span>
                    <span className="font-semibold text-gray-800">
                      ₹{(invoice.summary?.subtotal || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                  {invoice.summary?.discount ? (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount:</span>
                      <span>
                        -₹{invoice.summary.discount.toLocaleString("en-IN")}
                      </span>
                    </div>
                  ) : null}
                  <div className="flex justify-between text-gray-600">
                    <span>Delivery / Shipping:</span>
                    <span className="text-gray-800 font-medium">
                      {invoice.summary?.shipping === 0 || !invoice.summary?.shipping
                        ? "FREE"
                        : `₹${invoice.summary.shipping}`}
                    </span>
                  </div>
                  <div className="flex justify-between text-gray-600">
                    <span>Taxes (GST):</span>
                    <span className="text-gray-800 font-medium">Included</span>
                  </div>
                  <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-teal-900 bg-teal-100/50 p-2 rounded-lg">
                    <span>{invoice.paymentStatus === 'SUCCESS' ? 'Total Amount Paid:' : (invoice.paymentMethod === 'cod' || invoice.paymentMethod === 'cash') ? 'Total Due (COD):' : 'Total Amount:'}</span>
                    <span className="text-base text-teal-800">
                      ₹
                      {(
                        invoice.summary?.totalAmount ||
                        invoice.summary?.subtotal ||
                        0
                      ).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Footer / Notes */}
              <div className="pt-4 border-t border-gray-100 text-center text-xs text-gray-400">
                <p className="font-medium text-gray-600">
                  Thank you for your purchase from {invoice.store?.name}!
                </p>
                <p className="mt-0.5">
                  {(invoice.paymentMethod === 'cod' || invoice.paymentMethod === 'cash')
                    ? "This is a verified computer-generated order bill / invoice payable on delivery."
                    : "This is a verified computer-generated invoice for your completed payment."}
                </p>
              </div>

            </div>
          )}
        </div>

        {/* Modal Bottom Controls */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-200 transition"
          >
            <Printer size={15} /> Print
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-200 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={loading || !!error}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 disabled:opacity-50 transition shadow-md shadow-teal-600/20"
            >
              <Download size={15} /> Download Official PDF Bill
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
