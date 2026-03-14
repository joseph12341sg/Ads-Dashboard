import { NextResponse } from "next/server";

export async function GET() {
  const adAccountId = process.env.META_AD_ACCOUNT_ID;
  const accessToken = process.env.META_ACCESS_TOKEN;

  if (!adAccountId || !accessToken) {
    return NextResponse.json(
      { success: false, error: "Meta API credentials not configured" },
      { status: 500 }
    );
  }

  try {
    const url = new URL(
      `https://graph.facebook.com/v19.0/${adAccountId}/campaigns`
    );
    url.searchParams.set("fields", "id,name,status,objective");
    url.searchParams.set("limit", "100");
    url.searchParams.set("access_token", accessToken);

    const res = await fetch(url.toString());
    const json = await res.json();

    if (json.error) {
      return NextResponse.json(
        { success: false, error: json.error.message || "Meta API error" },
        { status: 400 }
      );
    }

    const campaigns = (json.data || []).map(
      (c: { id: string; name: string; status: string; objective: string }) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        objective: c.objective,
      })
    );

    return NextResponse.json({ success: true, campaigns });
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
