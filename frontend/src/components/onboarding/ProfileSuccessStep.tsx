"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { StudentProfile } from "@/types";
import {
  Sparkles,
  Award,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  ShieldCheck
} from "lucide-react";

interface ProfileSuccessStepProps {
  profile: StudentProfile;
}

export default function ProfileSuccessStep({ profile }: ProfileSuccessStepProps) {
  const router = useRouter();
  const summary = profile.intelligence_summary;

  const eligibleCount = summary?.eligible_scholarships_count ?? 4;
  const oppCount = summary?.relevant_opportunities_count ?? 7;
  const priorities = summary?.priority_improvement_areas ?? [
    "Verify university transcripts for one-click scholarship filing",
    "Add certification credentials to boost merit evaluation tier",
    "Engage with regional hackathon tracks for industry grants"
  ];
  const completeness = summary?.completeness_percentage ?? 88;

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-[#14141C] border border-[#282838] rounded-3xl p-8 sm:p-10 shadow-2xl text-center relative overflow-hidden"
      >
        {/* Top ambient glow */}
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full bg-emerald-500/15 blur-3xl pointer-events-none" />

        {/* Success Icon */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 mx-auto mb-5 shadow-lg">
          <Sparkles className="w-8 h-8" />
        </div>

        {/* Title & Value Announcement */}
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
          Your profile is ready.
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E9C] mt-2 max-w-md mx-auto">
          We&apos;ve synthesized your academic metrics, skills, and stage into a structured intelligence record.
        </p>

        {/* Dynamic Metrics Unlocked in 3 Reference-style Glowing Cards */}
        <div className="grid grid-cols-3 gap-3.5 my-8 text-left">
          {/* Card 1: Lavender */}
          <div className="card-pastel-lavender rounded-2xl p-4">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono block">
              {eligibleCount}
            </span>
            <span className="text-xs font-bold text-violet-300 mt-1 block">
              Scholarships
            </span>
            <span className="text-[10px] text-[#9E9EAE]">Direct matches</span>
          </div>

          {/* Card 2: Amber */}
          <div className="card-pastel-amber rounded-2xl p-4">
            <span className="text-2xl sm:text-3xl font-bold text-white font-mono block">
              {oppCount}
            </span>
            <span className="text-xs font-bold text-amber-300 mt-1 block">
              Opportunities
            </span>
            <span className="text-[10px] text-[#9E9EAE]">Curated tracks</span>
          </div>

          {/* Card 3: Mint */}
          <div className="card-pastel-mint rounded-2xl p-4">
            <span className="text-2xl sm:text-3xl font-bold text-emerald-400 font-mono block">
              {completeness}%
            </span>
            <span className="text-xs font-bold text-emerald-300 mt-1 block">
              Profile Score
            </span>
            <span className="text-[10px] text-[#9E9EAE]">Stage verified</span>
          </div>
        </div>

        {/* Priority Areas to Improve */}
        <div className="text-left bg-[#181824] border border-[#2A2A3C] rounded-2xl p-5 mb-8">
          <div className="flex items-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">
              3 Priority Recommendations Identified
            </h3>
          </div>
          <div className="space-y-2">
            {priorities.slice(0, 3).map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-xs text-[#9E9EAE]">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Primary Navigation to Dashboard */}
        <button
          type="button"
          onClick={() => router.push(`/dashboard?student_id=${profile.id}`)}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 flex items-center justify-center gap-2 mx-auto transition-all shadow-xl cursor-pointer group"
        >
          <span>Explore My Personalized Dashboard</span>
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>

        <p className="text-[11px] text-[#5E5E6E] mt-4 font-mono">
          Record ID: {profile.id} · Persisted to PostgreSQL
        </p>
      </motion.div>
    </div>
  );
}
