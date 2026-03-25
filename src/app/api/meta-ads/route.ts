import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Missing date parameter" },
      { status: 400 }
    );
  }

  const accountId = process.env.META_AD_ACCOUNT_ID;
  const campaignId = process.env.META_CAMPAIGN_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!accountId || !accessToken) {
    return NextResponse.json(
      { success: false, error: "Meta API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const timeRange = JSON.stringify({ since: date, until: date });

    // Try campaign-level first if campaign ID is set, otherwise use account-level
    const endpoint = campaignId
      ? `https://graph.facebook.com/v21.0/${campaignId}/insights`
      : `https://graph.facebook.com/v21.0/${accountId}/insights`;

    const url = new URL(endpoint);
    url.searchParams.set(
      "fields",
      "spend,inline_link_clicks,actions,cost_per_action_type"
    );
    url.searchParams.set("time_range", timeRange);
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.error) {
      return NextResponse.json(
        {
          success: false,
          error: json.error.message || "Meta API error",
        },
        { status: 400 }
      );
    }

    if (!json.data || json.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error:
            "No ad data found for this date. Ads may not have been running.",
        },
        { status: 200 }
      );
    }

    const row = json.data[0];

    const amount_spent = parseFloat(row.spend || "0");
    const link_clicks = parseInt(row.inline_link_clicks || "0", 10);

    let leads = 0;
    if (row.actions && Array.isArray(row.actions)) {
      const leadAction = row.actions.find(
        (a: { action_type: string; value: string }) =>
          a.action_type === "lead"
      );
      if (leadAction) leads = parseInt(leadAction.value, 10);
    }

    let cpl = 0;
    if (row.cost_per_action_type && Array.isArray(row.cost_per_action_type)) {
      const cplAction = row.cost_per_action_type.find(
        (a: { action_type: string; value: string }) =>
          a.action_type === "lead"
      );
      if (cplAction) cpl = parseFloat(cplAction.value);
    }

    return NextResponse.json({
      success: true,
      data: { amount_spent, link_clicks, leads, cpl },
    });
  } catch (err) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
