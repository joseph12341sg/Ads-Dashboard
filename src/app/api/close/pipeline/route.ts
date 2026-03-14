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

/* ── Fetch total_count for a query (uses _limit=0) ── */
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
  inbound_pipeline_id: string;
  inbound_status_map: Record<string, string>; // status_id -> label
  sales_pipeline_id: string;
  sales_status_map: Record<string, string>; // status_id -> label
}

let pipelineConfig: PipelineConfig | null = null;

async function getPipelineConfig(
  headers: Record<string, string>
): Promise<PipelineConfig> {
  if (pipelineConfig) return pipelineConfig;

  // Both Inbound and Sales are OPPORTUNITY pipelines
  const pipelinesRes = await fetch("https://api.close.com/api/v1/pipeline/", {
    headers,
  });
  const pipelinesData = await pipelinesRes.json();

  let inboundPipelineId = "";
  const inboundStatusMap: Record<string, string> = {};
  let salesPipelineId = "";
  const salesStatusMap: Record<string, string> = {};

  if (pipelinesData.data && Array.isArray(pipelinesData.data)) {
    for (const pipeline of pipelinesData.data) {
      const name = (pipeline.name ?? "") as string;

      // "00 | Inbound Pipeline" — the SETTING pipeline
      if (
        containsMatch(name, "Inbound Pipeline") ||
        containsMatch(name, "00 |")
      ) {
        inboundPipelineId = pipeline.id as string;
        if (pipeline.statuses && Array.isArray(pipeline.statuses)) {
          for (const s of pipeline.statuses) {
            inboundStatusMap[s.id as string] = s.label as string;
          }
        }
      }

      // "02 | Sales Pipeline" — the CLOSER pipeline
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
      }
    }
  }

  console.log(
    `[Close] Inbound Pipeline ID: ${inboundPipelineId}, statuses:`,
    inboundStatusMap
  );
  console.log(
    `[Close] Sales Pipeline ID: ${salesPipelineId}, statuses:`,
    salesStatusMap
  );

  pipelineConfig = {
    inbound_pipeline_id: inboundPipelineId,
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
    // 2. SETTING FUNNEL — current OPPORTUNITY counts per Inbound Pipeline status
    //    (Inbound Pipeline is an OPPORTUNITY pipeline, not lead statuses)
    // ═══════════════════════════════════════════
    const settingFunnel = {
      new_lead: 0,
      in_follow_up: 0,
      engaged: 0,
      follow_up_needed: 0,
      dq_not_interested: 0,
    };

    for (const [statusId, label] of Object.entries(config.inbound_status_map)) {
      // Query OPPORTUNITIES by status_id (NOT leads)
      const count = await fetchCount(
        `https://api.close.com/api/v1/opportunity/?status_id=${statusId}`,
        headers
      );

      console.log(
        `[Close] Inbound status "${label}" (${statusId}): ${count} opportunities`
      );

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

    // total_leads = all opportunities that are currently in any Inbound Pipeline status
    const total_leads =
      settingFunnel.new_lead +
      settingFunnel.in_follow_up +
      settingFunnel.engaged +
      settingFunnel.follow_up_needed +
      settingFunnel.dq_not_interested;

    // DQ count = opportunities currently in DQ/Not Interested status
    const dq_count = settingFunnel.dq_not_interested;

    console.log(
      `[Close] Setting funnel: total_leads=${total_leads}, dq=${dq_count}`,
      settingFunnel
    );

    // ═══════════════════════════════════════════
    // 3. OPPORTUNITY STATUS CHANGES — Sales Pipeline only
    // ═══════════════════════════════════════════
    const oppChangesUrl = df
      ? `https://api.close.com/api/v1/activity/status_change/opportunity/?${df}`
      : `https://api.close.com/api/v1/activity/status_change/opportunity/`;
    const allOppChanges = await fetchAllPages(oppChangesUrl, headers);

    // Filter to Sales Pipeline only using status IDs
    const salesStatusIds = new Set(Object.keys(config.sales_status_map));
    const oppChanges =
      salesStatusIds.size > 0
        ? allOppChanges.filter((change) => {
            const newId = change.new_status_id as string;
            const oldId = change.old_status_id as string;
            return salesStatusIds.has(newId) || salesStatusIds.has(oldId);
          })
        : allOppChanges;

    console.log(
      `[Close] Opportunity status changes: ${allOppChanges.length} total, ${oppChanges.length} in Sales Pipeline`
    );

    const closer = {
      call_1_scheduled: 0,
      call_1_sat: 0,
      call_1_no_show: 0,
      call_2_scheduled: 0,
      call_2_sat: 0,
      call_2_no_show: 0,
      closed_won: 0,
      closed_lost: 0,
      no_close: 0,
      follow_up_scheduled: 0,
      nurture: 0,
      onboarding: 0,
    };

    for (const change of oppChanges) {
      const newLabel = ((change.new_status_label ?? "") as string).trim();
      const oldLabel = ((change.old_status_label ?? "") as string).trim();
      const newType = ((change.new_status_type ?? "") as string)
        .trim()
        .toLowerCase();

      if (labelMatch(newLabel, "Call 1 - Discovery Scheduled"))
        closer.call_1_scheduled++;

      if (labelMatch(newLabel, "Call 1 - No Show")) closer.call_1_no_show++;

      // Call 1 Sat = moved FROM Call 1 to ANY next stage except No Show
      if (
        labelMatch(oldLabel, "Call 1 - Discovery Scheduled") &&
        !labelMatch(newLabel, "Call 1 - No Show")
      )
        closer.call_1_sat++;

      if (labelMatch(newLabel, "Call 2 - Close Scheduled"))
        closer.call_2_scheduled++;

      if (labelMatch(newLabel, "Call 2 - No Show")) closer.call_2_no_show++;

      // Call 2 Sat = moved FROM Call 2 to ANY next stage except No Show
      if (
        labelMatch(oldLabel, "Call 2 - Close Scheduled") &&
        !labelMatch(newLabel, "Call 2 - No Show")
      )
        closer.call_2_sat++;

      // "Closed" (ACTIVE status = deal done/delivered) — counts as won
      if (labelMatch(newLabel, "Closed") && newType === "active")
        closer.closed_won++;

      // "Onboarding Call Scheduled" (WON status)
      if (
        labelMatch(newLabel, "Onboarding Call Scheduled") ||
        newType === "won"
      ) {
        closer.closed_won++;
        closer.onboarding++;
      }

      // "Lost/DQ" (LOST status)
      if (labelMatch(newLabel, "Lost/DQ") || newType === "lost")
        closer.closed_lost++;

      // "No Close" (ACTIVE — didn't close but not fully lost)
      if (labelMatch(newLabel, "No Close")) closer.no_close++;

      if (labelMatch(newLabel, "Follow Up - Scheduled"))
        closer.follow_up_scheduled++;

      if (labelMatch(newLabel, "Nurture")) closer.nurture++;
    }

    const appointments_booked = closer.call_1_scheduled;

    // ═══════════════════════════════════════════
    // 4. CASH COLLECTED — "Closed" + "Onboarding Call Scheduled" in Sales Pipeline
    //    Use status_id filtering since pipeline_id doesn't work reliably
    // ═══════════════════════════════════════════
    // Find the "Closed" and "Onboarding Call Scheduled" status IDs
    let closedStatusId = "";
    let onboardingStatusId = "";
    for (const [id, label] of Object.entries(config.sales_status_map)) {
      if (labelMatch(label, "Closed")) closedStatusId = id;
      if (labelMatch(label, "Onboarding Call Scheduled"))
        onboardingStatusId = id;
    }

    const wonOpps: Record<string, unknown>[] = [];
    const seenIds = new Set<string>();

    // Fetch "Closed" opportunities by status_id
    if (closedStatusId) {
      const closedOpps = await fetchAllPages(
        `https://api.close.com/api/v1/opportunity/?status_id=${closedStatusId}&_fields=id,value,lead_name,date_won,status_label,status_type`,
        headers
      );
      for (const opp of closedOpps) {
        const id = opp.id as string;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          wonOpps.push(opp);
        }
      }
    }

    // Fetch "Onboarding Call Scheduled" opportunities by status_id
    if (onboardingStatusId) {
      const onboardingOpps = await fetchAllPages(
        `https://api.close.com/api/v1/opportunity/?status_id=${onboardingStatusId}&_fields=id,value,lead_name,date_won,status_label,status_type`,
        headers
      );
      for (const opp of onboardingOpps) {
        const id = opp.id as string;
        if (!seenIds.has(id)) {
          seenIds.add(id);
          wonOpps.push(opp);
        }
      }
    }

    let cash_collected = 0;
    for (const opp of wonOpps) {
      cash_collected += (opp.value as number) ?? 0;
    }
    cash_collected = Math.round(cash_collected / 100);

    console.log(
      `[Close] Won opps (Closed + Onboarding): ${wonOpps.length}, cash: £${cash_collected}`
    );

    // ═══════════════════════════════════════════
    // 4b. TOTAL LEADS (ALL TIME) — sum of all opportunities in BOTH pipelines
    // ═══════════════════════════════════════════
    let total_leads_all = total_leads; // Start with Inbound Pipeline count
    // Add all opportunities currently in Sales Pipeline statuses
    for (const statusId of Object.keys(config.sales_status_map)) {
      const count = await fetchCount(
        `https://api.close.com/api/v1/opportunity/?status_id=${statusId}`,
        headers
      );
      total_leads_all += count;
    }

    console.log(
      `[Close] Total leads (all pipelines): ${total_leads_all} (Inbound: ${total_leads}, Sales: ${total_leads_all - total_leads})`
    );

    // ═══════════════════════════════════════════
    // 5. PIPELINE VALUE — active opportunities in Sales Pipeline only
    //    Sum value of all opportunities in active Sales Pipeline statuses
    // ═══════════════════════════════════════════
    let pipeline_value = 0;
    for (const [statusId, label] of Object.entries(config.sales_status_map)) {
      // Skip non-active statuses (won, lost) and "Closed" (which we count as won)
      const lbl = label.trim().toLowerCase();
      if (
        lbl === "closed" ||
        lbl === "onboarding call scheduled" ||
        lbl === "lost/dq"
      )
        continue;

      const statusOpps = await fetchAllPages(
        `https://api.close.com/api/v1/opportunity/?status_id=${statusId}&_fields=value`,
        headers
      );
      for (const opp of statusOpps) {
        pipeline_value += (opp.value as number) ?? 0;
      }
    }
    pipeline_value = Math.round(pipeline_value / 100);

    // ═══════════════════════════════════════════
    // 6. RECENT DEALS — all Sales Pipeline opportunities, sorted by recent
    // ═══════════════════════════════════════════
    // Fetch from each Sales Pipeline status, combine and sort
    const allSalesOpps: Record<string, unknown>[] = [];
    for (const statusId of Object.keys(config.sales_status_map)) {
      const opps = await fetchAllPages(
        `https://api.close.com/api/v1/opportunity/?status_id=${statusId}&_fields=value,lead_name,status_label,status_type,date_won,date_updated`,
        headers
      );
      allSalesOpps.push(...opps);
    }

    // Sort by date_updated descending and take top 10
    allSalesOpps.sort((a, b) => {
      const da = (a.date_updated as string) ?? "";
      const db = (b.date_updated as string) ?? "";
      return db.localeCompare(da);
    });

    const recent_deals = allSalesOpps.slice(0, 10).map(
      (d) => ({
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
        total_leads_all,
        appointments_booked,
        dq_count,
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

    console.log("[Close] Final result:", JSON.stringify(result, null, 2));

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[Close] Pipeline error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
