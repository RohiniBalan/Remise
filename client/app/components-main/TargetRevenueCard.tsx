"use client";
import { Target, TrendingUp, PartyPopper, Settings as SettingsIcon } from "lucide-react";
import Link from "next/link";

export default function TargetRevenueCard({
  targetRevenue,
  achievedRevenue,
  periodLabel = "This Month",
  onGoToSettings,
}: {
  targetRevenue: number;
  achievedRevenue: number;
  periodLabel?: string;
  onGoToSettings?: () => void;
}) {
  // No target set yet — prompt instead of a misleading 0% bar
  if (!targetRevenue || targetRevenue <= 0) {
    return (
      <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-[#DFF1F1] flex items-center justify-center text-teal-600 shrink-0">
          <Target size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 text-sm">No revenue target set</p>
          <p className="text-xs text-gray-500 mt-0.5">
            Set a monthly target in Settings to track your progress here.
          </p>
        </div>
        {onGoToSettings && (
          <button
            onClick={onGoToSettings}
            className="flex items-center gap-1.5 text-xs font-semibold bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl transition shrink-0"
          >
            <SettingsIcon size={13} /> Set Target
          </button>
        )}
      </div>
    );
  }

  const percent = Math.min(100, (achievedRevenue / targetRevenue) * 100);
  const remaining = Math.max(0, targetRevenue - achievedRevenue);
  const achieved = achievedRevenue >= targetRevenue;

  return (
    <div className="bg-white rounded-2xl border border-[#BBD5DA] p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-[#DFF1F1] flex items-center justify-center text-teal-600">
            <Target size={17} />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">Revenue Target</h3>
            <p className="text-xs text-gray-400">{periodLabel}</p>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
            achieved
              ? "bg-green-50 text-green-700 border-green-200"
              : "bg-amber-50 text-amber-700 border-amber-200"
          }`}
        >
          {percent.toFixed(0)}%
        </span>
      </div>

      <div className="flex items-baseline gap-2 mb-2">
        <span className="text-2xl font-bold text-teal-700">
          ₹{achievedRevenue.toLocaleString("en-IN")}
        </span>
        <span className="text-sm text-gray-400">
          of ₹{targetRevenue.toLocaleString("en-IN")}
        </span>
      </div>

      <div className="w-full h-2.5 rounded-full bg-[#F5F5F5] overflow-hidden mb-3">
        <div
          className={`h-full rounded-full transition-all ${
            achieved ? "bg-green-500" : "bg-teal-600"
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {achieved ? (
        <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-xl px-3 py-2">
          <PartyPopper size={14} className="text-green-600 shrink-0" />
          <p className="text-xs font-semibold text-green-700">
            Target achieved! You're ₹
            {(achievedRevenue - targetRevenue).toLocaleString("en-IN")} over goal.
          </p>
        </div>
      ) : (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
          <TrendingUp size={14} className="text-amber-600 shrink-0" />
          <p className="text-xs font-semibold text-amber-700">
            ₹{remaining.toLocaleString("en-IN")} more needed to hit your target.
          </p>
        </div>
      )}
    </div>
  );
}