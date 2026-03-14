import type { MetaAdsDailyInput, MetaAdsDailyRecord } from "./types";

export function calculateRowMetrics(row: MetaAdsDailyInput) {
  return {
    cplc: row.link_clicks > 0 ? row.amount_spent / row.link_clicks : null,
    cost_per_call: row.calls > 0 ? row.amount_spent / row.calls : null,
    lp_cvr: row.link_clicks > 0 ? (row.leads / row.link_clicks) * 100 : null,
  };
}

export function calculateTotals(records: MetaAdsDailyRecord[]) {
  const total_spend = records.reduce(
    (sum, r) => sum + Number(r.amount_spent),
    0
  );
  const total_clicks = records.reduce((sum, r) => sum + r.link_clicks, 0);
  const total_leads = records.reduce((sum, r) => sum + r.leads, 0);
  const total_calls = records.reduce((sum, r) => sum + r.calls, 0);
  const avg_cpl =
    records.length > 0
      ? records.reduce((sum, r) => sum + Number(r.cpl), 0) / records.length
      : null;

  return {
    total_spend,
    total_clicks,
    total_leads,
    total_calls,
    avg_cpl,
    cplc: total_clicks > 0 ? total_spend / total_clicks : null,
    cost_per_call: total_calls > 0 ? total_spend / total_calls : null,
    lp_cvr: total_clicks > 0 ? (total_leads / total_clicks) * 100 : null,
  };
}
