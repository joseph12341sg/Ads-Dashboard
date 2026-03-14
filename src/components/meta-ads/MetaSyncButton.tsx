"use client";

import { useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import type { MetaSyncResponse } from "@/lib/meta-ads/types";

interface MetaSyncButtonProps {
  syncDate: string;
  onSyncSuccess: (data: MetaSyncResponse["data"]) => void;
  onSyncError: (error: string) => void;
}

export default function MetaSyncButton({
  syncDate,
  onSyncSuccess,
  onSyncError,
}: MetaSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);

  async function handleSync() {
    setSyncing(true);
    setSynced(false);

    try {
      const res = await fetch(`/api/meta-ads?date=${syncDate}`);
      const json: MetaSyncResponse = await res.json();

      if (json.success && json.data) {
        onSyncSuccess(json.data);
        setSynced(true);
        setTimeout(() => setSynced(false), 2000);
      } else {
        onSyncError(json.error || "Failed to sync");
      }
    } catch {
      onSyncError("Network error while syncing");
    } finally {
      setSyncing(false);
    }
  }

  return (
    <button
      onClick={handleSync}
      disabled={syncing}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-all duration-200 disabled:opacity-60"
      style={{
        border: "1px solid #A855F7",
        color: synced ? "#4ADE80" : "#A855F7",
        background: syncing ? "rgba(168,85,247,0.1)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!syncing && !synced) {
          e.currentTarget.style.background = "#A855F7";
          e.currentTarget.style.color = "#F2F4F8";
        }
      }}
      onMouseLeave={(e) => {
        if (!syncing && !synced) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#A855F7";
        }
      }}
    >
      {synced ? (
        <>
          <Check className="w-4 h-4" />
          Synced ✓
        </>
      ) : syncing ? (
        <>
          <RefreshCw className="w-4 h-4 animate-spin" />
          Syncing...
        </>
      ) : (
        <>
          <RefreshCw className="w-4 h-4" />
          Sync from Meta
        </>
      )}
    </button>
  );
}
