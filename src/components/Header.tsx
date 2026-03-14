"use client";

import { Compass } from "lucide-react";

export default function Header() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-brand-accent/20">
          <Compass className="w-5 h-5 text-brand-accent" />
        </div>
        <span className="font-montserrat font-bold text-brand-headline tracking-wider text-sm">
          NORTH STAR
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-opensans text-brand-muted hidden sm:block">
          {today}
        </span>
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-montserrat font-bold">
          NS
        </div>
      </div>
    </header>
  );
}
