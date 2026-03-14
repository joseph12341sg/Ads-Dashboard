import type { SupabaseClient } from "@supabase/supabase-js";
import type { Expense, ExpenseCategory, ExpenseFrequency } from "./types";
import { calculateMonthlyCost } from "./calculations";

export async function fetchExpenses(supabase: SupabaseClient): Promise<Expense[]> {
  const { data } = await supabase
    .from("expenses")
    .select("*")
    .eq("active", true)
    .order("category", { ascending: true })
    .order("name", { ascending: true });

  if (!data) return [];

  return data.map((row) => ({
    ...row,
    monthly_cost: calculateMonthlyCost(
      Number(row.amount),
      row.frequency as ExpenseFrequency
    ),
  })) as Expense[];
}

export async function insertExpense(
  supabase: SupabaseClient,
  expense: {
    name: string;
    category: ExpenseCategory;
    amount: number;
    frequency: ExpenseFrequency;
    start_date?: string | null;
    notes?: string | null;
  }
) {
  return supabase.from("expenses").insert(expense).select().single();
}

export async function updateExpense(
  supabase: SupabaseClient,
  id: string,
  expense: {
    name: string;
    category: ExpenseCategory;
    amount: number;
    frequency: ExpenseFrequency;
    start_date?: string | null;
    notes?: string | null;
  }
) {
  return supabase
    .from("expenses")
    .update({ ...expense, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
}

export async function deleteExpense(supabase: SupabaseClient, id: string) {
  return supabase.from("expenses").delete().eq("id", id);
}
