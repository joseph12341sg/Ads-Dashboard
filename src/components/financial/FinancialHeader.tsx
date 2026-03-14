"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import DateRangePicker from "@/components/sales/DateRangePicker";
import DataSourceTags from "./DataSourceTags";

interface FinancialHeaderProps {
  start: string;
  end: string;
  onDateChange: (start: string, end: string) => void;
}

export default function FinancialHeader({ start, end, onDateChange }: FinancialHeaderProps) {
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
          Financial performance
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <DataSourceTags />
        <DateRangePicker start={start} end={end} onChange={onDateChange} />
      </div>
    </div>
  );
}
