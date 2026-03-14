"use client";

import SalesKpiCard from "./SalesKpiCard";

interface KpiItem {
  label: string;
  value: string;
  subtitle: string;
  color?: string;
  badge?: string;
}

interface SalesKpiRowProps {
  items: KpiItem[];
  columns?: number;
  loading?: boolean;
}

export default function SalesKpiRow({ items, columns = 6, loading }: SalesKpiRowProps) {
  const gridClass =
    columns === 6
      ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3"
      : "grid grid-cols-2 lg:grid-cols-4 gap-3";

  if (loading) {
    return (
      <div className={gridClass}>
        {[...Array(items.length)].map((_, i) => (
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
    <div className={gridClass}>
      {items.map((item, i) => (
        <SalesKpiCard key={i} {...item} loading={loading} />
      ))}
    </div>
  );
}
