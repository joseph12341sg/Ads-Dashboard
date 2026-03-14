"use client";

import Image from "next/image";

export default function IntakeSuccess() {
  return (
    <div className="text-center">
      <Image
        src="/north-star-logo.png"
        alt="North Star Solutions"
        width={64}
        height={64}
        style={{ height: 64, width: "auto" }}
        className="mx-auto mb-6"
      />
      <div
        className="w-16 h-16 rounded-full mx-auto mb-6 flex items-center justify-center"
        style={{ background: "rgba(74,222,128,0.1)" }}
      >
        <svg
          className="w-8 h-8 text-[#4ADE80]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M5 13l4 4L19 7"
          />
        </svg>
      </div>
      <h2 className="font-montserrat font-bold text-xl text-[#F2F4F8] mb-3">
        Thank you!
      </h2>
      <p className="text-sm text-[#A1A8B3] max-w-sm mx-auto">
        Your details have been submitted to North Star Solutions. We&apos;ll be
        in touch soon.
      </p>
    </div>
  );
}
