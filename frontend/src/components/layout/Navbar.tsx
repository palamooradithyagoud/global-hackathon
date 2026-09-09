"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Compass, Sparkles, User, LogOut, ArrowUpRight } from "lucide-react";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("skillcatalyst_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUserName(parsed.name || "Student");
      } catch {
        // ignore
      }
    }
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem("skillcatalyst_session");
    localStorage.removeItem("skillcatalyst_profile");
    setUserName(null);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#0C0C10]/85 backdrop-blur-md border-b border-[#20202C]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand with 3D gradient dot */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 via-pink-500 to-amber-400 p-[1px] shadow-sm">
            <div className="w-full h-full rounded-full bg-[#0C0C10] flex items-center justify-center">
              <Compass className="w-4 h-4 text-violet-400 group-hover:rotate-45 transition-transform duration-300" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-base tracking-tight text-white">
              SkillCatalyst
            </span>
            <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300">
              Phase 1.1
            </span>
          </div>
        </Link>

        {/* Center Pill Navigation */}
        <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-[#161620] border border-[#262634]">
          <Link
            href="/scholarships"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname.startsWith("/scholarships")
                ? "bg-white text-black font-semibold shadow-xs"
                : "text-[#8E8E9C] hover:text-white"
            }`}
          >
            Scholarships
          </Link>
          <Link
            href="/onboarding"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname.startsWith("/onboarding")
                ? "bg-white text-black font-semibold shadow-xs"
                : "text-[#8E8E9C] hover:text-white"
            }`}
          >
            Build Profile
          </Link>
          <Link
            href="/dashboard"
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all ${
              pathname.startsWith("/dashboard")
                ? "bg-white text-black font-semibold shadow-xs"
                : "text-[#8E8E9C] hover:text-white"
            }`}
          >
            Dashboard
          </Link>
        </nav>

        {/* Right User Action */}
        <div className="flex items-center gap-3">
          {userName ? (
            <div className="flex items-center gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#181824] border border-[#282838] text-xs text-white">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 flex items-center justify-center text-black font-bold text-[11px]">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium">{userName}</span>
              </div>
              <button
                onClick={handleLogout}
                title="Log out"
                className="p-1.5 text-[#8E8E9C] hover:text-white hover:bg-[#1A1A26] rounded-full transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="px-3.5 py-1.5 text-xs font-medium text-[#8E8E9C] hover:text-white transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="px-4 py-1.5 text-xs font-semibold bg-white text-black rounded-full hover:bg-neutral-200 transition-colors shadow-xs flex items-center gap-1"
              >
                <span>Demo Entry</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
