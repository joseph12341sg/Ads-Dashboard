"use client";

import { useState, useRef } from "react";
import ColourSwatch from "./ColourSwatch";

export interface IntakeFormData {
  business_name: string;
  main_contact: string;
  phone: string;
  business_address: string;
  avg_fee_per_client: string;
  min_annual_revenue: string;
  max_annual_revenue: string;
  ideal_customer_profile: string;
  main_service_focus: string;
  agreed_daily_ad_spend: string;
  brand_colour_primary: string;
  brand_colour_secondary: string;
  brand_font: string;
  additional_notes: string;
}

interface IntakeFormProps {
  token: string;
  onSubmit: (data: IntakeFormData, logoFile: File | null) => Promise<void>;
}

export default function IntakeForm({ token, onSubmit }: IntakeFormProps) {
  const [form, setForm] = useState<IntakeFormData>({
    business_name: "",
    main_contact: "",
    phone: "",
    business_address: "",
    avg_fee_per_client: "",
    min_annual_revenue: "",
    max_annual_revenue: "",
    ideal_customer_profile: "",
    main_service_focus: "",
    agreed_daily_ad_spend: "",
    brand_colour_primary: "",
    brand_colour_secondary: "",
    brand_font: "",
    additional_notes: "",
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoError, setLogoError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  // suppress unused variable warning
  void token;

  function set(key: keyof IntakeFormData, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLogoError("");

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg", "svg"].includes(ext || "")) {
      setLogoError("Only .png, .jpg, and .svg files are allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setLogoError("File must be under 5MB");
      return;
    }

    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await onSubmit(form, logoFile);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      setSubmitting(false);
    }
  }

  const inputClass =
    "w-full px-4 py-3 rounded-lg text-sm text-[#F2F4F8] placeholder:text-[#A1A8B3]/40 outline-none transition-colors bg-[#0E1116] border border-[rgba(91,124,153,0.2)] focus:border-[#5B7C99]";
  const labelClass =
    "block text-xs text-[#A1A8B3] mb-1.5";
  const selectClass =
    "w-full px-4 py-3 rounded-lg text-sm text-[#F2F4F8] outline-none transition-colors bg-[#0E1116] border border-[rgba(91,124,153,0.2)] focus:border-[#5B7C99]";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="px-4 py-3 rounded-lg text-sm"
          style={{
            background: "rgba(248,113,113,0.08)",
            border: "1px solid rgba(248,113,113,0.2)",
            color: "#F87171",
          }}
        >
          {error}
        </div>
      )}

      {/* Business Details */}
      <div>
        <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
          Business details
        </h3>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Business name *</label>
            <input
              type="text"
              value={form.business_name}
              onChange={(e) => set("business_name", e.target.value)}
              required
              placeholder="Your company name"
              className={inputClass}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Main contact name *</label>
              <input
                type="text"
                value={form.main_contact}
                onChange={(e) => set("main_contact", e.target.value)}
                required
                placeholder="John Smith"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>Phone number *</label>
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set("phone", e.target.value)}
                required
                placeholder="+44 7XXX XXXXXX"
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className={labelClass}>Business address *</label>
            <input
              type="text"
              value={form.business_address}
              onChange={(e) => set("business_address", e.target.value)}
              required
              placeholder="123 Business Street, London"
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* Service Details */}
      <div>
        <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
          Service details
        </h3>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Average fee per client (&pound;)</label>
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
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Minimum annual revenue (&pound;)</label>
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
              <label className={labelClass}>Maximum annual revenue (&pound;)</label>
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
          </div>
          <div>
            <label className={labelClass}>
              Ideal customer profile &mdash; describe your ideal client
            </label>
            <textarea
              value={form.ideal_customer_profile}
              onChange={(e) => set("ideal_customer_profile", e.target.value)}
              placeholder="Tell us about the type of clients you'd love to work with..."
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className="border-t border-white/5" />

      {/* Ads & Branding */}
      <div>
        <h3 className="font-montserrat font-bold text-sm text-[#F2F4F8] mb-4">
          Ads & branding
        </h3>
        <div className="space-y-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Brand colour &mdash; primary</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.brand_colour_primary}
                  onChange={(e) => set("brand_colour_primary", e.target.value)}
                  placeholder="#000000"
                  className={inputClass}
                />
                <ColourSwatch colour={form.brand_colour_primary} size={20} />
              </div>
            </div>
            <div>
              <label className={labelClass}>Brand colour &mdash; secondary</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={form.brand_colour_secondary}
                  onChange={(e) =>
                    set("brand_colour_secondary", e.target.value)
                  }
                  placeholder="#000000"
                  className={inputClass}
                />
                <ColourSwatch colour={form.brand_colour_secondary} size={20} />
              </div>
            </div>
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
            <label className={labelClass}>Upload your logo</label>
            {logoPreview ? (
              <div className="flex items-center gap-3">
                <div
                  className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center"
                  style={{
                    background: "#0E1116",
                    border: "1px solid rgba(91,124,153,0.2)",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    className="w-full h-full object-contain"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setLogoFile(null);
                    setLogoPreview(null);
                    if (fileRef.current) fileRef.current.value = "";
                  }}
                  className="text-xs text-[#F87171] hover:underline"
                >
                  Remove
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="px-4 py-3 rounded-lg text-sm text-[#A1A8B3] transition-colors hover:text-[#F2F4F8] w-full text-left"
                style={{
                  background: "#0E1116",
                  border: "1px solid rgba(91,124,153,0.2)",
                }}
              >
                Click to upload (.png, .jpg, .svg &mdash; max 5MB)
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileChange}
              className="hidden"
            />
            {logoError && (
              <p className="text-xs text-[#F87171] mt-1">{logoError}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>Anything else we should know?</label>
            <textarea
              value={form.additional_notes}
              onChange={(e) => set("additional_notes", e.target.value)}
              placeholder="Additional notes or special requirements..."
              rows={3}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-[10px] font-montserrat font-semibold text-sm text-[#F2F4F8] transition-all active:scale-[0.985] disabled:opacity-60"
        style={{ background: "#5B7C99" }}
      >
        {submitting ? "Submitting..." : "Submit onboarding details"}
      </button>
    </form>
  );
}
