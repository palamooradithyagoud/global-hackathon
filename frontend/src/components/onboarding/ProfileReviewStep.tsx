"use client";

import React from "react";
import { motion } from "framer-motion";
import { StudentProfileCreatePayload } from "@/types";
import {
  CheckCircle2,
  Edit2,
  GraduationCap,
  Sparkles,
  Layers,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Loader2,
  FolderGit2,
  Clock,
  MapPin
} from "lucide-react";

interface ProfileReviewStepProps {
  formData: StudentProfileCreatePayload;
  onEdit: () => void;
  onConfirm: () => void;
  isSubmitting: boolean;
  errorMessage: string | null;
}

export default function ProfileReviewStep({
  formData,
  onEdit,
  onConfirm,
  isSubmitting,
  errorMessage,
}: ProfileReviewStepProps) {
  const stageTitles: Record<string, string> = {
    class_10: "Class 10 (Secondary)",
    intermediate: "Intermediate (Senior Secondary)",
    b_tech: "B.Tech (Undergraduate Engineering)",
  };

  return (
    <div className="max-w-3xl mx-auto py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#20202C]">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-violet-300 px-3 py-1 bg-[#181824] border border-violet-500/30 rounded-full">
            Final Step · Review & Verification
          </span>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-2.5">
            Review Your Profile
          </h1>
          <p className="text-xs sm:text-sm text-[#8E8E9C] mt-1">
            Please verify your academic metrics and skills before saving to the intelligence database.
          </p>
        </div>

        <button
          type="button"
          onClick={onEdit}
          disabled={isSubmitting}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#181824] border border-[#2B2B3C] text-xs font-semibold text-white hover:bg-[#202030] transition-colors cursor-pointer w-fit"
        >
          <Edit2 className="w-3.5 h-3.5 text-violet-300" />
          <span>Edit Details</span>
        </button>
      </div>

      {errorMessage && (
        <div className="mt-4 p-3.5 rounded-2xl bg-red-950/40 border border-red-800/40 text-xs text-red-300 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Submission failed: </span>
            <span>{errorMessage}</span>
          </div>
        </div>
      )}

      {/* Review Cards in Dark Obsidian Theme */}
      <div className="mt-6 space-y-4">
        {/* 1. Identity & Education Stage */}
        <div className="bg-[#14141C] border border-[#262634] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-[#222230] mb-3">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-violet-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E9C]">
                Education & Identity
              </span>
            </div>
            <span className="text-xs font-semibold px-3 py-0.5 rounded-full bg-[#1C1C28] text-white border border-[#2E2E40]">
              {stageTitles[formData.education_stage] || formData.education_stage}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div>
              <span className="text-[#8E8E9C] block">Full Name</span>
              <span className="font-bold text-white text-sm">{formData.name}</span>
            </div>
            <div>
              <span className="text-[#8E8E9C] block">Email</span>
              <span className="font-medium text-white">{formData.email}</span>
            </div>
            <div>
              <span className="text-[#8E8E9C] block">Location</span>
              <span className="font-medium text-white flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5 text-[#7E7E8E]" />
                {formData.location || "Not specified"}
              </span>
            </div>
          </div>
        </div>

        {/* 2. Academic Records */}
        <div className="bg-[#14141C] border border-[#262634] rounded-3xl p-6 shadow-xl">
          <div className="flex items-center gap-2 pb-3 border-b border-[#222230] mb-3">
            <Layers className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E9C]">
              Academic Credentials
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div className="sm:col-span-2">
              <span className="text-[#8E8E9C] block">Institution / College</span>
              <span className="font-bold text-white">
                {formData.academic_profile.school_or_college || "Not specified"}
              </span>
              {formData.academic_profile.university && (
                <span className="text-[11px] text-[#8E8E9C] block mt-0.5">
                  Affiliation: {formData.academic_profile.university}
                </span>
              )}
            </div>

            <div>
              <span className="text-[#8E8E9C] block">
                {formData.education_stage === "b_tech"
                  ? "Branch"
                  : formData.education_stage === "intermediate"
                  ? "Stream"
                  : "Board"}
              </span>
              <span className="font-bold text-white">
                {formData.academic_profile.branch ||
                  formData.academic_profile.stream ||
                  formData.academic_profile.board ||
                  "—"}
              </span>
            </div>

            <div>
              <span className="text-[#8E8E9C] block">
                {formData.education_stage === "b_tech" ? "CGPA (10.0 scale)" : "Percentage"}
              </span>
              <span className="font-bold text-emerald-400 font-mono text-sm">
                {formData.academic_profile.cgpa
                  ? `${formData.academic_profile.cgpa} / 10.0`
                  : formData.academic_profile.percentage
                  ? `${formData.academic_profile.percentage}%`
                  : "—"}
              </span>
            </div>
          </div>

          {formData.academic_profile.future_direction && (
            <div className="mt-3 pt-3 border-t border-[#222230] text-xs">
              <span className="text-[#8E8E9C]">Planned Pathway: </span>
              <span className="font-semibold text-white">
                {formData.academic_profile.future_direction}
              </span>
            </div>
          )}
        </div>

        {/* 3. Skills (B.Tech) */}
        {formData.education_stage === "b_tech" && (
          <div className="bg-[#14141C] border border-[#262634] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-[#222230] mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E9C]">
                  Verified Skills ({formData.skills.length})
                </span>
              </div>
            </div>

            {formData.skills.length === 0 ? (
              <p className="text-xs text-[#717180] italic">No skills added.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {formData.skills.map((s) => (
                  <span
                    key={s.skill_name}
                    className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C28] border border-[#2E2E40] text-xs font-medium text-white"
                  >
                    <span>{s.skill_name}</span>
                    <span className="text-[10px] text-violet-300 px-1.5 py-0.2 rounded-full bg-violet-500/20">
                      {s.proficiency}
                    </span>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* 4. Interests (Class 10 / Intermediate) */}
        {formData.education_stage !== "b_tech" && formData.interests.length > 0 && (
          <div className="bg-[#14141C] border border-[#262634] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222230] mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E9C]">
                Areas of Interest ({formData.interests.length})
              </span>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 rounded-full bg-[#1C1C28] border border-[#2E2E40] text-xs font-medium text-white"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* 5. Projects & Career Goal (B.Tech) */}
        {formData.education_stage === "b_tech" && (
          <div className="bg-[#14141C] border border-[#262634] rounded-3xl p-6 shadow-xl">
            <div className="flex items-center gap-2 pb-3 border-b border-[#222230] mb-3">
              <FolderGit2 className="w-4 h-4 text-white" />
              <span className="text-xs font-bold uppercase tracking-wider text-[#8E8E9C]">
                Portfolio & Career Target
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-[#8E8E9C] block">Target Role</span>
                <span className="font-bold text-white text-sm">
                  {formData.target_role || "Software Engineer"}
                </span>
              </div>
              <div>
                <span className="text-[#8E8E9C] block">Available Daily Learning Time</span>
                <span className="font-medium text-white flex items-center gap-1 mt-0.5">
                  <Clock className="w-3.5 h-3.5 text-[#7E7E8E]" />
                  {formData.preferences?.available_learning_time || "2–4 hours/day"}
                </span>
              </div>
            </div>

            {formData.projects.length > 0 && (
              <div className="mt-3.5 pt-3 border-t border-[#222230] space-y-1.5">
                <span className="text-[#8E8E9C] text-[11px] block">
                  Included Projects ({formData.projects.length})
                </span>
                {formData.projects.map((p, i) => (
                  <div key={i} className="text-xs font-semibold text-white">
                    • {p.name} {p.technologies && <span className="text-violet-300 font-normal font-mono">({p.technologies})</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Confirmation Call to Action */}
      <div className="mt-8 pt-6 border-t border-[#20202C] flex flex-col sm:flex-row items-center justify-between gap-4">
        <button
          type="button"
          onClick={onEdit}
          disabled={isSubmitting}
          className="text-xs font-medium text-[#8E8E9C] hover:text-white order-2 sm:order-1 cursor-pointer"
        >
          ← Make corrections in form
        </button>

        <button
          type="button"
          onClick={onConfirm}
          disabled={isSubmitting}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all shadow-xl cursor-pointer order-1 sm:order-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin text-black" />
              <span>Validating & Saving to PostgreSQL...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Confirm & Save Profile</span>
              <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
