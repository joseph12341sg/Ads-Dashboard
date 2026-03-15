"use client";

import { useState } from "react";
import { RefreshCw, Check } from "lucide-react";
import type { MetaSyncResponse } from "@/lib/meta-ads/types";

interface SyncResult {
  meta: MetaSyncResponse["data"];
  closeCalls: number | null;
}

interface MetaSyncButtonProps {
  syncDate: string;
  onSyncSuccess: (data: SyncResult) => void;
  onSyncError: (error: string) => void;
}

export default function MetaSyncButton({
  syncDate,
  onSyncSuccess,
  onSyncError,
}: MetaSyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncedLabel, setSyncedLabel] = useState("");

  async function handleSync() {
    setSyncing(true);
    setSyncedLabel("");

    try {
      // Fetch Meta and Close in parallel
      const [metaRes, closeRes] = await Promise.all([
        fetch(`/api/meta-ads?date=${syncDate}`),
        fetch(`/api/close/calls-by-date?date=${syncDate}`).catch(() => null),
      ]);

      const metaJson: MetaSyncResponse = await metaRes.json();

      if (!metaJson.success || !metaJson.data) {
        onSyncError(metaJson.error || "Failed to sync from Meta");
        setSyncing(false);
        return;
      }

      let closeCalls: number | null = null;
      if (closeRes) {
        try {
          const closeJson = await closeRes.json();
          if (closeJson.success) {
            closeCalls = closeJson.calls;
          }
        } catch {
          // Close failed silently — calls stays null
        }
      }

      onSyncSuccess({ meta: metaJson.data, closeCalls });

      const label =
        closeCalls !== null ? "Meta + Close synced ✓" : "Meta synced ✓";
      setSyncedLabel(label);
      setTimeout(() => setSyncedLabel(""), 2500);
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
        color: syncedLabel ? "#4ADE80" : "#A855F7",
        background: syncing ? "rgba(168,85,247,0.1)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!syncing && !syncedLabel) {
          e.currentTarget.style.background = "#A855F7";
          e.currentTarget.style.color = "#F2F4F8";
        }
      }}
      onMouseLeave={(e) => {
        if (!syncing && !syncedLabel) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "#A855F7";
        }
      }}
    >
      {syncedLabel ? (
        <>
          <Check className="w-4 h-4" />
          {syncedLabel}
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
