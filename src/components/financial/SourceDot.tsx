"use client";

const SOURCE_COLORS: Record<string, string> = {
  close: "#60A5FA",
  meta: "#A855F7",
  clients: "#FBBF24",
  manual: "#5B7C99",
  auto: "#4ADE80",
};

interface SourceDotProps {
  source: keyof typeof SOURCE_COLORS;
  size?: number;
}

export default function SourceDot({ source, size = 6 }: SourceDotProps) {
  return (
    <span
      className="inline-block rounded-full shrink-0"
      style={{
        width: size,
        height: size,
        background: SOURCE_COLORS[source] ?? "#5B7C99",
      }}
    />
  );
}
