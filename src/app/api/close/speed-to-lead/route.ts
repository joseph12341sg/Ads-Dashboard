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
  // Convert to UK time
  const date = new Date(isoDate);
  const ukTime = new Date(
    date.toLocaleString("en-US", { timeZone: "Europe/London" })
  );
  const hour = ukTime.getHours();
  return hour >= 10 && hour < 20; // 10am to 8pm
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
    // Build date filters
    const dateFilter =
      start && end
        ? `date_created__gt=${start}T00:00:00&date_created__lt=${end}T23:59:59`
        : "";

    // ═══════════════════════════════════════════
    // 1. Fetch all LEADS created in the period
    // ═══════════════════════════════════════════
    const leadsUrl = dateFilter
      ? `https://api.close.com/api/v1/lead/?${dateFilter}&_fields=id,date_created,display_name`
      : `https://api.close.com/api/v1/lead/?_fields=id,date_created,display_name`;

    const leads = await fetchAllPages(leadsUrl, headers);
    console.log(`[STL] Found ${leads.length} leads`);

    // ═══════════════════════════════════════════
    // 2. Fetch all outbound CALL activities in the period
    //    These are linked to leads via lead_id
    // ═══════════════════════════════════════════
    const callsUrl = dateFilter
      ? `https://api.close.com/api/v1/activity/call/?${dateFilter}&direction=outbound&_fields=lead_id,date_created,duration`
      : `https://api.close.com/api/v1/activity/call/?direction=outbound&_fields=lead_id,date_created,duration`;

    const calls = await fetchAllPages(callsUrl, headers);
    console.log(`[STL] Found ${calls.length} outbound calls`);

    // ═══════════════════════════════════════════
    // 3. Build a map: lead_id -> all call timestamps + count
    // ═══════════════════════════════════════════
    const callsByLead = new Map<
      string,
      { firstCall: string; callCount: number }
    >();

    // Also count ALL calls per lead (not just in period) for avg contacts
    const totalCallsByLead = new Map<string, number>();

    for (const call of calls) {
      const leadId = call.lead_id as string;
      const callDate = call.date_created as string;
      if (!leadId || !callDate) continue;

      totalCallsByLead.set(leadId, (totalCallsByLead.get(leadId) ?? 0) + 1);

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
    // 4. Calculate speed-to-lead metrics
    // ═══════════════════════════════════════════
    let inHoursTotal = 0;
    let inHoursWithin5Min = 0;
    let afterHoursTotal = 0;
    let afterHoursWithin5Min = 0;
    const responseTimesInHours: number[] = [];
    const responseTimesAfterHours: number[] = [];
    let leadsWithCalls = 0;
    let totalContactAttempts = 0;

    for (const lead of leads) {
      const leadId = lead.id as string;
      const leadCreated = lead.date_created as string;
      if (!leadId || !leadCreated) continue;

      const callData = callsByLead.get(leadId);
      const callCount = totalCallsByLead.get(leadId) ?? 0;

      if (callCount > 0) {
        leadsWithCalls++;
        totalContactAttempts += callCount;
      }

      const inHours = isInHoursUK(leadCreated);

      if (callData) {
        const leadTime = new Date(leadCreated).getTime();
        const firstCallTime = new Date(callData.firstCall).getTime();
        const diffMinutes = (firstCallTime - leadTime) / (1000 * 60);

        // Only count positive diffs (call after lead creation)
        if (diffMinutes >= 0) {
          if (inHours) {
            inHoursTotal++;
            responseTimesInHours.push(diffMinutes);
            if (diffMinutes <= 5) inHoursWithin5Min++;
          } else {
            afterHoursTotal++;
            responseTimesAfterHours.push(diffMinutes);
            if (diffMinutes <= 5) afterHoursWithin5Min++;
          }
        }
      } else {
        // Lead exists but no call yet — still counts toward total
        if (inHours) {
          inHoursTotal++;
        } else {
          afterHoursTotal++;
        }
      }
    }

    // ═══════════════════════════════════════════
    // 5. Calculate KPI values
    // ═══════════════════════════════════════════
    const speedToLeadPct =
      inHoursTotal > 0 ? (inHoursWithin5Min / inHoursTotal) * 100 : null;

    const avgResponseTimeInHours =
      responseTimesInHours.length > 0
        ? responseTimesInHours.reduce((a, b) => a + b, 0) /
          responseTimesInHours.length
        : null;

    const avgResponseTimeAfterHours =
      responseTimesAfterHours.length > 0
        ? responseTimesAfterHours.reduce((a, b) => a + b, 0) /
          responseTimesAfterHours.length
        : null;

    const avgContactAttempts =
      leadsWithCalls > 0 ? totalContactAttempts / leadsWithCalls : null;

    // ═══════════════════════════════════════════
    // 6. Calculate dials per day metrics
    //    Use the date range to determine number of working days
    // ═══════════════════════════════════════════
    let workingDays = 1;
    if (start && end) {
      const s = new Date(start);
      const e = new Date(end);
      let days = 0;
      const current = new Date(s);
      while (current <= e) {
        const day = current.getDay();
        if (day !== 0 && day !== 6) days++; // Exclude weekends
        current.setDate(current.getDate() + 1);
      }
      workingDays = Math.max(days, 1);
    }

    const totalCalls = calls.length;
    // Personal dials = total calls / working days (per person assumption)
    const personalDialsPerDay =
      workingDays > 0 ? totalCalls / workingDays : null;

    // Office dials = total unique leads contacted per day
    const uniqueLeadsContacted = callsByLead.size;
    const officeDialsPerDay =
      workingDays > 0 && uniqueLeadsContacted > 0
        ? totalCalls / workingDays / Math.max(uniqueLeadsContacted, 1) * uniqueLeadsContacted
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
          within_5_min: afterHoursWithin5Min,
          percentage:
            afterHoursTotal > 0
              ? (afterHoursWithin5Min / afterHoursTotal) * 100
              : null,
          avg_response_minutes: avgResponseTimeAfterHours,
        },
        avg_contact_attempts: avgContactAttempts,
        total_leads: leads.length,
        leads_contacted: leadsWithCalls,
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
