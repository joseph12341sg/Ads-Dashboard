"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid, Cell } from "recharts";
import type { MonthlyTrend } from "@/lib/financial/types";

interface ProfitTrendChartProps {
  data: MonthlyTrend[];
}

export default function ProfitTrendChart({ data }: ProfitTrendChartProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.08)" }}
    >
      <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">Profit Trend</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(91,124,153,0.08)" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{ fill: "#A1A8B3", fontSize: 11 }}
            axisLine={{ stroke: "rgba(91,124,153,0.1)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "#A1A8B3", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v) => `£${(v / 1000).toFixed(0)}k`}
          />
          <Tooltip
            contentStyle={{
              background: "#161B22",
              border: "1px solid rgba(91,124,153,0.15)",
              borderRadius: 8,
              fontSize: 12,
              color: "#F2F4F8",
            }}
            formatter={(value) => [`£${Number(value).toLocaleString("en-GB")}`, undefined]}
            labelStyle={{ color: "#A1A8B3" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 11, color: "#A1A8B3" }}
          />
          <Bar
            dataKey="profit"
            name="Profit"
            radius={[4, 4, 0, 0]}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.profit >= 0 ? "rgba(96,165,250,0.4)" : "rgba(248,113,113,0.4)"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
