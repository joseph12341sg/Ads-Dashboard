"use client";

import { useState, useEffect } from "react";
import MetaSyncButton from "./MetaSyncButton";
import type { MetaAdsDailyRecord } from "@/lib/meta-ads/types";

interface DailyInputFormProps {
  editingRecord: MetaAdsDailyRecord | null;
  onSubmit: (data: {
    date: string;
    amount_spent: number;
    link_clicks: number;
    leads: number;
    calls: number;
    cpl: number;
    synced_from_meta: boolean;
  }) => void;
  onCancelEdit: () => void;
}

function getYesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split("T")[0];
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function DailyInputForm({
  editingRecord,
  onSubmit,
  onCancelEdit,
}: DailyInputFormProps) {
  const [syncDate, setSyncDate] = useState(getYesterday());
  const [syncError, setSyncError] = useState("");
  const [wasSynced, setWasSynced] = useState(false);

  const [date, setDate] = useState(getYesterday());
  const [amountSpent, setAmountSpent] = useState("");
  const [linkClicks, setLinkClicks] = useState("");
  const [leads, setLeads] = useState("");
  const [calls, setCalls] = useState("");
  const [cpl, setCpl] = useState("");

  useEffect(() => {
    if (editingRecord) {
      setDate(editingRecord.date);
      setAmountSpent(String(editingRecord.amount_spent));
      setLinkClicks(String(editingRecord.link_clicks));
      setLeads(String(editingRecord.leads));
      setCalls(String(editingRecord.calls));
      setCpl(String(editingRecord.cpl));
      setWasSynced(editingRecord.synced_from_meta);
    }
  }, [editingRecord]);

  function handleClear() {
    setDate(getYesterday());
    setAmountSpent("");
    setLinkClicks("");
    setLeads("");
    setCalls("");
    setCpl("");
    setSyncError("");
    setWasSynced(false);
    onCancelEdit();
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit({
      date,
      amount_spent: parseFloat(amountSpent) || 0,
      link_clicks: parseInt(linkClicks) || 0,
      leads: parseInt(leads) || 0,
      calls: parseInt(calls) || 0,
      cpl: parseFloat(cpl) || 0,
      synced_from_meta: wasSynced,
    });
    if (!editingRecord) handleClear();
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg text-sm text-[#F2F4F8] placeholder:text-[#A1A8B3]/40 outline-none transition-colors bg-[#0E1116] border border-[rgba(91,124,153,0.2)] focus:border-[#A855F7]";

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: "#161B22",
        border: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
        {editingRecord ? "Edit entry" : "Add daily metrics"}
      </h3>

      {/* Sync Section */}
      {!editingRecord && (
        <>
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <input
              type="date"
              value={syncDate}
              max={getToday()}
              onChange={(e) => setSyncDate(e.target.value)}
              className="px-3 py-2 rounded-lg text-sm text-[#F2F4F8] outline-none bg-[#0E1116] border border-[rgba(91,124,153,0.2)] focus:border-[#A855F7]"
            />
            <MetaSyncButton
              syncDate={syncDate}
              onSyncSuccess={(data) => {
                if (data) {
                  setDate(syncDate);
                  setAmountSpent(String(data.amount_spent));
                  setLinkClicks(String(data.link_clicks));
                  setLeads(String(data.leads));
                  setCpl(String(data.cpl));
                  setCalls("");
                  setWasSynced(true);
                  setSyncError("");
                }
              }}
              onSyncError={(err) => setSyncError(err)}
            />
          </div>
          {syncError && (
            <p className="text-xs text-[#F87171] mb-3">{syncError}</p>
          )}
          <div className="border-t border-white/5 mb-4" />
        </>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Date */}
        <div>
          <label className="block text-[11px] text-[#A1A8B3] mb-1">Date</label>
          <input
            type="date"
            value={date}
            max={getToday()}
            onChange={(e) => setDate(e.target.value)}
            required
            className={inputClass}
          />
        </div>

        {/* 2-column grid */}
        <div className="grid grid-cols-2 gap-3">
          {/* Amount Spent */}
          <div>
            <label className="block text-[11px] text-[#A1A8B3] mb-1">
              Amount spent (£)
            </label>
            <div className={wasSynced && amountSpent ? "border-l-2 border-[#A855F7] pl-1" : ""}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amountSpent}
                onChange={(e) => setAmountSpent(e.target.value)}
                placeholder="0.00"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Link Clicks */}
          <div>
            <label className="block text-[11px] text-[#A1A8B3] mb-1">
              Link clicks
            </label>
            <div className={wasSynced && linkClicks ? "border-l-2 border-[#A855F7] pl-1" : ""}>
              <input
                type="number"
                min="0"
                value={linkClicks}
                onChange={(e) => setLinkClicks(e.target.value)}
                placeholder="0"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Leads */}
          <div>
            <label className="block text-[11px] text-[#A1A8B3] mb-1">
              Leads
            </label>
            <div className={wasSynced && leads ? "border-l-2 border-[#A855F7] pl-1" : ""}>
              <input
                type="number"
                min="0"
                value={leads}
                onChange={(e) => setLeads(e.target.value)}
                placeholder="0"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* Calls — Manual input */}
          <div>
            <label className="flex items-center gap-2 text-[11px] text-[#A1A8B3] mb-1">
              Calls
              <span className="text-[9px] text-[#FBBF24] uppercase tracking-wider">
                Manual input
              </span>
            </label>
            <div className="border-l-2 border-[#FBBF24] pl-1">
              <input
                type="number"
                min="0"
                value={calls}
                onChange={(e) => setCalls(e.target.value)}
                placeholder="0"
                required
                className={inputClass}
              />
            </div>
          </div>

          {/* CPL */}
          <div className="col-span-2">
            <label className="block text-[11px] text-[#A1A8B3] mb-1">
              CPL (£)
            </label>
            <div className={wasSynced && cpl ? "border-l-2 border-[#A855F7] pl-1" : ""}>
              <input
                type="number"
                step="0.01"
                min="0"
                value={cpl}
                onChange={(e) => setCpl(e.target.value)}
                placeholder="0.00"
                required
                className={inputClass}
              />
            </div>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            className="flex-1 py-2.5 rounded-[10px] font-montserrat font-semibold text-sm text-[#F2F4F8] bg-[#A855F7] hover:bg-[#9333EA] active:scale-[0.985] transition-all"
          >
            {editingRecord ? "Update entry" : "Add entry"}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-2.5 rounded-[10px] text-sm text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
          >
            {editingRecord ? "Cancel" : "Clear"}
          </button>
        </div>
      </form>
    </div>
  );
}
