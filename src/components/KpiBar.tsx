"use client";

import { useEffect, useState } from "react";
import KpiCard from "./KpiCard";
import { KPI_DATA } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";
import type { Client } from "@/lib/clients/types";

function generateSparklinePath(values: number[]): string {
  if (values.length === 0) return "";
  const max = Math.max(...values, 1);
  const width = 50;
  const height = 20;
  const step = values.length > 1 ? width / (values.length - 1) : 0;

  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 2) - 1;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

function formatGbp(value: number): string {
  if (value >= 1000) {
    const k = value / 1000;
    return "£" + k.toLocaleString("en-GB", { minimumFractionDigits: k % 1 === 0 ? 0 : 1, maximumFractionDigits: 1 }) + "k";
  }
  return "£" + value.toLocaleString("en-GB", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export default function KpiBar() {
  // Cost per booked call (existing)
  const [costPerCall, setCostPerCall] = useState<number | null>(null);
  const [cpcTrend, setCpcTrend] = useState<{ text: string; direction: "up" | "down" | "neutral" }>({
    text: "",
    direction: "neutral",
  });
  const [cpcSparkline, setCpcSparkline] = useState("");

  // Revenue from Close CRM
  const [revenue, setRevenue] = useState<number | null>(null);
  const [wonDeals, setWonDeals] = useState<number | null>(null);

  // Clients & MRR from Supabase
  const [activeClients, setActiveClients] = useState<number | null>(null);
  const [mrr, setMrr] = useState<number | null>(null);

  useEffect(() => {
    // Fetch cost per booked call from Supabase
    async function fetchCostPerCall() {
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        const since = fourteenDaysAgo.toISOString().split("T")[0];

        const { data } = await supabase
          .from("meta_ads_daily")
          .select("date, amount_spent, calls")
          .gte("date", since)
          .lte("date", today)
          .order("date", { ascending: true });

        if (!data || data.length === 0) return;

        const dailyCpc = data.map((r) => ({
          date: r.date,
          cpc: r.calls > 0 ? Number(r.amount_spent) / r.calls : null,
        }));

        const totalSpend = data.reduce((s, r) => s + Number(r.amount_spent), 0);
        const totalCalls = data.reduce((s, r) => s + r.calls, 0);
        const overallCpc = totalCalls > 0 ? totalSpend / totalCalls : null;
        setCostPerCall(overallCpc);

        const last7 = data.slice(-7);
        const prior7 = data.slice(-14, -7);

        if (last7.length > 0 && prior7.length > 0) {
          const last7Spend = last7.reduce((s, r) => s + Number(r.amount_spent), 0);
          const last7Calls = last7.reduce((s, r) => s + r.calls, 0);
          const prior7Spend = prior7.reduce((s, r) => s + Number(r.amount_spent), 0);
          const prior7Calls = prior7.reduce((s, r) => s + r.calls, 0);

          const last7Cpc = last7Calls > 0 ? last7Spend / last7Calls : null;
          const prior7Cpc = prior7Calls > 0 ? prior7Spend / prior7Calls : null;

          if (last7Cpc !== null && prior7Cpc !== null && prior7Cpc > 0) {
            const diff = last7Cpc - prior7Cpc;
            const pct = ((diff / prior7Cpc) * 100).toFixed(1);
            if (diff < 0) {
              setCpcTrend({ text: `${pct}% vs prior wk`, direction: "up" });
            } else if (diff > 0) {
              setCpcTrend({ text: `+${pct}% vs prior wk`, direction: "down" });
            } else {
              setCpcTrend({ text: "No change", direction: "neutral" });
            }
          }
        }

        const sparkValues = dailyCpc.map((d) => d.cpc ?? 0);
        if (sparkValues.some((v) => v > 0)) {
          setCpcSparkline(generateSparklinePath(sparkValues));
        }
      } catch {
        // Silently fail
      }
    }

    // Fetch revenue from Close CRM pipeline API
    async function fetchRevenue() {
      try {
        const res = await fetch("/api/close/pipeline");
        if (res.ok) {
          const data = await res.json();
          setRevenue(data.revenue?.cash_collected ?? null);
          setWonDeals(data.revenue?.won_deals_count ?? null);
        }
      } catch {
        // Silently fail
      }
    }

    // Fetch clients & MRR from Supabase
    async function fetchClients() {
      try {
        const supabase = createClient();
        const { data } = await supabase
          .from("clients")
          .select("status, value_type, value_amount")
          .eq("status", "active");

        if (data) {
          const clients = data as Pick<Client, "status" | "value_type" | "value_amount">[];
          setActiveClients(clients.length);
          const mrrTotal = clients
            .filter((c) => c.value_type === "mrr")
            .reduce((sum, c) => sum + Number(c.value_amount), 0);
          setMrr(mrrTotal);
        }
      } catch {
        // Silently fail
      }
    }

    fetchCostPerCall();
    fetchRevenue();
    fetchClients();
  }, []);

  function formatCpc(value: number | null): string {
    if (value === null) return "—";
    return "£" + value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {KPI_DATA.map((kpi, i) => {
        // Card 0: Revenue — live from Close CRM
        if (i === 0) {
          return (
            <KpiCard
              key={i}
              label="Revenue"
              value={revenue !== null ? formatGbp(revenue) : "—"}
              trend={wonDeals !== null ? `${wonDeals} deal${wonDeals !== 1 ? "s" : ""} closed` : "Loading..."}
              direction="up"
              color="#4ADE80"
              sparklinePath={kpi.sparklinePath}
            />
          );
        }

        // Card 1: MRR — live from Supabase clients
        if (i === 1) {
          return (
            <KpiCard
              key={i}
              label="MRR"
              value={mrr !== null ? formatGbp(mrr) : "—"}
              trend="Monthly recurring revenue"
              direction="neutral"
              color="#4ADE80"
              sparklinePath={kpi.sparklinePath}
            />
          );
        }

        // Card 2: Active Clients — live from Supabase
        if (i === 2) {
          return (
            <KpiCard
              key={i}
              label="Active Clients"
              value={activeClients !== null ? String(activeClients) : "—"}
              trend="Currently active"
              direction="neutral"
              color="#FBBF24"
              sparklinePath={kpi.sparklinePath}
            />
          );
        }

        // Card 3: Cost / Booked Call — live from Supabase
        if (i === 3) {
          return (
            <KpiCard
              key={i}
              label="Cost / Booked Call"
              value={formatCpc(costPerCall)}
              trend={cpcTrend.text || "Loading..."}
              direction={cpcTrend.direction}
              color="#A855F7"
              sparklinePath={cpcSparkline}
            />
          );
        }

        return (
          <KpiCard
            key={i}
            label={kpi.label}
            value={kpi.value}
            trend={kpi.trend}
            direction={kpi.direction}
            color={kpi.color}
            sparklinePath={kpi.sparklinePath}
            placeholder={"placeholder" in kpi ? kpi.placeholder : undefined}
          />
        );
      })}
    </section>
  );
}
