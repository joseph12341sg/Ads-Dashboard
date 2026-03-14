"use client";

import SourceDot from "./SourceDot";

interface FinancialKpiCardProps {
  label: string;
  value: string;
  subtitle?: string;
  color?: string;
  source?: "close" | "meta" | "clients" | "manual" | "auto";
  badge?: string;
}

export default function FinancialKpiCard({ label, value, subtitle, color = "#F2F4F8", source, badge }: FinancialKpiCardProps) {
  return (
    <div
      className="rounded-xl p-4 flex flex-col gap-1.5"
      style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.08)" }}
    >
      <div className="flex items-center gap-1.5">
        {source && <SourceDot source={source} />}
        <span className="text-[10px] uppercase tracking-widest text-[#A1A8B3] font-opensans">
          {label}
        </span>
        {badge && (
          <span
            className="ml-auto text-[9px] px-1.5 py-0.5 rounded-full text-[#A1A8B3]"
            style={{ background: "rgba(91,124,153,0.1)" }}
          >
            {badge}
          </span>
        )}
      </div>
      <span className="text-2xl font-montserrat font-bold" style={{ color }}>
        {value}
      </span>
      {subtitle && (
        <span className="text-[11px] text-[#A1A8B3] font-opensans">{subtitle}</span>
      )}
    </div>
  );
}
