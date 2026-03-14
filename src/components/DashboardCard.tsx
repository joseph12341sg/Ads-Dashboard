"use client";

import Link from "next/link";
import { ArrowRight, TrendingUp, BarChart3, Users, Megaphone, LayoutGrid } from "lucide-react";

const ICON_MAP = {
  TrendingUp,
  BarChart3,
  Users,
  Megaphone,
  LayoutGrid,
} as const;

interface DashboardCardProps {
  title: string;
  description: string;
  href: string;
  color: string;
  icon: keyof typeof ICON_MAP;
  status: string;
  placeholder?: boolean;
}

export default function DashboardCard({
  title,
  description,
  href,
  color,
  icon,
  status,
  placeholder,
}: DashboardCardProps) {
  const Icon = ICON_MAP[icon];

  return (
    <Link href={href} className="group block">
      <div
        className={`
          relative overflow-hidden rounded-xl bg-brand-card p-6
          border transition-all duration-200
          ${
            placeholder
              ? "border-dashed border-brand-accent/30 opacity-50"
              : "border-white/5 hover:border-white/15 hover:-translate-y-0.5"
          }
        `}
      >
        {/* Subtle glow effect */}
        {!placeholder && (
          <div
            className="absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-[0.07] pointer-events-none"
            style={{ background: color }}
          />
        )}

        <div className="relative flex flex-col gap-4">
          {/* Icon + badge row */}
          <div className="flex items-start justify-between">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-lg"
              style={{ backgroundColor: `${color}15` }}
            >
              <Icon className="w-5 h-5" style={{ color }} />
            </div>

            {placeholder && (
              <span className="text-[10px] uppercase tracking-wider px-2 py-1 rounded-full border border-brand-accent/30 text-brand-muted font-opensans">
                Coming soon
              </span>
            )}
          </div>

          {/* Title + description */}
          <div>
            <h3 className="font-montserrat font-bold text-brand-headline text-base mb-1">
              {title}
            </h3>
            <p className="font-opensans text-sm text-brand-muted leading-relaxed">
              {description}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-white/5">
            <span
              className="text-xs font-opensans"
              style={{ color: placeholder ? undefined : color }}
            >
              {status}
            </span>
            <ArrowRight
              className="w-4 h-4 text-brand-muted opacity-0 -translate-x-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-x-0"
            />
          </div>
        </div>
      </div>
    </Link>
  );
}
