"use client";

import type { ClientStatus } from "@/lib/clients/types";

type TabValue = "all" | ClientStatus;

interface ClientStatusTabsProps {
  active: TabValue;
  onChange: (tab: TabValue) => void;
  counts: { all: number; active: number; paused: number; churned: number };
}

const TABS: { value: TabValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "paused", label: "Paused" },
  { value: "churned", label: "Churned" },
];

export default function ClientStatusTabs({
  active,
  onChange,
  counts,
}: ClientStatusTabsProps) {
  return (
    <div className="flex gap-1">
      {TABS.map((tab) => {
        const isActive = active === tab.value;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className="px-3 py-1.5 rounded-md text-xs transition-colors"
            style={{
              background: isActive ? "rgba(91,124,153,0.15)" : "transparent",
              color: isActive ? "#F2F4F8" : "#A1A8B3",
            }}
          >
            {tab.label} ({counts[tab.value]})
          </button>
        );
      })}
    </div>
  );
}
