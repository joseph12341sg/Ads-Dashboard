"use client";

import { formatNumber } from "@/lib/close/formatters";

interface FunnelStage {
  label: string;
  value: number;
  color: string;
}

interface PipelineFunnelProps {
  title: string;
  subtitle?: string;
  stages: FunnelStage[];
}

export default function PipelineFunnel({ title, subtitle, stages }: PipelineFunnelProps) {
  const maxVal = Math.max(...stages.map((s) => s.value), 1);

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <div className="mb-4">
        <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8]">
          {title}
        </h3>
        {subtitle && (
          <p className="text-[11px] text-[#A1A8B3] mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="space-y-3">
        {stages.map((stage) => (
          <div key={stage.label} className="flex items-center gap-3">
            <span className="text-xs text-[#A1A8B3] w-[180px] shrink-0 truncate">
              {stage.label}
            </span>
            <div className="flex-1 h-6 rounded-md bg-white/[0.03] overflow-hidden">
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{
                  width: `${Math.max((stage.value / maxVal) * 100, 2)}%`,
                  background: stage.color,
                  opacity: 0.8,
                }}
              />
            </div>
            <span
              className="text-xs font-montserrat font-bold w-10 text-right shrink-0"
              style={{ color: stage.color }}
            >
              {formatNumber(stage.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
