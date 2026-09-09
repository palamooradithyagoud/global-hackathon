"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { Scholarship } from "@/types";
import OverviewCards from "@/components/dashboard/OverviewCards";
import {
  Sparkles,
  HelpCircle,
  Building,
  Loader2,
  RefreshCw,
  Home,
  Share2,
  Briefcase,
  BookOpen,
  Compass,
  X,
  ArrowRight
} from "lucide-react";

export default function ScholarshipsPreviewPage() {
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>("Adam William");

  // Modal state for Job, Learning, Explore placeholders
  const [modalCategory, setModalCategory] = useState<string | null>(null);

  const [educationStage, setEducationStage] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<string | null>(null);
  const [studentYear, setStudentYear] = useState<string | null>(null);

  const fetchScholarships = async (stage?: string | null, year?: string | null) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.scholarships.getPreview(50, stage || undefined, year || undefined);
      setScholarships(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load scholarship previews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("skillcatalyst_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.name) setUserName(parsed.name);
        if (parsed.education_stage) setEducationStage(parsed.education_stage);
        
        const stage = parsed.education_stage || null;
        const initialYear = parsed.year || parsed.academic_profile?.year || null;
        if (initialYear) setStudentYear(initialYear);

        // Immediately fetch scholarships without waiting for profile.get
        fetchScholarships(stage, initialYear);

        if (parsed.student_id) {
          setStudentId(parsed.student_id);
          // Background sync to verify if year in profile is updated
          api.profile.get(parsed.student_id).then((p) => {
            if (p.academic_profile?.year && p.academic_profile.year !== initialYear) {
              setStudentYear(p.academic_profile.year);
              fetchScholarships(stage, p.academic_profile.year);
            }
          }).catch(() => {});
        }
        return;
      } catch {
        // ignore
      }
    }
    fetchScholarships(null);
  }, []);

  const handleSelectCard = (card: "scholarships" | "job" | "learning" | "explore") => {
    if (card === "scholarships") {
      router.push("/scholarships/details");
    } else if (card === "job") {
      router.push(`/jobs?stage=${educationStage || "class_10"}`);
    } else if (card === "learning") {
      setModalCategory("Skill & Learning Tracks");
    } else if (card === "explore") {
      setModalCategory("Future Educational Pathways");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 pb-28"
    >
      {/* 1. TOP BAR: Avatar + Welcome back */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 p-[2px] shadow-md">
            <div className="w-full h-full rounded-full bg-[#181824] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {userName.charAt(0).toUpperCase()}
            </div>
          </div>
          <div>
            <span className="text-xs text-[#8E8E9C] font-normal block leading-tight">
              Welcome back
            </span>
            <span className="font-bold text-base text-white block tracking-tight">
              {userName}
            </span>
          </div>
        </div>
      </div>

      {/* 2. BIG HEADING MATCHING REFERENCE: "Let's explore new fields" */}
      <div className="pt-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.05]">
          Let&apos;s explore <br />
          <span className="font-normal text-[#E2E2EC]">new fields</span>
        </h1>
      </div>

      {/* 3. THE 4 REFERENCE CARDS IN EXACT COLORS: Clicking Scholarships navigates to /scholarships/details! */}
      <OverviewCards
        scholarshipsCount={scholarships.length}
        onSelectCard={handleSelectCard}
      />

      {/* Helper text under cards */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#7E7E8E]">
          Tap <strong className="text-violet-300 font-semibold">Scholarships</strong> above to open the full opportunities page.
        </p>
      </div>

      {/* Bottom Motivation Banner: Check My Eligibility */}
      <div className="p-4 rounded-3xl bg-[#14141C] border border-[#2A2A3C] flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 uppercase tracking-wide">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Eligibility not checked yet</span>
          </span>
          <p className="text-xs text-[#8E8E9C] mt-0.5">
            Complete your profile to unlock personalized match scoring.
          </p>
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="px-5 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer shadow-sm"
        >
          <span>Check My Eligibility</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Modal / Placeholder Popup for other 3 cards as instructed */}
      <AnimatePresence>
        {modalCategory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              className="bg-[#14141C] border border-[#2B2B3C] rounded-3xl p-7 max-w-sm w-full text-center space-y-4 shadow-2xl relative"
            >
              <button
                onClick={() => setModalCategory(null)}
                className="absolute top-4 right-4 p-1.5 text-[#8E8E9C] hover:text-white rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto text-white">
                {modalCategory.includes("Job") ? (
                  <Briefcase className="w-7 h-7 text-amber-400" />
                ) : modalCategory.includes("Skill") ? (
                  <BookOpen className="w-7 h-7 text-emerald-400" />
                ) : (
                  <Compass className="w-7 h-7 text-pink-400" />
                )}
              </div>

              <h3 className="font-bold text-lg text-white">
                {modalCategory}
              </h3>

              <p className="text-xs text-[#8E8E9C] leading-relaxed">
                This feature is scheduled for release in the upcoming phase. All verified scholarship matching is active right now in the <strong>Scholarships</strong> card!
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalCategory(null);
                    router.push("/scholarships/details");
                  }}
                  className="w-full py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-md flex items-center justify-center gap-1.5"
                >
                  <span>Open Scholarships</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setModalCategory(null)}
                  className="w-full py-2 rounded-full text-xs text-[#8E8E9C] hover:text-white"
                >
                  Close
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
