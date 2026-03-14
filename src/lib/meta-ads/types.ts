export interface MetaAdsDailyInput {
  date: string;
  amount_spent: number;
  link_clicks: number;
  leads: number;
  calls: number;
  cpl: number;
  synced_from_meta?: boolean;
}

export interface MetaAdsDailyRecord extends MetaAdsDailyInput {
  id: string;
  user_id: string;
  synced_from_meta: boolean;
  created_at: string;
  updated_at: string;
}

export interface MetaSyncResponse {
  success: boolean;
  data?: {
    amount_spent: number;
    link_clicks: number;
    leads: number;
    cpl: number;
  };
  error?: string;
}

export interface TokenStatus {
  valid: boolean;
  expires_at: string | null;
  days_remaining: number | null;
}
