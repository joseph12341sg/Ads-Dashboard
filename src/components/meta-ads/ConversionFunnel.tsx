"use client";

import { formatNumber, formatPercentage } from "@/lib/meta-ads/formatters";

interface ConversionFunnelProps {
  clicks: number;
  leads: number;
  calls: number;
}

export default function ConversionFunnel({
  clicks,
  leads,
  calls,
}: ConversionFunnelProps) {
  const clickToLead = clicks > 0 ? (leads / clicks) * 100 : null;
  const leadToCall = leads > 0 ? (calls / leads) * 100 : null;

  const maxVal = Math.max(clicks, leads, calls, 1);

  const stages = [
    { label: "Clicks", value: clicks, color: "#60A5FA", width: (clicks / maxVal) * 100 },
    { label: "Leads", value: leads, color: "#A855F7", width: (leads / maxVal) * 100 },
    { label: "Calls", value: calls, color: "#4ADE80", width: (calls / maxVal) * 100 },
  ];

  const conversions = [
    { rate: clickToLead, label: "Click → Lead" },
    { rate: leadToCall, label: "Lead → Call" },
  ];

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-5">
        Conversion Funnel
      </h3>

      <div className="space-y-4">
        {stages.map((stage, i) => (
          <div key={stage.label}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs text-[#A1A8B3]">{stage.label}</span>
              <span
                className="font-montserrat font-bold text-sm"
                style={{ color: stage.color }}
              >
                {formatNumber(stage.value)}
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.max(stage.width, 2)}%`,
                  background: stage.color,
                }}
              />
            </div>
            {i < conversions.length && (
              <div className="flex justify-center my-2">
                <span className="text-[10px] text-[#A1A8B3] px-2 py-0.5 rounded-full bg-white/[0.03]">
                  {conversions[i].label}: {formatPercentage(conversions[i].rate)}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
