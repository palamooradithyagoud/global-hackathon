"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { StudentProfile, EducationStage, Scholarship, PersonalizedScholarship } from "@/types";
import { api } from "@/lib/api";
import { STAGE_CONFIGS, isOpportunityStrictlyEligible } from "@/lib/stageIsolation";
import { getJobsForStage } from "@/lib/jobData";
import {
  X,
  GraduationCap,
  Award,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Building,
  BookOpen,
  Info,
  Loader2,
  Briefcase,
  Layers,
  Calendar,
  ExternalLink,
  ChevronRight,
  Filter,
  UserPlus
} from "lucide-react";
import CreateAccountModal from "@/components/common/CreateAccountModal";

interface ProfileSectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: StudentProfile | null;
  onProfileUpdated?: (updatedProfile: StudentProfile) => void;
}

export default function ProfileSectionModal({
  isOpen,
  onClose,
  profile,
  onProfileUpdated,
}: ProfileSectionModalProps) {
  const router = useRouter();
  const [isSwitching, setIsSwitching] = useState(false);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [activeStage, setActiveStage] = useState<EducationStage>(
    profile?.education_stage || "b_tech"
  );
  const [btechYear, setBtechYear] = useState<string>(
    profile?.academic_profile?.year || "1st Year"
  );
  const [isUpdatingYear, setIsUpdatingYear] = useState(false);
  const [stageScholarships, setStageScholarships] = useState<Scholarship[]>([]);
  const [isLoadingScholarships, setIsLoadingScholarships] = useState(false);
  const [activeTab, setActiveTab] = useState<"scholarships" | "future_modules">("scholarships");

  // Keep activeStage & btechYear in sync when profile loads
  useEffect(() => {
    if (profile?.education_stage) {
      setActiveStage(profile.education_stage);
    }
    if (profile?.academic_profile?.year) {
      setBtechYear(profile.academic_profile.year);
    }
  }, [profile]);

  const handleUpdateYear = async (newYear: string) => {
    setBtechYear(newYear);
    if (!profile?.id) return;
    setIsUpdatingYear(true);
    try {
      const updated = await api.profile.update(profile.id, {
        academic_profile: {
          year: newYear,
        },
      });
      if (onProfileUpdated) {
        onProfileUpdated(updated);
      }
    } catch (err) {
      console.error("Failed to update B.Tech year:", err);
    } finally {
      setIsUpdatingYear(false);
    }
  };

  const handleAccountCreated = (session: any) => {
    if (session.student_id) {
      onClose();
      router.push(`/profile?student_id=${session.student_id}`);
    }
  };

  // Fetch strictly isolated scholarships whenever activeStage changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    const fetchStageScholarships = async () => {
      setIsLoadingScholarships(true);
      try {
        // Fetch preview filtered specifically by stage from backend
        const preview = await api.scholarships.getPreview(10, activeStage);
        if (isMounted) {
          // Double-enforce strict isolation client-side
          const strictlyIsolated = preview.filter((s) =>
            isOpportunityStrictlyEligible(s.eligible_stages, activeStage)
          );
          setStageScholarships(strictlyIsolated);
        }
      } catch (err) {
        console.error("Failed to load stage scholarships:", err);
      } finally {
        if (isMounted) {
          setIsLoadingScholarships(false);
        }
      }
    };

    fetchStageScholarships();
    return () => {
      isMounted = false;
    };
  }, [isOpen, activeStage]);

  if (!isOpen) return null;

  const currentConfig = STAGE_CONFIGS[activeStage] || STAGE_CONFIGS.b_tech;

  const handleSwitchStage = async (newStage: EducationStage) => {
    if (newStage === activeStage && isSwitching) return;
    setIsSwitching(true);
    setActiveStage(newStage);

    try {
      // 1. Authenticate demo student profile for target stage
      const session = await api.auth.demoLogin(newStage);
      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));

      if (session.student_id) {
        const fullProfile = await api.profile.get(session.student_id);
        if (onProfileUpdated) {
          onProfileUpdated(fullProfile);
        }
      }
    } catch (err) {
      console.error("Failed to switch stage:", err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        <div
          key="profile-section-modal-backdrop"
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto"
        >
          <motion.div
            key="profile-section-modal-card"
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-[#13131B] border border-[#28283C] rounded-3xl p-5 sm:p-7 max-w-2xl w-full text-left space-y-5 shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
          >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-violet-600/15 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${currentConfig.accentColor} p-[2px] shadow-lg`}>
                <div className="w-full h-full rounded-[14px] bg-[#181824] flex items-center justify-center text-white font-bold text-base">
                  {profile?.name ? profile.name.charAt(0).toUpperCase() : "S"}
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                    {profile?.name || "Student Profile"}
                  </h2>
                  <span className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${currentConfig.badgeBg}`}>
                    <ShieldCheck className="w-3 h-3" />
                    <span>{currentConfig.gradeBadge}</span>
                  </span>
                </div>
                <p className="text-xs text-[#8E8E9C]">
                  {profile?.email || "student@skillcatalyst.dev"} • Class Profile Section
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsCreateAccountOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-300 text-xs font-bold transition-all cursor-pointer shadow-sm"
                title="Create a new student account"
              >
                <UserPlus className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Create Account</span>
                <span className="sm:hidden">+ Account</span>
              </button>

              <button
                onClick={onClose}
                className="p-2 text-[#8E8E9C] hover:text-white rounded-full bg-[#1C1C28] hover:bg-[#262638] transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="space-y-5 overflow-y-auto pr-1 flex-1 custom-scrollbar">
            {/* Interactive Class / Education Stage Switcher */}
            <div className="space-y-2.5 bg-[#171723] p-4 rounded-2xl border border-[#28283C]">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-semibold text-white block">
                    Educational Stage & Class Selection
                  </span>
                  <span className="text-[11px] text-[#8E8E9C]">
                    Select student class to isolate matching scholarships and opportunities
                  </span>
                </div>
                {isSwitching && (
                  <span className="text-[11px] text-violet-400 flex items-center gap-1">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 pt-1">
                {/* Class 10 Option */}
                <button
                  type="button"
                  id="profile-stage-class-10"
                  onClick={() => handleSwitchStage("class_10")}
                  disabled={isSwitching}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    activeStage === "class_10"
                      ? "bg-emerald-500/15 border-emerald-500/70 text-white shadow-[0_0_20px_rgba(16,185,129,0.15)] ring-1 ring-emerald-500/50"
                      : "bg-[#14141E] border-[#252535] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
                  }`}
                >
                  <span className="block text-xs sm:text-sm font-bold">Class 10th</span>
                  <span className="block text-[10px] mt-0.5 text-emerald-400 font-medium">
                    5 Scholarships
                  </span>
                </button>

                {/* Intermediate Option */}
                <button
                  type="button"
                  id="profile-stage-intermediate"
                  onClick={() => handleSwitchStage("intermediate")}
                  disabled={isSwitching}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    activeStage === "intermediate"
                      ? "bg-purple-500/15 border-purple-500/70 text-white shadow-[0_0_20px_rgba(168,85,247,0.15)] ring-1 ring-purple-500/50"
                      : "bg-[#14141E] border-[#252535] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
                  }`}
                >
                  <span className="block text-xs sm:text-sm font-bold">11th & 12th</span>
                  <span className="block text-[10px] mt-0.5 text-purple-400 font-medium">
                    5 Scholarships
                  </span>
                </button>

                {/* B.Tech Option */}
                <button
                  type="button"
                  id="profile-stage-btech"
                  onClick={() => handleSwitchStage("b_tech")}
                  disabled={isSwitching}
                  className={`p-3 rounded-2xl border text-center transition-all cursor-pointer ${
                    activeStage === "b_tech"
                      ? "bg-amber-500/15 border-amber-500/70 text-white shadow-[0_0_20px_rgba(245,158,11,0.15)] ring-1 ring-amber-500/50"
                      : "bg-[#14141E] border-[#252535] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
                  }`}
                >
                  <span className="block text-xs sm:text-sm font-bold">B.Tech</span>
                  <span className="block text-[10px] mt-0.5 text-amber-400 font-medium">
                    15 Scholarships
                  </span>
                </button>
              </div>

              {/* B.Tech Year of Study selector when B.Tech is active */}
              {activeStage === "b_tech" && (
                <div className="pt-3 border-t border-[#26263A] mt-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                      <GraduationCap className="w-4 h-4 text-amber-400" />
                      <span>B.Tech Year of Study:</span>
                    </span>
                    <div className="flex items-center gap-2">
                      {isUpdatingYear && (
                        <span className="text-[10px] text-amber-400 flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Saving...</span>
                        </span>
                      )}
                      <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        {btechYear}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((yr) => {
                      const isSelected = btechYear.toLowerCase().startsWith(yr.toLowerCase().slice(0, 3));
                      return (
                        <button
                          key={yr}
                          type="button"
                          onClick={() => handleUpdateYear(yr)}
                          disabled={isUpdatingYear}
                          className={`py-2 px-1 rounded-xl text-center font-bold transition-all cursor-pointer border ${
                            isSelected
                              ? "bg-amber-400 text-black border-amber-300 shadow-sm font-extrabold ring-1 ring-amber-400"
                              : "bg-[#12121B] text-white/80 border-[#2B2B3E] hover:bg-[#1D1D2C] hover:text-white"
                          }`}
                        >
                          <span className="block text-xs">{yr}</span>
                          <span className={`block text-[9px] mt-0.5 ${isSelected ? "text-black/80 font-medium" : "text-amber-400"}`}>
                            {yr === "1st Year" ? "10 Schol." : "2 Schol."}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Stage Isolation Status Banner */}
            <div className="p-3.5 rounded-2xl bg-[#181826] border border-[#2C2C40] flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className={`p-2 rounded-xl border ${currentConfig.badgeBg}`}>
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white">
                      Strict Stage Isolation: {currentConfig.label}
                    </span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                      Zero Leaks
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8E8E9C] mt-0.5">
                    Showing ONLY scholarships eligible for {currentConfig.shortLabel}. Cross-stage opportunities are suppressed.
                  </p>
                </div>
              </div>

              <span className="text-xs font-mono font-bold text-white px-2.5 py-1 rounded-lg bg-[#202030] border border-[#303045] whitespace-nowrap">
                {stageScholarships.length} Available
              </span>
            </div>

            {/* Navigation Tabs between Scholarships & Future Modules */}
            <div className="flex items-center gap-2 border-b border-[#252538] pb-1">
              <button
                type="button"
                onClick={() => setActiveTab("scholarships")}
                className={`pb-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === "scholarships"
                    ? "text-white border-white"
                    : "text-[#8E8E9C] border-transparent hover:text-white"
                }`}
              >
                <Award className="w-3.5 h-3.5" />
                <span>Class Scholarships ({stageScholarships.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("future_modules")}
                className={`pb-2 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border-b-2 ${
                  activeTab === "future_modules"
                    ? "text-white border-white"
                    : "text-[#8E8E9C] border-transparent hover:text-white"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>
                  {activeStage === "class_10" ? "Govt Jobs (8)" : `Jobs (${getJobsForStage(activeStage).length})`}
                </span>
              </button>
            </div>

            {/* Tab 1: Live Scholarships Feed for Selected Class */}
            {activeTab === "scholarships" && (
              <div className="space-y-2.5">
                {isLoadingScholarships ? (
                  <div className="py-12 flex flex-col items-center justify-center gap-2 text-xs text-[#8E8E9C]">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                    <span>Loading verified scholarships for {currentConfig.shortLabel}...</span>
                  </div>
                ) : stageScholarships.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#8E8E9C] bg-[#161622] rounded-2xl border border-[#242434] p-4">
                    No scholarships currently listed for this stage.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1 custom-scrollbar">
                    {stageScholarships.map((s, idx) => (
                      <div
                        key={s.id || s.title || `stage-scholarship-${idx}`}
                        className="p-3.5 rounded-2xl bg-[#181826] hover:bg-[#1E1E30] border border-[#28283C] hover:border-[#383852] transition-all flex items-center justify-between gap-3 group"
                      >
                        <div className="space-y-1 min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-semibold text-white truncate">
                              {s.title}
                            </h4>
                            <span className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${currentConfig.badgeBg}`}>
                              {currentConfig.gradeBadge}
                            </span>
                          </div>

                          <div className="flex items-center gap-3 text-[11px] text-[#8E8E9C]">
                            <span className="flex items-center gap-1">
                              <Building className="w-3 h-3" />
                              <span className="truncate max-w-[130px] sm:max-w-none">{s.provider}</span>
                            </span>
                            <span>•</span>
                            <span className="text-emerald-400 font-semibold">{s.benefit_value || s.award_amount || "Merit Grant"}</span>
                            {s.deadline && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 text-[#8E8E9C]">
                                  <Calendar className="w-3 h-3" />
                                  <span>{s.deadline}</span>
                                </span>
                              </>
                            )}
                          </div>
                        </div>

                        <a
                          href={s.application_link || s.application_url || "#"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white text-white hover:text-black text-xs font-semibold transition-all flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          <span>Apply</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Job Pathways Showcase */}
            {activeTab === "future_modules" && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-amber-400" />
                    <span>
                      {activeStage === "class_10"
                        ? "8 Verified Government Jobs for 10th Pass"
                        : `${currentConfig.shortLabel} Job Pathways`}
                    </span>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      router.push(`/jobs?stage=${activeStage}`);
                    }}
                    className="text-[11px] font-bold text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Full Job Portal</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {getJobsForStage(activeStage).map((job, idx) => (
                    <div
                      key={job.id || job.title || `stage-job-${idx}`}
                      className="p-3.5 rounded-2xl bg-[#181826] hover:bg-[#1E1E30] border border-[#28283C] hover:border-amber-500/40 transition-all space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold text-white">
                            {job.title}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                            {job.minEducation}
                          </span>
                        </div>
                        {job.payScale && (
                          <span className="text-[10px] font-mono text-white/80 bg-white/10 px-2 py-0.5 rounded-md">
                            {job.payScale}
                          </span>
                        )}
                      </div>

                      <p className="text-[11px] text-[#A0A0C0] line-clamp-2">
                        <strong>Requirements: </strong>{job.keyRequirements}
                      </p>

                      <div className="flex items-center justify-between pt-1 text-[10px] text-[#8E8E9C] border-t border-[#222234]">
                        <span>Age: {job.ageLimit}</span>
                        <a
                          href={job.officialPortal || "https://ssc.gov.in"}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-amber-300 hover:text-white font-semibold flex items-center gap-1"
                        >
                          <span>Portal</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-[#222232] flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                onClose();
                router.push(
                  profile?.id
                    ? `/dashboard/scholarships?student_id=${profile.id}`
                    : `/scholarships`
                );
              }}
              className="flex-1 py-3 px-4 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Explore All {currentConfig.shortLabel} Opportunities</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-full text-xs text-[#8E8E9C] hover:text-white hover:bg-[#1E1E2C] transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>

    <CreateAccountModal
      key="profile-section-create-account-modal"
      isOpen={isCreateAccountOpen}
      onClose={() => setIsCreateAccountOpen(false)}
      onSuccess={handleAccountCreated}
      initialStage={activeStage}
    />
  </>
);
}
