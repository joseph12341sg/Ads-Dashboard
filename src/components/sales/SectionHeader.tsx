"use client";

interface SectionHeaderProps {
  title: string;
}

export default function SectionHeader({ title }: SectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="font-montserrat font-bold text-base text-[#F2F4F8]">
        {title}
      </h2>
      <div className="flex items-center gap-2 text-[10px] text-[#4ADE80] uppercase tracking-wider">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#4ADE80] opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#4ADE80]" />
        </span>
        Live from Close
      </div>
    </div>
  );
}
