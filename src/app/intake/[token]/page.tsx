"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import IntakeForm, {
  type IntakeFormData,
} from "@/components/clients/IntakeForm";
import IntakeSuccess from "@/components/clients/IntakeSuccess";

type LinkStatus = "loading" | "valid" | "invalid" | "expired" | "used";

export default function IntakePage() {
  const params = useParams();
  const token = params.token as string;
  const [status, setStatus] = useState<LinkStatus>("loading");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    async function validateToken() {
      try {
        const res = await fetch(`/api/intake?token=${token}`);
        const json = await res.json();
        if (json.valid) {
          setStatus("valid");
        } else {
          setStatus(json.reason || "invalid");
        }
      } catch {
        setStatus("invalid");
      }
    }
    validateToken();
  }, [token]);

  async function handleSubmit(data: IntakeFormData, logoFile: File | null) {
    const formData = new FormData();
    formData.append("token", token);

    for (const [key, value] of Object.entries(data)) {
      if (value) formData.append(key, value);
    }

    if (logoFile) {
      formData.append("logo", logoFile);
    }

    const res = await fetch("/api/intake", {
      method: "POST",
      body: formData,
    });

    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.error || "Submission failed");
    }

    setSubmitted(true);
  }

  return (
    <div className="relative min-h-screen bg-[#0E1116] flex items-center justify-center overflow-hidden">
      {/* Background glows */}
      <div
        className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full"
        style={{
          background: "#5B7C99",
          filter: "blur(120px)",
          opacity: 0.06,
        }}
      />
      <div
        className="absolute bottom-[-20%] left-[-10%] w-[400px] h-[400px] rounded-full"
        style={{
          background: "#8B5CF6",
          filter: "blur(120px)",
          opacity: 0.06,
        }}
      />

      <div className="relative z-10 w-full max-w-[600px] mx-4 py-12">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <Image
            src="/north-star-logo.png"
            alt="North Star Solutions"
            width={52}
            height={52}
            style={{ height: 52, width: "auto" }}
            priority
          />
          <h1
            className="font-montserrat font-bold text-[#F2F4F8] mt-4"
            style={{ fontSize: 20, letterSpacing: 1 }}
          >
            NORTH STAR SOLUTIONS
          </h1>
          <p
            className="font-opensans text-[#A1A8B3] mt-1"
            style={{ fontSize: 13 }}
          >
            Client Onboarding
          </p>
        </div>

        {status === "loading" && (
          <div className="text-center">
            <div className="animate-pulse text-[#A1A8B3] text-sm">
              Validating link...
            </div>
          </div>
        )}

        {status === "invalid" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "#161B22",
              border: "1px solid rgba(91,124,153,0.12)",
            }}
          >
            <h2 className="font-montserrat font-bold text-lg text-[#F87171] mb-2">
              Invalid link
            </h2>
            <p className="text-sm text-[#A1A8B3]">
              This onboarding link is not valid. Please contact North Star
              Solutions for a new one.
            </p>
          </div>
        )}

        {status === "expired" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "#161B22",
              border: "1px solid rgba(91,124,153,0.12)",
            }}
          >
            <h2 className="font-montserrat font-bold text-lg text-[#FBBF24] mb-2">
              Link expired
            </h2>
            <p className="text-sm text-[#A1A8B3]">
              This link has expired. Please contact North Star Solutions for a
              new one.
            </p>
          </div>
        )}

        {status === "used" && (
          <div
            className="rounded-xl p-8 text-center"
            style={{
              background: "#161B22",
              border: "1px solid rgba(91,124,153,0.12)",
            }}
          >
            <h2 className="font-montserrat font-bold text-lg text-[#A1A8B3] mb-2">
              Already submitted
            </h2>
            <p className="text-sm text-[#A1A8B3]">
              This form has already been submitted. If you need to make changes,
              please contact North Star Solutions.
            </p>
          </div>
        )}

        {status === "valid" && !submitted && (
          <div
            className="rounded-xl p-7"
            style={{
              background: "#161B22",
              border: "1px solid rgba(91,124,153,0.12)",
            }}
          >
            <IntakeForm token={token} onSubmit={handleSubmit} />
          </div>
        )}

        {submitted && (
          <div
            className="rounded-xl p-10"
            style={{
              background: "#161B22",
              border: "1px solid rgba(91,124,153,0.12)",
            }}
          >
            <IntakeSuccess />
          </div>
        )}

        <p
          className="text-center mt-8"
          style={{ fontSize: 12, color: "rgba(161,168,179,0.4)" }}
        >
          North Star Solutions &copy; 2026
        </p>
      </div>
    </div>
  );
}
