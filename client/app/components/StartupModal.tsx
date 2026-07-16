"use client";

import useWakeUp from "../hooks/useWakeup";

export default function StartupModal() {
  const loading = useWakeUp();

  if (!loading) return null;

  return (
    <div className="fixed inset-0 z-[9999] bg-black/70 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-[380px] text-center">

        <div className="mx-auto mb-5 h-12 w-12 rounded-full border-4 border-gray-300 border-t-green-600 animate-spin" />

        <h2 className="text-xl font-bold">
          Preparing Remise
        </h2>

        <p className="text-gray-600 mt-3">
          Starting backend services...
        </p>

        <p className="text-sm text-gray-400 mt-2">
          This usually takes less than a minute.
        </p>

      </div>
    </div>
  );
}