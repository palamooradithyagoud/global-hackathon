"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EducationStage, STAGE_CONFIGS } from "@/lib/stageIsolation";
import { JOB_PATHWAYS, getJobsForStage } from "@/lib/jobData";
import { api } from "@/lib/api";
import JobPathCards from "@/components/jobs/JobPathCards";
import {
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  Building,
  Sparkles,
  Search,
  CheckCircle2,
  Info,
  Loader2,
  Lock
} from "lucide-react";

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageParam = searchParams.get("stage") as EducationStage | null;

  const [activeStage, setActiveStage] = useState<EducationStage>(stageParam || "class_10");
  const [searchQuery, setSearchQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Authoritatively resolve the student's educational stage
  useEffect(() => {
    let isMounted = true;

    const resolveStage = async () => {
      setIsLoading(true);
      try {
        // 1. If explicit URL stage parameter is given, prioritize it
        if (stageParam) {
          if (isMounted) setActiveStage(stageParam);
          return;
        }

        // 2. Otherwise read the saved session and profile
        const saved = localStorage.getItem("skillcatalyst_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed?.student_id) {
            if (isMounted) setStudentId(parsed.student_id);

            // Fetch live student profile to get authoritative education_stage
            try {
              const fullProfile = await api.profile.get(parsed.student_id);
              if (fullProfile?.education_stage && isMounted) {
                setActiveStage(fullProfile.education_stage as EducationStage);
                return;
              }
            } catch {
              // fallback to session field
            }
          }

          if (parsed?.education_stage && isMounted) {
            setActiveStage(parsed.education_stage as EducationStage);
            return;
          }
        }

        // 3. Fallback default
        if (isMounted) setActiveStage("class_10");
      } catch (err) {
        console.error("Error resolving education stage for jobs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    resolveStage();

    return () => {
      isMounted = false;
    };
  }, [stageParam]);

  const currentStageConfig = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS.class_10;
  const rawJobs = getJobsForStage(activeStage);

  const filteredJobs = rawJobs.filter((j) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      j.title.toLowerCase().includes(q) ||
      j.organization.toLowerCase().includes(q) ||
      j.keyRequirements.toLowerCase().includes(q) ||
      j.tags.some((t) => t.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-[#0C0C10] text-white pb-28 pt-6">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Bar: Back navigation & Class Isolation status badge */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(studentId ? `/dashboard?student_id=${studentId}` : "/dashboard")}
            className="w-11 h-11 rounded-full bg-[#181824] border border-[#282838] text-white flex items-center justify-center hover:bg-[#222232] transition-transform hover:scale-105 cursor-pointer shadow-md"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <span className={`text-xs font-bold px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 shadow-sm ${currentStageConfig.badgeBg}`}>
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>{currentStageConfig.gradeBadge} Only</span>
            </span>
          </div>
        </div>

        {/* Big Heading - Dynamically tailored to the active educational class */}
        <div className="space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Briefcase className="w-4 h-4" />
            <span>
              {activeStage === "class_10"
                ? "Class 10th Public Sector Pathways"
                : activeStage === "intermediate"
                ? "Higher Secondary (+2) Career Pathways"
                : "Undergraduate Engineering Pathways"}
            </span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            {activeStage === "class_10" ? (
              <>
                Government Jobs for <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-400">
                  Class 10th Pass Candidates
                </span>
              </>
            ) : activeStage === "intermediate" ? (
              <>
                Career Pathways for <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-pink-300 to-indigo-400">
                  Class 11th &amp; 12th (Intermediate)
                </span>
              </>
            ) : (
              <>
                Technology &amp; PSU Careers for <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-cyan-300 to-indigo-400">
                  B.Tech Undergraduates
                </span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-[#A0A0B8] max-w-2xl leading-relaxed">
            {activeStage === "class_10"
              ? "Official Government of India, State Police, Railway, Postal and Forest recruitments strictly open for candidates with 10th Pass qualification."
              : activeStage === "intermediate"
              ? "Competitive national examinations & defence officer academy entries (SSC CHSL, NDA & Naval Academy) for 12th Pass students."
              : "Enterprise software development roles and Maharatna PSU executive trainee recruitments via GATE."}
          </p>
        </div>

        {/* Strict Class Isolation Banner */}
        <div className="p-4 rounded-2xl bg-[#14141E] border border-[#2B2B3E] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border ${currentStageConfig.badgeBg}`}>
              <Lock className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white">
                  Strict Class Isolation Active: {currentStageConfig.label}
                </span>
                <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                  Zero Leaks
                </span>
              </div>
              <p className="text-[11px] text-[#8E8E9C] mt-0.5">
                Displaying only opportunities eligible for {currentStageConfig.shortLabel}. Other educational classes are strictly isolated.
              </p>
            </div>
          </div>

          <span className="text-xs font-mono font-bold text-white px-3 py-1.5 rounded-xl bg-[#1A1A28] border border-[#2C2C40] self-start sm:self-auto whitespace-nowrap">
            {filteredJobs.length} Verified {activeStage === "class_10" ? "Government Jobs" : "Pathways"}
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E9C] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeStage === "class_10"
                ? "Search SSC MTS, Havaldar, GDS, Railways, Police..."
                : "Search job title, requirements, or sector..."
            }
            className="w-full bg-[#14141E] border border-[#252538] rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#6E6E85] focus:outline-none focus:border-amber-500/60 transition-colors shadow-inner"
          />
        </div>

        {/* Highlight Callout for Class 10th Government Jobs */}
        {activeStage === "class_10" && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/25 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <h4 className="font-bold text-white">
                Class 10th Pass Government Employment Guarantee
              </h4>
              <p className="text-amber-200/80 leading-relaxed">
                All 8 positions listed below (including <strong>SSC MTS, SSC Havaldar, India Post GDS, Railway Level-1, State Group-D, Police Constable, Home Guard, and Forest posts</strong>) legally require a minimum of 10th Pass.
              </p>
            </div>
          </div>
        )}

        {/* List of Job Path Cards */}
        <div className="pt-1">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-[#8E8E9C]">
              <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              <span>Verifying class isolation for jobs...</span>
            </div>
          ) : (
            <JobPathCards jobs={filteredJobs} />
          )}
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <JobsPageContent />
    </Suspense>
  );
}
