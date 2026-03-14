"use client";

import { useState, useRef } from "react";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface LogoUploadProps {
  currentUrl?: string | null;
  onFileSelect: (file: File | null) => void;
}

const ACCEPTED = ".png,.jpg,.jpeg,.svg";
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

export default function LogoUpload({
  currentUrl,
  onFileSelect,
}: LogoUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentUrl || null);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setError("");

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!["png", "jpg", "jpeg", "svg"].includes(ext || "")) {
      setError("Only .png, .jpg, and .svg files are allowed");
      return;
    }

    if (file.size > MAX_SIZE) {
      setError("File must be under 5MB");
      return;
    }

    const url = URL.createObjectURL(file);
    setPreview(url);
    onFileSelect(file);
  }

  function handleRemove() {
    setPreview(null);
    onFileSelect(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      {preview ? (
        <div className="flex items-center gap-3">
          <div
            className="w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center"
            style={{
              background: "#0E1116",
              border: "1px solid rgba(91,124,153,0.2)",
            }}
          >
            <Image
              src={preview}
              alt="Logo preview"
              width={64}
              height={64}
              className="object-contain"
              unoptimized
            />
          </div>
          <button
            type="button"
            onClick={handleRemove}
            className="text-[#F87171] text-xs flex items-center gap-1 hover:underline"
          >
            <X className="w-3 h-3" /> Remove
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm text-[#A1A8B3] transition-colors hover:text-[#F2F4F8]"
          style={{
            background: "#0E1116",
            border: "1px solid rgba(91,124,153,0.2)",
          }}
        >
          <Upload className="w-4 h-4" />
          Upload logo
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />
      {error && <p className="text-xs text-[#F87171] mt-1">{error}</p>}
    </div>
  );
}
