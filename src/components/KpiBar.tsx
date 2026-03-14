"use client";

import { useEffect, useState } from "react";
import KpiCard from "./KpiCard";
import { KPI_DATA } from "@/lib/constants";
import { createClient } from "@/lib/supabase/client";

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

export default function KpiBar() {
  const [leadsToday, setLeadsToday] = useState<number | null>(null);
  const [leadsTrend, setLeadsTrend] = useState<{ text: string; direction: "up" | "down" | "neutral" }>({
    text: "",
    direction: "neutral",
  });
  const [sparklinePath, setSparklinePath] = useState("");

  useEffect(() => {
    async function fetchLeads() {
      try {
        const supabase = createClient();
        const today = new Date().toISOString().split("T")[0];
        const fourteenDaysAgo = new Date();
        fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 13);
        const since = fourteenDaysAgo.toISOString().split("T")[0];

        const { data } = await supabase
          .from("meta_ads_daily")
          .select("date, leads")
          .gte("date", since)
          .lte("date", today)
          .order("date", { ascending: true });

        if (!data) return;

        // Today's leads
        const todayEntry = data.find((r) => r.date === today);
        const todayLeads = todayEntry ? todayEntry.leads : 0;
        setLeadsToday(todayLeads);

        // Yesterday's leads for trend
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        const yesterdayEntry = data.find((r) => r.date === yesterdayStr);

        if (yesterdayEntry) {
          const diff = todayLeads - yesterdayEntry.leads;
          if (diff > 0) {
            setLeadsTrend({ text: `+${diff} vs yesterday`, direction: "up" });
          } else if (diff < 0) {
            setLeadsTrend({ text: `${diff} vs yesterday`, direction: "down" });
          } else {
            setLeadsTrend({ text: "No change", direction: "neutral" });
          }
        } else {
          setLeadsTrend({ text: "No change", direction: "neutral" });
        }

        // Sparkline from last 14 days
        const leadsValues = data.map((r) => r.leads);
        if (leadsValues.length > 0) {
          setSparklinePath(generateSparklinePath(leadsValues));
        }
      } catch {
        // Silently fail — card shows defaults
      }
    }

    fetchLeads();
  }, []);

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {KPI_DATA.map((kpi, i) => {
        // Override the 4th card (index 3) with live leads data
        if (i === 3) {
          return (
            <KpiCard
              key={i}
              label="Leads Today"
              value={leadsToday !== null ? String(leadsToday) : "—"}
              trend={leadsTrend.text || "Loading..."}
              direction={leadsTrend.direction}
              color="#A855F7"
              sparklinePath={sparklinePath}
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
