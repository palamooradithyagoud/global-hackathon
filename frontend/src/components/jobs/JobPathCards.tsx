"use client";

import React from "react";
import { motion } from "framer-motion";
import { JobPathway } from "@/lib/jobData";
import {
  Building,
  ShieldCheck,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Award,
  Clock,
  Briefcase,
  AlertCircle
} from "lucide-react";

interface JobPathCardsProps {
  jobs: JobPathway[];
}

export default function JobPathCards({ jobs }: JobPathCardsProps) {
  if (jobs.length === 0) {
    return (
      <div className="py-12 text-center text-xs text-[#8E8E9C] bg-[#14141E] rounded-3xl border border-[#242434] p-6">
        No job pathways found for this educational stage.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {jobs.map((job, index) => (
        <motion.div
          key={job.id}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: index * 0.04 }}
          className="rounded-[26px] bg-[#14141E] hover:bg-[#181826] border border-[#2B2B3E] hover:border-amber-500/50 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden group"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

          <div className="space-y-3.5 relative z-10">
            {/* Badges Header */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>{job.minEducation}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  {job.category}
                </span>
              </div>

              {job.payScale && (
                <span className="text-[11px] font-mono font-bold text-white/90 bg-white/10 px-2.5 py-0.5 rounded-full border border-white/10">
                  {job.payScale}
                </span>
              )}
            </div>

            {/* Title & Department */}
            <div>
              <span className="text-xs text-[#A0A0C0] font-semibold flex items-center gap-1.5 mb-1">
                <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="truncate">{job.organization}</span>
              </span>
              <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                {job.title}
              </h3>
            </div>

            {/* Key Requirements (Direct Table Requirements from User) */}
            <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-2xl space-y-2 border border-white/10">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                Key Requirements & Eligibility:
              </span>
              <p className="text-xs sm:text-[13px] text-slate-100 font-medium leading-relaxed">
                {job.keyRequirements}
              </p>

              {/* Selection Process Sub-bullet */}
              <div className="pt-2 border-t border-white/10 flex items-start gap-1.5 text-xs text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong className="text-white">Selection Process: </strong>
                  {job.selectionProcess}
                </span>
              </div>
            </div>

            {/* Tags */}
            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
              {job.tags.map((tag, tIdx) => (
                <span
                  key={tIdx}
                  className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#1D1D2C] text-[#A0A0C0] border border-[#2E2E44]"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>

          {/* Card Footer Actions */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 relative z-10 mt-4">
            <div className="text-[11px] text-[#8E8E9C] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Age Criteria: {job.ageLimit}</span>
            </div>

            <a
              href={job.officialPortal?.startsWith("http") ? job.officialPortal : "https://www.google.com/search?q=" + encodeURIComponent(job.title + " " + job.organization + " notification 10th pass")}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-extrabold hover:bg-neutral-200 transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 cursor-pointer"
            >
              <span>Recruitment Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </motion.div>
      ))}
    </div>
  );
}
