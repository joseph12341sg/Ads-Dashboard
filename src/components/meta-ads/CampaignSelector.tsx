"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  status: string;
  objective: string;
}

interface CampaignSelectorProps {
  selectedCampaignId: string;
  onSelect: (campaignId: string, campaignName: string) => void;
}

export default function CampaignSelector({
  selectedCampaignId,
  onSelect,
}: CampaignSelectorProps) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    async function loadCampaigns() {
      try {
        const res = await fetch("/api/meta-ads/campaigns");
        const json = await res.json();
        if (json.success) {
          setCampaigns(json.campaigns);
          // Auto-select first active campaign if none selected
          if (!selectedCampaignId && json.campaigns.length > 0) {
            const active = json.campaigns.find(
              (c: Campaign) => c.status === "ACTIVE"
            );
            const first = active || json.campaigns[0];
            onSelect(first.id, first.name);
          }
        } else {
          setError(json.error || "Failed to load campaigns");
        }
      } catch {
        setError("Failed to fetch campaigns");
      } finally {
        setLoading(false);
      }
    }
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selected = campaigns.find((c) => c.id === selectedCampaignId);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-[#A1A8B3]">
        <Loader2 className="w-4 h-4 animate-spin" />
        Loading campaigns...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-xs text-[#F87171]">{error}</div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="text-xs text-[#A1A8B3]">No campaigns found</div>
    );
  }

  const statusColor = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "#4ADE80";
      case "PAUSED":
        return "#FBBF24";
      default:
        return "#A1A8B3";
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[#F2F4F8] bg-[#0E1116] border border-[rgba(91,124,153,0.2)] hover:border-[#A855F7] transition-colors w-full text-left"
      >
        {selected ? (
          <span className="flex items-center gap-2 truncate flex-1 min-w-0">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ background: statusColor(selected.status) }}
            />
            <span className="truncate">{selected.name}</span>
          </span>
        ) : (
          <span className="text-[#A1A8B3]">Select a campaign</span>
        )}
        <ChevronDown
          className={`w-4 h-4 flex-shrink-0 text-[#A1A8B3] transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && (
        <div
          className="absolute z-50 mt-1 w-full rounded-lg border border-[rgba(91,124,153,0.2)] bg-[#161B22] shadow-xl max-h-60 overflow-y-auto"
        >
          {campaigns.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => {
                onSelect(c.id, c.name);
                setOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 text-sm flex items-center gap-2 hover:bg-[#A855F7]/10 transition-colors ${
                c.id === selectedCampaignId
                  ? "bg-[#A855F7]/15 text-[#F2F4F8]"
                  : "text-[#A1A8B3]"
              }`}
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ background: statusColor(c.status) }}
              />
              <span className="truncate flex-1 min-w-0">{c.name}</span>
              <span className="text-[10px] uppercase tracking-wider flex-shrink-0">
                {c.status}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
