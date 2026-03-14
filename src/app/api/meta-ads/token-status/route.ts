import { NextResponse } from "next/server";

export async function GET() {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const appId = process.env.META_APP_ID;
  const appSecret = process.env.META_APP_SECRET;

  if (!accessToken || !appId || !appSecret) {
    return NextResponse.json(
      { valid: false, expires_at: null, days_remaining: null },
      { status: 200 }
    );
  }

  try {
    const url = new URL("https://graph.facebook.com/debug_token");
    url.searchParams.set("input_token", accessToken);
    url.searchParams.set("access_token", `${appId}|${appSecret}`);

    const res = await fetch(url.toString());
    const json = await res.json();

    if (!json.data) {
      return NextResponse.json({
        valid: false,
        expires_at: null,
        days_remaining: null,
      });
    }

    const { is_valid, expires_at } = json.data;

    if (!is_valid) {
      return NextResponse.json({
        valid: false,
        expires_at: null,
        days_remaining: null,
      });
    }

    // expires_at === 0 means the token never expires
    if (expires_at === 0) {
      return NextResponse.json({
        valid: true,
        expires_at: null,
        days_remaining: null,
      });
    }

    const expiresDate = new Date(expires_at * 1000);
    const now = new Date();
    const daysRemaining = Math.floor(
      (expiresDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      valid: true,
      expires_at: expiresDate.toISOString(),
      days_remaining: daysRemaining,
    });
  } catch (err) {
    return NextResponse.json(
      {
        valid: false,
        expires_at: null,
        days_remaining: null,
      },
      { status: 200 }
    );
  }
}
