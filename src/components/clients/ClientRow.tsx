"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, AlertTriangle } from "lucide-react";
import type { Client } from "@/lib/clients/types";
import {
  formatClientCurrency,
  formatClientDate,
  getAvatarColour,
  getInitials,
} from "@/lib/clients/formatters";

interface ClientRowProps {
  client: Client;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80" },
  paused: { bg: "rgba(251,191,36,0.1)", text: "#FBBF24" },
  churned: { bg: "rgba(248,113,113,0.1)", text: "#F87171" },
};

function isRenewingSoon(date: string | null): boolean {
  if (!date) return false;
  const now = new Date();
  const renewal = new Date(date);
  const diff = renewal.getTime() - now.getTime();
  return diff >= 0 && diff <= 7 * 24 * 60 * 60 * 1000;
}

export default function ClientRow({ client }: ClientRowProps) {
  const router = useRouter();
  const isChurned = client.status === "churned";
  const statusStyle = STATUS_STYLES[client.status] || STATUS_STYLES.active;
  const avatarColour = getAvatarColour(client.business_name);
  const renewingSoon = isRenewingSoon(client.renewal_date);

  const valueDisplay =
    client.value_type === "mrr"
      ? `${formatClientCurrency(client.value_amount)}/mo`
      : formatClientCurrency(client.value_amount);

  return (
    <tr
      className="border-t border-white/5 cursor-pointer hover:bg-white/[0.02] transition-colors"
      style={{ opacity: isChurned ? 0.5 : 1 }}
      onClick={() => router.push(`/clients/${client.id}`)}
    >
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0"
            style={{ background: avatarColour }}
          >
            {getInitials(client.business_name)}
          </div>
          <span className="text-sm text-[#F2F4F8]">
            {client.business_name}
          </span>
        </div>
      </td>
      <td className="py-3 px-4 text-sm text-[#4ADE80]">{valueDisplay}</td>
      <td className="py-3 px-4">
        <span
          className="text-[11px] px-2 py-0.5 rounded"
          style={{
            background: "rgba(91,124,153,0.1)",
            color: "#5B7C99",
          }}
        >
          {client.value_type === "mrr" ? "MRR" : "Upfront"}
        </span>
      </td>
      <td className="py-3 px-4 text-sm text-[#A1A8B3]">
        {formatClientDate(client.start_date)}
      </td>
      <td className="py-3 px-4 text-sm">
        {client.renewal_date ? (
          <span
            className="flex items-center gap-1"
            style={{ color: renewingSoon ? "#FBBF24" : "#A1A8B3" }}
          >
            {renewingSoon && <AlertTriangle className="w-3 h-3" />}
            {formatClientDate(client.renewal_date)}
          </span>
        ) : (
          <span className="text-[#A1A8B3]">&mdash;</span>
        )}
      </td>
      <td className="py-3 px-4">
        <span
          className="text-[11px] px-2 py-0.5 rounded capitalize"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          {client.status}
        </span>
      </td>
      <td className="py-3 px-4 text-[#A1A8B3]">
        <ChevronRight className="w-4 h-4" />
      </td>
    </tr>
  );
}
