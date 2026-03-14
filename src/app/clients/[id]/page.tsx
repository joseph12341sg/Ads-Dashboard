"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { Client, ClientStatus } from "@/lib/clients/types";
import ClientProfile from "@/components/clients/ClientProfile";
import type { ClientFormData } from "@/components/clients/ClientForm";

export default function ClientDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  const fetchClient = useCallback(async () => {
    const { data } = await supabase
      .from("clients")
      .select("*")
      .eq("id", id)
      .single();
    setClient(data as Client | null);
    setLoading(false);
  }, [id, supabase]);

  useEffect(() => {
    fetchClient();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleUpdate(data: ClientFormData, logoFile: File | null) {
    const updates: Record<string, unknown> = {
      business_name: data.business_name,
      value_type: data.value_type,
      value_amount: parseFloat(data.value_amount) || 0,
      start_date: data.start_date,
      renewal_date: data.renewal_date || null,
      status: data.status,
      phone: data.phone || null,
      main_contact: data.main_contact || null,
      business_address: data.business_address || null,
      avg_fee_per_client: data.avg_fee_per_client
        ? parseFloat(data.avg_fee_per_client)
        : null,
      min_annual_revenue: data.min_annual_revenue
        ? parseFloat(data.min_annual_revenue)
        : null,
      max_annual_revenue: data.max_annual_revenue
        ? parseFloat(data.max_annual_revenue)
        : null,
      ideal_customer_profile: data.ideal_customer_profile || null,
      main_service_focus: data.main_service_focus || null,
      agreed_daily_ad_spend: data.agreed_daily_ad_spend
        ? parseFloat(data.agreed_daily_ad_spend)
        : null,
      brand_colour_primary: data.brand_colour_primary || null,
      brand_colour_secondary: data.brand_colour_secondary || null,
      brand_font: data.brand_font || null,
      additional_notes: data.additional_notes || null,
      updated_at: new Date().toISOString(),
    };

    // Upload logo if provided
    if (logoFile) {
      const ext = logoFile.name.split(".").pop() || "png";
      const path = `${id}/logo.${ext}`;
      const { error: uploadErr } = await supabase.storage
        .from("client-logos")
        .upload(path, logoFile, { upsert: true });

      if (!uploadErr) {
        const {
          data: { publicUrl },
        } = supabase.storage.from("client-logos").getPublicUrl(path);
        updates.logo_url = publicUrl;
      }
    }

    const { error } = await supabase
      .from("clients")
      .update(updates)
      .eq("id", id);

    if (error) throw error;
    await fetchClient();
  }

  async function handleStatusChange(status: ClientStatus) {
    const { error } = await supabase
      .from("clients")
      .update({ status, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) throw error;
    await fetchClient();
  }

  async function handleDelete() {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) throw error;
    router.push("/clients");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
        <div className="animate-pulse text-[#A1A8B3] text-sm">Loading...</div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-[#0E1116] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[#A1A8B3] mb-4">Client not found</p>
          <button
            onClick={() => router.push("/clients")}
            className="text-sm text-[#5B7C99] hover:underline"
          >
            Back to clients
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0E1116]">
      <header
        className="sticky top-0 z-30 px-6 py-3 flex items-center gap-3"
        style={{
          background: "#0E1116",
          borderBottom: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <button
          onClick={() => router.push("/clients")}
          className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Image
          src="/north-star-logo.png"
          alt="North Star Solutions"
          width={28}
          height={28}
          style={{ height: 28, width: "auto" }}
        />
        <h1 className="font-montserrat font-bold text-[18px] text-[#F2F4F8]">
          {client.business_name}
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <ClientProfile
          client={client}
          onUpdate={handleUpdate}
          onStatusChange={handleStatusChange}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
