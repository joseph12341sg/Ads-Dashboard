"use client";

import KpiCard from "./KpiCard";
import { KPI_DATA } from "@/lib/constants";

export default function KpiBar() {
  return (
    <section className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
      {KPI_DATA.map((kpi, i) => (
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
      ))}
    </section>
  );
}
