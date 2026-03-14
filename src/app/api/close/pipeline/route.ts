import { NextRequest, NextResponse } from "next/server";

/* ── In-memory cache with 5-minute TTL ── */
const cache = new Map<string, { data: unknown; ts: number }>();
const CACHE_TTL = 5 * 60 * 1000;

function getCached(key: string) {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.ts < CACHE_TTL) return entry.data;
  return null;
}

function setCache(key: string, data: unknown) {
  cache.set(key, { data, ts: Date.now() });
}

/* ── Auth headers ── */
function getHeaders() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return null;
  return {
    Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };
}

/* ── Paginated fetch (handles all pages) ── */
async function fetchAllPages(
  baseUrl: string,
  headers: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const allResults: Record<string, unknown>[] = [];
  let skip = 0;
  const limit = 100;
  let hasMore = true;

  while (hasMore) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const res = await fetch(
      `${baseUrl}${separator}_limit=${limit}&_skip=${skip}`,
      { headers }
    );
    const json = await res.json();

    if (json.error) throw new Error(json.error);
    if (json.data) {
      allResults.push(...json.data);
    }

    hasMore = json.has_more === true;
    skip += limit;
  }

  return allResults;
}

/* ── Count-only fetch (uses _limit=0 for total_results) ── */
async function fetchCount(
  baseUrl: string,
  headers: Record<string, string>
): Promise<number> {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const res = await fetch(`${baseUrl}${separator}_limit=0`, { headers });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json.total_results ?? 0;
}

/* ── Build date filter query params ── */
function dateFilter(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  return `date_created__gt=${start}T00:00:00&date_created__lt=${end}T23:59:59`;
}

function wonDateFilter(start: string | null, end: string | null): string {
  if (!start || !end) return "";
  return `date_won__gt=${start}&date_won__lt=${end}`;
}

export async function GET(request: NextRequest) {
  const headers = getHeaders();
  if (!headers) {
    return NextResponse.json(
      { error: "Close API key not configured" },
      { status: 500 }
    );
  }

  const start = request.nextUrl.searchParams.get("start");
  const end = request.nextUrl.searchParams.get("end");
  const isAllTime = !start || !end;

  const cacheKey = `pipeline:${start ?? "all"}:${end ?? "all"}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const df = dateFilter(start, end);
    const wdf = wonDateFilter(start, end);
    const ampDf = df ? `&${df}` : "";
    const qDf = df ? `?${df}` : "";
    const ampWdf = wdf ? `&${wdf}` : "";

    // 1. Fetch dials count (outbound calls)
    const dialsUrl = df
      ? `https://api.close.com/api/v1/activity/call/?${df}&direction=outbound`
      : `https://api.close.com/api/v1/activity/call/?direction=outbound`;
    const total_dials = await fetchCount(dialsUrl, headers);

    // 2. Fetch lead status changes
    const leadChangesUrl = df
      ? `https://api.close.com/api/v1/activity/status_change/lead/?${df}`
      : `https://api.close.com/api/v1/activity/status_change/lead/`;
    const leadChanges = await fetchAllPages(leadChangesUrl, headers);

    const settingFunnel = {
      new_lead: 0,
      in_follow_up: 0,
      engaged: 0,
      follow_up_needed: 0,
      dq_not_interested: 0,
    };

    for (const change of leadChanges) {
      const label = change.new_status_label as string;
      if (label === "New Lead") settingFunnel.new_lead++;
      else if (label === "In Follow Up Sequence") settingFunnel.in_follow_up++;
      else if (label === "Engaged (In Conversation)") settingFunnel.engaged++;
      else if (label === "Follow Up Needed") settingFunnel.follow_up_needed++;
      else if (label === "DQ/Not Interested")
        settingFunnel.dq_not_interested++;
    }

    // 3. Fetch opportunity status changes
    const oppChangesUrl = df
      ? `https://api.close.com/api/v1/activity/status_change/opportunity/?${df}`
      : `https://api.close.com/api/v1/activity/status_change/opportunity/`;
    const oppChanges = await fetchAllPages(oppChangesUrl, headers);

    const closer = {
      call_1_scheduled: 0,
      call_1_sat: 0,
      call_1_no_show: 0,
      call_2_scheduled: 0,
      call_2_sat: 0,
      call_2_no_show: 0,
      closed_won: 0,
      closed_lost: 0,
      follow_up_scheduled: 0,
      nurture: 0,
    };

    for (const change of oppChanges) {
      const newLabel = change.new_status_label as string;
      const oldLabel = change.old_status_label as string;
      const newType = change.new_status_type as string;

      // Call 1 Scheduled
      if (newLabel === "Call 1 - Discovery Scheduled")
        closer.call_1_scheduled++;

      // Call 1 No Show
      if (newLabel === "Call 1 - No Show") closer.call_1_no_show++;

      // Call 1 Sat: moved FROM "Call 1 - Discovery Scheduled" TO "Call 2 - Close Scheduled"
      if (
        oldLabel === "Call 1 - Discovery Scheduled" &&
        newLabel === "Call 2 - Close Scheduled"
      )
        closer.call_1_sat++;

      // Call 2 Scheduled
      if (newLabel === "Call 2 - Close Scheduled") closer.call_2_scheduled++;

      // Call 2 No Show
      if (newLabel === "Call 2 - No Show") closer.call_2_no_show++;

      // Call 2 Sat: moved FROM "Call 2 - Close Scheduled" TO any of: Follow Up, Nurture, won, lost
      if (
        oldLabel === "Call 2 - Close Scheduled" &&
        (newLabel === "Follow Up - Scheduled" ||
          newLabel === "Nurture" ||
          newType === "won" ||
          newType === "lost")
      )
        closer.call_2_sat++;

      // Closed Won
      if (newType === "won") closer.closed_won++;

      // Closed Lost
      if (newType === "lost") closer.closed_lost++;

      // Follow Up Scheduled
      if (newLabel === "Follow Up - Scheduled") closer.follow_up_scheduled++;

      // Nurture
      if (newLabel === "Nurture") closer.nurture++;
    }

    // Appointments booked = call 1 scheduled
    const appointments_booked = closer.call_1_scheduled;

    // 4. Fetch won opportunities for revenue
    const wonUrl = wdf
      ? `https://api.close.com/api/v1/opportunity/?status_type=won&${wdf}&_fields=value,lead_name,date_won,status_label`
      : `https://api.close.com/api/v1/opportunity/?status_type=won&_fields=value,lead_name,date_won,status_label`;
    const wonOpps = await fetchAllPages(wonUrl, headers);

    let cash_collected = 0;
    for (const opp of wonOpps) {
      cash_collected += (opp.value as number) ?? 0;
    }
    cash_collected = Math.round(cash_collected / 100);

    // 5. Fetch active pipeline value
    const allActive = await fetchAllPages(
      `https://api.close.com/api/v1/opportunity/?status_type=active&_fields=value`,
      headers
    );
    const pipeline_value = Math.round(
      allActive.reduce((sum, o) => sum + ((o.value as number) ?? 0), 0) / 100
    );

    // 6. Fetch recent deals
    const recentRes = await fetch(
      `https://api.close.com/api/v1/opportunity/?_order_by=-date_updated&_fields=value,lead_name,status_label,status_type,date_won,date_updated&_limit=10`,
      { headers }
    );
    const recentJson = await recentRes.json();
    const recent_deals = (recentJson.data ?? []).map(
      (d: Record<string, unknown>) => ({
        lead_name: d.lead_name ?? "Unknown",
        value: Math.round(((d.value as number) ?? 0) / 100),
        status_label: d.status_label ?? "",
        status_type: d.status_type ?? "active",
        date_won: d.date_won ?? null,
      })
    );

    const result = {
      setting: {
        total_dials,
        total_leads: settingFunnel.new_lead,
        appointments_booked,
        dq_count: settingFunnel.dq_not_interested,
        funnel: settingFunnel,
      },
      closer,
      revenue: {
        cash_collected,
        pipeline_value,
        won_deals_count: wonOpps.length,
      },
      recent_deals,
    };

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
