"use client";

import { Plus, Pencil, Trash2 } from "lucide-react";
import { categoryLabels, frequencyLabels, formatFinCurrency } from "@/lib/financial/formatters";
import type { Expense, ExpenseCategory, ExpenseFrequency } from "@/lib/financial/types";

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  software: "#60A5FA",
  contractors: "#A855F7",
  advertising: "#FBBF24",
  professional: "#4ADE80",
  office_admin: "#5B7C99",
  other: "#A1A8B3",
};

interface ExpenseTableProps {
  lineItems: Expense[];
  adSpend: number;
  loading: boolean;
  onAdd: () => void;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
}

export default function ExpenseTable({ lineItems, adSpend, loading, onAdd, onEdit, onDelete }: ExpenseTableProps) {
  const totalMonthlyCost = adSpend + lineItems.reduce((s, e) => s + e.monthly_cost, 0);

  if (loading) {
    return (
      <div
        className="rounded-xl p-5 animate-pulse"
        style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.08)" }}
      >
        <div className="h-5 w-40 bg-white/5 rounded mb-4" />
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-10 bg-white/5 rounded" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.08)" }}
    >
      <div className="flex items-center justify-between px-5 py-4">
        <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8]">Expense line items</h3>
        <button
          onClick={onAdd}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-[#F2F4F8] transition-colors hover:opacity-90"
          style={{ background: "#5B7C99" }}
        >
          <Plus className="w-3.5 h-3.5" />
          Add expense
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-t border-white/5 text-[10px] uppercase tracking-wider text-[#A1A8B3]">
              <th className="text-left px-5 py-2.5 font-normal">Item</th>
              <th className="text-left px-3 py-2.5 font-normal">Category</th>
              <th className="text-right px-3 py-2.5 font-normal">Amount</th>
              <th className="text-left px-3 py-2.5 font-normal">Frequency</th>
              <th className="text-right px-3 py-2.5 font-normal">Monthly Cost</th>
              <th className="text-right px-5 py-2.5 font-normal">Actions</th>
            </tr>
          </thead>
          <tbody>
            {/* Auto Meta Ad Spend row */}
            <tr className="border-t border-white/5" style={{ borderLeft: "3px solid #A855F7" }}>
              <td className="px-5 py-3 text-[#F2F4F8]">Meta Ad Spend</td>
              <td className="px-3 py-3">
                <CategoryPill category="advertising" />
              </td>
              <td className="px-3 py-3 text-right text-[#F2F4F8]">{formatFinCurrency(adSpend)}</td>
              <td className="px-3 py-3 text-[#A1A8B3]">Monthly</td>
              <td className="px-3 py-3 text-right text-[#F2F4F8]">{formatFinCurrency(adSpend)}</td>
              <td className="px-5 py-3 text-right">
                <span className="text-[10px] text-[#A855F7]">Auto from Meta</span>
              </td>
            </tr>

            {/* Manual expense rows */}
            {lineItems.map((item) => (
              <tr key={item.id} className="border-t border-white/5">
                <td className="px-5 py-3 text-[#F2F4F8]">{item.name}</td>
                <td className="px-3 py-3">
                  <CategoryPill category={item.category} />
                </td>
                <td className="px-3 py-3 text-right text-[#F2F4F8]">{formatFinCurrency(item.amount)}</td>
                <td className="px-3 py-3 text-[#A1A8B3]">{frequencyLabels[item.frequency as ExpenseFrequency]}</td>
                <td className="px-3 py-3 text-right text-[#F2F4F8]">{formatFinCurrency(item.monthly_cost)}</td>
                <td className="px-5 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => onEdit(item)}
                      className="p-1 text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(item.id)}
                      className="p-1 text-[#A1A8B3] hover:text-[#F87171] transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {/* Total row */}
            <tr className="border-t border-white/10">
              <td className="px-5 py-3 font-montserrat font-bold text-[#F2F4F8]" colSpan={4}>
                Total
              </td>
              <td className="px-3 py-3 text-right font-montserrat font-bold text-[#F2F4F8]">
                {formatFinCurrency(totalMonthlyCost)}
              </td>
              <td />
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function CategoryPill({ category }: { category: ExpenseCategory }) {
  return (
    <span
      className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
      style={{
        color: CATEGORY_COLORS[category],
        background: `${CATEGORY_COLORS[category]}15`,
      }}
    >
      {categoryLabels[category]}
    </span>
  );
}
