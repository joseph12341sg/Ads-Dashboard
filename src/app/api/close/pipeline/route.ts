import { NextRequest, NextResponse } from "next/server";

function getHeaders() {
  const apiKey = process.env.CLOSE_API_KEY;
  if (!apiKey) return null;
  return {
    Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
    "Content-Type": "application/json",
  };
}

async function fetchPaginated(
  baseUrl: string,
  headers: Record<string, string>
): Promise<Record<string, unknown>[]> {
  const results: Record<string, unknown>[] = [];
  let skip = 0;
  const limit = 100;

  while (true) {
    const separator = baseUrl.includes("?") ? "&" : "?";
    const url = `${baseUrl}${separator}_skip=${skip}&_limit=${limit}`;
    const res = await fetch(url, { headers });
    const json = await res.json();

    if (json.error) throw new Error(json.error);
    if (!json.data || json.data.length === 0) break;

    results.push(...json.data);
    if (!json.has_more) break;
    skip += limit;
  }

  return results;
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

  if (!start || !end) {
    return NextResponse.json(
      { error: "Missing start or end date" },
      { status: 400 }
    );
  }

  try {
    // 1. Fetch dials count (outbound calls)
    const dialsRes = await fetch(
      `https://api.close.com/api/v1/activity/call/?date_created__gt=${start}T00:00:00&date_created__lt=${end}T23:59:59&direction=outbound&_limit=0`,
      { headers }
    );
    const dialsJson = await dialsRes.json();
    const total_dials = dialsJson.total_results ?? 0;

    // 2. Fetch lead status changes
    const leadChanges = await fetchPaginated(
      `https://api.close.com/api/v1/activity/status_change/lead/?date_created__gt=${start}T00:00:00&date_created__lt=${end}T23:59:59`,
      headers
    );

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
    const oppChanges = await fetchPaginated(
      `https://api.close.com/api/v1/activity/status_change/opportunity/?date_created__gt=${start}T00:00:00&date_created__lt=${end}T23:59:59`,
      headers
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
      follow_up_scheduled: 0,
      nurture: 0,
    };

    for (const change of oppChanges) {
      const newLabel = change.new_status_label as string;
      const oldLabel = change.old_status_label as string;
      const newType = change.new_status_type as string;

      if (newLabel === "Call 1 - Discovery Scheduled")
        closer.call_1_scheduled++;
      if (newLabel === "Call 1 - No Show") closer.call_1_no_show++;
      if (
        newLabel === "Call 2 - Close Scheduled" &&
        oldLabel === "Call 1 - Discovery Scheduled"
      )
        closer.call_1_sat++;
      if (newLabel === "Call 2 - Close Scheduled") closer.call_2_scheduled++;
      if (newLabel === "Call 2 - No Show") closer.call_2_no_show++;
      if (
        oldLabel === "Call 2 - Close Scheduled" &&
        (newType === "won" || newType === "lost")
      )
        closer.call_2_sat++;
      if (newType === "won") closer.closed_won++;
      if (newType === "lost") closer.closed_lost++;
      if (newLabel === "Follow Up - Scheduled") closer.follow_up_scheduled++;
      if (newLabel === "Nurture") closer.nurture++;
    }

    // Appointments booked = call 1 scheduled (leads that made it to closer pipeline)
    const appointments_booked = closer.call_1_scheduled;

    // 4. Fetch won opportunities for revenue
    const wonOpps = await fetchPaginated(
      `https://api.close.com/api/v1/opportunity/?status_type=won&date_won__gt=${start}&date_won__lt=${end}&_fields=value,lead_name,date_won,status_label`,
      headers
    );

    let cash_collected = 0;
    for (const opp of wonOpps) {
      cash_collected += (opp.value as number) ?? 0;
    }
    cash_collected = Math.round(cash_collected / 100); // cents to pounds

    // 5. Fetch active pipeline value
    const activePipeRes = await fetch(
      `https://api.close.com/api/v1/opportunity/?status_type=active&_fields=value&_limit=0`,
      { headers }
    );
    const activePipeJson = await activePipeRes.json();
    const pipeline_value = Math.round(
      (activePipeJson.total_results ?? 0) > 0
        ? (activePipeJson.data ?? []).reduce(
            (sum: number, o: { value?: number }) => sum + (o.value ?? 0),
            0
          ) / 100
        : 0
    );

    // For pipeline value with _limit=0 we can't sum data, so fetch all active opps
    let actualPipelineValue = pipeline_value;
    if (activePipeJson.total_results > 0 && (!activePipeJson.data || activePipeJson.data.length === 0)) {
      const allActive = await fetchPaginated(
        `https://api.close.com/api/v1/opportunity/?status_type=active&_fields=value`,
        headers
      );
      actualPipelineValue = Math.round(
        allActive.reduce(
          (sum, o) => sum + ((o.value as number) ?? 0),
          0
        ) / 100
      );
    }

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

    return NextResponse.json({
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
        pipeline_value: actualPipelineValue || pipeline_value,
        won_deals_count: wonOpps.length,
      },
      recent_deals,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
