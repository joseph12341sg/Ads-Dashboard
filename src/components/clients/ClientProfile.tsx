"use client";

import { useState } from "react";
import Image from "next/image";
import type { Client, ClientStatus } from "@/lib/clients/types";
import {
  formatClientCurrency,
  formatClientDate,
  getAvatarColour,
  getInitials,
  formatServiceFocus,
} from "@/lib/clients/formatters";
import ColourSwatch from "./ColourSwatch";
import ClientForm, { type ClientFormData } from "./ClientForm";

interface ClientProfileProps {
  client: Client;
  onUpdate: (data: ClientFormData, logoFile: File | null) => Promise<void>;
  onStatusChange: (status: ClientStatus) => Promise<void>;
  onDelete: () => Promise<void>;
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: "rgba(74,222,128,0.1)", text: "#4ADE80" },
  paused: { bg: "rgba(251,191,36,0.1)", text: "#FBBF24" },
  churned: { bg: "rgba(248,113,113,0.1)", text: "#F87171" },
};

function DetailItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg p-3"
      style={{ background: "#0E1116" }}
    >
      <span className="block text-[10px] uppercase tracking-wider text-[#A1A8B3] mb-1">
        {label}
      </span>
      <span className="text-[13px] text-[#F2F4F8]">{children}</span>
    </div>
  );
}

export default function ClientProfile({
  client,
  onUpdate,
  onStatusChange,
  onDelete,
}: ClientProfileProps) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const statusStyle = STATUS_STYLES[client.status] || STATUS_STYLES.active;
  const avatarColour = getAvatarColour(client.business_name);
  const valueDisplay =
    client.value_type === "mrr"
      ? `${formatClientCurrency(client.value_amount)}/mo`
      : formatClientCurrency(client.value_amount);

  async function handleSave(data: ClientFormData, logoFile: File | null) {
    setSaving(true);
    try {
      await onUpdate(data, logoFile);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <ClientForm
        initial={client}
        onSubmit={handleSave}
        onCancel={() => setEditing(false)}
        submitLabel="Save changes"
        loading={saving}
      />
    );
  }

  return (
    <div>
      {/* Profile header */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            {client.logo_url ? (
              <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#0E1116] flex items-center justify-center">
                <Image
                  src={client.logo_url}
                  alt={client.business_name}
                  width={56}
                  height={56}
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-lg font-bold text-white"
                style={{ background: avatarColour }}
              >
                {getInitials(client.business_name)}
              </div>
            )}
            <div>
              <h2 className="font-montserrat font-bold text-lg text-[#F2F4F8]">
                {client.business_name}
              </h2>
              <div className="flex items-center gap-3 mt-1">
                <span
                  className="text-[11px] px-2 py-0.5 rounded capitalize"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.text,
                  }}
                >
                  {client.status}
                </span>
                <span className="text-sm text-[#4ADE80]">{valueDisplay}</span>
                <span className="text-xs text-[#A1A8B3]">
                  Since {formatClientDate(client.start_date)}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <select
              value={client.status}
              onChange={(e) =>
                onStatusChange(e.target.value as ClientStatus)
              }
              className="px-3 py-1.5 rounded-lg text-xs text-[#F2F4F8] bg-[#0E1116] border border-[rgba(91,124,153,0.2)] outline-none"
            >
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="churned">Churned</option>
            </select>
            <button
              onClick={() => setEditing(true)}
              className="px-4 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                border: "1px solid #5B7C99",
                color: "#5B7C99",
              }}
            >
              Edit
            </button>
          </div>
        </div>
      </div>

      {/* Business Details */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <h3 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Business details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailItem label="Business Name">
            {client.business_name}
          </DetailItem>
          <DetailItem label="Main Contact">
            {client.main_contact || "--"}
          </DetailItem>
          <DetailItem label="Phone">{client.phone || "--"}</DetailItem>
          <DetailItem label="Business Address">
            {client.business_address || "--"}
          </DetailItem>
        </div>
      </div>

      {/* Service Details */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <h3 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Service details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailItem label="Avg Fee Per Client">
            {client.avg_fee_per_client
              ? formatClientCurrency(client.avg_fee_per_client)
              : "--"}
          </DetailItem>
          <DetailItem label="Main Service Focus">
            {formatServiceFocus(client.main_service_focus)}
          </DetailItem>
          <DetailItem label="Min Annual Revenue">
            {client.min_annual_revenue
              ? formatClientCurrency(client.min_annual_revenue)
              : "--"}
          </DetailItem>
          <DetailItem label="Max Annual Revenue">
            {client.max_annual_revenue
              ? formatClientCurrency(client.max_annual_revenue)
              : "--"}
          </DetailItem>
          <div className="md:col-span-2">
            <DetailItem label="Ideal Customer Profile">
              {client.ideal_customer_profile || "--"}
            </DetailItem>
          </div>
        </div>
      </div>

      {/* Ads & Branding */}
      <div
        className="rounded-xl p-5 mb-4"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.08)",
        }}
      >
        <h3 className="font-montserrat font-bold text-xs text-[#A1A8B3] uppercase tracking-wider mb-4">
          Ads & branding
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <DetailItem label="Agreed Daily Ad Spend">
            {client.agreed_daily_ad_spend
              ? formatClientCurrency(client.agreed_daily_ad_spend)
              : "--"}
          </DetailItem>
          <DetailItem label="Brand Font">
            {client.brand_font || "--"}
          </DetailItem>
          <DetailItem label="Primary Colour">
            <span className="flex items-center gap-2">
              <ColourSwatch colour={client.brand_colour_primary} />
              {client.brand_colour_primary || "--"}
            </span>
          </DetailItem>
          <DetailItem label="Secondary Colour">
            <span className="flex items-center gap-2">
              <ColourSwatch colour={client.brand_colour_secondary} />
              {client.brand_colour_secondary || "--"}
            </span>
          </DetailItem>
          {client.logo_url && (
            <DetailItem label="Logo">
              <a
                href={client.logo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#5B7C99] underline"
              >
                Download logo
              </a>
            </DetailItem>
          )}
          <div className={client.logo_url ? "" : "md:col-span-2"}>
            <DetailItem label="Additional Notes">
              {client.additional_notes || "--"}
            </DetailItem>
          </div>
        </div>
      </div>

      {/* Delete */}
      <div className="mt-6">
        {confirmDelete ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-[#F87171]">
              Are you sure? This cannot be undone.
            </span>
            <button
              onClick={onDelete}
              className="px-3 py-1 rounded text-sm text-[#F87171] border border-[#F87171] hover:bg-[#F87171] hover:text-white transition-colors"
            >
              Confirm delete
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="px-3 py-1 rounded text-sm text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="text-sm text-[#F87171] hover:underline"
          >
            Delete client
          </button>
        )}
      </div>
    </div>
  );
}
