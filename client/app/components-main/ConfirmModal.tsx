"use client";

import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Delete",
  cancelText = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white shadow-xl">

        <div className="p-6">

          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <AlertTriangle className="h-7 w-7 text-red-600" />
          </div>

          <h2 className="text-center text-xl font-bold">
            {title}
          </h2>

          <p className="mt-3 text-center text-sm text-gray-600">
            {message}
          </p>

          <div className="mt-6 flex justify-end gap-3">

            <button
              onClick={onCancel}
              disabled={loading}
              className="rounded-xl border border-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-100"
            >
              {cancelText}
            </button>

            <button
              onClick={onConfirm}
              disabled={loading}
              className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? "Please wait..." : confirmText}
            </button>

          </div>

        </div>

      </div>
    </div>
  );
}