"use client";

import { useState } from "react";
import type { Client, ClientStatus } from "@/lib/clients/types";
import ClientStatusTabs from "./ClientStatusTabs";
import ClientRow from "./ClientRow";

interface ClientTableProps {
  clients: Client[];
  loading?: boolean;
}

type TabValue = "all" | ClientStatus;

export default function ClientTable({ clients, loading }: ClientTableProps) {
  const [tab, setTab] = useState<TabValue>("all");

  const counts = {
    all: clients.length,
    active: clients.filter((c) => c.status === "active").length,
    paused: clients.filter((c) => c.status === "paused").length,
    churned: clients.filter((c) => c.status === "churned").length,
  };

  const filtered =
    tab === "all" ? clients : clients.filter((c) => c.status === tab);

  // Sort: active first, then paused, then churned; alphabetically within each
  const sorted = [...filtered].sort((a, b) => {
    const order: Record<string, number> = { active: 0, paused: 1, churned: 2 };
    const diff = (order[a.status] ?? 3) - (order[b.status] ?? 3);
    if (diff !== 0) return diff;
    return a.business_name.localeCompare(b.business_name);
  });

  if (loading) {
    return (
      <div
        className="rounded-xl p-5"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <div className="h-5 w-32 bg-white/5 rounded mb-4 animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-12 bg-white/[0.02] rounded mb-2 animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className="rounded-xl"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <div className="px-5 pt-5 pb-3 flex items-center justify-between">
        <div>
          <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8]">
            All clients
          </h3>
          <p className="text-[11px] text-[#A1A8B3] mt-0.5">
            {counts.active} active, {counts.paused} paused, {counts.churned}{" "}
            churned
          </p>
        </div>
        <ClientStatusTabs active={tab} onChange={setTab} counts={counts} />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-t border-white/5">
              <th className="py-2.5 px-4 text-[10px] uppercase tracking-wider text-[#A1A8B3] font-normal">
                Client
              </th>
              <th className="py-2.5 px-4 text-[10px] uppercase tracking-wider text-[#A1A8B3] font-normal">
                Value
              </th>
              <th className="py-2.5 px-4 text-[10px] uppercase tracking-wider text-[#A1A8B3] font-normal">
                Type
              </th>
              <th className="py-2.5 px-4 text-[10px] uppercase tracking-wider text-[#A1A8B3] font-normal">
                Start Date
              </th>
              <th className="py-2.5 px-4 text-[10px] uppercase tracking-wider text-[#A1A8B3] font-normal">
                Renewal
              </th>
              <th className="py-2.5 px-4 text-[10px] uppercase tracking-wider text-[#A1A8B3] font-normal">
                Status
              </th>
              <th className="py-2.5 px-4 w-8" />
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="py-8 text-center text-sm text-[#A1A8B3]"
                >
                  No clients found
                </td>
              </tr>
            ) : (
              sorted.map((client) => (
                <ClientRow key={client.id} client={client} />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
