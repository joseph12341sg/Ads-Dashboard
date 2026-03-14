"use client";

import { useState } from "react";
import type { Client, ClientStatus, ValueType, ServiceFocus } from "@/lib/clients/types";
import ColourSwatch from "./ColourSwatch";
import LogoUpload from "./LogoUpload";

export interface ClientFormData {
  business_name: string;
  value_type: ValueType;
  value_amount: string;
  start_date: string;
  renewal_date: string;
  status: ClientStatus;
  phone: string;
  main_contact: string;
  business_address: string;
  avg_fee_per_client: string;
  min_annual_revenue: string;
  max_annual_revenue: string;
  ideal_customer_profile: string;
  main_service_focus: ServiceFocus | "";
  agreed_daily_ad_spend: string;
  brand_colour_primary: string;
  brand_colour_secondary: string;
  brand_font: string;
  additional_notes: string;
}

interface ClientFormProps {
  initial?: Partial<Client>;
  onSubmit: (data: ClientFormData, logoFile: File | null) => Promise<void>;
  onCancel: () => void;
  submitLabel: string;
  loading?: boolean;
}

function getToday() {
  return new Date().toISOString().split("T")[0];
}

export default function ClientForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel,
  loading,
}: ClientFormProps) {
  const [form, setForm] = useState<ClientFormData>({
    business_name: initial?.business_name ?? "",
    value_type: initial?.value_type ?? "mrr",
    value_amount: initial?.value_amount != null ? String(initial.value_amount) : "",
    start_date: initial?.start_date ?? getToday(),
    renewal_date: initial?.renewal_date ?? "",
    status: initial?.status ?? "active",
    phone: initial?.phone ?? "",
    main_contact: initial?.main_contact ?? "",
    business_address: initial?.business_address ?? "",
    avg_fee_per_client: initial?.avg_fee_per_client != null ? String(initial.avg_fee_per_client) : "",
    min_annual_revenue: initial?.min_annual_revenue != null ? String(initial.min_annual_revenue) : "",
    max_annual_revenue: initial?.max_annual_revenue != null ? String(initial.max_annual_revenue) : "",
    ideal_customer_profile: initial?.ideal_customer_profile ?? "",
    main_service_focus: initial?.main_service_focus ?? "",
    agreed_daily_ad_spend: initial?.agreed_daily_ad_spend != null ? String(initial.agreed_daily_ad_spend) : "",
    brand_colour_primary: initial?.brand_colour_primary ?? "",
    brand_colour_secondary: initial?.brand_colour_secondary ?? "",
    brand_font: initial?.brand_font ?? "",
    additional_notes: initial?.additional_notes ?? "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  function set(key: keyof ClientFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form, logoFile);
  }

  const inputClass =
    "w-full px-3 py-2.5 rounded-lg text-sm text-[#F2F4F8] placeholder:text-[#A1A8B3]/40 outline-none transition-colors bg-[#0E1116] border border-[rgba(91,124,153,0.2)] focus:border-[#5B7C99]";
  const labelClass = "block text-[11px] text-[#A1A8B3] mb-1 uppercase tracking-wider";
  const selectClass =
    "w-full px-3 py-2.5 rounded-lg text-sm text-[#F2F4F8] outline-none transition-colors bg-[#0E1116] border border-[rgba(91,124,153,0.2)] focus:border-[#5B7C99]";

  return (
    <form onSubmit={handleSubmit}>
      <div
        className="rounded-xl p-5"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        {/* Core fields */}
        <h4 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Core details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Business name *</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              required
              placeholder="Acme Ltd"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Value type *</label>
            <select
              value={form.value_type}
              onChange={(e) => set("value_type", e.target.value)}
              className={selectClass}
            >
              <option value="mrr">MRR</option>
              <option value="upfront">Upfront</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Value amount (&pound;) *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.value_amount}
              onChange={(e) => set("value_amount", e.target.value)}
              required
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
              className={selectClass}
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Start date *</label>
            <input
              type="date"
              value={form.start_date}
              onChange={(e) => set("start_date", e.target.value)}
              required
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Renewal date</label>
            <input
              type="date"
              value={form.renewal_date}
              onChange={(e) => set("renewal_date", e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-white/5 my-5" />

        {/* Business details */}
        <h4 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Business details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Main contact</label>
            <input
              type="text"
              value={form.main_contact}
              onChange={(e) => set("main_contact", e.target.value)}
              placeholder="John Smith"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Phone</label>
            <input
              type="tel"
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+44 7XXX XXXXXX"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Business address</label>
            <input
              type="text"
              value={form.business_address}
              onChange={(e) => set("business_address", e.target.value)}
              placeholder="123 Business Street, London"
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-white/5 my-5" />

        {/* Service details */}
        <h4 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Service details
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Avg fee per client (&pound;)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.avg_fee_per_client}
              onChange={(e) => set("avg_fee_per_client", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Main service focus</label>
            <select
              value={form.main_service_focus}
              onChange={(e) => set("main_service_focus", e.target.value)}
              className={selectClass}
            >
              <option value="">Select...</option>
              <option value="bookkeeping">Bookkeeping</option>
              <option value="full_service">Full Service</option>
              <option value="cfo">CFO</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className={labelClass}>Min annual revenue (&pound;)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.min_annual_revenue}
              onChange={(e) => set("min_annual_revenue", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Max annual revenue (&pound;)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.max_annual_revenue}
              onChange={(e) => set("max_annual_revenue", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Ideal customer profile</label>
            <textarea
              value={form.ideal_customer_profile}
              onChange={(e) => set("ideal_customer_profile", e.target.value)}
              placeholder="Describe your ideal client..."
              rows={3}
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-white/5 my-5" />

        {/* Ads & Branding */}
        <h4 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Ads & branding
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className={labelClass}>Agreed daily ad spend (&pound;)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={form.agreed_daily_ad_spend}
              onChange={(e) => set("agreed_daily_ad_spend", e.target.value)}
              placeholder="0.00"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Brand font</label>
            <input
              type="text"
              value={form.brand_font}
              onChange={(e) => set("brand_font", e.target.value)}
              placeholder="e.g. Montserrat"
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>Brand colour — primary</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.brand_colour_primary}
                onChange={(e) => set("brand_colour_primary", e.target.value)}
                placeholder="#000000"
                className={inputClass}
              />
              <ColourSwatch colour={form.brand_colour_primary} />
            </div>
          </div>
          <div>
            <label className={labelClass}>Brand colour — secondary</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={form.brand_colour_secondary}
                onChange={(e) => set("brand_colour_secondary", e.target.value)}
                placeholder="#000000"
                className={inputClass}
              />
              <ColourSwatch colour={form.brand_colour_secondary} />
            </div>
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Logo</label>
            <LogoUpload
              currentUrl={initial?.logo_url}
              onFileSelect={setLogoFile}
            />
          </div>
          <div className="md:col-span-2">
            <label className={labelClass}>Additional notes</label>
            <textarea
              value={form.additional_notes}
              onChange={(e) => set("additional_notes", e.target.value)}
              placeholder="Any other information..."
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 mt-4">
        <button
          type="submit"
          disabled={loading}
          className="px-6 py-2.5 rounded-[10px] font-montserrat font-semibold text-sm text-[#F2F4F8] transition-all active:scale-[0.985] disabled:opacity-60"
          style={{ background: "#5B7C99" }}
        >
          {loading ? "Saving..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-6 py-2.5 rounded-[10px] text-sm text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
