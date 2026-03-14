import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date");

  if (!date) {
    return NextResponse.json(
      { success: false, error: "Missing date parameter" },
      { status: 400 }
    );
  }

  const apiKey = process.env.CLOSE_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { success: false, error: "Close API key not configured" },
      { status: 500 }
    );
  }

  try {
    const headers = {
      Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
      "Content-Type": "application/json",
    };

    const url = `https://api.close.com/api/v1/activity/status_change/opportunity/?date_created__gt=${date}T00:00:00&date_created__lt=${date}T23:59:59&new_status_label=Call%201%20-%20Discovery%20Scheduled&_limit=0`;

    const res = await fetch(url, { headers });
    const json = await res.json();

    if (json.error) {
      return NextResponse.json(
        { success: false, error: json.error },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      calls: json.total_results ?? 0,
      date,
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
