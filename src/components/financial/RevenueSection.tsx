"use client";

import FinancialSectionHeader from "./FinancialSectionHeader";
import FinancialKpiRow from "./FinancialKpiRow";
import { formatFinCurrency, formatFinPercentage } from "@/lib/financial/formatters";
import type { RevenueData } from "@/lib/financial/types";

interface RevenueSectionProps {
  data: RevenueData;
  loading: boolean;
}

export default function RevenueSection({ data, loading }: RevenueSectionProps) {
  const growth = data.previous_period_revenue > 0
    ? ((data.total_revenue - data.previous_period_revenue) / data.previous_period_revenue) * 100
    : null;

  return (
    <>
      <FinancialSectionHeader title="Revenue" badge="Auto from Close + Clients" />
      <FinancialKpiRow
        loading={loading}
        items={[
          {
            label: "Cash Collected",
            value: formatFinCurrency(data.cash_collected),
            subtitle: `${data.won_deals_count} deal${data.won_deals_count !== 1 ? "s" : ""} closed`,
            color: "#4ADE80",
            source: "close",
          },
          {
            label: "MRR",
            value: formatFinCurrency(data.mrr),
            subtitle: `${data.active_clients} active client${data.active_clients !== 1 ? "s" : ""}`,
            color: "#4ADE80",
            source: "clients",
          },
          {
            label: "Total Revenue",
            value: formatFinCurrency(data.total_revenue),
            subtitle: "Cash Collected + MRR",
            color: "#4ADE80",
            badge: "auto",
          },
          {
            label: "Revenue Growth",
            value: formatFinPercentage(growth),
            subtitle: "vs previous period",
            color: growth !== null && growth >= 0 ? "#4ADE80" : "#F87171",
            badge: "auto",
          },
        ]}
      />
    </>
  );
}
