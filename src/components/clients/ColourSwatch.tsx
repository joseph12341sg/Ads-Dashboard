"use client";

interface ColourSwatchProps {
  colour: string | null;
  size?: number;
}

export default function ColourSwatch({ colour, size = 16 }: ColourSwatchProps) {
  if (!colour) return null;

  const isValid = /^#([0-9A-Fa-f]{3}){1,2}$/.test(colour);

  return (
    <span
      className="inline-block rounded"
      style={{
        width: size,
        height: size,
        background: isValid ? colour : "#333",
        border: "1px solid rgba(255,255,255,0.1)",
      }}
    />
  );
}
