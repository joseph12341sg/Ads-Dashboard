"use client";

import { useState, useEffect, useCallback } from "react";
import SalesHeader from "@/components/sales/SalesHeader";
import ConnectionBanner from "@/components/sales/ConnectionBanner";
import SectionHeader from "@/components/sales/SectionHeader";
import SalesKpiRow from "@/components/sales/SalesKpiRow";
import PipelineFunnel from "@/components/sales/PipelineFunnel";
import RecentDealsTable from "@/components/sales/RecentDealsTable";
import {
  calculateSettingRates,
  calculateCloserRates,
} from "@/lib/close/calculations";
import {
  formatCurrency,
  formatNumber,
  formatPercentage,
} from "@/lib/close/formatters";
import type { SalesDashboardData } from "@/lib/close/types";

function getDefaultRange(): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return [first.toISOString().split("T")[0], now.toISOString().split("T")[0]];
}

export default function SalesPage() {
  const [start, end] = getDefaultRange();
  const [dateStart, setDateStart] = useState(start);
  const [dateEnd, setDateEnd] = useState(end);
  const [data, setData] = useState<SalesDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState("");

  const fetchData = useCallback(async (s: string, e: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/close/pipeline?start=${s}&end=${e}`);
      if (!res.ok) {
        const err = await res.json();
        setConnectionError(err.error || "Unable to connect to Close CRM");
        setData(null);
      } else {
        const json: SalesDashboardData = await res.json();
        setData(json);
        setConnectionError("");
      }
    } catch {
      setConnectionError("Unable to connect to Close CRM. Check your API key.");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Check health on mount
    fetch("/api/close/health")
      .then((r) => r.json())
      .then((h) => {
        if (!h.connected) setConnectionError(h.error || "Unable to connect to Close CRM");
      })
      .catch(() => {});

    fetchData(dateStart, dateEnd);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDateChange(s: string, e: string) {
    setDateStart(s);
    setDateEnd(e);
    fetchData(s, e);
  }

  const setting = data?.setting ?? {
    total_dials: 0, total_leads: 0, appointments_booked: 0, dq_count: 0,
    funnel: { new_lead: 0, in_follow_up: 0, engaged: 0, follow_up_needed: 0, dq_not_interested: 0 },
  };
  const closer = data?.closer ?? {
    call_1_scheduled: 0, call_1_sat: 0, call_1_no_show: 0,
    call_2_scheduled: 0, call_2_sat: 0, call_2_no_show: 0,
    closed_won: 0, closed_lost: 0, follow_up_scheduled: 0, nurture: 0,
  };
  const revenue = data?.revenue ?? { cash_collected: 0, pipeline_value: 0, won_deals_count: 0 };
  const recentDeals = data?.recent_deals ?? [];

  const settingRates = calculateSettingRates(setting);
  const closerRates = calculateCloserRates(closer, revenue);

  return (
    <div className="min-h-screen bg-[#0E1116]">
      {connectionError && <ConnectionBanner error={connectionError} />}
      <SalesHeader start={dateStart} end={dateEnd} onDateChange={handleDateChange} />

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* ═══ SETTING PIPELINE ═══ */}
        <SectionHeader title="Setting pipeline" />

        <SalesKpiRow
          columns={6}
          loading={loading}
          items={[
            { label: "Total Dials", value: formatNumber(setting.total_dials), subtitle: "Outbound calls" },
            { label: "Appointments Booked", value: formatNumber(setting.appointments_booked), subtitle: "Moved to Call 1 Scheduled" },
            { label: "Booking Rate", value: formatPercentage(settingRates.booking_rate), subtitle: "Booked ÷ Dials", color: "#60A5FA", badge: "auto" },
            { label: "Setting Rate", value: formatPercentage(settingRates.setting_rate), subtitle: "Booked ÷ Total Leads", color: "#A855F7", badge: "auto" },
            { label: "DQ'd", value: formatNumber(setting.dq_count), subtitle: "Not interested / unqualified" },
            { label: "DQ Rate", value: formatPercentage(settingRates.dq_rate), subtitle: "DQ'd ÷ Total Leads", color: "#F87171", badge: "auto" },
          ]}
        />

        <PipelineFunnel
          title="Setting funnel"
          subtitle="Current period"
          stages={[
            { label: "New Lead", value: setting.funnel.new_lead, color: "#60A5FA" },
            { label: "In Follow Up Sequence", value: setting.funnel.in_follow_up, color: "#60A5FA" },
            { label: "Engaged (In Conversation)", value: setting.funnel.engaged, color: "#A855F7" },
            { label: "Follow Up Needed", value: setting.funnel.follow_up_needed, color: "#FBBF24" },
            { label: "DQ/Not Interested", value: setting.funnel.dq_not_interested, color: "#F87171" },
          ]}
        />

        {/* Divider */}
        <div className="border-t border-white/5" />

        {/* ═══ SALES CLOSER PIPELINE ═══ */}
        <SectionHeader title="Sales closer pipeline" />

        {/* Volume */}
        <SalesKpiRow
          columns={4}
          loading={loading}
          items={[
            { label: "Call 1 Scheduled", value: formatNumber(closer.call_1_scheduled), subtitle: "Discovery calls booked" },
            { label: "Call 1 Sat", value: formatNumber(closer.call_1_sat), subtitle: "Attended discovery" },
            { label: "Call 2 Scheduled", value: formatNumber(closer.call_2_scheduled), subtitle: "Close calls booked" },
            { label: "Call 2 Sat", value: formatNumber(closer.call_2_sat), subtitle: "Attended close call" },
          ]}
        />

        {/* Show & Close Rates */}
        <SalesKpiRow
          columns={4}
          loading={loading}
          items={[
            { label: "Call 1 Show Rate", value: formatPercentage(closerRates.call_1_show_rate), subtitle: "Sat ÷ (Sat + No Show)", color: "#60A5FA", badge: "auto" },
            { label: "Call 2 Show Rate", value: formatPercentage(closerRates.call_2_show_rate), subtitle: "Sat ÷ (Sat + No Show)", color: "#60A5FA", badge: "auto" },
            { label: "Call 1 Close Rate", value: formatPercentage(closerRates.call_1_close_rate), subtitle: "Won ÷ Call 1 Sat", color: "#4ADE80", badge: "auto" },
            { label: "Call 2 Close Rate", value: formatPercentage(closerRates.call_2_close_rate), subtitle: "Won ÷ Call 2 Sat", color: "#4ADE80", badge: "auto" },
          ]}
        />

        {/* Revenue & Overall */}
        <SalesKpiRow
          columns={4}
          loading={loading}
          items={[
            { label: "Cash Collected", value: formatCurrency(revenue.cash_collected), subtitle: "Won deals revenue", color: "#4ADE80" },
            { label: "Pipeline Value", value: formatCurrency(revenue.pipeline_value), subtitle: "Active opportunities", color: "#FBBF24" },
            { label: "Avg Deal Size", value: formatCurrency(closerRates.avg_deal_size), subtitle: "Revenue ÷ Won Deals", color: "#A855F7", badge: "auto" },
            { label: "Overall Close Rate", value: formatPercentage(closerRates.overall_close_rate), subtitle: "Won ÷ Call 2 Sat", color: "#4ADE80", badge: "auto" },
          ]}
        />

        {/* Two-Column: Closer Funnel + Recent Deals */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <PipelineFunnel
            title="Closer funnel"
            subtitle="Current period"
            stages={[
              { label: "Call 1 - Discovery Scheduled", value: closer.call_1_scheduled, color: "#60A5FA" },
              { label: "Call 1 - No Show", value: closer.call_1_no_show, color: "#F87171" },
              { label: "Call 2 - Close Scheduled", value: closer.call_2_scheduled, color: "#A855F7" },
              { label: "Call 2 - No Show", value: closer.call_2_no_show, color: "#F87171" },
              { label: "Follow Up - Scheduled", value: closer.follow_up_scheduled, color: "#FBBF24" },
              { label: "Nurture", value: closer.nurture, color: "#5B7C99" },
              { label: "Closed (Won)", value: closer.closed_won, color: "#4ADE80" },
              { label: "No Close (Lost)", value: closer.closed_lost, color: "#F87171" },
            ]}
          />
          <RecentDealsTable deals={recentDeals} loading={loading} />
        </div>
      </main>
    </div>
  );
}
