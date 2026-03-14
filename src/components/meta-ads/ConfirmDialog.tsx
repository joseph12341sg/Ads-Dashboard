"use client";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className="w-full max-w-sm mx-4 rounded-xl p-6"
        style={{
          background: "#161B22",
          border: "1px solid rgba(91,124,153,0.15)",
        }}
      >
        <h3 className="font-montserrat font-bold text-[#F2F4F8] text-base mb-2">
          {title}
        </h3>
        <p className="text-sm text-[#A1A8B3] mb-6">{message}</p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-sm text-[#A1A8B3] hover:text-[#F2F4F8] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 rounded-lg text-sm text-[#F2F4F8] bg-[#F87171] hover:bg-[#EF4444] transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
