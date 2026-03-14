export type ClientStatus = "active" | "paused" | "churned";
export type ValueType = "mrr" | "upfront";
export type ServiceFocus = "bookkeeping" | "full_service" | "cfo" | "other";

export interface Client {
  id: string;
  user_id: string;
  status: ClientStatus;
  value_type: ValueType;
  value_amount: number;
  start_date: string;
  renewal_date: string | null;
  business_name: string;
  phone: string | null;
  main_contact: string | null;
  business_address: string | null;
  avg_fee_per_client: number | null;
  min_annual_revenue: number | null;
  max_annual_revenue: number | null;
  ideal_customer_profile: string | null;
  main_service_focus: ServiceFocus | null;
  agreed_daily_ad_spend: number | null;
  brand_colour_primary: string | null;
  brand_colour_secondary: string | null;
  brand_font: string | null;
  logo_url: string | null;
  additional_notes: string | null;
  intake_completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface IntakeLink {
  id: string;
  user_id: string;
  client_id: string | null;
  token: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface ClientKpis {
  active_count: number;
  mrr: number;
  total_value: number;
  avg_value: number | null;
  paused_count: number;
  churned_count: number;
}
