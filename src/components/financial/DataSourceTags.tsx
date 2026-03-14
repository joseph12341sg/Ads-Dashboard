"use client";

import SourceDot from "./SourceDot";

const SOURCES = [
  { key: "close" as const, label: "Close" },
  { key: "meta" as const, label: "Meta" },
  { key: "clients" as const, label: "Clients" },
  { key: "manual" as const, label: "Manual" },
];

export default function DataSourceTags() {
  return (
    <div className="flex items-center gap-2">
      {SOURCES.map((s) => (
        <span
          key={s.key}
          className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] text-[#A1A8B3]"
          style={{ background: "rgba(91,124,153,0.08)", border: "1px solid rgba(91,124,153,0.1)" }}
        >
          <SourceDot source={s.key} />
          {s.label}
        </span>
      ))}
    </div>
  );
}
