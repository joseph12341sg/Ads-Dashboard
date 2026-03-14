"use client";

interface KpiCardProps {
  label: string;
  value: string;
  subtitle: string;
  color?: string;
  badge?: string;
}

export default function KpiCard({
  label,
  value,
  subtitle,
  color = "#F2F4F8",
  badge,
}: KpiCardProps) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">
          {label}
        </span>
        {badge && (
          <span
            className="text-[9px] uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: "#A855F7",
              background: "rgba(168,85,247,0.1)",
            }}
          >
            {badge}
          </span>
        )}
      </div>
      <div
        className="font-montserrat font-bold text-[22px] mb-1"
        style={{ color }}
      >
        {value}
      </div>
      <span className="text-[11px] text-[#A1A8B3]">{subtitle}</span>
    </div>
  );
}
