"use client";

import FinancialSectionHeader from "./FinancialSectionHeader";
import FinancialKpiRow from "./FinancialKpiRow";
import { formatFinCurrency, formatRatio } from "@/lib/financial/formatters";
import type { UnitEconomics } from "@/lib/financial/types";

interface UnitEconomicsSectionProps {
  data: UnitEconomics;
  loading: boolean;
}

export default function UnitEconomicsSection({ data, loading }: UnitEconomicsSectionProps) {
  let ltvCacColor = "#4ADE80";
  if (data.ltv_cac_ratio !== null) {
    if (data.ltv_cac_ratio < 1) ltvCacColor = "#F87171";
    else if (data.ltv_cac_ratio < 3) ltvCacColor = "#FBBF24";
  }

  return (
    <>
      <FinancialSectionHeader title="Unit economics" badge="Auto-calculated" />
      <FinancialKpiRow
        loading={loading}
        items={[
          {
            label: "CAC",
            value: formatFinCurrency(data.cac),
            subtitle: "Ad Spend \u00f7 New Clients",
            color: "#FBBF24",
          },
          {
            label: "LTV",
            value: formatFinCurrency(data.ltv),
            subtitle: "Avg Client Value",
            color: "#4ADE80",
            source: "clients",
          },
          {
            label: "LTV : CAC Ratio",
            value: formatRatio(data.ltv_cac_ratio),
            subtitle: "LTV \u00f7 CAC",
            color: ltvCacColor,
          },
          {
            label: "Revenue Per Client",
            value: formatFinCurrency(data.revenue_per_client),
            subtitle: "Revenue \u00f7 Active Clients",
            color: "#A855F7",
          },
        ]}
      />
    </>
  );
}
