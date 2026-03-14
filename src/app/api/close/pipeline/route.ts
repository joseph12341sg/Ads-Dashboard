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

/* ── Case-insensitive trimmed matching ── */
function labelMatch(
  actual: string | undefined | null,
  expected: string
): boolean {
  if (!actual) return false;
  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

function containsMatch(
  actual: string | undefined | null,
  substring: string
): boolean {
  if (!actual) return false;
  return actual.trim().toLowerCase().includes(substring.trim().toLowerCase());
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

/* ── Fetch total_count for a query (uses _limit=0 for efficiency) ── */
async function fetchCount(
  baseUrl: string,
  headers: Record<string, string>
): Promise<number> {
  const separator = baseUrl.includes("?") ? "&" : "?";
  const res = await fetch(`${baseUrl}${separator}_limit=0`, { headers });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return (json.total_results as number) ?? 0;
}

/* ── Pipeline configuration (cached permanently after first fetch) ── */
interface PipelineConfig {
  inbound_status_map: Record<string, string>; // status_id -> label
  sales_pipeline_id: string;
  sales_status_map: Record<string, string>; // status_id -> label
}

let pipelineConfig: PipelineConfig | null = null;

/* Known Inbound Pipeline labels */
const INBOUND_LABELS = [
  "new lead",
  "in follow up sequence",
  "engaged (in conversation)",
  "follow up needed",
  "dq/not interested",
];

async function getPipelineConfig(
  headers: Record<string, string>
): Promise<PipelineConfig> {
  if (pipelineConfig) return pipelineConfig;

  // Fetch all lead statuses
  const leadRes = await fetch("https://api.close.com/api/v1/status/lead/", {
    headers,
  });
  const leadData = await leadRes.json();

  const inboundStatusMap: Record<string, string> = {};

  if (leadData.data && Array.isArray(leadData.data)) {
    for (const status of leadData.data) {
      const pipelineName = (status.pipeline_name ?? "") as string;
      const label = (status.label ?? "") as string;

      // Match by pipeline name
      const matchesPipeline =
        containsMatch(pipelineName, "Inbound Pipeline") ||
        containsMatch(pipelineName, "00 |");

      // Fallback: match by known label
      const matchesLabel = INBOUND_LABELS.includes(label.trim().toLowerCase());

      if (matchesPipeline || matchesLabel) {
        inboundStatusMap[status.id as string] = label;
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Close] Found ${Object.keys(inboundStatusMap).length} Inbound Pipeline statuses:`,
      inboundStatusMap
    );
  }

  // Fetch opportunity pipelines to find "02 | Sales Pipeline"
  const pipelinesRes = await fetch("https://api.close.com/api/v1/pipeline/", {
    headers,
  });
  const pipelinesData = await pipelinesRes.json();

  let salesPipelineId = "";
  const salesStatusMap: Record<string, string> = {};

  if (pipelinesData.data && Array.isArray(pipelinesData.data)) {
    for (const pipeline of pipelinesData.data) {
      const name = (pipeline.name ?? "") as string;
      if (
        containsMatch(name, "Sales Pipeline") ||
        containsMatch(name, "02 |")
      ) {
        salesPipelineId = pipeline.id as string;

        if (pipeline.statuses && Array.isArray(pipeline.statuses)) {
          for (const s of pipeline.statuses) {
            salesStatusMap[s.id as string] = s.label as string;
          }
        }
        break;
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Close] Sales Pipeline ID: ${salesPipelineId}, statuses:`,
      salesStatusMap
    );
  }

  pipelineConfig = {
    inbound_status_map: inboundStatusMap,
    sales_pipeline_id: salesPipelineId,
    sales_status_map: salesStatusMap,
  };

  return pipelineConfig;
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

  const cacheKey = `pipeline:${start ?? "all"}:${end ?? "all"}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    const config = await getPipelineConfig(headers);
    const df = dateFilter(start, end);
    const wdf = wonDateFilter(start, end);

    // ═══════════════════════════════════════════
    // 1. DIALS — ALL outbound calls
    // ═══════════════════════════════════════════
    const dialsUrl = df
      ? `https://api.close.com/api/v1/activity/call/?${df}&direction=outbound`
      : `https://api.close.com/api/v1/activity/call/?direction=outbound`;
    const allCalls = await fetchAllPages(dialsUrl, headers);
    const total_dials = allCalls.filter(
      (c) => (c.direction as string)?.toLowerCase() === "outbound"
    ).length;

    // ═══════════════════════════════════════════
    // 2. SETTING FUNNEL — current lead counts per Inbound Pipeline status
    // ═══════════════════════════════════════════
    const settingFunnel = {
      new_lead: 0,
      in_follow_up: 0,
      engaged: 0,
      follow_up_needed: 0,
      dq_not_interested: 0,
    };

    for (const [statusId, label] of Object.entries(config.inbound_status_map)) {
      const count = await fetchCount(
        `https://api.close.com/api/v1/lead/?status_id=${statusId}`,
        headers
      );

      if (process.env.NODE_ENV === "development") {
        console.log(
          `[Close] Lead status "${label}" (${statusId}): ${count} leads`
        );
      }

      const lbl = label.trim().toLowerCase();
      if (lbl === "new lead") settingFunnel.new_lead = count;
      else if (lbl === "in follow up sequence")
        settingFunnel.in_follow_up = count;
      else if (lbl === "engaged (in conversation)")
        settingFunnel.engaged = count;
      else if (lbl === "follow up needed")
        settingFunnel.follow_up_needed = count;
      else if (lbl === "dq/not interested")
        settingFunnel.dq_not_interested = count;
    }

    const total_leads =
      settingFunnel.new_lead +
      settingFunnel.in_follow_up +
      settingFunnel.engaged +
      settingFunnel.follow_up_needed +
      settingFunnel.dq_not_interested;

    // DQ count = current leads in DQ/Not Interested status
    const dq_count = settingFunnel.dq_not_interested;

    // ═══════════════════════════════════════════
    // 3. OPPORTUNITY STATUS CHANGES — Sales Pipeline only
    // ═══════════════════════════════════════════
    const oppChangesUrl = df
      ? `https://api.close.com/api/v1/activity/status_change/opportunity/?${df}`
      : `https://api.close.com/api/v1/activity/status_change/opportunity/`;
    const allOppChanges = await fetchAllPages(oppChangesUrl, headers);

    // Filter to Sales Pipeline only
    const salesStatusIds = new Set(Object.keys(config.sales_status_map));
    const oppChanges =
      salesStatusIds.size > 0
        ? allOppChanges.filter((change) => {
            const newId = change.new_status_id as string;
            const oldId = change.old_status_id as string;
            return salesStatusIds.has(newId) || salesStatusIds.has(oldId);
          })
        : allOppChanges;

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Close] Opportunity status changes: ${allOppChanges.length} total, ${oppChanges.length} in Sales Pipeline`
      );
    }

    const closer = {
      call_1_scheduled: 0,
      call_1_sat: 0,
      call_1_no_show: 0,
      call_2_scheduled: 0,
      call_2_sat: 0,
      call_2_no_show: 0,
      closed_won: 0, // "Closed" (active) + "Onboarding Call Scheduled" (won)
      closed_lost: 0, // "Lost/DQ" (lost)
      no_close: 0, // "No Close" (active)
      follow_up_scheduled: 0,
      nurture: 0,
      onboarding: 0, // "Onboarding Call Scheduled" (won)
    };

    for (const change of oppChanges) {
      const newLabel = ((change.new_status_label ?? "") as string).trim();
      const oldLabel = ((change.old_status_label ?? "") as string).trim();
      const newType = ((change.new_status_type ?? "") as string)
        .trim()
        .toLowerCase();

      // Call 1 Scheduled
      if (labelMatch(newLabel, "Call 1 - Discovery Scheduled"))
        closer.call_1_scheduled++;

      // Call 1 No Show
      if (labelMatch(newLabel, "Call 1 - No Show")) closer.call_1_no_show++;

      // Call 1 Sat = moved FROM "Call 1 - Discovery Scheduled" to ANY next stage
      // except "Call 1 - No Show"
      if (
        labelMatch(oldLabel, "Call 1 - Discovery Scheduled") &&
        !labelMatch(newLabel, "Call 1 - No Show")
      )
        closer.call_1_sat++;

      // Call 2 Scheduled
      if (labelMatch(newLabel, "Call 2 - Close Scheduled"))
        closer.call_2_scheduled++;

      // Call 2 No Show
      if (labelMatch(newLabel, "Call 2 - No Show")) closer.call_2_no_show++;

      // Call 2 Sat = moved FROM "Call 2 - Close Scheduled" to ANY next stage
      // except "Call 2 - No Show"
      if (
        labelMatch(oldLabel, "Call 2 - Close Scheduled") &&
        !labelMatch(newLabel, "Call 2 - No Show")
      )
        closer.call_2_sat++;

      // "Closed" (ACTIVE status = deal done/delivered) — counts as won
      if (labelMatch(newLabel, "Closed") && newType === "active")
        closer.closed_won++;

      // "Onboarding Call Scheduled" (WON status)
      if (labelMatch(newLabel, "Onboarding Call Scheduled") || newType === "won") {
        closer.closed_won++;
        closer.onboarding++;
      }

      // "Lost/DQ" (LOST status)
      if (labelMatch(newLabel, "Lost/DQ") || newType === "lost")
        closer.closed_lost++;

      // "No Close" (ACTIVE status — didn't close but not fully lost)
      if (labelMatch(newLabel, "No Close")) closer.no_close++;

      // Follow Up - Scheduled
      if (labelMatch(newLabel, "Follow Up - Scheduled"))
        closer.follow_up_scheduled++;

      // Nurture
      if (labelMatch(newLabel, "Nurture")) closer.nurture++;
    }

    const appointments_booked = closer.call_1_scheduled;

    // ═══════════════════════════════════════════
    // 4. CASH COLLECTED — "Closed" (active) + "Onboarding Call Scheduled" (won)
    // ═══════════════════════════════════════════
    const pipelineFilter = config.sales_pipeline_id
      ? `pipeline_id=${config.sales_pipeline_id}&`
      : "";

    // Fetch "Closed" opportunities (active status = deal done)
    const closedUrl = wdf
      ? `https://api.close.com/api/v1/opportunity/?${pipelineFilter}status_label=Closed&${wdf}&_fields=id,value,lead_name,date_won,status_label,status_type`
      : `https://api.close.com/api/v1/opportunity/?${pipelineFilter}status_label=Closed&_fields=id,value,lead_name,date_won,status_label,status_type`;
    const closedOpps = await fetchAllPages(closedUrl, headers);

    // Fetch "won" opportunities (Onboarding Call Scheduled)
    const wonUrl = wdf
      ? `https://api.close.com/api/v1/opportunity/?${pipelineFilter}status_type=won&${wdf}&_fields=id,value,lead_name,date_won,status_label,status_type`
      : `https://api.close.com/api/v1/opportunity/?${pipelineFilter}status_type=won&_fields=id,value,lead_name,date_won,status_label,status_type`;
    const wonOpps = await fetchAllPages(wonUrl, headers);

    // Deduplicate by opportunity ID
    const seenIds = new Set<string>();
    const allWonOpps: Record<string, unknown>[] = [];
    for (const opp of [...closedOpps, ...wonOpps]) {
      const id = opp.id as string;
      if (!seenIds.has(id)) {
        seenIds.add(id);
        allWonOpps.push(opp);
      }
    }

    let cash_collected = 0;
    for (const opp of allWonOpps) {
      cash_collected += (opp.value as number) ?? 0;
    }
    cash_collected = Math.round(cash_collected / 100); // cents to pounds

    if (process.env.NODE_ENV === "development") {
      console.log(
        `[Close] Won opportunities (Closed + Onboarding): ${allWonOpps.length}, cash: £${cash_collected}`
      );
    }

    // ═══════════════════════════════════════════
    // 5. PIPELINE VALUE — active opportunities in Sales Pipeline only
    // ═══════════════════════════════════════════
    const activeUrl = config.sales_pipeline_id
      ? `https://api.close.com/api/v1/opportunity/?pipeline_id=${config.sales_pipeline_id}&status_type=active&_fields=value`
      : `https://api.close.com/api/v1/opportunity/?status_type=active&_fields=value`;
    const allActive = await fetchAllPages(activeUrl, headers);
    const pipeline_value = Math.round(
      allActive.reduce((sum, o) => sum + ((o.value as number) ?? 0), 0) / 100
    );

    // ═══════════════════════════════════════════
    // 6. RECENT DEALS — Sales Pipeline only
    // ═══════════════════════════════════════════
    const recentUrl = config.sales_pipeline_id
      ? `https://api.close.com/api/v1/opportunity/?pipeline_id=${config.sales_pipeline_id}&_order_by=-date_updated&_fields=value,lead_name,status_label,status_type,date_won,date_updated&_limit=10`
      : `https://api.close.com/api/v1/opportunity/?_order_by=-date_updated&_fields=value,lead_name,status_label,status_type,date_won,date_updated&_limit=10`;
    const recentRes = await fetch(recentUrl, { headers });
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
        total_leads,
        appointments_booked,
        dq_count,
        funnel: settingFunnel,
      },
      closer,
      revenue: {
        cash_collected,
        pipeline_value,
        won_deals_count: allWonOpps.length,
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
