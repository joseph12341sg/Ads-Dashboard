"use client";

import { useState } from "react";
import { X, Copy, Check, Link as LinkIcon } from "lucide-react";

interface IntakeLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: () => Promise<string>;
}

export default function IntakeLinkModal({
  isOpen,
  onClose,
  onGenerate,
}: IntakeLinkModalProps) {
  const [link, setLink] = useState("");
  const [generating, setGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate() {
    setGenerating(true);
    setError("");
    try {
      const url = await onGenerate();
      setLink(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate link. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopy() {
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleClose() {
    setLink("");
    setCopied(false);
    setError("");
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/60"
        onClick={handleClose}
      />
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-xl p-6"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.15)",
        }}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-montserrat font-bold text-base text-[#F2F4F8]">
            Generate intake link
          </h3>
          <button
            onClick={handleClose}
            className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!link ? (
          <>
            <p className="text-sm text-[#A1A8B3] mb-5">
              Generate a unique link for a new client to fill in their onboarding
              details. The link expires in 7 days.
            </p>
            {error && (
              <p className="text-xs text-[#F87171] mb-3">{error}</p>
            )}
            <button
              onClick={handleGenerate}
              disabled={generating}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm text-[#F2F4F8] transition-colors disabled:opacity-60"
              style={{ background: "#5B7C99" }}
            >
              <LinkIcon className="w-4 h-4" />
              {generating ? "Generating..." : "Generate link"}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-[#A1A8B3] mb-3">
              Share this link with your client:
            </p>
            <div
              className="flex items-center gap-2 p-3 rounded-lg mb-4"
              style={{
                background: "#0E1116",
                border: "1px solid rgba(91,124,153,0.2)",
              }}
            >
              <input
                type="text"
                value={link}
                readOnly
                className="flex-1 bg-transparent text-sm text-[#F2F4F8] outline-none"
              />
              <button
                onClick={handleCopy}
                className="shrink-0 p-1.5 rounded transition-colors"
                style={{
                  color: copied ? "#4ADE80" : "#5B7C99",
                }}
              >
                {copied ? (
                  <Check className="w-4 h-4" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-[#A1A8B3]">
              This link expires in 7 days. The client will fill in their
              onboarding details and a new client record will be created.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
