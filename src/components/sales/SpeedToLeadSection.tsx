"use client";

import { useState, useEffect, useRef } from "react";
import type { SpeedToLeadData } from "@/lib/close/types";
import SectionHeader from "./SectionHeader";

/* ── KPI Targets ── */
const KPI_TARGETS = {
  personalDialsPerDay: 4,
  officeDialsPerDay: 2,
  bookingRate: 60,
  showRate: 80,
  speedToLead: 80,
} as const;

/* ── Format helpers ── */
function fmt(val: number | null, suffix = ""): string {
  if (val === null || val === undefined) return "—";
  return `${val.toFixed(1)}${suffix}`;
}

function fmtTime(minutes: number | null): string {
  if (minutes === null || minutes === undefined) return "—";
  if (minutes < 1) return `${Math.round(minutes * 60)}s`;
  if (minutes < 60) return `${minutes.toFixed(1)}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `${hrs}h ${mins}m`;
}

/* ── KPI Flag component ── */
function KpiFlag({
  label,
  value,
  target,
  unit,
  subtitle,
  inverse,
  loading,
}: {
  label: string;
  value: number | null;
  target: number;
  unit: string;
  subtitle: string;
  inverse?: boolean; // true = lower is better
  loading?: boolean;
}) {
  const meetsKpi =
    value !== null && (inverse ? value <= target : value >= target);
  const flagColor = value === null ? "#5B7C99" : meetsKpi ? "#4ADE80" : "#F87171";
  const flagBg = value === null ? "rgba(91,124,153,0.1)" : meetsKpi ? "rgba(74,222,128,0.1)" : "rgba(248,113,113,0.1)";
  const flagLabel = value === null ? "NO DATA" : meetsKpi ? "ON TARGET" : "BELOW TARGET";

  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:border-white/10"
      style={{
        background: "#161B22",
        border: `1px solid ${value === null ? "rgba(91,124,153,0.08)" : meetsKpi ? "rgba(74,222,128,0.15)" : "rgba(248,113,113,0.15)"}`,
        opacity: loading ? 0.5 : 1,
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] uppercase tracking-wider text-[#A1A8B3]">
          {label}
        </span>
        <span
          className="text-[9px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
          style={{ color: flagColor, background: flagBg }}
        >
          {flagLabel}
        </span>
      </div>
      {loading ? (
        <div className="h-7 w-20 bg-white/5 rounded animate-pulse mb-1" />
      ) : (
        <div
          className="font-montserrat font-bold text-[22px] mb-1"
          style={{ color: flagColor }}
        >
          {value !== null ? `${value.toFixed(1)}${unit}` : "—"}
        </div>
      )}
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-[#A1A8B3]">{subtitle}</span>
        <span className="text-[10px] text-[#5B7C99]">
          Target: {target}{unit}
        </span>
      </div>
    </div>
  );
}

/* ── Stat card (no KPI flag, just info) ── */
function StatCard({
  label,
  value,
  subtitle,
  color = "#F2F4F8",
  loading,
}: {
  label: string;
  value: string;
  subtitle: string;
  color?: string;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-4 transition-all duration-200 hover:border-white/10"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
        opacity: loading ? 0.5 : 1,
      }}
    >
      <span className="text-[10px] uppercase tracking-wider text-[#A1A8B3] block mb-2">
        {label}
      </span>
      {loading ? (
        <div className="h-7 w-20 bg-white/5 rounded animate-pulse mb-1" />
      ) : (
        <div
          className="font-montserrat font-bold text-[22px] mb-1"
          style={{ color }}
        >
          {value}
        </div>
      )}
      <span className="text-[11px] text-[#A1A8B3]">{subtitle}</span>
    </div>
  );
}

/* ── Main Section ── */
interface SpeedToLeadSectionProps {
  dateStart: string;
  dateEnd: string;
  bookingRate: number | null;
  showRate: number | null;
}

export default function SpeedToLeadSection({
  dateStart,
  dateEnd,
  bookingRate,
  showRate,
}: SpeedToLeadSectionProps) {
  const [data, setData] = useState<SpeedToLeadData | null>(null);
  const [loading, setLoading] = useState(true);
  const prevParams = useRef("");

  useEffect(() => {
    const params = `${dateStart}:${dateEnd}`;
    if (params === prevParams.current && data) return;
    prevParams.current = params;

    async function load() {
      setLoading(true);
      try {
        const isAllTime = dateStart === "all" && dateEnd === "all";
        const url = isAllTime
          ? "/api/close/speed-to-lead"
          : `/api/close/speed-to-lead?start=${dateStart}&end=${dateEnd}`;
        const res = await fetch(url);
        if (res.ok) {
          const json: SpeedToLeadData = await res.json();
          setData(json);
        }
      } catch {
        // Silently fail — section just won't show data
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [dateStart, dateEnd]); // eslint-disable-line react-hooks/exhaustive-deps

  const stl = data?.speed_to_lead;
  const dials = data?.dials;

  return (
    <>
      <SectionHeader title="Speed to lead & KPI targets" />

      {/* Speed to Lead Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiFlag
          label="Speed to Lead (In Hours)"
          value={stl?.in_hours.percentage ?? null}
          target={KPI_TARGETS.speedToLead}
          unit="%"
          subtitle={`${stl?.in_hours.within_5_min ?? 0}/${stl?.in_hours.total ?? 0} in-hours leads within 5 min`}
          loading={loading}
        />
        <StatCard
          label="Avg Response Time"
          value={fmtTime(stl?.in_hours.avg_response_minutes ?? null)}
          subtitle="Avg time to first contact (in-hours only)"
          color="#60A5FA"
          loading={loading}
        />
        <StatCard
          label="Avg Calls Per Lead"
          value={fmt(stl?.avg_contact_attempts ?? null, "x")}
          subtitle={`${stl?.total_leads ?? 0} inbound pipeline leads`}
          color="#A855F7"
          loading={loading}
        />
        <StatCard
          label="After Hours Leads"
          value={`${stl?.after_hours.total ?? 0}`}
          subtitle="Leads outside 10am–8pm UK (excluded from STL)"
          color="#FBBF24"
          loading={loading}
        />
      </div>

      {/* KPI Targets Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiFlag
          label="Personal Dials / Day"
          value={dials?.personal_dials_per_day ?? null}
          target={KPI_TARGETS.personalDialsPerDay}
          unit=""
          subtitle={`${dials?.total_calls ?? 0} calls over ${dials?.working_days ?? 0} days`}
          loading={loading}
        />
        <KpiFlag
          label="Booking Rate"
          value={bookingRate}
          target={KPI_TARGETS.bookingRate}
          unit="%"
          subtitle="Booked ÷ Total Leads"
          loading={loading}
        />
        <KpiFlag
          label="Show Rate"
          value={showRate}
          target={KPI_TARGETS.showRate}
          unit="%"
          subtitle="Call 1 Sat ÷ (Sat + No Show)"
          loading={loading}
        />
      </div>
    </>
  );
}
