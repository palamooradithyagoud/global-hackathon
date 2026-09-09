"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { StudentProfile, PersonalizedScholarship } from "@/types";
import {
  ArrowLeft,
  Share2,
  Award,
  Calendar,
  Building,
  Sparkles,
  CheckCircle2,
  Filter,
  ArrowUpRight,
  Loader2,
  RefreshCw,
  AlertCircle
} from "lucide-react";

function ScholarshipsDetailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("student_id");

  const [studentId, setStudentId] = useState<string | null>(studentIdParam);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [opportunities, setOpportunities] = useState<PersonalizedScholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filterEligibleOnly, setFilterEligibleOnly] = useState(false);
  const [activeTag, setActiveTag] = useState<string>("All");

  useEffect(() => {
    if (!studentIdParam) {
      const saved = localStorage.getItem("skillcatalyst_session");
      if (saved) {
        try {
          const session = JSON.parse(saved);
          if (session.student_id) {
            setStudentId(session.student_id);
          }
        } catch {
          // ignore
        }
      }
    }
  }, [studentIdParam]);

  const loadData = async (id: string) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const [profileData, scholarshipData] = await Promise.all([
        api.profile.get(id),
        api.scholarships.getPersonalized(id),
      ]);
      setProfile(profileData);
      setOpportunities(scholarshipData);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load personalized opportunities.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadData(studentId);
    } else {
      api.auth.demoLogin("b_tech").then((sess) => {
        if (sess.student_id) {
          setStudentId(sess.student_id);
          loadData(sess.student_id);
        } else {
          setIsLoading(false);
          setErrorMessage("No student profile found. Please complete onboarding.");
        }
      });
    }
  }, [studentId]);

  const filteredOpportunities = opportunities.filter((item) => {
    if (filterEligibleOnly && !item.is_eligible) return false;
    if (activeTag === "Merit") return item.tags.some((t) => t.toLowerCase().includes("merit"));
    if (activeTag === "STEM") return item.tags.some((t) => t.toLowerCase().includes("stem") || t.toLowerCase().includes("tech"));
    return true;
  });

  const cardTintClasses = [
    "card-pastel-lavender",
    "card-pastel-amber",
    "card-pastel-mint",
    "card-pastel-rose",
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="max-w-xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 pb-24"
    >
      {/* 1. TOP BAR MATCHING REFERENCE (3rd Screen): Back circle button + Share circle button */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push(studentId ? `/dashboard?student_id=${studentId}` : "/dashboard")}
          className="w-11 h-11 rounded-full bg-[#181822] border border-[#262634] text-white flex items-center justify-center hover:bg-[#222230] transition-transform hover:scale-105 cursor-pointer shadow-md"
          title="Back to Overview"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-violet-300 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
          Personalized Opportunities
        </span>

        <button
          type="button"
          onClick={() => {
            if (studentId) loadData(studentId);
          }}
          className="w-11 h-11 rounded-full bg-[#181822] border border-[#262634] text-[#8E8E9C] hover:text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-md"
          title="Refresh Opportunities"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BIG HEADING MATCHING REFERENCE (3rd Screen): "Lesson schedule" -> "Personalized scholarships" */}
      <div className="pt-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.05]">
          Personalized <br />
          <span className="font-normal text-[#E2E2EC]">scholarships</span>
        </h1>
        <p className="text-xs text-[#8E8E9C] mt-2">
          Matched to your verified profile ({profile?.education_stage.toUpperCase()} · CGPA {profile?.academic_profile?.cgpa || "Verified"})
        </p>
      </div>

      {/* 3. CYCLE INDICATOR / FILTER BAR matching reference subheader */}
      <div className="flex items-center justify-between p-3.5 bg-[#14141C] border border-[#262634] rounded-2xl">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-bold text-white">Active Cycle 2025 – 2026</span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setFilterEligibleOnly(!filterEligibleOnly)}
            className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-colors cursor-pointer ${
              filterEligibleOnly
                ? "bg-white text-black"
                : "bg-[#1E1E2C] text-[#8E8E9C] hover:text-white"
            }`}
          >
            {filterEligibleOnly ? "Eligible Only" : "Show All"}
          </button>
        </div>
      </div>

      {/* Pill Tags */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {["All", "Merit", "STEM"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTag(t)}
            className={`pill-filter cursor-pointer text-xs ${
              activeTag === t ? "pill-filter-active" : "pill-filter-inactive"
            }`}
          >
            {t}
          </button>
        ))}
        <span className="text-xs text-[#8E8E9C] ml-auto font-mono">
          {filteredOpportunities.length} Available
        </span>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
          <p className="text-xs text-[#8E8E9C]">Evaluating match criteria...</p>
        </div>
      )}

      {/* Error state */}
      {!isLoading && errorMessage && (
        <div className="p-5 bg-red-950/30 border border-red-800/40 rounded-3xl text-center">
          <p className="text-xs text-red-300 mb-2">{errorMessage}</p>
          <button
            onClick={() => studentId && loadData(studentId)}
            className="px-4 py-1.5 bg-white text-black text-xs font-semibold rounded-full"
          >
            Retry
          </button>
        </div>
      )}

      {/* List of Scholarships with 3rd Screen Reference Card Style */}
      {!isLoading && !errorMessage && (
        <div className="space-y-4">
          {filteredOpportunities.map((item, index) => {
            const tintClass = cardTintClasses[index % cardTintClasses.length];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={`${tintClass} rounded-[26px] p-5 sm:p-6 transition-all shadow-xl relative overflow-hidden`}
              >
                {/* Header row with time/amount pill & top-right circular arrow button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                      {item.benefit_value}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono ${
                        item.is_eligible
                          ? "bg-emerald-500/25 text-emerald-200 border border-emerald-500/30"
                          : "bg-black/20 text-white/75"
                      }`}
                    >
                      {item.match_score}% Match · {item.is_eligible ? "Eligible" : "Needs Review"}
                    </span>
                  </div>

                  <div className="btn-arrow-circle shrink-0">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>

                {/* Provider & Title */}
                <span className="text-xs text-[#1E293B] font-medium flex items-center gap-1 mb-1">
                  <Building className="w-3.5 h-3.5" />
                  {item.provider}
                </span>

                <h3 className="text-lg font-extrabold text-[#0F172A] leading-snug mb-2">
                  {item.title}
                </h3>

                <p className="text-xs text-[#1E293B]/85 leading-relaxed mb-4">
                  {item.description}
                </p>

                {/* Criteria breakdown */}
                <div className="p-3 bg-black/10 backdrop-blur-xs rounded-2xl mb-3 space-y-1 text-xs">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0F172A]/70 block mb-1">
                    Verified Match Criteria:
                  </span>
                  {item.match_reasons.map((reason, rIdx) => (
                    <div key={rIdx} className="flex items-center gap-1.5 text-[#0F172A] text-[11px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-800 shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                  {item.action_item && (
                    <div className="text-amber-950 font-semibold text-[11px] pt-1">
                      Action requirement: {item.action_item}
                    </div>
                  )}
                </div>

                {/* Footer with deadline & Apply button */}
                <div className="pt-3 border-t border-black/10 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-medium text-[#0F172A]">
                    <Calendar className="w-3.5 h-3.5 text-[#1E293B]" />
                    <span>Deadline: {item.deadline}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      alert(`Application filing for ${item.title} opens in next phase release.`)
                    }
                    className="px-4 py-1.5 rounded-full bg-[#0F172A] text-white text-xs font-bold hover:bg-black transition-colors cursor-pointer shadow-sm"
                  >
                    Apply Now →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function ScholarshipsDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
          <p className="text-xs text-[#8E8E9C]">Opening Scholarships...</p>
        </div>
      }
    >
      <ScholarshipsDetailPageContent />
    </Suspense>
  );
}
