"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EducationStage, STAGE_CONFIGS } from "@/lib/stageIsolation";
import { JOB_PATHWAYS, getJobsForStage } from "@/lib/jobData";
import JobPathCards from "@/components/jobs/JobPathCards";
import {
  ArrowLeft,
  Briefcase,
  ShieldCheck,
  Building,
  Filter,
  Sparkles,
  Search,
  CheckCircle2,
  Info,
  Loader2
} from "lucide-react";

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialStage = (searchParams.get("stage") as EducationStage) || "class_10";

  const [activeStage, setActiveStage] = useState<EducationStage>(initialStage);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("skillcatalyst_session");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.student_id) setStudentId(parsed.student_id);
        if (parsed.education_stage && !searchParams.get("stage")) {
          setActiveStage(parsed.education_stage as EducationStage);
        }
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

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
        {/* Top bar with back button & stage badge */}
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
            <span className="text-xs font-bold text-amber-300 px-3.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center gap-1.5 shadow-sm">
              <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
              <span>{currentStageConfig.gradeBadge} Job Pathways</span>
            </span>
          </div>
        </div>

        {/* Big Heading */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-400">
            <Briefcase className="w-4 h-4" />
            <span>Public Sector & Career Opportunities</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight">
            Job Pathways &amp; <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-yellow-400">
              {activeStage === "class_10" ? "Government Jobs for 10th Pass" : "Verified Career Tracks"}
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-[#A0A0B8] max-w-2xl leading-relaxed">
            {activeStage === "class_10"
              ? "Official Government of India, State Police, Railway & Postal recruitments strictly open for candidates with 10th Pass minimum qualification."
              : `Stage-isolated employment tracks and examinations customized for ${currentStageConfig.label}.`}
          </p>
        </div>

        {/* Education Stage Selector */}
        <div className="p-4 rounded-3xl bg-[#14141E] border border-[#252538] space-y-3 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-amber-400" />
              <span>Filter Job Paths by Educational Level</span>
            </span>
            <span className="text-[11px] text-[#8E8E9C]">
              Showing {filteredJobs.length} Verified Posts
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            {/* Class 10th */}
            <button
              type="button"
              id="job-stage-class-10"
              onClick={() => setActiveStage("class_10")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                activeStage === "class_10"
                  ? "bg-amber-500/15 border-amber-500 text-white shadow-[0_0_20px_rgba(245,158,11,0.2)] ring-1 ring-amber-500/50"
                  : "bg-[#181824] border-[#262638] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
              }`}
            >
              <span className="block text-xs sm:text-sm font-bold">Class 10th</span>
              <span className="block text-[10px] mt-0.5 text-amber-400 font-semibold">
                8 Government Jobs
              </span>
            </button>

            {/* Intermediate */}
            <button
              type="button"
              id="job-stage-intermediate"
              onClick={() => setActiveStage("intermediate")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                activeStage === "intermediate"
                  ? "bg-purple-500/15 border-purple-500 text-white shadow-[0_0_20px_rgba(168,85,247,0.2)] ring-1 ring-purple-500/50"
                  : "bg-[#181824] border-[#262638] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
              }`}
            >
              <span className="block text-xs sm:text-sm font-bold">11th &amp; 12th</span>
              <span className="block text-[10px] mt-0.5 text-purple-400 font-semibold">
                CHSL / NDA
              </span>
            </button>

            {/* B.Tech */}
            <button
              type="button"
              id="job-stage-btech"
              onClick={() => setActiveStage("b_tech")}
              className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                activeStage === "b_tech"
                  ? "bg-blue-500/15 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)] ring-1 ring-blue-500/50"
                  : "bg-[#181824] border-[#262638] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
              }`}
            >
              <span className="block text-xs sm:text-sm font-bold">B.Tech</span>
              <span className="block text-[10px] mt-0.5 text-blue-400 font-semibold">
                SDE &amp; PSUs
              </span>
            </button>
          </div>
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

        {/* Stage Notification Callout for Class 10th */}
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
        <div className="pt-2">
          <JobPathCards jobs={filteredJobs} />
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
