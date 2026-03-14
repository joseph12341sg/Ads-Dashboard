"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from "recharts";
import type { MonthlyTrend } from "@/lib/financial/types";

interface RevenueExpenseChartProps {
  data: MonthlyTrend[];
}

export default function RevenueExpenseChart({ data }: RevenueExpenseChartProps) {
  return (
    <div
      className="rounded-xl p-5"
      style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.08)" }}
    >
      <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">Revenue vs Expenses</h3>
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={data} barGap={4}>
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
            dataKey="revenue"
            name="Revenue"
            fill="rgba(74,222,128,0.5)"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="expenses"
            name="Expenses"
            fill="rgba(248,113,113,0.4)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
