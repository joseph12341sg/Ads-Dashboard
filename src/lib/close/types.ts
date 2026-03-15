export interface SettingPipelineData {
  total_dials: number;
  total_leads: number;
  total_leads_all: number;
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
  no_close: number;
  follow_up_scheduled: number;
  nurture: number;
  onboarding: number;
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

export interface SpeedToLeadData {
  speed_to_lead: {
    in_hours: {
      total: number;
      within_5_min: number;
      percentage: number | null;
      avg_response_minutes: number | null;
    };
    after_hours: {
      total: number;
    };
    avg_contact_attempts: number | null;
    total_leads: number;
    leads_contacted: number;
  };
  dials: {
    total_calls: number;
    working_days: number;
    personal_dials_per_day: number | null;
    office_dials_per_day: number | null;
    unique_leads_contacted: number;
  };
}
