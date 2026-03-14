"use client";

import FinancialKpiCard from "./FinancialKpiCard";

interface KpiItem {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  source?: "close" | "meta" | "clients" | "manual" | "auto";
  badge?: string;
}

interface FinancialKpiRowProps {
  items: KpiItem[];
  loading?: boolean;
}

export default function FinancialKpiRow({ items, loading }: FinancialKpiRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {items.map((_, i) => (
          <div
            key={i}
            className="rounded-xl p-4 animate-pulse"
            style={{ background: "#161B22" }}
          >
            <div className="h-3 w-20 bg-white/5 rounded mb-3" />
            <div className="h-7 w-24 bg-white/5 rounded mb-2" />
            <div className="h-3 w-16 bg-white/5 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((item, i) => (
        <FinancialKpiCard key={i} {...item} />
      ))}
    </div>
  );
}
