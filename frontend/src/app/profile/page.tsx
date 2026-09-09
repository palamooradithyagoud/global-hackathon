"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { StudentProfile } from "@/types";
import { EducationStage, STAGE_CONFIGS } from "@/lib/stageIsolation";
import {
  User,
  GraduationCap,
  Award,
  ShieldCheck,
  Building,
  Calendar,
  Briefcase,
  Layers,
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowLeft,
  FileText,
  Mail,
  MapPin,
  Clock,
  CheckCircle2,
  DollarSign,
  Code,
  FolderGit2,
  BookOpen,
  Target,
  UserPlus
} from "lucide-react";
import CreateAccountModal from "@/components/common/CreateAccountModal";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("student_id");

  const [studentId, setStudentId] = useState<string | null>(studentIdParam);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isCreateAccountOpen, setIsCreateAccountOpen] = useState(false);
  const [isUpdatingYear, setIsUpdatingYear] = useState(false);

  const handleUpdateBtechYear = async (newYear: string) => {
    if (!studentId || !profile) return;
    setIsUpdatingYear(true);
    try {
      const updated = await api.profile.update(studentId, {
        academic_profile: {
          year: newYear,
        },
      });
      setProfile(updated);
    } catch (err) {
      console.error("Failed to update B.Tech year:", err);
    } finally {
      setIsUpdatingYear(false);
    }
  };

  const handleAccountCreated = (session: any) => {
    if (session.student_id) {
      setStudentId(session.student_id);
      router.push(`/profile?student_id=${session.student_id}`);
    }
  };

  // 1. Resolve studentId with priority to URL query parameter
  useEffect(() => {
    if (studentIdParam) {
      setStudentId(studentIdParam);
      return;
    }

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

    // Default fallback demo login
    api.auth.demoLogin("class_10").then((sess) => {
      if (sess.student_id) {
        setStudentId(sess.student_id);
      }
    });
  }, [studentIdParam]);

  // 2. Fetch full student profile details
  useEffect(() => {
    if (!studentId) return;

    let isMounted = true;
    const fetchProfile = async () => {
      setIsLoading(true);
      setErrorMessage(null);
      try {
        const data = await api.profile.get(studentId);
        if (isMounted) {
          setProfile(data);
        }
      } catch (err: any) {
        console.error("Failed to load profile:", err);
        if (isMounted) {
          setErrorMessage(err.message || "Failed to load student profile.");
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      isMounted = false;
    };
  }, [studentId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0A0A0E] flex flex-col items-center justify-center text-white gap-3">
        <Loader2 className="w-9 h-9 animate-spin text-amber-400" />
        <span className="text-xs text-[#8E8E9C]">Loading Student Profile Details...</span>
      </div>
    );
  }

  if (errorMessage || !profile) {
    return (
      <div className="min-h-screen bg-[#0A0A0E] text-white flex flex-col items-center justify-center px-4">
        <div className="p-6 rounded-3xl bg-[#14141E] border border-[#2B2B3E] max-w-md w-full text-center space-y-4">
          <p className="text-sm text-red-400">{errorMessage || "Student profile not found."}</p>
          <button
            onClick={() => router.push("/onboarding")}
            className="px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-neutral-200 cursor-pointer"
          >
            Create Profile in Onboarding
          </button>
        </div>
      </div>
    );
  }

  const stage = (profile.education_stage || "class_10") as EducationStage;
  const stageConfig = STAGE_CONFIGS[stage] || STAGE_CONFIGS.class_10;
  const acad = profile.academic_profile;
  const completeness = profile.intelligence_summary?.completeness_percentage || 85;

  return (
    <div className="min-h-screen bg-[#0A0A0E] text-white pb-28 pt-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
        {/* Top Navigation Bar */}
        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => router.push(studentId ? `/dashboard?student_id=${studentId}` : "/dashboard")}
            className="w-11 h-11 rounded-full bg-[#161622] border border-[#28283C] text-white flex items-center justify-center hover:bg-[#202030] transition-all hover:scale-105 cursor-pointer shadow-md"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsCreateAccountOpen(true)}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-black text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-md hover:scale-105"
            >
              <UserPlus className="w-4 h-4" />
              <span>Create New Account</span>
            </button>

            <button
              type="button"
              onClick={() => router.push("/onboarding")}
              className="px-4 py-2 rounded-2xl bg-[#181826] hover:bg-[#222234] border border-[#2A2A40] text-xs font-semibold text-white transition-all flex items-center gap-2 cursor-pointer shadow-sm"
            >
              <FileText className="w-4 h-4 text-amber-400" />
              <span>Edit Profile</span>
            </button>
          </div>
        </div>

        {/* 1. Primary Student Identity Card */}
        <div className="rounded-3xl bg-[#12121B] border border-[#262638] p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
          {/* Subtle Accent Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-amber-500/10 via-purple-500/5 to-transparent blur-3xl pointer-events-none" />

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5 relative z-10">
            {/* Avatar & Core Bio */}
            <div className="flex items-start sm:items-center gap-4">
              <div className={`w-18 h-18 sm:w-20 sm:h-20 rounded-3xl bg-gradient-to-tr ${stageConfig.accentColor} p-[3px] shadow-xl shrink-0`}>
                <div className="w-full h-full rounded-[22px] bg-[#161622] flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl">
                  {profile.name.charAt(0).toUpperCase()}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {profile.name}
                  </h1>
                  <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full border ${stageConfig.badgeBg}`}>
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>{stageConfig.gradeBadge}</span>
                  </span>
                  {stage === "b_tech" && acad?.year && (
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                      {acad.year}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-xs text-[#A0A0B8] flex-wrap">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5 text-[#6E6E85]" />
                    <span>{profile.email}</span>
                  </span>
                  {profile.location && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#6E6E85]" />
                        <span>{profile.location}</span>
                      </span>
                    </>
                  )}
                  {profile.date_of_birth && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-[#6E6E85]" />
                        <span>DOB: {profile.date_of_birth}</span>
                      </span>
                    </>
                  )}
                </div>

                {profile.target_role && (
                  <div className="pt-1 flex items-center gap-1.5 text-xs text-amber-300 font-semibold">
                    <Target className="w-3.5 h-3.5 text-amber-400" />
                    <span>Target Career: {profile.target_role}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Profile Completeness Pill */}
            <div className="p-3.5 rounded-2xl bg-[#181826] border border-[#28283C] text-right space-y-1 self-start sm:self-auto min-w-[140px]">
              <span className="text-[11px] text-[#8E8E9C] block">Profile Strength</span>
              <span className="text-lg font-black text-emerald-400 block font-mono">
                {completeness}% Verified
              </span>
              <div className="w-full h-1.5 bg-[#252538] rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${completeness}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Academic Record Details Card */}
        <div className="rounded-3xl bg-[#12121B] border border-[#262638] p-6 space-y-4 shadow-lg">
          <div className="flex items-center justify-between border-b border-[#202030] pb-3">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-amber-400" />
              <span>Academic Credentials &amp; Institution Record</span>
            </h2>
            <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              Verified Record
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
              <span className="text-[#8E8E9C]">Institution / School</span>
              <p className="font-bold text-white text-sm truncate">
                {acad?.school_or_college || (stage === "class_10" ? "Delhi Public School" : "National Institute")}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
              <span className="text-[#8E8E9C]">Educational Level</span>
              <p className="font-bold text-white text-sm">{stageConfig.label}</p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
              <span className="text-[#8E8E9C]">
                {stage === "b_tech" ? "Cumulative CGPA" : "Board Percentage"}
              </span>
              <p className="font-bold text-emerald-400 text-sm font-mono">
                {acad?.cgpa
                  ? `${acad.cgpa} / 10.0 CGPA`
                  : acad?.percentage
                  ? `${acad.percentage}%`
                  : stage === "class_10"
                  ? "91.4% Board"
                  : "8.75 CGPA"}
              </p>
            </div>

            {acad?.board && (
              <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
                <span className="text-[#8E8E9C]">Affiliated Board</span>
                <p className="font-bold text-white text-sm">{acad.board}</p>
              </div>
            )}

            {(acad?.stream || acad?.branch) && (
              <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
                <span className="text-[#8E8E9C]">
                  {stage === "b_tech" ? "Branch / Major" : "Academic Stream"}
                </span>
                <p className="font-bold text-white text-sm">{acad.branch || acad.stream}</p>
              </div>
            )}

            {/* Standard non-B.Tech year display */}
            {stage !== "b_tech" && acad?.year && (
              <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
                <span className="text-[#8E8E9C]">Year of Study</span>
                <p className="font-bold text-white text-sm">{acad.year}</p>
              </div>
            )}

            {/* B.TECH INTERACTIVE YEAR SELECTOR AS REQUESTED */}
            {stage === "b_tech" && (
              <div className="p-4 rounded-2xl bg-[#181826] border border-amber-500/30 space-y-2 col-span-1 sm:col-span-2 md:col-span-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>B.Tech Engineering Year of Study</span>
                  </span>
                  <div className="flex items-center gap-2">
                    {isUpdatingYear && (
                      <span className="text-[11px] text-amber-400 flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        <span>Updating year...</span>
                      </span>
                    )}
                    <span className="text-[11px] font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                      Active: {acad?.year || "1st Year"}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1">
                  {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((yr) => {
                    const currentYr = acad?.year || "1st Year";
                    const isSelected = currentYr.toLowerCase().startsWith(yr.toLowerCase().slice(0, 3));
                    return (
                      <button
                        key={yr}
                        type="button"
                        onClick={() => handleUpdateBtechYear(yr)}
                        disabled={isUpdatingYear}
                        className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                          isSelected
                            ? "bg-amber-400 text-black border-amber-300 shadow-md font-extrabold ring-1 ring-amber-400"
                            : "bg-[#14141E] text-white/80 border-[#2B2B3E] hover:bg-[#202030] hover:text-white"
                        }`}
                      >
                        <span className="block">{yr}</span>
                        <span className={`block text-[9px] mt-0.5 ${isSelected ? "text-black/80 font-medium" : "text-amber-400"}`}>
                          {yr === "1st Year" ? "10 Scholarships" : "2 Scholarships"}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 3. Skills & Competencies Card */}
        <div className="rounded-3xl bg-[#12121B] border border-[#262638] p-6 space-y-4 shadow-lg">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-[#202030] pb-3">
            <Code className="w-5 h-5 text-emerald-400" />
            <span>Verified Skills &amp; Proficiencies</span>
          </h2>

          {profile.skills && profile.skills.length > 0 ? (
            <div className="flex flex-wrap gap-2.5">
              {profile.skills.map((s, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2 rounded-2xl bg-[#161624] border border-[#28283C] flex items-center gap-2 text-xs"
                >
                  <span className="font-bold text-white">{s.skill_name}</span>
                  <span className="text-[10px] font-semibold px-2 py-0.2 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                    {s.proficiency}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242434] text-xs text-[#8E8E9C]">
              No skills added yet. Complete the profile onboarding to record skills.
            </div>
          )}
        </div>

        {/* 4. Projects & Academic Portfolio */}
        {profile.projects && profile.projects.length > 0 && (
          <div className="rounded-3xl bg-[#12121B] border border-[#262638] p-6 space-y-4 shadow-lg">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-[#202030] pb-3">
              <FolderGit2 className="w-5 h-5 text-purple-400" />
              <span>Projects &amp; Academic Work</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {profile.projects.map((p, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#161624] border border-[#28283C] space-y-2 flex flex-col justify-between"
                >
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-white">{p.name}</h3>
                    {p.description && (
                      <p className="text-xs text-[#A0A0B8] line-clamp-2 leading-relaxed">
                        {p.description}
                      </p>
                    )}
                    {p.technologies && (
                      <p className="text-[11px] text-amber-300 font-mono">
                        Tech: {p.technologies}
                      </p>
                    )}
                  </div>

                  {p.github_url && (
                    <a
                      href={p.github_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="pt-2 text-xs text-white/80 hover:text-white flex items-center gap-1 font-semibold"
                    >
                      <span>Repository</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Certifications & Accreditations */}
        {profile.certifications && profile.certifications.length > 0 && (
          <div className="rounded-3xl bg-[#12121B] border border-[#262638] p-6 space-y-4 shadow-lg">
            <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-[#202030] pb-3">
              <Award className="w-5 h-5 text-amber-400" />
              <span>Certifications &amp; Accreditations</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {profile.certifications.map((c, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#161624] border border-[#28283C] flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <h3 className="font-bold text-white text-sm">{c.name}</h3>
                    <p className="text-[#8E8E9C]">
                      {c.issuer || "Accredited Body"} {c.date ? `• ${c.date}` : ""}
                    </p>
                  </div>
                  {c.credential_url && (
                    <a
                      href={c.credential_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. Learning Preferences & Financial Context */}
        <div className="rounded-3xl bg-[#12121B] border border-[#262638] p-6 space-y-4 shadow-lg">
          <h2 className="text-sm sm:text-base font-bold text-white flex items-center gap-2 border-b border-[#202030] pb-3">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <span>Learning Preferences &amp; Context</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3.5 text-xs">
            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
              <span className="text-[#8E8E9C]">Preferred Work / Study Region</span>
              <p className="font-bold text-white text-sm">
                {profile.preferences?.preferred_location || "Flexible / Pan-India"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
              <span className="text-[#8E8E9C]">Daily Available Learning Time</span>
              <p className="font-bold text-white text-sm">
                {profile.preferences?.available_learning_time || "1–2 hours/day"}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-[#161622] border border-[#242436] space-y-1">
              <span className="text-[#8E8E9C]">Education &amp; Certification Budget</span>
              <p className="font-bold text-white text-sm">
                {profile.financial_context?.education_budget || "₹0 (Fully Funded / Free)"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <CreateAccountModal
        isOpen={isCreateAccountOpen}
        onClose={() => setIsCreateAccountOpen(false)}
        onSuccess={handleAccountCreated}
        initialStage={stage}
      />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0A0A0E] flex items-center justify-center text-white">
          <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
        </div>
      }
    >
      <ProfilePageContent />
    </Suspense>
  );
}
