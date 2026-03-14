export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
  if (Number.isInteger(value)) {
    return "£" + value.toLocaleString("en-GB");
  }
  return (
    "£" +
    value.toLocaleString("en-GB", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  );
}

export function formatNumber(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toLocaleString("en-GB");
}

export function formatPercentage(value: number | null): string {
  if (value === null || value === undefined) return "—";
  return value.toFixed(1) + "%";
}
