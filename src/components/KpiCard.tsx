"use client";

import Sparkline from "./Sparkline";

interface KpiCardProps {
  label: string;
  value: string;
  trend: string;
  direction: "up" | "down" | "neutral";
  color: string;
  sparklinePath: string;
  placeholder?: boolean;
}

export default function KpiCard({
  label,
  value,
  trend,
  direction,
  color,
  sparklinePath,
  placeholder,
}: KpiCardProps) {
  const trendColor =
    direction === "up"
      ? "text-kpi-green"
      : direction === "down"
      ? "text-kpi-red"
      : "text-brand-muted";

  const arrow = direction === "up" ? "↑" : direction === "down" ? "↓" : "";

  return (
    <div
      className={`
        relative flex flex-col gap-2 p-4 rounded-xl bg-brand-card
        border transition-all duration-200
        ${
          placeholder
            ? "border-dashed border-brand-accent/30 opacity-50"
            : "border-white/5 hover:border-white/10"
        }
      `}
    >
      <span className="text-[10px] uppercase tracking-widest text-brand-muted font-opensans">
        {label}
      </span>

      <div className="flex items-end justify-between gap-2">
        <span className="text-2xl font-montserrat font-bold text-brand-headline">
          {value}
        </span>
        <Sparkline path={sparklinePath} color={color} />
      </div>

      <span className={`text-xs font-opensans ${trendColor}`}>
        {trend} {arrow}
      </span>
    </div>
  );
}
