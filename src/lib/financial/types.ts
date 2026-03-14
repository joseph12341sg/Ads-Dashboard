export type ExpenseCategory = 'software' | 'contractors' | 'advertising' | 'professional' | 'office_admin' | 'other';
export type ExpenseFrequency = 'monthly' | 'quarterly' | 'annual' | 'one_off';

export interface Expense {
  id: string;
  user_id: string;
  name: string;
  category: ExpenseCategory;
  amount: number;
  frequency: ExpenseFrequency;
  start_date: string | null;
  active: boolean;
  notes: string | null;
  monthly_cost: number;
  created_at: string;
  updated_at: string;
}

export interface RevenueData {
  cash_collected: number;
  mrr: number;
  total_revenue: number;
  won_deals_count: number;
  new_clients_count: number;
  active_clients: number;
  avg_client_value: number | null;
  previous_period_revenue: number;
}

export interface ExpenseData {
  ad_spend: number;
  manual_expenses_monthly: number;
  total_expenses: number;
  line_items: Expense[];
}

export interface ProfitData {
  gross_profit: number;
  profit_margin: number | null;
  net_cash_flow: number;
  previous_period_margin: number | null;
}

export interface UnitEconomics {
  cac: number | null;
  ltv: number | null;
  ltv_cac_ratio: number | null;
  revenue_per_client: number | null;
}

export interface MonthlyTrend {
  month: string;
  revenue: number;
  expenses: number;
  profit: number;
}

export interface FinancialDashboardData {
  revenue: RevenueData;
  expenses: ExpenseData;
  profit: ProfitData;
  unit_economics: UnitEconomics;
  monthly_trend: MonthlyTrend[];
}
