"use client";

import { useRouter } from "next/navigation";
import Image from "next/image";
import { ArrowLeft, Link as LinkIcon, Plus } from "lucide-react";

interface ClientHeaderProps {
  onGenerateLink: () => void;
}

export default function ClientHeader({ onGenerateLink }: ClientHeaderProps) {
  const router = useRouter();

  return (
    <header
      className="sticky top-0 z-30 px-6 py-3 flex items-center justify-between"
      style={{
        background: "#0E1116",
        borderBottom: "1px solid rgba(91,124,153,0.08)",
      }}
    >
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/")}
          className="text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <Image
          src="/north-star-logo.png"
          alt="North Star Solutions"
          width={28}
          height={28}
          style={{ height: 28, width: "auto" }}
        />
        <h1 className="font-montserrat font-bold text-[18px] text-[#F2F4F8]">
          Client success
        </h1>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onGenerateLink}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm transition-colors"
          style={{
            border: "1px solid #5B7C99",
            color: "#5B7C99",
            background: "transparent",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(91,124,153,0.1)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LinkIcon className="w-4 h-4" />
          Generate intake link
        </button>
        <button
          onClick={() => router.push("/clients/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm text-[#F2F4F8] transition-colors"
          style={{ background: "#5B7C99" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "#6B8DAA";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "#5B7C99";
          }}
        >
          <Plus className="w-4 h-4" />
          Add client
        </button>
      </div>
    </header>
  );
}
