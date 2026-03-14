"use client";

import { AlertTriangle } from "lucide-react";

interface ConnectionBannerProps {
  error: string;
}

export default function ConnectionBanner({ error }: ConnectionBannerProps) {
  return (
    <div
      className="flex items-center gap-2 px-4 py-3 text-sm"
      style={{
        background: "rgba(248,113,113,0.08)",
        borderBottom: "1px solid rgba(248,113,113,0.2)",
      }}
    >
      <AlertTriangle className="w-4 h-4 text-[#F87171] shrink-0" />
      <span className="text-[#F87171]">{error}</span>
    </div>
  );
}
