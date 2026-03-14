"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import type { TokenStatus } from "@/lib/meta-ads/types";

export default function TokenWarningBanner() {
  const [status, setStatus] = useState<TokenStatus | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetch("/api/meta-ads/token-status")
      .then((r) => r.json())
      .then((data: TokenStatus) => setStatus(data))
      .catch(() => {});
  }, []);

  if (dismissed || !status) return null;

  const expired = status.valid === false && status.days_remaining === null;
  const expiringSoon =
    status.valid &&
    status.days_remaining !== null &&
    status.days_remaining < 7;

  if (!expired && !expiringSoon) return null;

  const isExpired = expired || (status.days_remaining !== null && status.days_remaining <= 0);

  return (
    <div
      className="flex items-center justify-between px-4 py-3 text-sm"
      style={{
        background: isExpired
          ? "rgba(248,113,113,0.08)"
          : "rgba(251,191,36,0.08)",
        borderBottom: `1px solid ${isExpired ? "rgba(248,113,113,0.2)" : "rgba(251,191,36,0.2)"}`,
      }}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle
          className="w-4 h-4 shrink-0"
          style={{ color: isExpired ? "#F87171" : "#FBBF24" }}
        />
        <span style={{ color: isExpired ? "#F87171" : "#FBBF24" }}>
          {isExpired
            ? "Meta API token expired. Sync is unavailable."
            : `Your Meta API token expires in ${status.days_remaining} day${status.days_remaining === 1 ? "" : "s"}.`}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {!isExpired && (
          <a
            href="https://developers.facebook.com/tools/accesstoken"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs hover:underline"
            style={{ color: isExpired ? "#F87171" : "#FBBF24" }}
          >
            Refresh token →
          </a>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
