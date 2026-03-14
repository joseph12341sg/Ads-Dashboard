"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import DateRangePicker from "./DateRangePicker";

interface SalesHeaderProps {
  start: string;
  end: string;
  onDateChange: (start: string, end: string) => void;
}

export default function SalesHeader({ start, end, onDateChange }: SalesHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <Link href="/" className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <Image
          src="/north-star-logo.png"
          alt="North Star Solutions"
          width={28}
          height={28}
          style={{ height: 28, width: "auto" }}
        />
        <h1 className="font-montserrat font-bold text-[#F2F4F8] text-lg">
          Sales &amp; Pipeline
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-[11px] text-[#4ADE80]">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#4ADE80]" />
          </span>
          Live from Close
        </div>
        <DateRangePicker start={start} end={end} onChange={onDateChange} />
      </div>
    </div>
  );
}
