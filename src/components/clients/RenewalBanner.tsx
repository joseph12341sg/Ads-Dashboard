"use client";

import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import type { Client } from "@/lib/clients/types";
import { formatClientDate } from "@/lib/clients/formatters";

interface RenewalBannerProps {
  clients: Client[];
}

export default function RenewalBanner({ clients }: RenewalBannerProps) {
  if (clients.length === 0) return null;

  return (
    <div
      className="rounded-xl px-4 py-3 flex items-start gap-3"
      style={{
        background: "rgba(251,191,36,0.06)",
        border: "1px solid rgba(251,191,36,0.15)",
      }}
    >
      <AlertTriangle className="w-4 h-4 text-[#FBBF24] mt-0.5 shrink-0" />
      <p className="text-sm text-[#FBBF24]">
        {clients.length} client{clients.length > 1 ? "s" : ""} renewing within
        7 days &mdash;{" "}
        {clients.map((c, i) => (
          <span key={c.id}>
            <Link
              href={`/clients/${c.id}`}
              className="underline hover:text-[#F2F4F8] transition-colors"
            >
              {c.business_name}
            </Link>{" "}
            ({formatClientDate(c.renewal_date)})
            {i < clients.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>
    </div>
  );
}
