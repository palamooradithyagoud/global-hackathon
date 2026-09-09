"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home } from "lucide-react";

export default function BottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const checkSession = () => {
      try {
        const saved = localStorage.getItem("skillcatalyst_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.student_id) {
            setStudentId(parsed.student_id);
            return;
          }
        }
      } catch {
        // ignore
      }
      setStudentId(null);
    };

    checkSession();
  }, [pathname]);

  // Hide on login screen if appropriate
  if (pathname === "/login") return null;

  const isOnboarding = pathname.startsWith("/onboarding");
  const isDashboardOverview = pathname === "/dashboard";
  const isScholarshipsOverview = pathname === "/scholarships";
  const isLanding = pathname === "/";

  // Home is active on all dashboard/scholarship/landing pages, Hub is active on onboarding
  const isHomeActive = !isOnboarding;
  const isHubActive = isOnboarding;

  const handleGoHome = () => {
    // If already on overview, smoothly scroll up
    if (isDashboardOverview || isScholarshipsOverview || isLanding) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    // If on subpage or onboarding, navigate back to overview / home page
    if (studentId) {
      router.push(`/dashboard?student_id=${studentId}`);
    } else {
      router.push("/scholarships");
    }
  };

  const handleGoHub = () => {
    if (isOnboarding) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    router.push("/onboarding");
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50 select-none">
      <div className="bg-[#12121A]/95 backdrop-blur-xl border border-[#2B2B3C] rounded-full p-1.5 shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex items-center gap-1.5">
        {/* Left Side: Home Button */}
        <button
          type="button"
          onClick={handleGoHome}
          className={`h-11 px-6 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
            isHomeActive
              ? "bg-white text-black shadow-lg scale-[1.02]"
              : "bg-transparent text-[#8E8E9C] hover:text-white hover:bg-white/10"
          }`}
          title="Go to Home"
          aria-label="Home"
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Right Side: Hub / Profile Button with reference 3-node connected network icon */}
        <button
          type="button"
          onClick={handleGoHub}
          className={`h-11 px-6 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
            isHubActive
              ? "bg-white text-black shadow-lg scale-[1.02]"
              : "bg-transparent text-[#8E8E9C] hover:text-white hover:bg-white/10"
          }`}
          title="Build / View Student Profile"
          aria-label="Profile Hub"
        >
          <svg
            viewBox="0 0 24 24"
            className="w-5 h-5 fill-none stroke-current stroke-[2.2]"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="6.5" r="2.5" />
            <circle cx="6.5" cy="17.5" r="2.5" />
            <circle cx="17.5" cy="17.5" r="2.5" />
            <line x1="10.2" y1="8.5" x2="7.8" y2="15.5" />
            <line x1="13.8" y1="8.5" x2="16.2" y2="15.5" />
            <line x1="9" y1="17.5" x2="15" y2="17.5" />
          </svg>
        </button>
      </div>
    </div>
  );
}
