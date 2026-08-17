// /components-seller/dashboard/FormComponents.tsx
import React from "react";

export function Input({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400 disabled:opacity-50"
      />
    </div>
  );
}

export function TextArea({
  label,
  ...props
}: { label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <textarea
        {...props}
        className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition placeholder-gray-400 resize-none"
      />
    </div>
  );
}

export function Select({
  label,
  children,
  ...props
}: {
  label: string;
  children: React.ReactNode;
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        {label}
      </label>
      <select
        {...props}
        className="w-full bg-white border border-[#BBD5DA] rounded-xl px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-teal-400 transition cursor-pointer"
      >
        {children}
      </select>
    </div>
  );
}