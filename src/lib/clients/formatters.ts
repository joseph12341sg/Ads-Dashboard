export function formatClientCurrency(value: number | null): string {
  if (value === null || value === undefined) return "--";
  return (
    "\u00a3" +
    Math.round(value).toLocaleString("en-GB")
  );
}

export function formatClientDate(dateStr: string | null): string {
  if (!dateStr) return "--";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const AVATAR_COLOURS = ["#60A5FA", "#4ADE80", "#A855F7", "#FBBF24", "#FB7185"];

export function getAvatarColour(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLOURS[Math.abs(hash) % AVATAR_COLOURS.length];
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function formatServiceFocus(value: string | null): string {
  if (!value) return "--";
  const map: Record<string, string> = {
    bookkeeping: "Bookkeeping",
    full_service: "Full Service",
    cfo: "CFO",
    other: "Other",
  };
  return map[value] || value;
}
