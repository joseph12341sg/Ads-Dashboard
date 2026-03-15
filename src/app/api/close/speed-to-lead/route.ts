import { NextRequest, NextResponse } from "next/server";

/* ── Auth headers ── */
function getHeaders() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return null;
  return {
    Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };
}

/* ── Paginated fetch ── */
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
    if (json.data) allResults.push(...json.data);
    hasMore = json.has_more === true;
    skip += limit;
  }
  return allResults;
}

/* ── Check if timestamp is within UK working hours (10am-8pm) ── */
function isInHoursUK(isoDate: string): boolean {
  const date = new Date(isoDate);
  const ukTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Europe/London" })
  );
  const hour = ukTime.getHours();
  return hour >= 10 && hour < 20;
}

function containsMatch(
  actual: string | undefined | null,
  substring: string
): boolean {
  if (!actual) return false;
  return actual.trim().toLowerCase().includes(substring.trim().toLowerCase());
}

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

/* ── Get Inbound Pipeline info ── */
let inboundPipelineInfo: { pipelineId: string; statusIds: string[] } | null = null;

async function getInboundPipelineInfo(
  headers: Record<string, string>
): Promise<{ pipelineId: string; statusIds: string[] }> {
  if (inboundPipelineInfo) return inboundPipelineInfo;

  const res = await fetch("https://api.close.com/api/v1/pipeline/", {
    headers,
  });
  const data = await res.json();
  const statusIds: string[] = [];
  let pipelineId = "";

  if (data.data && Array.isArray(data.data)) {
    for (const pipeline of data.data) {
      const name = (pipeline.name ?? "") as string;
      if (
        containsMatch(name, "Inbound Pipeline") ||
        containsMatch(name, "00 |")
      ) {
        pipelineId = pipeline.id as string;
        if (pipeline.statuses && Array.isArray(pipeline.statuses)) {
          for (const s of pipeline.statuses) {
            statusIds.push(s.id as string);
          }
        }
        break;
      }
    }
  }

  inboundPipelineInfo = { pipelineId, statusIds };
  console.log(`[STL] Inbound Pipeline ID: ${pipelineId}, status IDs: ${statusIds.join(", ")}`);
  return inboundPipelineInfo;
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

  const cacheKey = `stl:${start ?? "all"}:${end ?? "all"}`;
  const cached = getCached(cacheKey);
  if (cached) return NextResponse.json(cached);

  try {
    // ═══════════════════════════════════════════
    // 1. Get Inbound Pipeline ID and status IDs
    // ═══════════════════════════════════════════
    const { pipelineId, statusIds } = await getInboundPipelineInfo(headers);

    if (!pipelineId) {
      return NextResponse.json({
        error: "Inbound Pipeline not found",
      }, { status: 404 });
    }

    // ═══════════════════════════════════════════
    // 2. Fetch ALL opportunities ever created in the Inbound Pipeline
    //    (using pipeline_id to include leads that may have moved out)
    // ═══════════════════════════════════════════
    const inboundLeadIds = new Set<string>();
    const leadCreatedDates = new Map<string, string>(); // lead_id -> earliest date_created

    const opps = await fetchAllPages(
      `https://api.close.com/api/v1/opportunity/?pipeline_id=${pipelineId}&_fields=lead_id,date_created`,
      headers
    );
    for (const opp of opps) {
      const leadId = opp.lead_id as string;
      const dateCreated = opp.date_created as string;
      if (!leadId) continue;
      inboundLeadIds.add(leadId);
      // Track earliest opportunity creation date per lead
      const existing = leadCreatedDates.get(leadId);
      if (!existing || dateCreated < existing) {
        leadCreatedDates.set(leadId, dateCreated);
      }
    }

    console.log(
      `[STL] Found ${inboundLeadIds.size} leads in Inbound Pipeline`
    );

    // ═══════════════════════════════════════════
    // 3. Fetch lead details for creation dates
    //    (opportunity date_created may differ from lead date_created)
    // ═══════════════════════════════════════════
    // Fetch actual lead creation dates for the inbound leads
    for (const leadId of Array.from(inboundLeadIds)) {
      try {
        const res = await fetch(
          `https://api.close.com/api/v1/lead/${leadId}/?_fields=date_created`,
          { headers }
        );
        const lead = await res.json();
        if (lead.date_created) {
          leadCreatedDates.set(leadId, lead.date_created as string);
        }
      } catch {
        // Keep the opportunity date if lead fetch fails
      }
    }

    // ═══════════════════════════════════════════
    // 4. Fetch all outbound CALL activities
    // ═══════════════════════════════════════════
    const dateFilter =
      start && end
        ? `date_created__gt=${start}T00:00:00&date_created__lt=${end}T23:59:59`
        : "";

    const callsUrl = dateFilter
      ? `https://api.close.com/api/v1/activity/call/?${dateFilter}&direction=outbound&_fields=lead_id,date_created`
      : `https://api.close.com/api/v1/activity/call/?direction=outbound&_fields=lead_id,date_created`;

    const allCalls = await fetchAllPages(callsUrl, headers);

    // Filter calls to ONLY those made to inbound pipeline leads
    const calls = allCalls.filter((c) =>
      inboundLeadIds.has(c.lead_id as string)
    );

    console.log(
      `[STL] ${allCalls.length} total calls, ${calls.length} to inbound leads`
    );

    // ═══════════════════════════════════════════
    // 5. Build call maps for inbound leads only
    // ═══════════════════════════════════════════
    const callsByLead = new Map<
      string,
      { firstCall: string; callCount: number }
    >();

    for (const call of calls) {
      const leadId = call.lead_id as string;
      const callDate = call.date_created as string;
      if (!leadId || !callDate) continue;

      const existing = callsByLead.get(leadId);
      if (!existing || callDate < existing.firstCall) {
        callsByLead.set(leadId, {
          firstCall: callDate,
          callCount: (existing?.callCount ?? 0) + 1,
        });
      } else {
        existing.callCount++;
      }
    }

    // ═══════════════════════════════════════════
    // 6. Calculate speed-to-lead (in-hours only)
    //    and avg contact attempts (ALL inbound leads)
    // ═══════════════════════════════════════════
    let inHoursTotal = 0;
    let inHoursWithin5Min = 0;
    let afterHoursTotal = 0;
    const responseTimesInHours: number[] = [];
    let totalContactAttempts = 0;

    for (const leadId of Array.from(inboundLeadIds)) {
      const leadCreated = leadCreatedDates.get(leadId);
      if (!leadCreated) continue;

      // Count calls to this lead (for avg contact attempts across ALL inbound leads)
      const callData = callsByLead.get(leadId);
      totalContactAttempts += callData?.callCount ?? 0;

      const inHours = isInHoursUK(leadCreated);

      if (!inHours) {
        afterHoursTotal++;
        continue;
      }

      // In-hours lead — counts toward speed-to-lead
      inHoursTotal++;

      if (callData) {
        const leadTime = new Date(leadCreated).getTime();
        const firstCallTime = new Date(callData.firstCall).getTime();
        const diffMinutes = (firstCallTime - leadTime) / (1000 * 60);

        if (diffMinutes >= 0) {
          responseTimesInHours.push(diffMinutes);
          if (diffMinutes <= 5) inHoursWithin5Min++;
        }
      }
    }

    // ═══════════════════════════════════════════
    // 7. Calculate KPI values
    // ═══════════════════════════════════════════
    const speedToLeadPct =
      inHoursTotal > 0 ? (inHoursWithin5Min / inHoursTotal) * 100 : null;

    const avgResponseTimeInHours =
      responseTimesInHours.length > 0
        ? responseTimesInHours.reduce((a, b) => a + b, 0) /
          responseTimesInHours.length
        : null;

    // Avg contact attempts = total calls ÷ ALL inbound pipeline leads
    const avgContactAttempts =
      inboundLeadIds.size > 0
        ? totalContactAttempts / inboundLeadIds.size
        : null;

    // Avg contact attempts per day = avg contact attempts ÷ working days
    // (calculated after workingDays is computed below)

    // ═══════════════════════════════════════════
    // 8. Dials per day metrics
    // ═══════════════════════════════════════════
    let workingDays = 1;
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      let days = 0;
      const current = new Date(s);
      while (current <= e) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) days++;
        current.setDate(current.getDate() + 1);
      }
      workingDays = Math.max(days, 1);
    }

    const avgContactAttemptsPerDay =
      avgContactAttempts !== null && workingDays > 0
        ? avgContactAttempts / workingDays
        : null;

    const totalCalls = calls.length;
    const personalDialsPerDay =
      workingDays > 0 ? totalCalls / workingDays : null;

    const uniqueLeadsContacted = callsByLead.size;
    const officeDialsPerDay =
      workingDays > 0 && uniqueLeadsContacted > 0
        ? totalCalls / workingDays
        : null;

    const result = {
      speed_to_lead: {
        in_hours: {
          total: inHoursTotal,
          within_5_min: inHoursWithin5Min,
          percentage: speedToLeadPct,
          avg_response_minutes: avgResponseTimeInHours,
        },
        after_hours: {
          total: afterHoursTotal,
        },
        avg_contact_attempts: avgContactAttempts,
        avg_contact_attempts_per_day: avgContactAttemptsPerDay,
        total_leads: inboundLeadIds.size,
        leads_contacted: uniqueLeadsContacted,
      },
      dials: {
        total_calls: totalCalls,
        working_days: workingDays,
        personal_dials_per_day: personalDialsPerDay,
        office_dials_per_day: officeDialsPerDay,
        unique_leads_contacted: uniqueLeadsContacted,
      },
    };

    console.log("[STL] Result:", JSON.stringify(result, null, 2));

    setCache(cacheKey, result);
    return NextResponse.json(result);
  } catch (err) {
    console.error("[STL] Error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
