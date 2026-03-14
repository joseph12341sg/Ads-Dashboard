"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import type { Expense, ExpenseCategory, ExpenseFrequency } from "@/lib/financial/types";

const CATEGORIES: { value: ExpenseCategory; label: string }[] = [
  { value: "software", label: "Software" },
  { value: "contractors", label: "Contractors" },
  { value: "advertising", label: "Advertising" },
  { value: "professional", label: "Professional" },
  { value: "office_admin", label: "Office / admin" },
  { value: "other", label: "Other" },
];

const FREQUENCIES: { value: ExpenseFrequency; label: string }[] = [
  { value: "monthly", label: "Monthly" },
  { value: "quarterly", label: "Quarterly" },
  { value: "annual", label: "Annual" },
  { value: "one_off", label: "One-off" },
];

interface AddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    name: string;
    category: ExpenseCategory;
    amount: number;
    frequency: ExpenseFrequency;
    start_date?: string | null;
    notes?: string | null;
  }) => Promise<void>;
  editing?: Expense | null;
}

export default function AddExpenseModal({ isOpen, onClose, onSubmit, editing }: AddExpenseModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("software");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState<ExpenseFrequency>("monthly");
  const [startDate, setStartDate] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (editing) {
      setName(editing.name);
      setCategory(editing.category);
      setAmount(String(editing.amount));
      setFrequency(editing.frequency);
      setStartDate(editing.start_date ?? "");
      setNotes(editing.notes ?? "");
    } else {
      setName("");
      setCategory("software");
      setAmount("");
      setFrequency("monthly");
      setStartDate("");
      setNotes("");
    }
    setError("");
  }, [editing, isOpen]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !amount) {
      setError("Name and amount are required");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await onSubmit({
        name: name.trim(),
        category,
        amount: parseFloat(amount),
        frequency,
        start_date: startDate || null,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setSubmitting(false);
    }
  }

  if (!isOpen) return null;

  const inputClass = "w-full px-3 py-2 rounded-lg text-sm text-[#F2F4F8] bg-[#0E1116] border border-[rgba(91,124,153,0.2)] outline-none focus:border-[#5B7C99] transition-colors";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative z-10 w-full max-w-md mx-4 rounded-xl p-6"
        style={{ background: "#161B22", border: "1px solid rgba(91,124,153,0.15)" }}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-montserrat font-bold text-base text-[#F2F4F8]">
            {editing ? "Edit expense" : "Add expense"}
          </h3>
          <button onClick={onClose} className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="block text-[11px] text-[#A1A8B3] mb-1.5 uppercase tracking-wider">Item name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Close CRM"
              className={inputClass}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#A1A8B3] mb-1.5 uppercase tracking-wider">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className={inputClass}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#A1A8B3] mb-1.5 uppercase tracking-wider">Amount (£) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className={inputClass}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] text-[#A1A8B3] mb-1.5 uppercase tracking-wider">Frequency</label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as ExpenseFrequency)}
                className={inputClass}
              >
                {FREQUENCIES.map((f) => (
                  <option key={f.value} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-[11px] text-[#A1A8B3] mb-1.5 uppercase tracking-wider">Start date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-[#A1A8B3] mb-1.5 uppercase tracking-wider">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Optional notes..."
              className={inputClass + " resize-none"}
            />
          </div>

          {error && <p className="text-xs text-[#F87171]">{error}</p>}

          <div className="flex gap-3 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm text-[#A1A8B3] transition-colors hover:text-[#F2F4F8]"
              style={{ border: "1px solid rgba(91,124,153,0.2)" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 rounded-lg text-sm text-[#F2F4F8] transition-colors disabled:opacity-60"
              style={{ background: "#5B7C99" }}
            >
              {submitting ? "Saving..." : editing ? "Update expense" : "Add expense"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
