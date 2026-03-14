"use client";

import { Pencil, Trash2, Cloud } from "lucide-react";
import type { MetaAdsDailyRecord } from "@/lib/meta-ads/types";
import { calculateRowMetrics } from "@/lib/meta-ads/calculations";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
  formatDate,
} from "@/lib/meta-ads/formatters";

interface DailyLogTableProps {
  records: MetaAdsDailyRecord[];
  onEdit: (record: MetaAdsDailyRecord) => void;
  onDelete: (record: MetaAdsDailyRecord) => void;
  loading?: boolean;
}

export default function DailyLogTable({
  records,
  onEdit,
  onDelete,
  loading,
}: DailyLogTableProps) {
  if (loading) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
          Daily Log
        </h3>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 bg-white/[0.03] rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
        Daily Log
      </h3>

      {records.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-sm text-[#A1A8B3]">
            No entries yet — sync from Meta or add your first daily metrics
            above
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto -mx-5 px-5">
          <table className="w-full text-sm min-w-[800px]">
            <thead>
              <tr className="text-[10px] uppercase tracking-wider text-[#A1A8B3] border-b border-white/5">
                <th className="text-left py-2 pr-3 font-normal">Date</th>
                <th className="text-right py-2 px-3 font-normal">Spend</th>
                <th className="text-right py-2 px-3 font-normal">Clicks</th>
                <th className="text-right py-2 px-3 font-normal">Leads</th>
                <th className="text-right py-2 px-3 font-normal">Calls</th>
                <th className="text-right py-2 px-3 font-normal">CPL</th>
                <th className="text-right py-2 px-3 font-normal text-[#A855F7]">
                  CPLC
                </th>
                <th className="text-right py-2 px-3 font-normal text-[#A855F7]">
                  Cost/Call
                </th>
                <th className="text-right py-2 px-3 font-normal text-[#A855F7]">
                  LP CVR
                </th>
                <th className="text-right py-2 pl-3 font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {records.map((record) => {
                const metrics = calculateRowMetrics(record);
                return (
                  <tr
                    key={record.id}
                    className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="py-2.5 pr-3 text-[#F2F4F8]">
                      <div className="flex items-center gap-1.5">
                        {formatDate(record.date)}
                        {record.synced_from_meta && (
                          <Cloud className="w-3 h-3 text-[#A855F7]/40" />
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F2F4F8]">
                      {formatCurrency(Number(record.amount_spent))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F2F4F8]">
                      {formatNumber(record.link_clicks)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F2F4F8]">
                      {formatNumber(record.leads)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F2F4F8]">
                      {formatNumber(record.calls)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#F2F4F8]">
                      {formatCurrency(Number(record.cpl))}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#A855F7]">
                      {formatCurrency(metrics.cplc)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#A855F7]">
                      {formatCurrency(metrics.cost_per_call)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-[#A855F7]">
                      {formatPercentage(metrics.lp_cvr)}
                    </td>
                    <td className="py-2.5 pl-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => onEdit(record)}
                          className="p-1.5 rounded-md text-[#A1A8B3] hover:text-[#F2F4F8] hover:bg-white/[0.05] transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDelete(record)}
                          className="p-1.5 rounded-md text-[#A1A8B3] hover:text-[#F87171] hover:bg-white/[0.05] transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
