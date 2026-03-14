"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Calendar } from "lucide-react";

export default function MetaHeader() {
  return (
    <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
        >
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
          Meta Ads
        </h1>
      </div>
      <div
        className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs text-[#A1A8B3]"
        style={{
          background: "rgba(91,124,153,0.08)",
          border: "1px solid rgba(91,124,153,0.12)",
        }}
      >
        <Calendar className="w-3.5 h-3.5" />
        Last 30 days
      </div>
    </div>
  );
}
