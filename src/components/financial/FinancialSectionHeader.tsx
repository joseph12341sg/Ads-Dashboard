"use client";

interface FinancialSectionHeaderProps {
  title: string;
  badge?: string;
}

export default function FinancialSectionHeader({ title, badge }: FinancialSectionHeaderProps) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="font-montserrat font-bold text-base text-[#F2F4F8]">
        {title}
      </h2>
      {badge && (
        <span
          className="text-[10px] px-2 py-0.5 rounded-full text-[#A1A8B3]"
          style={{ background: "rgba(91,124,153,0.1)" }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}
