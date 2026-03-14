"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ClientForm, { type ClientFormData } from "@/components/clients/ClientForm";

export default function NewClientPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const supabase = createClient();

  async function handleSubmit(data: ClientFormData, logoFile: File | null) {
    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const insertData: Record<string, unknown> = {
        user_id: user.id,
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
      };

      const { data: newClient, error } = await supabase
        .from("clients")
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      // Upload logo if provided
      if (logoFile && newClient) {
        const ext = logoFile.name.split(".").pop() || "png";
        const path = `${newClient.id}/logo.${ext}`;
        const { error: uploadErr } = await supabase.storage
          .from("client-logos")
          .upload(path, logoFile, { upsert: true });

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

      router.push(`/clients/${newClient.id}`);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create client");
      setSaving(false);
    }
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
          Add new client
        </h1>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-6">
        <ClientForm
          onSubmit={handleSubmit}
          onCancel={() => router.push("/clients")}
          submitLabel="Create client"
          loading={saving}
        />
      </main>
    </div>
  );
}
