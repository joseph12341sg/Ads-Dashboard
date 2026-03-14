import type { Client, ClientKpis } from "./types";

export function calculateClientKpis(clients: Client[]): ClientKpis {
  const active = clients.filter((c) => c.status === "active");
  const paused = clients.filter((c) => c.status === "paused");
  const churned = clients.filter((c) => c.status === "churned");

  const mrr = active
    .filter((c) => c.value_type === "mrr")
    .reduce((sum, c) => sum + Number(c.value_amount), 0);

  const total_value = active.reduce((sum, c) => {
    if (c.value_type === "mrr") return sum + Number(c.value_amount) * 12;
    return sum + Number(c.value_amount);
  }, 0);

  return {
    active_count: active.length,
    mrr,
    total_value,
    avg_value: active.length > 0 ? total_value / active.length : null,
    paused_count: paused.length,
    churned_count: churned.length,
  };
}

export function getClientsRenewingSoon(
  clients: Client[],
  days: number = 7
): Client[] {
  const now = new Date();
  const threshold = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  return clients.filter(
    (c) =>
      c.status === "active" &&
      c.renewal_date &&
      new Date(c.renewal_date) <= threshold &&
      new Date(c.renewal_date) >= now
  );
}
