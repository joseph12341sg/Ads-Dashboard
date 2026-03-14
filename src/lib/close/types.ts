export interface SettingPipelineData {
  total_dials: number;
  total_leads: number;
  appointments_booked: number;
  dq_count: number;
  funnel: {
    new_lead: number;
    in_follow_up: number;
    engaged: number;
    follow_up_needed: number;
    dq_not_interested: number;
  };
}

export interface CloserPipelineData {
  call_1_scheduled: number;
  call_1_sat: number;
  call_1_no_show: number;
  call_2_scheduled: number;
  call_2_sat: number;
  call_2_no_show: number;
  closed_won: number;
  closed_lost: number;
  follow_up_scheduled: number;
  nurture: number;
}

export interface RevenueData {
  cash_collected: number;
  pipeline_value: number;
  won_deals_count: number;
}

export interface RecentDeal {
  lead_name: string;
  value: number;
  status_label: string;
  status_type: "active" | "won" | "lost";
  date_won?: string;
}

export interface SettingRates {
  booking_rate: number | null;
  setting_rate: number | null;
  dq_rate: number | null;
}

export interface CloserRates {
  call_1_show_rate: number | null;
  call_2_show_rate: number | null;
  call_1_close_rate: number | null;
  call_2_close_rate: number | null;
  overall_close_rate: number | null;
  avg_deal_size: number | null;
}

export interface SalesDashboardData {
  setting: SettingPipelineData;
  closer: CloserPipelineData;
  revenue: RevenueData;
  recent_deals: RecentDeal[];
}
