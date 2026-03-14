"use client";

import { useEffect } from "react";
import { CheckCircle, XCircle, X } from "lucide-react";

interface ToastProps {
  message: string;
  type: "success" | "error";
  onClose: () => void;
}

export default function Toast({ message, type, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-lg"
        style={{
          background: "#161B22",
          border: `1px solid ${type === "success" ? "rgba(74,222,128,0.2)" : "rgba(248,113,113,0.2)"}`,
        }}
      >
        {type === "success" ? (
          <CheckCircle className="w-4 h-4 text-[#4ADE80] shrink-0" />
        ) : (
          <XCircle className="w-4 h-4 text-[#F87171] shrink-0" />
        )}
        <span className="text-[#F2F4F8]">{message}</span>
        <button onClick={onClose} className="ml-2 text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
