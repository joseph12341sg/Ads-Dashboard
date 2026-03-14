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
function isMatch(actual: string | undefined | null, expected: string): boolean {
  if (!actual) return false;
  return actual.trim().toLowerCase() === expected.trim().toLowerCase();
}

function containsMatch(actual: string | undefined | null, substring: string): boolean {
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

/* ── Pipeline configuration (cached permanently after first fetch) ── */
interface PipelineConfig {
  setting_status_ids: Set<string>;
  closer_pipeline_id: string;
  closer_status_map: Record<string, string>;
}

let pipelineConfig: PipelineConfig | null = null;

async function getPipelineConfig(
  headers: Record<string, string>
): Promise<PipelineConfig> {
  if (pipelineConfig) return pipelineConfig;

  // Fetch lead statuses to find "00 | Inbound Pipeline" statuses
  const leadRes = await fetch("https://api.close.com/api/v1/status/lead/", {
    headers,
  });
  const leadData = await leadRes.json();

  const settingStatusIds = new Set<string>();
  if (leadData.data && Array.isArray(leadData.data)) {
    for (const status of leadData.data) {
      const pipelineName = (status.pipeline_name ?? "") as string;
      if (
        containsMatch(pipelineName, "Inbound Pipeline") ||
        containsMatch(pipelineName, "00 |")
      ) {
        settingStatusIds.add(status.id as string);
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Close] Found ${settingStatusIds.size} lead statuses for Inbound Pipeline`
    );
  }

  // Fetch opportunity pipelines to find "02 | Sales Pipeline"
  const pipelinesRes = await fetch("https://api.close.com/api/v1/pipeline/", {
    headers,
  });
  const pipelinesData = await pipelinesRes.json();

  let closerPipelineId = "";
  const closerStatusMap: Record<string, string> = {};

  if (pipelinesData.data && Array.isArray(pipelinesData.data)) {
    for (const pipeline of pipelinesData.data) {
      const name = (pipeline.name ?? "") as string;
      if (containsMatch(name, "Sales Pipeline") || containsMatch(name, "02 |")) {
        closerPipelineId = pipeline.id as string;

        if (pipeline.statuses && Array.isArray(pipeline.statuses)) {
          for (const s of pipeline.statuses) {
            closerStatusMap[s.id as string] = s.label as string;
          }
        }
        break;
      }
    }
  }

  if (process.env.NODE_ENV === "development") {
    console.log(
      `[Close] Sales Pipeline ID: ${closerPipelineId}, statuses: ${Object.keys(closerStatusMap).length}`
    );
  }

  pipelineConfig = {
    setting_status_ids: settingStatusIds,
    closer_pipeline_id: closerPipelineId,
    closer_status_map: closerStatusMap,
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
    // Fetch pipeline config (cached after first call)
    const config = await getPipelineConfig(headers);

    const df = dateFilter(start, end);
    const wdf = wonDateFilter(start, end);

    // 1. Fetch dials (ALL outbound calls — not pipeline-specific)
    const dialsUrl = df
      ? `https://api.close.com/api/v1/activity/call/?${df}&direction=outbound`
      : `https://api.close.com/api/v1/activity/call/?direction=outbound`;
    const allCalls = await fetchAllPages(dialsUrl, headers);
    // Client-side filter for outbound direction as safety
    const total_dials = allCalls.filter(
      (c) => (c.direction as string)?.toLowerCase() === "outbound"
    ).length;

    // 2. Fetch lead status changes — filter to Inbound Pipeline only
    const leadChangesUrl = df
      ? `https://api.close.com/api/v1/activity/status_change/lead/?${df}`
      : `https://api.close.com/api/v1/activity/status_change/lead/`;
    const allLeadChanges = await fetchAllPages(leadChangesUrl, headers);

    // Filter to only Inbound Pipeline statuses
    const leadChanges = config.setting_status_ids.size > 0
      ? allLeadChanges.filter((change) => {
          const newId = change.new_status_id as string;
          const oldId = change.old_status_id as string;
          return (
            config.setting_status_ids.has(newId) ||
            config.setting_status_ids.has(oldId)
          );
        })
      : allLeadChanges; // Fallback: use all if no pipeline config found

    const settingFunnel = {
      new_lead: 0,
      in_follow_up: 0,
      engaged: 0,
      follow_up_needed: 0,
      dq_not_interested: 0,
    };

    for (const change of leadChanges) {
      const label = (change.new_status_label ?? "") as string;
      if (isMatch(label, "New Lead")) settingFunnel.new_lead++;
      else if (isMatch(label, "In Follow Up Sequence"))
        settingFunnel.in_follow_up++;
      else if (isMatch(label, "Engaged (In Conversation)"))
        settingFunnel.engaged++;
      else if (isMatch(label, "Follow Up Needed"))
        settingFunnel.follow_up_needed++;
      else if (isMatch(label, "DQ/Not Interested"))
        settingFunnel.dq_not_interested++;
    }

    // 3. Fetch opportunity status changes — filter to Sales Pipeline only
    const oppChangesUrl = df
      ? `https://api.close.com/api/v1/activity/status_change/opportunity/?${df}`
      : `https://api.close.com/api/v1/activity/status_change/opportunity/`;
    const allOppChanges = await fetchAllPages(oppChangesUrl, headers);

    // Filter to Sales Pipeline only using status IDs
    const closerStatusIds = new Set(Object.keys(config.closer_status_map));
    const oppChanges =
      closerStatusIds.size > 0
        ? allOppChanges.filter((change) => {
            const newId = change.new_status_id as string;
            const oldId = change.old_status_id as string;
            return closerStatusIds.has(newId) || closerStatusIds.has(oldId);
          })
        : allOppChanges; // Fallback

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
      const newLabel = ((change.new_status_label ?? "") as string).trim();
      const oldLabel = ((change.old_status_label ?? "") as string).trim();
      const newType = ((change.new_status_type ?? "") as string).trim();

      if (isMatch(newLabel, "Call 1 - Discovery Scheduled"))
        closer.call_1_scheduled++;

      if (isMatch(newLabel, "Call 1 - No Show")) closer.call_1_no_show++;

      if (
        isMatch(oldLabel, "Call 1 - Discovery Scheduled") &&
        isMatch(newLabel, "Call 2 - Close Scheduled")
      )
        closer.call_1_sat++;

      if (isMatch(newLabel, "Call 2 - Close Scheduled"))
        closer.call_2_scheduled++;

      if (isMatch(newLabel, "Call 2 - No Show")) closer.call_2_no_show++;

      if (
        isMatch(oldLabel, "Call 2 - Close Scheduled") &&
        (isMatch(newLabel, "Follow Up - Scheduled") ||
          isMatch(newLabel, "Nurture") ||
          newType.toLowerCase() === "won" ||
          newType.toLowerCase() === "lost")
      )
        closer.call_2_sat++;

      if (newType.toLowerCase() === "won") closer.closed_won++;
      if (newType.toLowerCase() === "lost") closer.closed_lost++;

      if (isMatch(newLabel, "Follow Up - Scheduled"))
        closer.follow_up_scheduled++;
      if (isMatch(newLabel, "Nurture")) closer.nurture++;
    }

    const appointments_booked = closer.call_1_scheduled;

    // 4. Fetch won opportunities — filter to Sales Pipeline
    const wonBaseUrl = config.closer_pipeline_id
      ? `https://api.close.com/api/v1/opportunity/?pipeline_id=${config.closer_pipeline_id}&status_type=won`
      : `https://api.close.com/api/v1/opportunity/?status_type=won`;
    const wonUrl = wdf
      ? `${wonBaseUrl}&${wdf}&_fields=value,lead_name,date_won,status_label`
      : `${wonBaseUrl}&_fields=value,lead_name,date_won,status_label`;
    const wonOpps = await fetchAllPages(wonUrl, headers);

    let cash_collected = 0;
    for (const opp of wonOpps) {
      cash_collected += (opp.value as number) ?? 0;
    }
    cash_collected = Math.round(cash_collected / 100);

    // 5. Fetch active pipeline value — filter to Sales Pipeline
    const activeBaseUrl = config.closer_pipeline_id
      ? `https://api.close.com/api/v1/opportunity/?pipeline_id=${config.closer_pipeline_id}&status_type=active&_fields=value`
      : `https://api.close.com/api/v1/opportunity/?status_type=active&_fields=value`;
    const allActive = await fetchAllPages(activeBaseUrl, headers);
    const pipeline_value = Math.round(
      allActive.reduce((sum, o) => sum + ((o.value as number) ?? 0), 0) / 100
    );

    // 6. Fetch recent deals — filter to Sales Pipeline
    const recentBaseUrl = config.closer_pipeline_id
      ? `https://api.close.com/api/v1/opportunity/?pipeline_id=${config.closer_pipeline_id}&_order_by=-date_updated&_fields=value,lead_name,status_label,status_type,date_won,date_updated&_limit=10`
      : `https://api.close.com/api/v1/opportunity/?_order_by=-date_updated&_fields=value,lead_name,status_label,status_type,date_won,date_updated&_limit=10`;
    const recentRes = await fetch(recentBaseUrl, { headers });
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
