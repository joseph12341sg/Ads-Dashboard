"use client";

interface SparklineProps {
  path: string;
  color: string;
  width?: number;
  height?: number;
}

export default function Sparkline({ path, color, width = 50, height = 20 }: SparklineProps) {
  if (!path) return null;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      className="opacity-60"
    >
      <path
        d={path}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
