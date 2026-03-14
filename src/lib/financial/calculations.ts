import type { ExpenseFrequency, RevenueData, ExpenseData, ProfitData, UnitEconomics } from "./types";

export function calculateMonthlyCost(amount: number, frequency: ExpenseFrequency): number {
  switch (frequency) {
    case 'monthly': return amount;
    case 'quarterly': return amount / 3;
    case 'annual': return amount / 12;
    case 'one_off': return amount;
  }
}

export function calculateProfit(revenue: RevenueData, expenses: ExpenseData): ProfitData {
  const gross_profit = revenue.total_revenue - expenses.total_expenses;
  const profit_margin = revenue.total_revenue > 0
    ? (gross_profit / revenue.total_revenue) * 100 : null;

  const prev_profit = revenue.previous_period_revenue > 0
    ? revenue.previous_period_revenue - expenses.total_expenses : null;
  const previous_period_margin = prev_profit !== null && revenue.previous_period_revenue > 0
    ? (prev_profit / revenue.previous_period_revenue) * 100 : null;

  return {
    gross_profit,
    profit_margin,
    net_cash_flow: gross_profit,
    previous_period_margin,
  };
}

export function calculateUnitEconomics(
  ad_spend: number,
  new_clients: number,
  avg_client_value: number | null,
  total_revenue: number,
  active_clients: number
): UnitEconomics {
  const cac = new_clients > 0 ? ad_spend / new_clients : null;
  const ltv = avg_client_value;
  const ltv_cac_ratio = cac && ltv ? ltv / cac : null;
  const revenue_per_client = active_clients > 0
    ? total_revenue / active_clients : null;

  return { cac, ltv, ltv_cac_ratio, revenue_per_client };
}
