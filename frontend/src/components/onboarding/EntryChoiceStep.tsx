"use client";

import React from "react";
import { motion } from "framer-motion";
import { FileText, Edit3, ArrowUpRight, Sparkles, CheckCircle2 } from "lucide-react";

interface EntryChoiceStepProps {
  onSelectChoice: (choice: "resume" | "manual") => void;
}

export default function EntryChoiceStep({ onSelectChoice }: EntryChoiceStepProps) {
  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-10">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-300 px-3 py-1 bg-[#181824] border border-violet-500/30 rounded-full">
          Step 1 of 4 · Getting Started
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-3">
          Let&apos;s build your student profile
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E9C] mt-2 max-w-lg mx-auto">
          We&apos;ll use this information to personalize scholarships, career pathways, and opportunities for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Option A — Upload Resume (Lavender-tinted reference card) */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          onClick={() => onSelectChoice("resume")}
          className="card-pastel-lavender rounded-3xl p-7 flex flex-col justify-between cursor-pointer transition-all shadow-xl group relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                <span>Fastest · AI Extraction</span>
              </span>
              <div className="btn-arrow-circle">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4">
              <FileText className="w-6 h-6 text-violet-300" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Option A — Upload Resume
            </h2>
            <p className="text-xs text-[#9E9EAE] leading-relaxed mb-6">
              Upload your resume and our backend will extract relevant academic, skill, and experience information into structured fields for your review.
            </p>
          </div>

          <div className="pt-4 border-t border-violet-500/20 flex items-center justify-between text-xs text-violet-300 font-semibold">
            <span>Upload PDF or Text document</span>
            <span>Extract & Verify →</span>
          </div>
        </motion.div>

        {/* Option B — Fill Manually (Amber-tinted reference card) */}
        <motion.div
          whileHover={{ y: -3 }}
          transition={{ duration: 0.15 }}
          onClick={() => onSelectChoice("manual")}
          className="card-pastel-amber rounded-3xl p-7 flex flex-col justify-between cursor-pointer transition-all shadow-xl group relative overflow-hidden"
        >
          <div>
            <div className="flex items-center justify-between mb-5">
              <span className="px-3 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Step-by-Step Guidance</span>
              </span>
              <div className="btn-arrow-circle">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>

            <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-4">
              <Edit3 className="w-6 h-6 text-amber-300" />
            </div>

            <h2 className="text-xl font-bold text-white mb-2">
              Option B — Fill Manually
            </h2>
            <p className="text-xs text-[#9E9EAE] leading-relaxed mb-6">
              Enter your information step by step through a concise form tailored specifically to your exact educational stage.
            </p>
          </div>

          <div className="pt-4 border-t border-amber-500/20 flex items-center justify-between text-xs text-amber-300 font-semibold">
            <span>Adaptive stage questions</span>
            <span>Start Entry →</span>
          </div>
        </motion.div>
      </div>

      <div className="mt-8 text-center text-xs text-[#717180]">
        You can review, verify, and modify all details before your profile is persisted to the database.
      </div>
    </div>
  );
}
