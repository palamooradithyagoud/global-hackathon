"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { StudentProfile, PersonalizedScholarship } from "@/types";
import OverviewCards from "@/components/dashboard/OverviewCards";
import ProfileSectionModal from "@/components/profile/ProfileSectionModal";
import CareerPathwaysModal from "@/components/dashboard/CareerPathwaysModal";
import {
  Loader2,
  AlertCircle,
  Home,
  Share2,
  Briefcase,
  BookOpen,
  Compass,
  X,
  ArrowRight,
  ShieldCheck
} from "lucide-react";

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const studentIdParam = searchParams.get("student_id");

  const [studentId, setStudentId] = useState<string | null>(studentIdParam);
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [opportunities, setOpportunities] = useState<PersonalizedScholarship[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isCareerModalOpen, setIsCareerModalOpen] = useState(false);

  // Modal state for Job, Learning placeholders
  const [modalCategory, setModalCategory] = useState<string | null>(null);

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
          setErrorMessage("No student profile found. Please complete the onboarding flow first.");
        }
      });
    }
  }, [studentId]);

  // Handler for card selection:
  // Scholarships navigates to dedicated new page with animation!
  const handleSelectCard = (card: "scholarships" | "job" | "learning" | "explore" | "career") => {
    if (card === "scholarships") {
      router.push(studentId ? `/dashboard/scholarships?student_id=${studentId}` : "/dashboard/scholarships");
    } else if (card === "job") {
      setModalCategory("Job & Internship Pathways");
    } else if (card === "learning") {
      setModalCategory("Skill & Learning Tracks");
    } else if (card === "explore" || card === "career") {
      setIsCareerModalOpen(true);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-md mx-auto px-4 py-28 flex flex-col items-center justify-center text-center">
        <Loader2 className="w-9 h-9 animate-spin text-violet-400 mb-4" />
        <h2 className="text-base font-bold text-white">
          Personalizing Opportunities...
        </h2>
        <p className="text-xs text-[#8E8E9C] mt-1">
          Loading your verified student dashboard
        </p>
      </div>
    );
  }

  if (errorMessage && !profile) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center">
        <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800/40 flex items-center justify-center text-red-400 mx-auto mb-3">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-white">Profile Required</h2>
        <p className="text-xs text-[#8E8E9C] mt-1 mb-5">{errorMessage}</p>
        <button
          onClick={() => router.push("/onboarding")}
          className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 shadow-md"
        >
          Build Your Profile
        </button>
      </div>
    );
  }

  const studentName = profile?.name || "Adam William";

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-xl mx-auto px-4 sm:px-6 py-6 w-full space-y-6 pb-28"
    >
      {/* 1. TOP BAR MATCHING REFERENCE: Avatar + Welcome back + Active Stage Pill */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="flex items-center gap-3 text-left group cursor-pointer hover:opacity-90 transition-opacity"
          title="Open Profile Section"
        >
          {/* Avatar circle matching reference */}
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-pink-500 p-[2px] shadow-md group-hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-full bg-[#181824] flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {profile?.name ? (
                profile.name.charAt(0).toUpperCase()
              ) : (
                <span className="text-amber-300">AW</span>
              )}
            </div>
          </div>
          <div>
            <span className="text-xs text-[#8E8E9C] font-normal block leading-tight">
              Welcome back
            </span>
            <span className="font-bold text-base text-white block tracking-tight group-hover:text-amber-300 transition-colors">
              {studentName}
            </span>
          </div>
        </button>

        {/* Clickable Education Stage Pill */}
        <button
          type="button"
          onClick={() => setIsProfileModalOpen(true)}
          className="px-3.5 py-1.5 rounded-full bg-[#14141C] border border-[#2B2B3C] hover:border-amber-400/50 text-xs font-semibold text-white flex items-center gap-2 transition-all cursor-pointer shadow-sm group"
          title="Click to view/switch education stage"
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs">
            {profile?.education_stage === "class_10"
              ? "Class 10th"
              : profile?.education_stage === "intermediate"
              ? "Intermediate (+2)"
              : "B.Tech"}
          </span>
          <span className="text-[10px] text-violet-300 font-mono group-hover:underline">
            Profile ⚙
          </span>
        </button>
      </div>

      {/* 2. BIG HEADING MATCHING REFERENCE: "Let's explore new fields" */}
      <div className="pt-2">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-white leading-[1.05]">
          Let&apos;s explore <br />
          <span className="font-normal text-[#E2E2EC]">new fields</span>
        </h1>
      </div>

      {/* 3. THE 4 REFERENCE CARDS IN EXACT COLORS: Clicking Scholarships opens the dedicated new page! */}
      <OverviewCards
        scholarshipsCount={opportunities.length}
        onSelectCard={handleSelectCard}
      />

      {/* Helper text under cards */}
      <div className="text-center pt-2">
        <p className="text-xs text-[#7E7E8E]">
          Tap <strong className="text-violet-300 font-semibold">Scholarships</strong> above to open your personalized opportunities page.
        </p>
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
                This feature is scheduled for release in the next phase. All verified opportunities and scholarship matching are live right now in the <strong>Scholarships</strong> card!
              </p>

              <div className="pt-2 flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setModalCategory(null);
                    router.push(studentId ? `/dashboard/scholarships?student_id=${studentId}` : "/dashboard/scholarships");
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

      {/* Profile Section Modal with stage switcher */}
      <ProfileSectionModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        profile={profile}
        onProfileUpdated={(updated) => {
          setProfile(updated);
          setStudentId(updated.id);
          loadData(updated.id);
        }}
      />

      {/* Career Pathways Interactive Roadmap Modal */}
      <CareerPathwaysModal
        isOpen={isCareerModalOpen}
        onClose={() => setIsCareerModalOpen(false)}
        educationStage={profile?.education_stage}
      />
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-md mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
          <Loader2 className="w-8 h-8 animate-spin text-violet-400 mb-3" />
          <p className="text-xs text-[#8E8E9C]">Loading Dashboard...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
