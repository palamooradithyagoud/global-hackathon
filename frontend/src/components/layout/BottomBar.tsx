"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Home } from "lucide-react";

export default function BottomBar() {
  const pathname = usePathname();
  const router = useRouter();
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
  const [hasActiveModal, setHasActiveModal] = useState<boolean>(false);

  // Check login state
  useEffect(() => {
    const checkSession = () => {
      try {
        const saved = localStorage.getItem("skillcatalyst_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.token || parsed?.student_id || parsed?.email) {
            setStudentId(parsed.student_id || null);
            setIsLoggedIn(true);
            return;
          }
        }
      } catch {
        // ignore
      }
      setStudentId(null);
      setIsLoggedIn(false);
    };

    checkSession();
    window.addEventListener("storage", checkSession);
    return () => window.removeEventListener("storage", checkSession);
  }, [pathname]);

  // Detect if any modal or full-screen dialog is currently open in the DOM
  useEffect(() => {
    const detectModal = () => {
      // Any fixed modal backdrop
      const modalElement = document.querySelector(".fixed.inset-0.z-50, [role='dialog']");
      setHasActiveModal(!!modalElement);
    };

    detectModal();

    const observer = new MutationObserver(() => {
      detectModal();
    });

    if (typeof document !== "undefined" && document.body) {
      observer.observe(document.body, { childList: true, subtree: true });
    }

    return () => observer.disconnect();
  }, [pathname]);

  // Only show the bottom navigation bar after the user has logged in
  if (!isLoggedIn) return null;

  if (!pathname) return null;

  // Never show bottom bar when any modal/overlay is open
  if (hasActiveModal) return null;

  const cleanPath = pathname.toLowerCase().replace(/\/+$/, "") || "/";

  // STRICT: Only show on the primary sections to allow switching between sections.
  // Explicitly excluded from /jobs, /scholarships/details, /onboarding, /login, /signup, etc.
  const isSectionOverview =
    cleanPath === "/dashboard" ||
    cleanPath === "/scholarships" ||
    cleanPath === "/profile";

  if (!isSectionOverview) return null;

  const isProfile = cleanPath.startsWith("/profile");
  const isDashboardOverview = cleanPath === "/dashboard";
  const isScholarshipsOverview = cleanPath === "/scholarships";

  // Home is active on dashboard/scholarship pages, Hub is active on profile
  const isHubActive = isProfile;
  const isHomeActive = !isHubActive;

  const handleGoHome = () => {
    // If already on overview, smoothly scroll up
    if (isDashboardOverview || isScholarshipsOverview) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    if (studentId) {
      router.push(`/dashboard?student_id=${studentId}`);
    } else {
      router.push("/dashboard");
    }
  };

  const handleGoHub = () => {
    if (isProfile) {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    if (studentId) {
      router.push(`/profile?student_id=${studentId}`);
    } else {
      router.push("/profile");
    }
  };

  return (
    <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-30 select-none">
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
          title="Go to Home / Dashboard"
          aria-label="Home"
        >
          <Home className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Right Side: Hub / Profile Button */}
        <button
          type="button"
          onClick={handleGoHub}
          className={`h-11 px-6 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer ${
            isHubActive
              ? "bg-white text-black shadow-lg scale-[1.02]"
              : "bg-transparent text-[#8E8E9C] hover:text-white hover:bg-white/10"
          }`}
          title="View Student Profile Section"
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
