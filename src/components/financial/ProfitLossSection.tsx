"use client";

import FinancialSectionHeader from "./FinancialSectionHeader";
import FinancialKpiRow from "./FinancialKpiRow";
import RevenueExpenseChart from "./RevenueExpenseChart";
import ProfitTrendChart from "./ProfitTrendChart";
import { formatFinCurrency, formatFinPercentage } from "@/lib/financial/formatters";
import type { ProfitData, MonthlyTrend } from "@/lib/financial/types";

interface ProfitLossSectionProps {
  data: ProfitData;
  trend: MonthlyTrend[];
  loading: boolean;
}

export default function ProfitLossSection({ data, trend, loading }: ProfitLossSectionProps) {
  const marginTrend = data.profit_margin !== null && data.previous_period_margin !== null
    ? data.profit_margin - data.previous_period_margin
    : null;

  return (
    <>
      <FinancialSectionHeader title="Profit & loss" badge="Auto-calculated" />
      <FinancialKpiRow
        loading={loading}
        items={[
          {
            label: "Gross Profit",
            value: formatFinCurrency(data.gross_profit),
            subtitle: "Revenue - Expenses",
            color: data.gross_profit >= 0 ? "#4ADE80" : "#F87171",
          },
          {
            label: "Profit Margin",
            value: formatFinPercentage(data.profit_margin),
            subtitle: "Profit \u00f7 Revenue",
            color: "#4ADE80",
          },
          {
            label: "Net Cash Flow",
            value: formatFinCurrency(data.net_cash_flow),
            subtitle: "Net position",
            color: data.net_cash_flow >= 0 ? "#4ADE80" : "#F87171",
          },
          {
            label: "Margin Trend",
            value: marginTrend !== null ? `${marginTrend >= 0 ? "+" : ""}${marginTrend.toFixed(1)}pp` : "\u2014",
            subtitle: "vs previous period",
            color: marginTrend !== null && marginTrend >= 0 ? "#4ADE80" : "#F87171",
          },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <RevenueExpenseChart data={trend} />
        <ProfitTrendChart data={trend} />
      </div>
    </>
  );
}
