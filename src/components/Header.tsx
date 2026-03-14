"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/components/AuthProvider";

export default function Header() {
  const today = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const router = useRouter();
  const { user } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleSignOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <header className="flex items-center justify-between px-6 py-4 border-b border-white/5">
      <div className="flex items-center gap-3">
        <Image
          src="/north-star-logo.png"
          alt="North Star Solutions"
          width={36}
          height={36}
          style={{ height: 36, width: "auto" }}
          priority
        />
        <span className="font-montserrat font-bold text-brand-headline tracking-wider text-sm">
          NORTH STAR SOLUTIONS
        </span>
      </div>

      <div className="flex items-center gap-4">
        <span className="text-sm font-opensans text-brand-muted hidden sm:block">
          {today}
        </span>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-brand-accent/20 text-brand-accent text-xs font-montserrat font-bold cursor-pointer"
          >
            NS
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 bg-brand-card border border-[rgba(91,124,153,0.15)] rounded-[10px] shadow-lg z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/5">
                <p className="text-xs text-brand-muted truncate">
                  {user?.email ?? "—"}
                </p>
              </div>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-2 px-4 py-3 text-[13px] text-brand-muted hover:text-kpi-red hover:bg-white/[0.03] transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
