export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "—";
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

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
