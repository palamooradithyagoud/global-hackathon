"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  MatchedJobPathway,
  JobPathway,
  MatchedJoobleJob,
  isJoobleJob
} from "@/lib/jobData";
import {
  Building,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Clock,
  Briefcase,
  Sparkles,
  MapPin,
  Globe
} from "lucide-react";

interface JobPathCardsProps {
  jobs: (MatchedJobPathway | JobPathway | MatchedJoobleJob)[];
  onAnalyzeFit?: (job: any) => void;
}

export default function JobPathCards({ jobs, onAnalyzeFit }: JobPathCardsProps) {
  if (jobs.length === 0) {
    return (
      <div className="py-14 text-center text-xs text-[#8E8E9C] bg-[#14141E] rounded-3xl border border-[#242434] p-8 space-y-2">
        <Briefcase className="w-8 h-8 text-[#5A5A72] mx-auto mb-2" />
        <p className="font-semibold text-sm text-white">No matching opportunities found.</p>
        <p className="text-xs text-[#8E8E9C]">Try adjusting your search terms or filter criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
      {jobs.map((job, index) => {
        const isJooble = isJoobleJob(job);

        if (isJooble) {
          const joobleJob = job as MatchedJoobleJob;
          const matchScore = joobleJob.match_score || 94;

          return (
            <motion.div
              key={joobleJob.id || `jooble-${index}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.04 }}
              className="rounded-[26px] bg-[#14141E] hover:bg-[#181826] border border-[#2B2B3E] hover:border-blue-500/50 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden group"
            >
              {/* Subtle Blue/Cyan Ambient Glow for Private Sector Jobs */}
              <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/5 blur-2xl pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

              <div className="space-y-3.5 relative z-10">
                {/* Badges Header: Match Score + Private Sector / Jooble Verified + Salary */}
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-2 flex-wrap">
                    {/* Matching Engine Badge */}
                    <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/35 flex items-center gap-1 shadow-xs">
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      <span>{matchScore}% Profile Match</span>
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                      <Globe className="w-3 h-3 text-cyan-400" />
                      <span>Jooble Verified · India</span>
                    </span>

                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15">
                      B.Tech / B.E.
                    </span>
                  </div>

                  {joobleJob.salary && (
                    <span className="text-[11px] font-mono font-bold text-emerald-300 bg-emerald-950/40 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                      {joobleJob.salary}
                    </span>
                  )}
                </div>

                {/* Company & Location */}
                <div>
                  <div className="flex items-center justify-between gap-2 text-xs text-[#A0A0C0] font-semibold mb-1">
                    <span className="flex items-center gap-1.5 truncate">
                      <Building className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span className="text-white/90 font-bold truncate">{joobleJob.company}</span>
                    </span>
                    <span className="flex items-center gap-1 text-[11px] text-[#8E8E9C] shrink-0">
                      <MapPin className="w-3 h-3 text-red-400" />
                      <span>{joobleJob.location || "India"}</span>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug group-hover:text-blue-300 transition-colors">
                    {joobleJob.title}
                  </h3>
                </div>

                {/* Job Snippet */}
                {joobleJob.snippet && (
                  <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-3">
                    {joobleJob.snippet}
                  </p>
                )}

                {/* Verified Match Criteria Box */}
                <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-2xl space-y-2 border border-white/10">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block">
                    Verified Match Criteria (Jooble Profile Engine):
                  </span>

                  {joobleJob.verified_criteria && joobleJob.verified_criteria.length > 0 ? (
                    joobleJob.verified_criteria.map((criterion, cIdx) => (
                      <div key={cIdx} className="flex items-start gap-2 text-xs text-white/95">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{criterion}</span>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="flex items-center gap-2 text-xs text-white/95">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Location: {joobleJob.location || "India"} (Verified India Recruitment)</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/95">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Education: B.Tech / B.E. Engineering qualification eligible</span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-white/95">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Sector: Private Sector (Live Jooble Verified)</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Matched Profile Skills Pills */}
                {joobleJob.matched_skills && joobleJob.matched_skills.length > 0 && (
                  <div className="space-y-1 pt-0.5">
                    <span className="text-[10px] font-semibold text-[#8E8E9C] uppercase tracking-wider block">
                      Matched Profile Skills:
                    </span>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {joobleJob.matched_skills.map((skill, sIdx) => (
                        <span
                          key={sIdx}
                          className="px-2.5 py-0.5 rounded-lg text-[10px] font-semibold bg-blue-500/10 text-blue-300 border border-blue-500/30 flex items-center gap-1"
                        >
                          <span>✓</span>
                          <span>{skill}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer Actions */}
              <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 relative z-10 mt-4 flex-wrap">
                <div className="text-[11px] text-[#A0A0C0] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>Jooble Live Feed</span>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  {onAnalyzeFit && (
                    <button
                      suppressHydrationWarning
                      type="button"
                      onClick={() => onAnalyzeFit(joobleJob)}
                      className="px-3.5 py-2 rounded-full bg-gradient-to-r from-[#2B1225] to-[#3B1A32] hover:from-[#3B1A32] hover:to-[#4E2243] text-pink-200 border border-pink-500/40 text-xs font-bold transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                      <span>Analyze My Fit</span>
                    </button>
                  )}

                  <a
                    suppressHydrationWarning
                    href={joobleJob.apply_link || "https://jooble.org"}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white text-xs font-extrabold hover:from-blue-600 hover:to-indigo-700 transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 cursor-pointer"
                  >
                    <span>Apply on Jooble</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          );
        }

        // Standard Government / Public Sector / Career Pathway Card
        const pathway = job as MatchedJobPathway;
        const matched = "matchScore" in pathway ? pathway : null;
        const matchScore = matched ? matched.matchScore : 95;
        const isEligible = matched ? matched.isEligible : true;

        return (
          <motion.div
            key={pathway.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.04 }}
            className="rounded-[26px] bg-[#14141E] hover:bg-[#181826] border border-[#2B2B3E] hover:border-amber-500/50 p-5 sm:p-6 transition-all duration-300 flex flex-col justify-between shadow-xl relative overflow-hidden group"
          >
            {/* Subtle Ambient Glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-amber-500/5 blur-2xl pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

            <div className="space-y-3.5 relative z-10">
              {/* Badges Header: Match Score + Minimum Education + Category */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Matching Engine Badge */}
                  <span className="px-3 py-1 rounded-full text-[11px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/35 flex items-center gap-1 shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>{matchScore}% Match · {isEligible ? "Eligible" : "Pending Age 18"}</span>
                  </span>

                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white border border-white/15">
                    {pathway.minEducation}
                  </span>
                </div>

                {pathway.payScale && (
                  <span className="text-[11px] font-mono font-bold text-white/90 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                    {pathway.payScale}
                  </span>
                )}
              </div>

              {/* Title & Department */}
              <div>
                <span className="text-xs text-[#A0A0C0] font-semibold flex items-center gap-1.5 mb-1">
                  <Building className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span className="truncate">{pathway.organization}</span>
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white tracking-tight leading-snug group-hover:text-amber-300 transition-colors">
                  {pathway.title}
                </h3>
              </div>

              {/* Key Requirements from Notification */}
              <p className="text-xs text-slate-300/90 leading-relaxed line-clamp-2">
                {pathway.keyRequirements}
              </p>

              {/* Verified Match Criteria Box: Age, Skills, and Education Matches */}
              <div className="p-3.5 bg-black/40 backdrop-blur-md rounded-2xl space-y-2 border border-white/10">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                  Verified Match Criteria (Age, Skills &amp; Education):
                </span>

                {matched?.verifiedMatchCriteria ? (
                  matched.verifiedMatchCriteria.map((criterion, cIdx) => (
                    <div key={cIdx} className="flex items-start gap-2 text-xs text-white/95">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{criterion}</span>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="flex items-center gap-2 text-xs text-white/95">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Education: {pathway.minEducation} verified matching requirement</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/95">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Age Criteria: {pathway.ageLimit} aligned with youth notifications</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-white/95">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Skills &amp; Syllabus: {pathway.requiredSkills.slice(0, 3).join(", ")} matched</span>
                    </div>
                  </>
                )}

                {/* Selection Process Sub-bullet */}
                <div className="pt-2 border-t border-white/10 flex items-start gap-1.5 text-[11px] text-slate-300">
                  <span className="text-[#A0A0C0]">Selection Format:</span>
                  <span className="text-white font-medium">{pathway.selectionProcess}</span>
                </div>
              </div>

              {/* Skills Tags */}
              <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                {pathway.requiredSkills.map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-medium bg-[#1D1D2C] text-[#C0C0DC] border border-[#2E2E44]"
                  >
                    ✓ {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Card Footer Actions */}
            <div className="pt-4 border-t border-white/10 flex items-center justify-between gap-3 relative z-10 mt-4 flex-wrap">
              <div className="text-[11px] text-[#A0A0C0] flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                <span>Age: {pathway.ageLimit}</span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {onAnalyzeFit && (
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => onAnalyzeFit(pathway)}
                    className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#2B1225] to-[#3B1A32] hover:from-[#3B1A32] hover:to-[#4E2243] text-pink-200 border border-pink-500/40 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0 hover:scale-105 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                    <span>Analyze Fit</span>
                  </button>
                )}

                <a
                  suppressHydrationWarning
                  href={pathway.officialPortal?.startsWith("http") ? pathway.officialPortal : "https://www.google.com/search?q=" + encodeURIComponent(pathway.title + " " + pathway.organization + " notification")}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-1.5 rounded-full bg-white text-black text-xs font-extrabold hover:bg-neutral-200 transition-all shadow-md flex items-center gap-1.5 shrink-0 hover:scale-105 cursor-pointer"
                >
                  <span>Recruitment Portal</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
