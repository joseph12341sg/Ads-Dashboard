"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import FinancialHeader from "@/components/financial/FinancialHeader";
import RevenueSection from "@/components/financial/RevenueSection";
import ExpenseSection from "@/components/financial/ExpenseSection";
import ProfitLossSection from "@/components/financial/ProfitLossSection";
import UnitEconomicsSection from "@/components/financial/UnitEconomicsSection";
import AddExpenseModal from "@/components/financial/AddExpenseModal";
import type {
  FinancialDashboardData,
  Expense,
  ExpenseCategory,
  ExpenseFrequency,
} from "@/lib/financial/types";

function getDefaultRange(): [string, string] {
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  return [first.toISOString().split("T")[0], now.toISOString().split("T")[0]];
}

const EMPTY_DATA: FinancialDashboardData = {
  revenue: {
    cash_collected: 0,
    mrr: 0,
    total_revenue: 0,
    won_deals_count: 0,
    new_clients_count: 0,
    active_clients: 0,
    avg_client_value: null,
    previous_period_revenue: 0,
  },
  expenses: {
    ad_spend: 0,
    manual_expenses_monthly: 0,
    total_expenses: 0,
    line_items: [],
  },
  profit: {
    gross_profit: 0,
    profit_margin: null,
    net_cash_flow: 0,
    previous_period_margin: null,
  },
  unit_economics: {
    cac: null,
    ltv: null,
    ltv_cac_ratio: null,
    revenue_per_client: null,
  },
  monthly_trend: [],
};

export default function FinancialPage() {
  const [defStart, defEnd] = getDefaultRange();
  const [dateStart, setDateStart] = useState(defStart);
  const [dateEnd, setDateEnd] = useState(defEnd);
  const [data, setData] = useState<FinancialDashboardData>(EMPTY_DATA);
  const [loading, setLoading] = useState(true);

  // Expense modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);

  const supabase = createClient();

  const fetchData = useCallback(async (s: string, e: string) => {
    setLoading(true);
    try {
      const isAllTime = s === "all" && e === "all";
      const url = isAllTime
        ? "/api/financial"
        : `/api/financial?start=${s}&end=${e}`;
      const res = await fetch(url);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Keep existing data on error
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(dateStart, dateEnd);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function handleDateChange(s: string, e: string) {
    setDateStart(s);
    setDateEnd(e);
    fetchData(s, e);
  }

  // ── Expense CRUD ──
  async function handleAddExpense(expenseData: {
    name: string;
    category: ExpenseCategory;
    amount: number;
    frequency: ExpenseFrequency;
    start_date?: string | null;
    notes?: string | null;
  }) {
    if (editingExpense) {
      const { error } = await supabase
        .from("expenses")
        .update({ ...expenseData, updated_at: new Date().toISOString() })
        .eq("id", editingExpense.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase.from("expenses").insert(expenseData);
      if (error) throw new Error(error.message);
    }
    setEditingExpense(null);
    fetchData(dateStart, dateEnd);
  }

  async function handleDeleteExpense(id: string) {
    await supabase.from("expenses").delete().eq("id", id);
    fetchData(dateStart, dateEnd);
  }

  function handleEditExpense(expense: Expense) {
    setEditingExpense(expense);
    setModalOpen(true);
  }

  function handleOpenAdd() {
    setEditingExpense(null);
    setModalOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#0E1116]">
      <FinancialHeader start={dateStart} end={dateEnd} onDateChange={handleDateChange} />

      <main className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-6">
        {/* ═══ REVENUE ═══ */}
        <RevenueSection data={data.revenue} loading={loading} />

        <div className="border-t border-white/5" />

        {/* ═══ EXPENSES ═══ */}
        <ExpenseSection
          data={data.expenses}
          revenue={data.revenue}
          loading={loading}
          onAddExpense={handleOpenAdd}
          onEditExpense={handleEditExpense}
          onDeleteExpense={handleDeleteExpense}
        />

        <div className="border-t border-white/5" />

        {/* ═══ PROFIT & LOSS ═══ */}
        <ProfitLossSection data={data.profit} trend={data.monthly_trend} loading={loading} />

        <div className="border-t border-white/5" />

        {/* ═══ UNIT ECONOMICS ═══ */}
        <UnitEconomicsSection data={data.unit_economics} loading={loading} />
      </main>

      <AddExpenseModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingExpense(null);
        }}
        onSubmit={handleAddExpense}
        editing={editingExpense}
      />
    </div>
  );
}
