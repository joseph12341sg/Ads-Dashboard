"use client";

import type { RecentDeal } from "@/lib/close/types";
import { formatCurrency } from "@/lib/close/formatters";

interface RecentDealsTableProps {
  deals: RecentDeal[];
  loading?: boolean;
}

function StatusPill({ label, type }: { label: string; type: string }) {
  let bg = "rgba(96,165,250,0.12)";
  let color = "#60A5FA";

  if (type === "won") {
    bg = "rgba(74,222,128,0.12)";
    color = "#4ADE80";
  } else if (type === "lost") {
    bg = "rgba(248,113,113,0.12)";
    color = "#F87171";
  }

  return (
    <span
      className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium"
      style={{ background: bg, color }}
    >
      {label}
    </span>
  );
}

export default function RecentDealsTable({ deals, loading }: RecentDealsTableProps) {
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
          Recent deals
        </h3>
        <p className="text-[11px] text-[#A1A8B3] mt-0.5">Last 10</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-8 bg-white/[0.03] rounded animate-pulse" />
          ))}
        </div>
      ) : deals.length === 0 ? (
        <p className="text-sm text-[#A1A8B3] py-8 text-center">No deals found</p>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[400px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#A1A8B3] border-b border-white/5">
                <th className="text-left py-2 pr-3 font-normal">Lead</th>
                <th className="text-right py-2 px-3 font-normal">Value</th>
                <th className="text-right py-2 pl-3 font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {deals.map((deal, i) => (
                <tr
                  key={i}
                  className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                >
                  <td className="py-2.5 pr-3 text-[#F2F4F8] truncate max-w-[200px]">
                    {deal.lead_name}
                  </td>
                  <td className="py-2.5 px-3 text-right text-[#F2F4F8]">
                    {formatCurrency(deal.value)}
                  </td>
                  <td className="py-2.5 pl-3 text-right">
                    <StatusPill label={deal.status_label} type={deal.status_type} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
