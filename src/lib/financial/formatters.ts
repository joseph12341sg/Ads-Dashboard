import type { ExpenseCategory, ExpenseFrequency } from "./types";

export function formatFinCurrency(value: number | null): string {
  if (value === null) return "—";
  const abs = Math.abs(value);
  const formatted = abs >= 1000
    ? "£" + abs.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
    : "£" + abs.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  return value < 0 ? `-${formatted}` : formatted;
}

export function formatFinPercentage(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1) + "%";
}

export function formatRatio(value: number | null): string {
  if (value === null) return "—";
  return value.toFixed(1) + "x";
}

export const categoryLabels: Record<ExpenseCategory, string> = {
  software: "Software",
  contractors: "Contractors",
  advertising: "Advertising",
  professional: "Professional",
  office_admin: "Office / admin",
  other: "Other",
};

export const frequencyLabels: Record<ExpenseFrequency, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  annual: "Annual",
  one_off: "One-off",
};
