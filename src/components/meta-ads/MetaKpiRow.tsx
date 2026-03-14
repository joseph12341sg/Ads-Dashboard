"use client";

import KpiCard from "./KpiCard";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/meta-ads/formatters";

interface MetaKpiRowProps {
  totals: {
    total_spend: number;
    total_clicks: number;
    total_leads: number;
    total_calls: number;
    avg_cpl: number | null;
    cplc: number | null;
    cost_per_call: number | null;
    lp_cvr: number | null;
  };
  loading?: boolean;
}

export default function MetaKpiRow({ totals, loading }: MetaKpiRowProps) {
  if (loading) {
    return (
      <div className="space-y-4">
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
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Row 1 — Input Totals */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Total Spend"
          value={formatCurrency(totals.total_spend)}
          subtitle="30 day total"
        />
        <KpiCard
          label="Total Clicks"
          value={formatNumber(totals.total_clicks)}
          subtitle="30 day total"
        />
        <KpiCard
          label="Total Leads"
          value={formatNumber(totals.total_leads)}
          subtitle="30 day total"
        />
        <KpiCard
          label="Total Calls"
          value={formatNumber(totals.total_calls)}
          subtitle="30 day total"
        />
      </div>

      {/* Row 2 — Auto-Calculated */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard
          label="Avg CPL"
          value={formatCurrency(totals.avg_cpl)}
          subtitle="Avg of CPL entries"
          color="#A855F7"
          badge="auto"
        />
        <KpiCard
          label="CPLC"
          value={formatCurrency(totals.cplc)}
          subtitle="Spend ÷ Clicks"
          color="#A855F7"
          badge="auto"
        />
        <KpiCard
          label="Cost Per Call"
          value={formatCurrency(totals.cost_per_call)}
          subtitle="Spend ÷ Calls"
          color="#A855F7"
          badge="auto"
        />
        <KpiCard
          label="LP CVR"
          value={formatPercentage(totals.lp_cvr)}
          subtitle="Leads ÷ Clicks × 100"
          color="#A855F7"
          badge="auto"
        />
      </div>
    </div>
  );
}
