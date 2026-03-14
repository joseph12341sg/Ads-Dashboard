"use client";

interface SalesKpiCardProps {
  label: string;
  value: string;
  subtitle: string;
  color?: string;
  badge?: string;
  loading?: boolean;
}

export default function SalesKpiCard({
  label,
  value,
  subtitle,
  color = "#F2F4F8",
  badge,
  loading,
}: SalesKpiCardProps) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:border-white/10"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
        opacity: loading ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">
          {label}
        </span>
        {badge && (
          <span
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{ color: "#A855F7", background: "rgba(168,85,247,0.1)" }}
          >
            {badge}
          </span>
        )}
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-white/5 rounded animate-pulse mb-1" />
      ) : (
        <div className="font-montserrat font-bold text-[22px] mb-1" style={{ color }}>
          {value}
        </div>
      )}
      <span className="text-[11px] text-[#A1A8B3]">{subtitle}</span>
    </div>
  );
}
