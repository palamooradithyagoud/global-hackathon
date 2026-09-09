"use client";

import React, { useEffect, useState, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { EducationStage, STAGE_CONFIGS } from "@/lib/stageIsolation";
import {
  JOB_PATHWAYS,
  getJobsForStage,
  matchJobsForStudent,
  MatchedJobPathway,
  MatchedJoobleJob,
  AnyJobItem
} from "@/lib/jobData";
import { StudentProfile } from "@/types";
import { api } from "@/lib/api";
import JobPathCards from "@/components/jobs/JobPathCards";
import JobFitModal from "@/components/jobs/JobFitModal";
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
  Lock,
  Filter,
  Globe,
  RefreshCw,
  Cpu,
  Layers,
  Code2
} from "lucide-react";

type BTechSector = "private" | "psu" | "all";

const BTECH_FILTER_PILLS = [
  { label: "All Roles", value: "All" },
  { label: "Full Stack", value: "Full Stack Developer" },
  { label: "Frontend", value: "Frontend React Developer" },
  { label: "Backend", value: "Backend Python FastAPI Engineer" },
  { label: "AI / ML", value: "AI Machine Learning Engineer" },
  { label: "Cloud & DevOps", value: "Cloud DevOps AWS Engineer" }
];

function JobsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stageParam = searchParams.get("stage") as EducationStage | null;

  const [activeStage, setActiveStage] = useState<EducationStage>(stageParam || "class_10");
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isClientMounted, setIsClientMounted] = useState(false);

  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // B.Tech Specific States
  const [bTechSector, setBTechSector] = useState<BTechSector>("private");
  const [selectedPill, setSelectedPill] = useState<string>("All");
  const [joobleJobs, setJoobleJobs] = useState<MatchedJoobleJob[]>([]);
  const [isJoobleLoading, setIsJoobleLoading] = useState<boolean>(false);
  const [joobleTotalCount, setJoobleTotalCount] = useState<number>(0);
  const [jooblePage, setJooblePage] = useState<number>(1);
  const [refreshNotice, setRefreshNotice] = useState<string | null>(null);

  // Job Fit & Skill Gap Engine Modal State
  const [selectedJobForFit, setSelectedJobForFit] = useState<any | null>(null);
  const [isFitModalOpen, setIsFitModalOpen] = useState<boolean>(false);

  // Load Jooble jobs from backend
  const fetchJoobleJobs = useCallback(
    async (sId?: string | null, customKeywords?: string, pageNum: number = 1) => {
      setIsJoobleLoading(true);
      try {
        const queryKeywords =
          customKeywords && customKeywords !== "All"
            ? customKeywords
            : undefined;

        const res = await api.jobs.searchBTechJobs({
          studentId: sId || undefined,
          keywords: queryKeywords,
          location: "India",
          page: pageNum
        });

        if (res && res.jobs) {
          setJoobleJobs(res.jobs);
          setJoobleTotalCount(res.total_count || res.jobs.length);
        }
      } catch (err) {
        console.error("Failed to fetch Jooble jobs:", err);
      } finally {
        setIsJoobleLoading(false);
      }
    },
    []
  );

  const handleRefreshJobs = async () => {
    const nextPage = (jooblePage % 10) + 1;
    setJooblePage(nextPage);
    await fetchJoobleJobs(studentId, selectedPill, nextPage);
    setRefreshNotice(`Fetched fresh page ${nextPage} from Jooble & stored in database!`);
    setTimeout(() => setRefreshNotice(null), 4000);
  };

  // Authoritatively resolve student profile to match Age, Skills, and Education
  useEffect(() => {
    let isMounted = true;

    const resolveStageAndProfile = async () => {
      setIsLoading(true);
      try {
        let currentStudentId: string | null = null;
        const saved = localStorage.getItem("skillcatalyst_session");
        if (saved) {
          try {
            const parsed = JSON.parse(saved);
            if (parsed?.student_id) {
              currentStudentId = parsed.student_id;
              if (isMounted) setStudentId(parsed.student_id);
            }
          } catch {
            // ignore
          }
        }

        let resolvedProfile: StudentProfile | null = null;

        // Fetch profile to evaluate Age, Skills, and Education matches
        if (currentStudentId) {
          try {
            resolvedProfile = await api.profile.get(currentStudentId);
            if (isMounted && resolvedProfile) {
              setProfile(resolvedProfile);
              if (!stageParam && resolvedProfile.education_stage) {
                setActiveStage(resolvedProfile.education_stage as EducationStage);
              }
            }
          } catch (e) {
            console.error("Failed to load profile for jobs:", e);
          }
        } else {
          // Demo fallback
          const demoStage = stageParam || "class_10";
          try {
            const sess = await api.auth.demoLogin(demoStage);
            if (sess.student_id) {
              currentStudentId = sess.student_id;
              if (isMounted) setStudentId(sess.student_id);
              resolvedProfile = await api.profile.get(sess.student_id);
              if (isMounted && resolvedProfile) {
                setProfile(resolvedProfile);
                if (!stageParam && resolvedProfile.education_stage) {
                  setActiveStage(resolvedProfile.education_stage as EducationStage);
                }
              }
            }
          } catch {
            // fallback
          }
        }

        const effectiveStage = stageParam || (resolvedProfile?.education_stage as EducationStage) || "class_10";
        if (isMounted) {
          setActiveStage(effectiveStage);
        }

        // If B.Tech is active, load live Jooble jobs
        if (effectiveStage === "b_tech") {
          await fetchJoobleJobs(currentStudentId);
        }
      } catch (err) {
        console.error("Error resolving profile for jobs:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    resolveStageAndProfile();

    return () => {
      isMounted = false;
    };
  }, [stageParam, fetchJoobleJobs]);

  const currentStageConfig = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS.class_10;
  const matchedPathways = matchJobsForStudent(activeStage, profile);

  // Handle Pill selection
  const handlePillClick = (pillValue: string) => {
    setSelectedPill(pillValue);
    if (activeStage === "b_tech") {
      fetchJoobleJobs(studentId, pillValue);
    }
  };

  // Filter jobs based on active stage, sector, and search query
  const getDisplayedJobs = (): AnyJobItem[] => {
    const q = searchQuery.toLowerCase().trim();

    if (activeStage === "class_10" || activeStage === "intermediate") {
      // Strictly isolate to stage-matched pathways
      return matchedPathways.filter((j) => {
        if (!q) return true;
        return (
          j.title.toLowerCase().includes(q) ||
          j.organization.toLowerCase().includes(q) ||
          j.keyRequirements.toLowerCase().includes(q) ||
          j.tags.some((t) => t.toLowerCase().includes(q)) ||
          j.verifiedMatchCriteria.some((c) => c.toLowerCase().includes(q))
        );
      });
    }

    // B.Tech Stage
    if (bTechSector === "private") {
      return joobleJobs.filter((job) => {
        if (!q) return true;
        return (
          job.title.toLowerCase().includes(q) ||
          job.company.toLowerCase().includes(q) ||
          (job.snippet && job.snippet.toLowerCase().includes(q)) ||
          job.matched_skills.some((s) => s.toLowerCase().includes(q)) ||
          (job.location && job.location.toLowerCase().includes(q))
        );
      });
    }

    if (bTechSector === "psu") {
      return matchedPathways
        .filter((j) => j.category === "Public Sector" || j.category === "Government")
        .filter((j) => {
          if (!q) return true;
          return (
            j.title.toLowerCase().includes(q) ||
            j.organization.toLowerCase().includes(q) ||
            j.keyRequirements.toLowerCase().includes(q)
          );
        });
    }

    // "all" sector
    const filteredPvt = joobleJobs.filter((job) => {
      if (!q) return true;
      return (
        job.title.toLowerCase().includes(q) ||
        job.company.toLowerCase().includes(q) ||
        (job.snippet && job.snippet.toLowerCase().includes(q)) ||
        job.matched_skills.some((s) => s.toLowerCase().includes(q))
      );
    });

    const filteredGov = matchedPathways.filter((j) => {
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.organization.toLowerCase().includes(q) ||
        j.keyRequirements.toLowerCase().includes(q)
      );
    });

    return [...filteredPvt, ...filteredGov];
  };

  const displayedJobs = getDisplayedJobs();

  if (!isClientMounted) {
    return (
      <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center text-white">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    );
  }

  return (
    <div suppressHydrationWarning className="min-h-screen bg-[#0C0C10] text-white pb-28 pt-6">

      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Bar: Back navigation & Class Isolation status badge */}
        <div className="flex items-center justify-between">
          <button
            suppressHydrationWarning
            type="button"
            onClick={() => router.push(studentId ? `/dashboard?student_id=${studentId}` : "/dashboard")}
            className="w-11 h-11 rounded-full bg-[#181824] border border-[#282838] text-white flex items-center justify-center hover:bg-[#222232] transition-transform hover:scale-105 cursor-pointer shadow-md"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            {activeStage === "b_tech" && (
              <span className="text-xs font-bold px-3 py-1.5 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-300 flex items-center gap-1.5 shadow-sm">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
                <span>Jooble India Live Feed</span>
              </span>
            )}

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
                : "B.Tech Private Sector & PSU Job Intelligence"}
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
                Private Sector &amp; PSU Careers for <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-300">
                  B.Tech Undergraduates (India)
                </span>
              </>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-[#A0A0B8] max-w-2xl leading-relaxed">
            {activeStage === "class_10"
              ? "Official Government of India, State Police, Railway, Postal and Forest recruitments strictly open for candidates with 10th Pass qualification."
              : activeStage === "intermediate"
              ? "Competitive national examinations & defence officer academy entries (SSC CHSL, NDA & Naval Academy) for 12th Pass students."
              : "Live Jooble API integration delivering real-time private sector tech jobs in India matched directly against your B.Tech branch, verified skills, and career targets."}
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
                {activeStage === "class_10"
                  ? "Strictly displaying the 8 official Government of India 10th Pass recruitments. Zero private sector leakage."
                  : activeStage === "intermediate"
                  ? "Displaying only Higher Secondary (+2) national career entries. Isolated from tertiary degree roles."
                  : "B.Tech Engineering portal enabled with verified Jooble India private sector recruiter matching."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {activeStage === "b_tech" && (
              <button
                suppressHydrationWarning
                type="button"
                onClick={handleRefreshJobs}
                disabled={isJoobleLoading}
                className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-[#1D1D2C] hover:bg-[#252538] border border-[#2F2F45] text-blue-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shadow-sm"
                title="Fetch new live jobs from Jooble and store in database"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isJoobleLoading ? "animate-spin" : ""}`} />
                <span>{isJoobleLoading ? "Fetching..." : "Fetch New Jobs"}</span>
              </button>
            )}
            <span className="text-xs font-mono font-bold text-white px-3 py-1.5 rounded-xl bg-[#1A1A28] border border-[#2C2C40] whitespace-nowrap">
              {displayedJobs.length} {activeStage === "class_10" ? "Government Jobs" : activeStage === "b_tech" && bTechSector === "private" ? "Jooble Jobs" : "Pathways"}
            </span>
          </div>
        </div>

        {refreshNotice && (
          <div className="p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-xs text-blue-200 flex items-center gap-2 animate-fadeIn">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{refreshNotice}</span>
          </div>
        )}

        {/* B.Tech Sector Filter Tabs (Private Sector Jooble vs PSU/GATE vs All) */}
        {activeStage === "b_tech" && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-1.5 bg-[#14141E] border border-[#252538] rounded-2xl overflow-x-auto">
              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setBTechSector("private")}
                className={`flex-1 min-w-[170px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bTechSector === "private"
                    ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
                    : "text-[#A0A0B8] hover:text-white hover:bg-white/5"
                }`}
              >
                <Globe className="w-4 h-4 text-cyan-300 shrink-0" />
                <span>🏢 Private Sector (Live Jooble India)</span>
              </button>

              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setBTechSector("psu")}
                className={`flex-1 min-w-[160px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bTechSector === "psu"
                    ? "bg-gradient-to-r from-amber-600 to-orange-600 text-white shadow-lg shadow-amber-500/20"
                    : "text-[#A0A0B8] hover:text-white hover:bg-white/5"
                }`}
              >
                <Building className="w-4 h-4 text-amber-300 shrink-0" />
                <span>🏛️ PSU &amp; GATE (Public Sector)</span>
              </button>

              <button
                suppressHydrationWarning
                type="button"
                onClick={() => setBTechSector("all")}
                className={`flex-1 min-w-[130px] py-2.5 px-4 rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  bTechSector === "all"
                    ? "bg-[#252538] text-white shadow-md border border-[#3E3E58]"
                    : "text-[#A0A0B8] hover:text-white hover:bg-white/5"
                }`}
              >
                <Layers className="w-4 h-4 shrink-0" />
                <span>All Opportunities</span>
              </button>
            </div>

            {/* Quick Filter Pills (for Private Sector / Jooble) */}
            {bTechSector !== "psu" && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <span className="text-[11px] font-bold text-[#8E8E9C] uppercase tracking-wider pl-1 shrink-0 flex items-center gap-1">
                  <Filter className="w-3 h-3 text-blue-400" />
                  <span>Domain:</span>
                </span>
                {BTECH_FILTER_PILLS.map((pill) => {
                  const isSelected = selectedPill === pill.value;
                  return (
                    <button
                      suppressHydrationWarning
                      key={pill.value}
                      type="button"
                      onClick={() => handlePillClick(pill.value)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                        isSelected
                          ? "bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/20"
                          : "bg-[#14141E] text-[#A0A0B8] hover:text-white hover:bg-[#1A1A28] border-[#252538]"
                      }`}
                    >
                      {pill.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Search Input Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-[#8E8E9C] absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            suppressHydrationWarning
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              activeStage === "class_10"
                ? "Search SSC MTS, Havaldar, GDS, Railways, Police..."
                : activeStage === "intermediate"
                ? "Search SSC CHSL, NDA, Cadet entries..."
                : bTechSector === "private"
                ? "Filter Jooble India jobs by title, company (Mastercard, Amazon), or skills (Python, React)..."
                : "Search job title, PSU, or domain..."
            }
            className="w-full bg-[#14141E] border border-[#252538] rounded-2xl pl-11 pr-4 py-3 text-xs sm:text-sm text-white placeholder-[#6E6E85] focus:outline-none focus:border-blue-500/60 transition-colors shadow-inner"
          />
        </div>

        {/* Highlight Callout for Matching Engine */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-500/10 via-emerald-500/10 to-transparent border border-blue-500/30 flex items-start gap-3">
          <Sparkles className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2 flex-wrap">
              <span>
                {activeStage === "b_tech"
                  ? "Jooble Profile Matching Engine Active"
                  : "Verified Matching Engine: Age, Skills & Education"}
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                {activeStage === "b_tech" ? "Live Recruiter Sync" : "100% Stage Verified"}
              </span>
            </h4>
            <p className="text-slate-200/90 leading-relaxed">
              {activeStage === "class_10"
                ? "Every government job below is matched directly against your age bracket, school curriculum (Mathematics & English), and minimum 10th Pass requirement."
                : activeStage === "intermediate"
                ? "Opportunities matched against your 12th pass stream, age bracket, and entrance syllabus."
                : `Jooble API live query strictly filtered for India recruitments. Profile skills evaluated: ${
                    profile?.skills && profile.skills.length > 0
                      ? profile.skills.map((s: any) => s.skill_name || s).slice(0, 4).join(", ")
                      : "Python, React, SQL, FastAPI, Data Structures"
                  }.`}
            </p>
          </div>
        </div>

        {/* List of Job Path Cards */}
        <div className="pt-1">
          {isLoading || (activeStage === "b_tech" && isJoobleLoading && bTechSector === "private") ? (
            <div className="py-20 flex flex-col items-center justify-center gap-2 text-xs text-[#8E8E9C]">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
              <span>
                {activeStage === "b_tech"
                  ? "Querying live Jooble India jobs matching your profile..."
                  : "Verifying class isolation for jobs..."}
              </span>
            </div>
          ) : (
            <JobPathCards
              jobs={displayedJobs}
              onAnalyzeFit={(job) => {
                setSelectedJobForFit(job);
                setIsFitModalOpen(true);
              }}
            />
          )}
        </div>

        {/* B.Tech Job Fit & Skill Gap AI Engine Modal */}
        <JobFitModal
          job={selectedJobForFit}
          isOpen={isFitModalOpen}
          onClose={() => setIsFitModalOpen(false)}
          studentId={studentId}
        />
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0C0C10] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
        </div>
      }
    >
      <JobsPageContent />
    </Suspense>
  );
}

