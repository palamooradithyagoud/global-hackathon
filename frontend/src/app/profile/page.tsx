"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { StudentProfile, Scholarship, PersonalizedScholarship } from "@/types";
import {
  EducationStage,
  STAGE_CONFIGS,
  filterByEducationStage,
  isOpportunityStrictlyEligible
} from "@/lib/stageIsolation";
import JobPathCards from "@/components/jobs/JobPathCards";
import { getJobsForStage } from "@/lib/jobData";
import {
  User,
  GraduationCap,
  Award,
  ShieldCheck,
  Building,
  Calendar,
  Briefcase,
  Layers,
  ChevronRight,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  Filter,
  Info,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock
} from "lucide-react";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("student_id");

  const [studentId, setStudentId] = useState<string | null>(studentIdParam);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [scholarships, setScholarships] = useState<Scholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdatingStage, setIsUpdatingStage] = useState(false);
  const [activeStage, setActiveStage] = useState<EducationStage>("b_tech");
  const [activeTab, setActiveTab] = useState<"scholarships" | "jobs" | "academics">("scholarships");

  // Load session or student ID from storage or param
  useEffect(() => {
    const saved = localStorage.getItem("skillcatalyst_session");
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session?.student_id) {
          setStudentId(session.student_id);
          return;
        }
      } catch {
        // ignore
      }
    }
    // Fallback to demo login if none present
    api.auth.demoLogin("b_tech").then((sess) => {
      if (sess.student_id) {
        setStudentId(sess.student_id);
      }
    });
  }, []);

  // Fetch student profile and stage-isolated scholarships
  const loadProfileAndScholarships = async (id: string, targetStage?: EducationStage) => {
    setIsLoading(true);
    try {
      const profileData = await api.profile.get(id);
      setProfile(profileData);
      const stage = (targetStage || profileData.education_stage || "b_tech") as EducationStage;
      setActiveStage(stage);

      // Fetch scholarships strictly filtered for this education stage
      const previewList = await api.scholarships.getPreview(12, stage);
      const strictlyIsolated = filterByEducationStage(previewList, stage);
      setScholarships(strictlyIsolated);
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) {
      loadProfileAndScholarships(studentId);
    }
  }, [studentId]);

  // Handle stage switching in real-time
  const handleStageSwitch = async (newStage: EducationStage) => {
    if (newStage === activeStage && !isUpdatingStage) return;
    setIsUpdatingStage(true);

    try {
      // 1. Authenticate demo session for the selected stage
      const session = await api.auth.demoLogin(newStage);
      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));

      if (session.student_id) {
        setStudentId(session.student_id);
        await loadProfileAndScholarships(session.student_id, newStage);
      }
    } catch (err) {
      console.error("Error switching stage:", err);
    } finally {
      setIsUpdatingStage(false);
    }
  };

  const currentStageConfig = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS.b_tech;

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-white pb-28 pt-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Profile Section Header & Student Card */}
        <div className="relative rounded-3xl bg-[#12121A] border border-[#262638] p-6 sm:p-8 overflow-hidden shadow-2xl">
          {/* Ambient Background Gradient */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-violet-600/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            {/* Student Info */}
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr ${currentStageConfig.accentColor} p-[3px] shadow-xl shrink-0`}>
                <div className="w-full h-full rounded-[22px] bg-[#161622] flex items-center justify-center text-white font-bold text-2xl">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "S"}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                    {profile?.name || "Student Profile"}
                  </h1>
                  <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border ${currentStageConfig.badgeBg}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{currentStageConfig.gradeBadge}</span>
                  </span>
                </div>

                <p className="text-xs sm:text-sm text-[#8E8E9C]">
                  {profile?.email || "student@skillcatalyst.dev"} • {profile?.location || "India"}
                </p>

                <div className="flex items-center gap-3 text-xs text-[#A0A0B5] pt-0.5">
                  <span className="flex items-center gap-1">
                    <GraduationCap className="w-4 h-4 text-[#8E8E9C]" />
                    <span className="font-medium text-white">
                      {profile?.academic_profile?.school_or_college ||
                        (activeStage === "class_10"
                          ? "Delhi Public School"
                          : activeStage === "intermediate"
                          ? "Narayana Junior College"
                          : "National Institute of Technology")}
                    </span>
                  </span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">
                    {profile?.academic_profile?.cgpa
                      ? `CGPA ${profile.academic_profile.cgpa} / 10`
                      : profile?.academic_profile?.percentage
                      ? `${profile.academic_profile.percentage}% Score`
                      : activeStage === "class_10"
                      ? "91.4% Board"
                      : activeStage === "intermediate"
                      ? "89.2% Score"
                      : "8.75 CGPA"}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => router.push("/onboarding")}
                className="px-4 py-2.5 rounded-2xl bg-[#1C1C28] hover:bg-[#252538] border border-[#2B2B3E] text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-[#8E8E9C]" />
                <span>Edit Profile</span>
              </button>
              <button
                type="button"
                onClick={() => router.push(studentId ? `/dashboard?student_id=${studentId}` : "/dashboard")}
                className="px-5 py-2.5 rounded-2xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <span>Full Dashboard</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Education Stage Isolation Controller */}
        <div className="rounded-3xl bg-[#12121A] border border-[#262638] p-6 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
                <Filter className="w-4 h-4 text-violet-400" />
                <span>Select Educational Class to Isolate Opportunities</span>
              </h2>
              <p className="text-xs text-[#8E8E9C]">
                Switching your class strictly segregates opportunities. Showing only verified matches for that level.
              </p>
            </div>

            {isUpdatingStage && (
              <div className="flex items-center gap-1.5 text-xs text-violet-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Updating class isolation...</span>
              </div>
            )}
          </div>

          {/* 3 Interactive Class Selector Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
            {/* 1. Class 10th Card */}
            <button
              type="button"
              id="select-stage-class-10"
              onClick={() => handleStageSwitch("class_10")}
              disabled={isUpdatingStage}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                activeStage === "class_10"
                  ? "bg-emerald-500/10 border-emerald-500 text-white ring-1 ring-emerald-500/40 shadow-[0_0_25px_rgba(16,185,129,0.15)]"
                  : "bg-[#161622] border-[#252535] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                  Class 10th
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300">
                  5 Scholarships
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Secondary Foundation</h3>
              <p className="text-[11px] text-[#8E8E9C] mt-1 leading-relaxed">
                NTSE, CBSE Girl Child, Tata Building India & science talent awards.
              </p>
              {activeStage === "class_10" && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Profile Class</span>
                </div>
              )}
            </button>

            {/* 2. Intermediate Card */}
            <button
              type="button"
              id="select-stage-intermediate"
              onClick={() => handleStageSwitch("intermediate")}
              disabled={isUpdatingStage}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                activeStage === "intermediate"
                  ? "bg-purple-500/10 border-purple-500 text-white ring-1 ring-purple-500/40 shadow-[0_0_25px_rgba(168,85,247,0.15)]"
                  : "bg-[#161622] border-[#252535] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-400">
                  11th & 12th
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                  5 Scholarships
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Intermediate (+2)</h3>
              <p className="text-[11px] text-[#8E8E9C] mt-1 leading-relaxed">
                INSPIRE-SHE, Dr. Kalam STEM, HDFC Badhte Kadam & pre-university grants.
              </p>
              {activeStage === "intermediate" && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-purple-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Profile Class</span>
                </div>
              )}
            </button>

            {/* 3. B.Tech Card */}
            <button
              type="button"
              id="select-stage-btech"
              onClick={() => handleStageSwitch("b_tech")}
              disabled={isUpdatingStage}
              className={`p-4 rounded-2xl border text-left transition-all relative overflow-hidden cursor-pointer ${
                activeStage === "b_tech"
                  ? "bg-amber-500/10 border-amber-500 text-white ring-1 ring-amber-500/40 shadow-[0_0_25px_rgba(245,158,11,0.15)]"
                  : "bg-[#161622] border-[#252535] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                  B.Tech
                </span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
                  6 Scholarships
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Undergraduate Engineering</h3>
              <p className="text-[11px] text-[#8E8E9C] mt-1 leading-relaxed">
                Google APAC, Amazon Future Engineer, Reliance Foundation & AICTE.
              </p>
              {activeStage === "b_tech" && (
                <div className="mt-3 flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Active Profile Class</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Isolation Guarantee Banner */}
        <div className="p-4 rounded-2xl bg-[#151522] border border-[#2B2B3E] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${currentStageConfig.badgeBg}`}>
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-white">
                  Active Filter: {currentStageConfig.label}
                </h4>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  Strict Isolation Active
                </span>
              </div>
              <p className="text-xs text-[#8E8E9C] mt-0.5">
                Every scholarship displayed below has been verified to strictly accept <strong>{currentStageConfig.shortLabel}</strong> students.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <span className="text-xs font-mono font-bold text-white px-3 py-1.5 rounded-xl bg-[#1C1C28] border border-[#2D2D40]">
              {scholarships.length} Verified Grants
            </span>
          </div>
        </div>

        {/* Section Navigation Tabs */}
        <div className="flex items-center gap-3 border-b border-[#222232] pb-2">
          <button
            type="button"
            onClick={() => setActiveTab("scholarships")}
            className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "scholarships"
                ? "text-white border-white"
                : "text-[#8E8E9C] border-transparent hover:text-white"
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Eligible Scholarships ({scholarships.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("jobs")}
            className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "jobs"
                ? "text-white border-white"
                : "text-[#8E8E9C] border-transparent hover:text-white"
            }`}
          >
            <Briefcase className="w-4 h-4" />
            <span>Jobs & Internships (Extensible Scaffolding)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("academics")}
            className={`pb-2.5 text-xs sm:text-sm font-bold flex items-center gap-2 transition-all cursor-pointer border-b-2 ${
              activeTab === "academics"
                ? "text-white border-white"
                : "text-[#8E8E9C] border-transparent hover:text-white"
            }`}
          >
            <GraduationCap className="w-4 h-4" />
            <span>Academic Verification</span>
          </button>
        </div>

        {/* Tab 1: Live Strictly Isolated Scholarships Showcase */}
        {activeTab === "scholarships" && (
          <div className="space-y-4">
            {isLoading || isUpdatingStage ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-xs text-[#8E8E9C]">
                <Loader2 className="w-8 h-8 animate-spin text-white" />
                <span>Loading strictly isolated scholarships for {currentStageConfig.shortLabel}...</span>
              </div>
            ) : scholarships.length === 0 ? (
              <div className="py-16 text-center text-xs text-[#8E8E9C] bg-[#14141E] rounded-3xl border border-[#242434] p-6 space-y-2">
                <AlertCircle className="w-8 h-8 mx-auto text-amber-400" />
                <h4 className="text-sm font-bold text-white">No Matching Grants Found</h4>
                <p>No scholarships currently match the strict eligibility criteria for this stage.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {scholarships.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-3xl bg-[#14141E] hover:bg-[#181824] border border-[#242436] hover:border-[#3A3A52] p-5 transition-all duration-300 flex flex-col justify-between space-y-4 shadow-md group"
                  >
                    <div className="space-y-3">
                      {/* Badge & Stage Pill */}
                      <div className="flex items-center justify-between gap-2">
                        <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${currentStageConfig.badgeBg}`}>
                          {currentStageConfig.gradeBadge}
                        </span>
                        {item.deadline && (
                          <span className="flex items-center gap-1 text-[11px] text-[#8E8E9C]">
                            <Clock className="w-3 h-3 text-amber-400" />
                            <span>{item.deadline}</span>
                          </span>
                        )}
                      </div>

                      {/* Title & Provider */}
                      <div>
                        <h3 className="text-base font-bold text-white group-hover:text-white line-clamp-2 transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-xs text-[#8E8E9C] flex items-center gap-1 mt-1">
                          <Building className="w-3 h-3 text-[#6E6E80]" />
                          <span className="truncate">{item.provider}</span>
                        </p>
                      </div>

                      {/* Award Amount */}
                      <div className="p-3 rounded-2xl bg-[#181824] border border-[#262638] flex items-center justify-between">
                        <span className="text-xs text-[#8E8E9C]">Award Amount</span>
                        <span className="text-sm font-bold text-emerald-400 font-mono">
                          {item.benefit_value || item.award_amount || "Merit Grant"}
                        </span>
                      </div>

                      {/* Criteria Snippet */}
                      <p className="text-xs text-[#9E9EB2] line-clamp-2 leading-relaxed">
                        {item.description || item.criteria}
                      </p>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex items-center gap-2">
                      <a
                        href={`/scholarships/details?id=${item.id}`}
                        className="flex-1 py-2.5 px-3 rounded-2xl bg-white text-black hover:bg-neutral-200 text-xs font-bold transition-all text-center flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                      >
                        <span>Direct Apply</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => router.push(`/scholarships/details?id=${item.id}`)}
                        className="p-2.5 rounded-2xl bg-[#1E1E2C] hover:bg-[#28283C] text-xs font-semibold text-[#8E8E9C] hover:text-white transition-all cursor-pointer"
                        title="View Full Details"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Job Pathways Showcase */}
        {activeTab === "jobs" && (
          <div className="space-y-6">
            <div className="p-4 rounded-2xl bg-amber-950/20 border border-amber-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-white">
                    {activeStage === "class_10"
                      ? "Class 10th Government Job Pathways (8 Verified)"
                      : `${currentStageConfig.shortLabel} Career & Employment Tracks`}
                  </h4>
                  <p className="text-xs text-amber-200/80 leading-relaxed">
                    {activeStage === "class_10"
                      ? "Official public sector posts open for candidates with 10th Pass minimum qualification (SSC MTS, Havaldar, GDS, Railways, Police, etc.)."
                      : `Stage-isolated employment tracks and examinations customized for ${currentStageConfig.label}.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => router.push(`/jobs?stage=${activeStage}`)}
                className="px-4 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-all flex items-center justify-center gap-1.5 shrink-0 shadow-md cursor-pointer"
              >
                <span>View Full Job Portal</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Render Job Cards */}
            <JobPathCards jobs={getJobsForStage(activeStage)} />
          </div>
        )}

        {/* Tab 3: Academic Credentials */}
        {activeTab === "academics" && (
          <div className="rounded-3xl bg-[#14141E] border border-[#262638] p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Academic Record Verification</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#181824] border border-[#242436] space-y-1">
                <span className="text-[#8E8E9C]">Educational Level</span>
                <p className="font-bold text-white text-sm">{currentStageConfig.label}</p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181824] border border-[#242436] space-y-1">
                <span className="text-[#8E8E9C]">Registered Institution</span>
                <p className="font-bold text-white text-sm truncate">
                  {profile?.academic_profile?.school_or_college || "Verified Institution"}
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#181824] border border-[#242436] space-y-1">
                <span className="text-[#8E8E9C]">Cumulative Evaluation</span>
                <p className="font-bold text-emerald-400 text-sm">
                  {profile?.academic_profile?.cgpa
                    ? `${profile.academic_profile.cgpa} CGPA`
                    : profile?.academic_profile?.percentage
                    ? `${profile.academic_profile.percentage}% Score`
                    : "Verified Pass"}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-white" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
