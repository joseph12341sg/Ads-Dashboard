"use client";

import { useState, useRef, useEffect } from "react";
import { Calendar, ChevronDown } from "lucide-react";

interface DateRangePickerProps {
  start: string;
  end: string;
  onChange: (start: string, end: string) => void;
}

function fmt(d: Date) {
  return d.toISOString().split("T")[0];
}

const PRESETS = [
  { label: "Today", getRange: () => { const t = fmt(new Date()); return [t, t]; } },
  { label: "This week", getRange: () => {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now); mon.setDate(diff);
    return [fmt(mon), fmt(now)];
  }},
  { label: "This month", getRange: () => {
    const now = new Date();
    return [fmt(new Date(now.getFullYear(), now.getMonth(), 1)), fmt(now)];
  }},
  { label: "Last month", getRange: () => {
    const now = new Date();
    const first = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const last = new Date(now.getFullYear(), now.getMonth(), 0);
    return [fmt(first), fmt(last)];
  }},
  { label: "This quarter", getRange: () => {
    const now = new Date();
    const qMonth = Math.floor(now.getMonth() / 3) * 3;
    return [fmt(new Date(now.getFullYear(), qMonth, 1)), fmt(now)];
  }},
  { label: "Last quarter", getRange: () => {
    const now = new Date();
    const currentQ = Math.floor(now.getMonth() / 3);
    const prevQ = currentQ === 0 ? 3 : currentQ - 1;
    const year = currentQ === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const first = new Date(year, prevQ * 3, 1);
    const last = new Date(year, prevQ * 3 + 3, 0);
    return [fmt(first), fmt(last)];
  }},
  { label: "This year", getRange: () => {
    const now = new Date();
    return [fmt(new Date(now.getFullYear(), 0, 1)), fmt(now)];
  }},
  { label: "All time", getRange: () => ["all", "all"] },
  { label: "Custom", getRange: () => null },
];

export default function DateRangePicker({ start, end, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isAllTime = start === "all" && end === "all";
  const displayText = isAllTime ? "All time" : `${start} → ${end}`;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-[#A1A8B3] transition-colors hover:text-[#F2F4F8]"
        style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.12)" }}
      >
        <Calendar className="w-3.5 h-3.5" />
        <span>{displayText}</span>
        <ChevronDown className="w-3 h-3" />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 rounded-xl p-3 min-w-[280px]"
          style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.15)" }}
        >
          {/* Presets */}
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p.label}
                onClick={() => {
                  const range = p.getRange();
                  if (range) {
                    onChange(range[0], range[1]);
                    setOpen(false);
                  }
                }}
                className="px-2.5 py-1 rounded-md text-[11px] text-[#A1A8B3] hover:text-[#F2F4F8] hover:bg-white/[0.05] transition-colors"
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Custom inputs */}
          {!isAllTime && (
            <div className="flex gap-2">
              <input
                type="date"
                value={start}
                onChange={(e) => onChange(e.target.value, end)}
                className="flex-1 px-2 py-1.5 rounded-md text-xs text-[#F2F4F8] bg-[#0E1116] border border-[rgba(91,124,153,0.2)] outline-none focus:border-[#5B7C99]"
              />
              <input
                type="date"
                value={end}
                onChange={(e) => onChange(start, e.target.value)}
                className="flex-1 px-2 py-1.5 rounded-md text-xs text-[#F2F4F8] bg-[#0E1116] border border-[rgba(91,124,153,0.2)] outline-none focus:border-[#5B7C99]"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
