"use client";

import FinancialSectionHeader from "./FinancialSectionHeader";
import FinancialKpiRow from "./FinancialKpiRow";
import ExpenseTable from "./ExpenseTable";
import { formatFinCurrency, formatFinPercentage } from "@/lib/financial/formatters";
import type { ExpenseData, Expense, RevenueData } from "@/lib/financial/types";

interface ExpenseSectionProps {
  data: ExpenseData;
  revenue: RevenueData;
  loading: boolean;
  onAddExpense: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
}

export default function ExpenseSection({
  data,
  revenue,
  loading,
  onAddExpense,
  onEditExpense,
  onDeleteExpense,
}: ExpenseSectionProps) {
  const expenseRatio = revenue.total_revenue > 0
    ? (data.total_expenses / revenue.total_revenue) * 100
    : null;

  return (
    <>
      <FinancialSectionHeader title="Expenses" badge="Auto ad spend + manual" />
      <FinancialKpiRow
        loading={loading}
        items={[
          {
            label: "Ad Spend",
            value: formatFinCurrency(data.ad_spend),
            subtitle: "Meta Ads total",
            color: "#F87171",
            source: "meta",
          },
          {
            label: "Other Expenses",
            value: formatFinCurrency(data.manual_expenses_monthly),
            subtitle: "Monthly from manual entries",
            color: "#F87171",
            source: "manual",
          },
          {
            label: "Total Expenses",
            value: formatFinCurrency(data.total_expenses),
            subtitle: "Ad Spend + Other Expenses",
            color: "#F87171",
            badge: "auto",
          },
          {
            label: "Expense Ratio",
            value: formatFinPercentage(expenseRatio),
            subtitle: "Expenses \u00f7 Revenue",
            color: "#FBBF24",
            badge: "auto",
          },
        ]}
      />
      <ExpenseTable
        lineItems={data.line_items}
        adSpend={data.ad_spend}
        loading={loading}
        onAdd={onAddExpense}
        onEdit={onEditExpense}
        onDelete={onDeleteExpense}
      />
    </>
  );
}
