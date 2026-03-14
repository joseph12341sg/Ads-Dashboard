"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setError("Invalid email or password");
      setSubmitting(false);
      return;
    }

    router.push("/");
  }

  function handleForgotPassword() {
    setError("");
    const toast = document.getElementById("forgot-toast");
    if (toast) {
      toast.classList.remove("opacity-0");
      toast.classList.add("opacity-100");
      setTimeout(() => {
        toast.classList.remove("opacity-100");
        toast.classList.add("opacity-0");
      }, 3000);
    }
  }

  return (
    <div className="relative min-h-screen bg-brand-bg flex items-center justify-center overflow-hidden">
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

      <div className="relative z-10 w-full max-w-[380px] mx-4">
        {/* Logo area */}
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
            className="font-montserrat font-bold text-brand-headline mt-4"
            style={{ fontSize: 22, letterSpacing: 1 }}
          >
            NORTH STAR SOLUTIONS
          </h1>
          <p className="font-opensans text-brand-muted mt-1" style={{ fontSize: 13 }}>
            CEO Dashboard
          </p>
        </div>

        {/* Form card */}
        <form
          onSubmit={handleSubmit}
          className="rounded-[14px] p-7"
          style={{
            background: "#161B22",
            border: "1px solid rgba(91,124,153,0.12)",
          }}
        >
          {/* Error banner */}
          {error && (
            <div
              className="mb-4 px-3 py-2 rounded-lg text-xs"
              style={{
                background: "rgba(248,113,113,0.08)",
                border: "1px solid rgba(248,113,113,0.2)",
                color: "#F87171",
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-4">
            <label className="block text-xs text-brand-muted mb-1.5">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@northstar.com"
              required
              className="w-full px-3 py-2.5 rounded-lg text-sm text-brand-headline placeholder:text-brand-muted/40 outline-none transition-colors"
              style={{
                background: "#0E1116",
                border: "1px solid rgba(91,124,153,0.2)",
              }}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = "#5B7C99")
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = "rgba(91,124,153,0.2)")
              }
            />
          </div>

          {/* Password */}
          <div className="mb-4">
            <label className="block text-xs text-brand-muted mb-1.5">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="w-full px-3 py-2.5 rounded-lg text-sm text-brand-headline placeholder:text-brand-muted/40 outline-none pr-10 transition-colors"
                style={{
                  background: "#0E1116",
                  border: "1px solid rgba(91,124,153,0.2)",
                }}
                onFocus={(e) =>
                  (e.currentTarget.style.borderColor = "#5B7C99")
                }
                onBlur={(e) =>
                  (e.currentTarget.style.borderColor =
                    "rgba(91,124,153,0.2)")
                }
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-brand-headline transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Remember me / Forgot password */}
          <div className="flex items-center justify-between mb-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="relative">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-4 h-4 rounded border border-brand-accent/30 bg-brand-bg peer-checked:bg-brand-accent peer-checked:border-brand-accent transition-colors flex items-center justify-center">
                  {rememberMe && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
              <span className="text-xs text-brand-muted">Remember me</span>
            </label>
            <button
              type="button"
              onClick={handleForgotPassword}
              className="text-xs text-brand-accent hover:underline"
            >
              Forgot password?
            </button>
          </div>

          {/* Sign in button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 rounded-[10px] font-montserrat font-semibold text-sm text-brand-headline transition-all active:scale-[0.985] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: "#5B7C99" }}
            onMouseEnter={(e) => {
              if (!submitting)
                e.currentTarget.style.background = "#6B8DAA";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#5B7C99";
            }}
          >
            {submitting ? "Signing in..." : "Sign in"}
          </button>
        </form>

        {/* Footer */}
        <p
          className="text-center mt-6"
          style={{ fontSize: 12, color: "rgba(161,168,179,0.4)" }}
        >
          North Star Solutions &copy; 2026
        </p>

        {/* Forgot password toast */}
        <div
          id="forgot-toast"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-lg text-xs text-brand-headline opacity-0 transition-opacity duration-300 pointer-events-none"
          style={{
            background: "#161B22",
            border: "1px solid rgba(91,124,153,0.2)",
          }}
        >
          Contact admin to reset password
        </div>
      </div>
    </div>
  );
}
