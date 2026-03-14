import { NextResponse } from "next/server";

export async function GET() {
  const apiKey = process.env.CLOSE_API_KEY;

  if (!apiKey) {
    return NextResponse.json({
      connected: false,
      error: "Close API key not configured",
    });
  }

  try {
    const res = await fetch("https://api.close.com/api/v1/me/", {
      headers: {
        Authorization: `Basic ${Buffer.from(apiKey + ":").toString("base64")}`,
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({
        connected: false,
        error: "Invalid API key or unauthorized",
      });
    }

    const json = await res.json();

    return NextResponse.json({
      connected: true,
      org_name: json.organizations?.[0]?.name ?? "Unknown",
    });
  } catch (err) {
    return NextResponse.json({
      connected: false,
      error: err instanceof Error ? err.message : "Connection failed",
    });
  }
}
