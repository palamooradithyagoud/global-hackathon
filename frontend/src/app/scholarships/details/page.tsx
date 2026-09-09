"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { Scholarship } from "@/types";
import {
  ArrowLeft,
  Share2,
  Award,
  Calendar,
  Building,
  Sparkles,
  HelpCircle,
  ArrowUpRight,
  Loader2,
  ArrowRight
} from "lucide-react";

function ScholarshipsPreviewDetailPageContent() {
  const router = useRouter();
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [educationStage, setEducationStage] = useState<string | null>(null);

  const fetchScholarships = async (stage?: string | null) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const data = await api.scholarships.getPreview(10, stage || undefined);
      setScholarships(data);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to load scholarship previews.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("skillcatalyst_session");
    let activeStage: string | null = null;
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.education_stage) activeStage = parsed.education_stage;
      } catch {
        // ignore
      }
    }
    setEducationStage(activeStage);
    fetchScholarships(activeStage);
  }, []);

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
          onClick={() => router.push("/scholarships")}
          className="w-11 h-11 rounded-full bg-[#181822] border border-[#262634] text-white flex items-center justify-center hover:bg-[#222230] transition-transform hover:scale-105 cursor-pointer shadow-md"
          title="Back to Overview"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <span className="text-xs font-semibold text-violet-300 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">
          {educationStage === "class_10"
            ? "Class 10 Exclusive"
            : educationStage === "intermediate"
            ? "Intermediate (11th/12th) Exclusive"
            : educationStage === "b_tech"
            ? "B.Tech Undergrad Exclusive"
            : "Scholarship Opportunities"}
        </span>

        <button
          type="button"
          onClick={() => fetchScholarships(educationStage)}
          className="w-11 h-11 rounded-full bg-[#181822] border border-[#262634] text-[#8E8E9C] hover:text-white flex items-center justify-center transition-transform hover:scale-105 cursor-pointer shadow-md"
          title="Refresh"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {/* 2. BIG HEADING MATCHING REFERENCE (3rd Screen) */}
      <div className="pt-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.05]">
          Active <br />
          <span className="font-normal text-[#E2E2EC]">scholarships</span>
        </h1>
        <p className="text-xs text-[#8E8E9C] mt-2">
          {educationStage ? (
            <span>
              Showing verified opportunities strictly curated for{" "}
              <strong className="text-white">
                {educationStage === "class_10"
                  ? "Class 10 students"
                  : educationStage === "intermediate"
                  ? "Intermediate (11th & 12th) students"
                  : "B.Tech undergraduates"}
              </strong>
            </span>
          ) : (
            "Verified national and global opportunities currently open for application."
          )}
        </p>
      </div>

      {/* Call to Action Banner: Check My Eligibility */}
      <div className="p-4 rounded-3xl bg-[#14141C] border border-[#2A2A3C] flex items-center justify-between gap-3 shadow-lg">
        <div>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Eligibility not checked yet</span>
          </span>
          <p className="text-xs text-[#8E8E9C] mt-0.5">
            Build your profile to calculate your personalized match score.
          </p>
        </div>
        <button
          onClick={() => router.push("/onboarding")}
          className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors flex items-center gap-1 shrink-0 cursor-pointer shadow-sm"
        >
          <span>Check Now</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {isLoading && (
        <div className="py-20 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
          <p className="text-xs text-[#8E8E9C]">Loading opportunities...</p>
        </div>
      )}

      {!isLoading && errorMessage && (
        <div className="p-5 bg-red-950/30 border border-red-800/40 rounded-3xl text-center">
          <p className="text-xs text-red-300 mb-2">{errorMessage}</p>
          <button
            onClick={() => fetchScholarships(educationStage)}
            className="px-4 py-1.5 bg-white text-black text-xs font-semibold rounded-full"
          >
            Retry
          </button>
        </div>
      )}

      {/* List of Scholarships with 3rd Screen Reference Card Style */}
      {!isLoading && !errorMessage && (
        <div className="space-y-4">
          {scholarships.map((item, index) => {
            const tintClass = cardTintClasses[index % cardTintClasses.length];
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                onClick={() => router.push("/onboarding")}
                className={`${tintClass} rounded-[26px] p-5 sm:p-6 transition-all shadow-xl relative overflow-hidden cursor-pointer group`}
              >
                {/* Header row with amount pill & top-right circular arrow button */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white backdrop-blur-xs border border-white/20">
                      {item.benefit_value}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-black/15 text-black/80">
                      {item.tags[0] || "Scholarship"}
                    </span>
                  </div>

                  <div className="btn-arrow-circle shrink-0">
                    <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>

                <span className="text-xs text-white/80 font-semibold flex items-center gap-1.5 mb-1.5">
                  <Building className="w-3.5 h-3.5 text-violet-400" />
                  {item.provider}
                </span>

                <h3 className="text-lg sm:text-xl font-black text-white leading-snug mb-2 tracking-tight group-hover:text-violet-200 transition-colors">
                  {item.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-200/90 leading-relaxed mb-4">
                  {item.description}
                </p>

                <div className="pt-3.5 border-t border-white/15 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-white/90">
                    <Calendar className="w-3.5 h-3.5 text-amber-400" />
                    <span>Deadline: {item.deadline}</span>
                  </div>

                  <span className="font-extrabold text-white text-xs flex items-center gap-1 group-hover:text-emerald-400 transition-colors">
                    <span>Check with profile</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

export default function ScholarshipsPreviewDetailPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
          <p className="text-xs text-[#8E8E9C]">Opening Scholarships...</p>
        </div>
      }
    >
      <ScholarshipsPreviewDetailPageContent />
    </Suspense>
  );
}
