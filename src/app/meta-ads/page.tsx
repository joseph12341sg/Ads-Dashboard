"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/components/AuthProvider";
import MetaHeader from "@/components/meta-ads/MetaHeader";
import TokenWarningBanner from "@/components/meta-ads/TokenWarningBanner";
import MetaKpiRow from "@/components/meta-ads/MetaKpiRow";
import ConversionFunnel from "@/components/meta-ads/ConversionFunnel";
import DailyInputForm from "@/components/meta-ads/DailyInputForm";
import SpendLeadsChart from "@/components/meta-ads/SpendLeadsChart";
import DailyLogTable from "@/components/meta-ads/DailyLogTable";
import ConfirmDialog from "@/components/meta-ads/ConfirmDialog";
import Toast from "@/components/meta-ads/Toast";
import { fetchAllEntries, upsertEntry, deleteEntry } from "@/lib/meta-ads/queries";
import { calculateTotals } from "@/lib/meta-ads/calculations";
import type { MetaAdsDailyRecord } from "@/lib/meta-ads/types";

export default function MetaAdsPage() {
  const { user } = useAuth();
  const [records, setRecords] = useState<MetaAdsDailyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingRecord, setEditingRecord] = useState<MetaAdsDailyRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<MetaAdsDailyRecord | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchAllEntries();
      setRecords(data);
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to load data",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totals = calculateTotals(records);

  async function handleSubmit(data: {
    date: string;
    amount_spent: number;
    link_clicks: number;
    leads: number;
    calls: number;
    cpl: number;
    synced_from_meta: boolean;
  }) {
    if (!user) return;

    try {
      await upsertEntry(
        {
          date: data.date,
          amount_spent: data.amount_spent,
          link_clicks: data.link_clicks,
          leads: data.leads,
          calls: data.calls,
          cpl: data.cpl,
          synced_from_meta: data.synced_from_meta,
        },
        user.id
      );
      setToast({
        message: editingRecord ? "Entry updated" : "Entry added",
        type: "success",
      });
      setEditingRecord(null);
      await loadData();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to save",
        type: "error",
      });
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteEntry(deleteTarget.id);
      setToast({ message: "Entry deleted", type: "success" });
      setDeleteTarget(null);
      await loadData();
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : "Failed to delete",
        type: "error",
      });
    }
  }

  return (
    <div className="min-h-screen bg-[#0E1116]">
      <TokenWarningBanner />
      <MetaHeader />

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* KPI Rows */}
        <MetaKpiRow totals={totals} loading={loading} />

        {/* Conversion Funnel */}
        <ConversionFunnel
          clicks={totals.total_clicks}
          leads={totals.total_leads}
          calls={totals.total_calls}
        />

        {/* Two-Column: Form + Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <DailyInputForm
            editingRecord={editingRecord}
            onSubmit={handleSubmit}
            onCancelEdit={() => setEditingRecord(null)}
          />
          <SpendLeadsChart records={records} />
        </div>

        {/* Daily Log Table */}
        <DailyLogTable
          records={records}
          onEdit={(r) => setEditingRecord(r)}
          onDelete={(r) => setDeleteTarget(r)}
          loading={loading}
        />
      </main>

      {/* Delete Confirmation */}
      {deleteTarget && (
        <ConfirmDialog
          title="Delete entry"
          message={`Are you sure you want to delete the entry for ${deleteTarget.date}? This cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
      )}

      {/* Toast */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
