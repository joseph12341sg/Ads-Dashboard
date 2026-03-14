"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { MetaAdsDailyRecord } from "@/lib/meta-ads/types";

interface SpendLeadsChartProps {
  records: MetaAdsDailyRecord[];
}

export default function SpendLeadsChart({ records }: SpendLeadsChartProps) {
  const chartData = records
    .slice(0, 14)
    .reverse()
    .map((r) => ({
      date: new Date(r.date + "T00:00:00").toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
      }),
      Spend: Number(r.amount_spent),
      Leads: r.leads,
    }));

  if (chartData.length === 0) {
    return (
      <div
        className="rounded-xl p-5 flex items-center justify-center"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
          minHeight: 300,
        }}
      >
        <p className="text-sm text-[#A1A8B3]">No data to display</p>
      </div>
    );
  }

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
        Spend vs Leads
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={chartData} barGap={2}>
          <XAxis
            dataKey="date"
            tick={{ fill: "#A1A8B3", fontSize: 10 }}
            axisLine={{ stroke: "rgba(91,124,153,0.12)" }}
            tickLine={false}
          />
          <YAxis
            yAxisId="spend"
            orientation="left"
            tick={{ fill: "#A1A8B3", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `£${v}`}
          />
          <YAxis
            yAxisId="leads"
            orientation="right"
            tick={{ fill: "#A1A8B3", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0E1116",
              border: "1px solid rgba(91,124,153,0.2)",
              borderRadius: 8,
              fontSize: 12,
              color: "#F2F4F8",
            }}
            cursor={{ fill: "rgba(91,124,153,0.05)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#A1A8B3", paddingTop: 8 }}
          />
          <Bar
            yAxisId="spend"
            dataKey="Spend"
            fill="#A855F7"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
          <Bar
            yAxisId="leads"
            dataKey="Leads"
            fill="#4ADE80"
            radius={[3, 3, 0, 0]}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
