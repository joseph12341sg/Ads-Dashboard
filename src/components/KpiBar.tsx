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
  const [costPerCall, setCostPerCall] = useState<number | null>(null);
  const [trend, setTrend] = useState<{ text: string; direction: "up" | "down" | "neutral" }>({
    text: "",
    direction: "neutral",
  });
  const [sparklinePath, setSparklinePath] = useState("");

  useEffect(() => {
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

        // Calculate cost per call for each day
        const dailyCpc = data.map((r) => ({
          date: r.date,
          cpc: r.calls > 0 ? Number(r.amount_spent) / r.calls : null,
        }));

        // Overall cost per call (total spend / total calls)
        const totalSpend = data.reduce((s, r) => s + Number(r.amount_spent), 0);
        const totalCalls = data.reduce((s, r) => s + r.calls, 0);
        const overallCpc = totalCalls > 0 ? totalSpend / totalCalls : null;
        setCostPerCall(overallCpc);

        // Trend: compare last 7 days avg vs prior 7 days avg
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
            // Lower cost per call is better → down is good (green), up is bad (red)
            if (diff < 0) {
              setTrend({ text: `${pct}% vs prior wk`, direction: "up" });
            } else if (diff > 0) {
              setTrend({ text: `+${pct}% vs prior wk`, direction: "down" });
            } else {
              setTrend({ text: "No change", direction: "neutral" });
            }
          } else {
            setTrend({ text: "No change", direction: "neutral" });
          }
        } else {
          setTrend({ text: "No change", direction: "neutral" });
        }

        // Sparkline: daily cost per call values (skip days with 0 calls)
        const sparkValues = dailyCpc.map((d) => d.cpc ?? 0);
        if (sparkValues.some((v) => v > 0)) {
          setSparklinePath(generateSparklinePath(sparkValues));
        }
      } catch {
        // Silently fail — card shows defaults
      }
    }

    fetchCostPerCall();
  }, []);

  function formatCpc(value: number | null): string {
    if (value === null) return "—";
    return "£" + value.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {KPI_DATA.map((kpi, i) => {
        // Override the 4th card (index 3) with live cost per booked call
        if (i === 3) {
          return (
            <KpiCard
              key={i}
              label="Cost / Booked Call"
              value={formatCpc(costPerCall)}
              trend={trend.text || "Loading..."}
              direction={trend.direction}
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
