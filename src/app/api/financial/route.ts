import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/* ── Supabase service client ── */
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

/* ── Close CRM helpers ── */
function getCloseHeaders() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return null;
  return {
    Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };
}

function containsMatch(actual: string | undefined | null, substring: string): boolean {
  if (!actual) return false;
  return actual.trim().toLowerCase().includes(substring.trim().toLowerCase());
}

function labelMatch(actual: string | undefined | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

async function fetchAllPages(baseUrl: string, headers: Record<string, string>) {
  const results: Record<string, unknown>[] = [];
  let skip = 0;
  let hasMore = true;
  while (hasMore) {
    const sep = baseUrl.includes("?") ? "&" : "?";
    const res = await fetch(`${baseUrl}${sep}_limit=100&_skip=${skip}`, { headers });
    const json = await res.json();
    if (json.data) results.push(...json.data);
    hasMore = json.has_more === true;
    skip += 100;
  }
  return results;
}

/* ── Pipeline config (cached in-memory) ── */
interface PipelineConfig {
  sales_status_map: Record<string, string>;
  closed_status_id: string;
  onboarding_status_id: string;
}

let cachedConfig: PipelineConfig | null = null;

async function getPipelineConfig(headers: Record<string, string>): Promise<PipelineConfig> {
  if (cachedConfig) return cachedConfig;

  const res = await fetch("https://api.close.com/api/v1/pipeline/", { headers });
  const data = await res.json();

  const salesStatusMap: Record<string, string> = {};
  let closedStatusId = "";
  let onboardingStatusId = "";

  if (data.data && Array.isArray(data.data)) {
    for (const pipeline of data.data) {
      if (containsMatch(pipeline.name, "Sales Pipeline") || containsMatch(pipeline.name, "02 |")) {
        if (pipeline.statuses && Array.isArray(pipeline.statuses)) {
          for (const s of pipeline.statuses) {
            salesStatusMap[s.id as string] = s.label as string;
            if (labelMatch(s.label, "Closed")) closedStatusId = s.id;
            if (labelMatch(s.label, "Onboarding Call Scheduled")) onboardingStatusId = s.id;
          }
        }
      }
    }
  }

  cachedConfig = { sales_status_map: salesStatusMap, closed_status_id: closedStatusId, onboarding_status_id: onboardingStatusId };
  return cachedConfig;
}

/* ── Get won opps from Close for a date range ── */
async function getWonOpps(headers: Record<string, string>, config: PipelineConfig, start?: string, end?: string) {
  const wonOpps: Record<string, unknown>[] = [];
  const seenIds = new Set<string>();

  for (const statusId of [config.closed_status_id, config.onboarding_status_id]) {
    if (!statusId) continue;
    const opps = await fetchAllPages(
      `https://api.close.com/api/v1/opportunity/?status_id=${statusId}&_fields=id,value,date_won,date_created`,
      headers
    );
    for (const opp of opps) {
      const id = opp.id as string;
      if (seenIds.has(id)) continue;
      seenIds.add(id);

      // Filter by date range if provided
      if (start && end) {
        const dateWon = (opp.date_won as string) || (opp.date_created as string) || "";
        const d = dateWon.split("T")[0];
        if (d < start || d > end) continue;
      }
      wonOpps.push(opp);
    }
  }

  return wonOpps;
}

/* ── Monthly short name ── */
function monthLabel(date: Date): string {
  return date.toLocaleString("en-GB", { month: "short" });
}

export async function GET(request: NextRequest) {
  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");

  const supabase = getSupabase();
  const closeHeaders = getCloseHeaders();

  // ═══════════════════════════════════════
  // 1. REVENUE FROM CLOSE (Cash Collected)
  // ═══════════════════════════════════════
  let cash_collected = 0;
  let won_deals_count = 0;
  let new_clients_count = 0;
  let previous_period_revenue = 0;

  if (closeHeaders) {
    try {
      const config = await getPipelineConfig(closeHeaders);

      // Current period won opps
      const wonOpps = await getWonOpps(closeHeaders, config, start || undefined, end || undefined);
      for (const opp of wonOpps) {
        cash_collected += ((opp.value as number) ?? 0);
      }
      cash_collected = Math.round(cash_collected / 100);
      won_deals_count = wonOpps.length;
      new_clients_count = wonOpps.length;

      // Previous period for growth calculation
      if (start && end) {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffMs = endDate.getTime() - startDate.getTime();
        const prevEnd = new Date(startDate.getTime() - 1);
        const prevStart = new Date(prevEnd.getTime() - diffMs);
        const prevStartStr = prevStart.toISOString().split("T")[0];
        const prevEndStr = prevEnd.toISOString().split("T")[0];

        const prevWonOpps = await getWonOpps(closeHeaders, config, prevStartStr, prevEndStr);
        for (const opp of prevWonOpps) {
          previous_period_revenue += ((opp.value as number) ?? 0);
        }
        previous_period_revenue = Math.round(previous_period_revenue / 100);
      }
    } catch (err) {
      console.error("[Financial] Close error:", err);
    }
  }

  // ═══════════════════════════════════════
  // 2. REVENUE FROM CLIENTS (MRR)
  // ═══════════════════════════════════════
  let mrr = 0;
  let active_clients = 0;
  let avg_client_value: number | null = null;

  if (supabase) {
    try {
      const { data: clients } = await supabase
        .from("clients")
        .select("value_type, value_amount, status")
        .eq("status", "active");

      if (clients && clients.length > 0) {
        active_clients = clients.length;
        mrr = clients
          .filter((c) => c.value_type === "mrr")
          .reduce((sum, c) => sum + Number(c.value_amount), 0);

        const totalClientValue = clients.reduce((sum, c) => {
          if (c.value_type === "mrr") return sum + Number(c.value_amount) * 12;
          return sum + Number(c.value_amount);
        }, 0);
        avg_client_value = active_clients > 0 ? Math.round(totalClientValue / active_clients) : null;
      }
    } catch (err) {
      console.error("[Financial] Clients error:", err);
    }
  }

  const total_revenue = cash_collected + mrr;

  // ═══════════════════════════════════════
  // 3. AD SPEND FROM META
  // ═══════════════════════════════════════
  let ad_spend = 0;

  if (supabase) {
    try {
      let query = supabase.from("meta_ads_daily").select("amount_spent");
      if (start && end) {
        query = query.gte("date", start).lte("date", end);
      }
      const { data: adData } = await query;
      if (adData) {
        ad_spend = adData.reduce((sum, r) => sum + Number(r.amount_spent), 0);
        ad_spend = Math.round(ad_spend * 100) / 100;
      }
    } catch (err) {
      console.error("[Financial] Meta ads error:", err);
    }
  }

  // ═══════════════════════════════════════
  // 4. MANUAL EXPENSES
  // ═══════════════════════════════════════
  let manual_expenses_monthly = 0;
  const line_items: Record<string, unknown>[] = [];

  if (supabase) {
    try {
      const { data: expenses } = await supabase
        .from("expenses")
        .select("*")
        .eq("active", true)
        .order("category", { ascending: true })
        .order("name", { ascending: true });

      if (expenses) {
        for (const exp of expenses) {
          const freq = exp.frequency as string;
          const amount = Number(exp.amount);
          let monthly_cost: number;
          switch (freq) {
            case "quarterly": monthly_cost = amount / 3; break;
            case "annual": monthly_cost = amount / 12; break;
            default: monthly_cost = amount;
          }

          // For one-off: only include if start_date is within the date range
          if (freq === "one_off" && start && end && exp.start_date) {
            const d = exp.start_date as string;
            if (d < start || d > end) {
              monthly_cost = 0;
            }
          }

          monthly_cost = Math.round(monthly_cost * 100) / 100;
          manual_expenses_monthly += monthly_cost;
          line_items.push({ ...exp, monthly_cost });
        }
      }
    } catch (err) {
      console.error("[Financial] Expenses error:", err);
    }
  }

  manual_expenses_monthly = Math.round(manual_expenses_monthly * 100) / 100;
  const total_expenses = Math.round((ad_spend + manual_expenses_monthly) * 100) / 100;

  // ═══════════════════════════════════════
  // 5. PROFIT
  // ═══════════════════════════════════════
  const gross_profit = total_revenue - total_expenses;
  const profit_margin = total_revenue > 0 ? (gross_profit / total_revenue) * 100 : null;

  const prev_total_rev = previous_period_revenue + mrr;
  const prev_profit = prev_total_rev - total_expenses;
  const previous_period_margin = prev_total_rev > 0 ? (prev_profit / prev_total_rev) * 100 : null;

  // ═══════════════════════════════════════
  // 6. UNIT ECONOMICS
  // ═══════════════════════════════════════
  const cac = new_clients_count > 0 ? Math.round(ad_spend / new_clients_count) : null;
  const ltv = avg_client_value;
  const ltv_cac_ratio = cac && ltv ? ltv / cac : null;
  const revenue_per_client = active_clients > 0 ? Math.round(total_revenue / active_clients) : null;

  // ═══════════════════════════════════════
  // 7. MONTHLY TREND (last 6 months)
  // ═══════════════════════════════════════
  const monthly_trend: { month: string; revenue: number; expenses: number; profit: number }[] = [];

  try {
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      const mStart = monthDate.toISOString().split("T")[0];
      const mEnd = monthEnd.toISOString().split("T")[0];
      const label = monthLabel(monthDate);

      let mRevenue = mrr; // MRR is recurring each month
      let mExpenses = manual_expenses_monthly;

      // Close won deals for this month
      if (closeHeaders) {
        try {
          const config = await getPipelineConfig(closeHeaders);
          const mWon = await getWonOpps(closeHeaders, config, mStart, mEnd);
          let mCash = 0;
          for (const opp of mWon) mCash += ((opp.value as number) ?? 0);
          mRevenue += Math.round(mCash / 100);
        } catch { /* skip */ }
      }

      // Ad spend for this month
      if (supabase) {
        try {
          const { data: mAds } = await supabase
            .from("meta_ads_daily")
            .select("amount_spent")
            .gte("date", mStart)
            .lte("date", mEnd);
          if (mAds) {
            const mAdSpend = mAds.reduce((s, r) => s + Number(r.amount_spent), 0);
            mExpenses += Math.round(mAdSpend * 100) / 100;
          }
        } catch { /* skip */ }
      }

      mRevenue = Math.round(mRevenue);
      mExpenses = Math.round(mExpenses);
      monthly_trend.push({ month: label, revenue: mRevenue, expenses: mExpenses, profit: mRevenue - mExpenses });
    }
  } catch (err) {
    console.error("[Financial] Trend error:", err);
  }

  const result = {
    revenue: {
      cash_collected,
      mrr,
      total_revenue,
      won_deals_count,
      new_clients_count,
      active_clients,
      avg_client_value,
      previous_period_revenue: previous_period_revenue + mrr,
    },
    expenses: {
      ad_spend,
      manual_expenses_monthly,
      total_expenses,
      line_items,
    },
    profit: {
      gross_profit,
      profit_margin,
      net_cash_flow: gross_profit,
      previous_period_margin,
    },
    unit_economics: {
      cac,
      ltv,
      ltv_cac_ratio,
      revenue_per_client,
    },
    monthly_trend,
  };

  return NextResponse.json(result);
}
