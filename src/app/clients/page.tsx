"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/clients/types";
import { calculateClientKpis, getClientsRenewingSoon } from "@/lib/clients/calculations";
import { formatClientCurrency } from "@/lib/clients/formatters";
import ClientHeader from "@/components/clients/ClientHeader";
import ClientKpiRow from "@/components/clients/ClientKpiRow";
import RenewalBanner from "@/components/clients/RenewalBanner";
import ClientTable from "@/components/clients/ClientTable";
import IntakeLinkModal from "@/components/clients/IntakeLinkModal";

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const supabase = createClient();

  const fetchClients = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("clients")
      .select("*")
      .order("status", { ascending: true })
      .order("business_name", { ascending: true });
    setClients((data ?? []) as Client[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    fetchClients();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const kpis = calculateClientKpis(clients);
  const renewingSoon = getClientsRenewingSoon(clients);

  async function handleGenerateLink(): Promise<string> {
    const token = crypto.randomUUID();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { error } = await supabase.from("intake_links").insert({
      user_id: user.id,
      token,
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      used: false,
    });
    if (error) throw error;

    const baseUrl = window.location.origin;
    return `${baseUrl}/intake/${token}`;
  }

  return (
    <div className="min-h-screen bg-[#0E1116]">
      <ClientHeader onGenerateLink={() => setModalOpen(true)} />

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
        <ClientKpiRow
          loading={loading}
          items={[
            {
              label: "Active Clients",
              value: String(kpis.active_count),
              color: "#F2F4F8",
              subtitle: "Currently active",
            },
            {
              label: "MRR",
              value: formatClientCurrency(kpis.mrr),
              color: "#4ADE80",
              subtitle: "Monthly recurring revenue",
            },
            {
              label: "Total Client Value",
              value: formatClientCurrency(kpis.total_value),
              color: "#FBBF24",
              subtitle: "MRR x12 + Upfront",
            },
            {
              label: "Avg Client Value",
              value: formatClientCurrency(kpis.avg_value),
              color: "#A855F7",
              subtitle: "Total \u00f7 Active Clients",
            },
          ]}
        />

        {!loading && <RenewalBanner clients={renewingSoon} />}

        <ClientTable clients={clients} loading={loading} />
      </main>

      <IntakeLinkModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onGenerate={handleGenerateLink}
      />
    </div>
  );
}
