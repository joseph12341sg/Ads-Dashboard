import type {
  SettingPipelineData,
  CloserPipelineData,
  RevenueData,
  SettingRates,
  CloserRates,
} from "./types";

export function calculateSettingRates(
  data: SettingPipelineData
): SettingRates {
  return {
    booking_rate:
      data.total_dials > 0
        ? (data.appointments_booked / data.total_dials) * 100
        : null,
    setting_rate:
      data.total_leads > 0
        ? (data.appointments_booked / data.total_leads) * 100
        : null,
    dq_rate:
      data.total_leads > 0
        ? (data.dq_count / data.total_leads) * 100
        : null,
  };
}

export function calculateCloserRates(
  data: CloserPipelineData,
  revenue: RevenueData
): CloserRates {
  const call_1_total = data.call_1_sat + data.call_1_no_show;
  const call_2_total = data.call_2_sat + data.call_2_no_show;

  return {
    call_1_show_rate:
      call_1_total > 0 ? (data.call_1_sat / call_1_total) * 100 : null,
    call_2_show_rate:
      call_2_total > 0 ? (data.call_2_sat / call_2_total) * 100 : null,
    call_1_close_rate:
      data.call_1_sat > 0
        ? (data.closed_won / data.call_1_sat) * 100
        : null,
    call_2_close_rate:
      data.call_2_sat > 0
        ? (data.closed_won / data.call_2_sat) * 100
        : null,
    overall_close_rate:
      data.call_2_sat > 0
        ? (data.closed_won / data.call_2_sat) * 100
        : null,
    avg_deal_size:
      revenue.won_deals_count > 0
        ? revenue.cash_collected / revenue.won_deals_count
        : null,
  };
}
