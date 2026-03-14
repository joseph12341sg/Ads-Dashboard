"use client";

interface KpiItem {
  label: string;
  value: string;
  color?: string;
  subtitle: string;
}

interface ClientKpiRowProps {
  items: KpiItem[];
  loading?: boolean;
}

export default function ClientKpiRow({ items, loading }: ClientKpiRowProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
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
        <div
          key={i}
          className="rounded-xl p-4 transition-all duration-200 hover:border-white/10"
          style={{
            background: "#161B22",
            border: "1px solid rgba(91,124,153,0.08)",
          }}
        >
          <span className="text-[10px] uppercase tracking-wider text-[#A1A8B3] block mb-2">
            {item.label}
          </span>
          <div
            className="font-montserrat font-bold text-[22px] mb-1"
            style={{ color: item.color || "#F2F4F8" }}
          >
            {item.value}
          </div>
          <span className="text-[11px] text-[#A1A8B3]">{item.subtitle}</span>
        </div>
      ))}
    </div>
  );
}
