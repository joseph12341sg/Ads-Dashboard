"use client";

import DashboardCard from "./DashboardCard";
import { DASHBOARD_CARDS } from "@/lib/constants";

export default function DashboardGrid() {
  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {DASHBOARD_CARDS.map((card, i) => (
        <DashboardCard
          key={i}
          title={card.title}
          description={card.description}
          href={card.href}
          color={card.color}
          icon={card.icon}
          status={card.status}
          placeholder={"placeholder" in card ? card.placeholder : undefined}
        />
      ))}
    </section>
  );
}
