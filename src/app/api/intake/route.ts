import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(request: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 }
    );
  }

  try {
    const formData = await request.formData();
    const token = formData.get("token") as string;

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      );
    }

    // Validate token
    const { data: link, error: linkErr } = await supabase
      .from("intake_links")
      .select("*")
      .eq("token", token)
      .single();

    if (linkErr || !link) {
      return NextResponse.json(
        { error: "Invalid link" },
        { status: 404 }
      );
    }

    if (link.used) {
      return NextResponse.json(
        { error: "This form has already been submitted" },
        { status: 400 }
      );
    }

    if (new Date(link.expires_at) < new Date()) {
      return NextResponse.json(
        { error: "This link has expired" },
        { status: 400 }
      );
    }

    // Build client record
    const clientData: Record<string, unknown> = {
      user_id: link.user_id,
      status: "active",
      value_type: "mrr",
      value_amount: 0,
      start_date: new Date().toISOString().split("T")[0],
      intake_completed: true,
      business_name: formData.get("business_name") as string,
      main_contact: (formData.get("main_contact") as string) || null,
      phone: (formData.get("phone") as string) || null,
      business_address: (formData.get("business_address") as string) || null,
      avg_fee_per_client: formData.get("avg_fee_per_client")
        ? parseFloat(formData.get("avg_fee_per_client") as string)
        : null,
      min_annual_revenue: formData.get("min_annual_revenue")
        ? parseFloat(formData.get("min_annual_revenue") as string)
        : null,
      max_annual_revenue: formData.get("max_annual_revenue")
        ? parseFloat(formData.get("max_annual_revenue") as string)
        : null,
      ideal_customer_profile:
        (formData.get("ideal_customer_profile") as string) || null,
      main_service_focus:
        (formData.get("main_service_focus") as string) || null,
      agreed_daily_ad_spend: formData.get("agreed_daily_ad_spend")
        ? parseFloat(formData.get("agreed_daily_ad_spend") as string)
        : null,
      brand_colour_primary:
        (formData.get("brand_colour_primary") as string) || null,
      brand_colour_secondary:
        (formData.get("brand_colour_secondary") as string) || null,
      brand_font: (formData.get("brand_font") as string) || null,
      additional_notes:
        (formData.get("additional_notes") as string) || null,
    };

    if (!clientData.business_name) {
      return NextResponse.json(
        { error: "Business name is required" },
        { status: 400 }
      );
    }

    // Insert client
    const { data: newClient, error: insertErr } = await supabase
      .from("clients")
      .insert(clientData)
      .select()
      .single();

    if (insertErr) {
      return NextResponse.json(
        { error: insertErr.message },
        { status: 500 }
      );
    }

    // Upload logo if provided
    const logoFile = formData.get("logo") as File | null;
    if (logoFile && logoFile.size > 0) {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `${newClient.id}/logo.${ext}`;
      const arrayBuffer = await logoFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const { error: uploadErr } = await supabase.storage
        .from("client-logos")
        .upload(path, buffer, {
          contentType: logoFile.type,
          upsert: true,
        });

      if (!uploadErr) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("client-logos").getPublicUrl(path);

        await supabase
          .from("clients")
          .update({ logo_url: publicUrl })
          .eq("id", newClient.id);
      }
    }

    // Mark intake link as used
    await supabase
      .from("intake_links")
      .update({ used: true, client_id: newClient.id })
      .eq("id", link.id);

    return NextResponse.json({ success: true, client_id: newClient.id });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service role key not configured" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { user_id } = body;

    if (!user_id) {
      return NextResponse.json(
        { error: "user_id is required" },
        { status: 400 }
      );
    }

    const token = crypto.randomUUID();
    const expires_at = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    const { error } = await supabase.from("intake_links").insert({
      user_id,
      token,
      expires_at,
      used: false,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ token });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required" }, { status: 400 });
  }

  const supabase = getServiceClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Service not configured" },
      { status: 500 }
    );
  }

  const { data: link, error } = await supabase
    .from("intake_links")
    .select("*")
    .eq("token", token)
    .single();

  if (error || !link) {
    return NextResponse.json({ valid: false, reason: "invalid" });
  }

  if (link.used) {
    return NextResponse.json({ valid: false, reason: "used" });
  }

  if (new Date(link.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: "expired" });
  }

  return NextResponse.json({ valid: true });
}
