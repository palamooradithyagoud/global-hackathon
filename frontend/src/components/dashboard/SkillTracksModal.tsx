"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X,
  Briefcase,
  Building,
  MapPin,
  ExternalLink,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen,
  FolderOpen,
  ListChecks,
  Code2
} from "lucide-react";
import {
  SavedSkillRoadmap,
  getSavedRoadmaps,
  removeRoadmap,
} from "@/lib/roadmapStorage";

interface SkillTracksModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | null;
}

export default function SkillTracksModal({
  isOpen,
  onClose,
  studentId,
}: SkillTracksModalProps) {
  const router = useRouter();
  const [roadmaps, setRoadmaps] = useState<SavedSkillRoadmap[]>([]);
  const [activeSection, setActiveSection] = useState<"all" | "job" | "req">("all");

  const loadRoadmaps = () => {
    setRoadmaps(getSavedRoadmaps());
  };

  useEffect(() => {
    if (isOpen) {
      loadRoadmaps();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleStorage = () => loadRoadmaps();
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeRoadmap(id);
    loadRoadmaps();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.22 }}
          className="relative w-full max-w-4xl rounded-[28px] bg-[#140A12] border border-[#351E2D] shadow-2xl text-white overflow-hidden my-6 flex flex-col max-h-[92vh]"
        >
          {/* Ambient Glows */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/10 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-purple-900/15 blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-[#281321] relative z-10 bg-[#170C15]/90 backdrop-blur-md shrink-0 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300 shadow-inner">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                      Skill Tracks
                    </h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/20 text-teal-300 border border-teal-500/30">
                      {roadmaps.length} Saved {roadmaps.length === 1 ? "Job" : "Jobs"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Your saved jobs, verified skills, and requirement roadmaps
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* TWO MAIN SECTIONS TABS: JOB & REQ */}
            <div className="flex items-center gap-2 pt-1 border-t border-[#281321]/80">
              <button
                type="button"
                onClick={() => setActiveSection("all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "all"
                    ? "bg-gradient-to-r from-teal-500 to-emerald-600 text-white shadow-lg shadow-teal-500/20 font-extrabold"
                    : "bg-[#20101D] hover:bg-[#2A1527] text-slate-400 hover:text-white border border-[#351E2D]"
                }`}
              >
                <span>All Sections</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("job")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "job"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-500/20 font-extrabold"
                    : "bg-[#20101D] hover:bg-[#2A1527] text-slate-400 hover:text-white border border-[#351E2D]"
                }`}
              >
                <Briefcase className="w-3.5 h-3.5 text-purple-400" />
                <span>JOB (Saved Jobs &amp; My Skills)</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveSection("req")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeSection === "req"
                    ? "bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-lg shadow-rose-500/20 font-extrabold"
                    : "bg-[#20101D] hover:bg-[#2A1527] text-slate-400 hover:text-white border border-[#351E2D]"
                }`}
              >
                <ListChecks className="w-3.5 h-3.5 text-rose-400" />
                <span>REQ (Job Requirements &amp; What to Learn)</span>
              </button>
            </div>
          </div>

          {/* Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 relative z-10">
            {roadmaps.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-[#20101D] border border-[#4A2848] flex items-center justify-center text-slate-400 mb-4 shadow-md">
                  <FolderOpen className="w-7 h-7 text-teal-400/70" />
                </div>
                <h3 className="text-base font-bold text-white mb-1">
                  No Saved Jobs in Skill Tracks Yet
                </h3>
                <p className="text-xs text-slate-400 max-w-sm mb-6 leading-relaxed">
                  Go to Job Pathways, click on any role fit analysis, and hit <strong>Save Roadmap</strong> to view your saved jobs, skills, and requirements right here.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    router.push("/jobs");
                  }}
                  className="px-5 py-2.5 rounded-full bg-gradient-to-r from-teal-500 to-emerald-600 hover:from-teal-400 hover:to-emerald-500 text-white text-xs font-bold shadow-lg shadow-teal-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-105"
                >
                  <span>Explore Jobs &amp; Roadmaps</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              roadmaps.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl bg-[#1A0D18] border border-[#351E2D] p-5 space-y-5 hover:border-[#4A2848] transition-all shadow-md"
                >
                  {/* Top Bar with Title, External Apply & Delete */}
                  <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#281321] flex-wrap">
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-white">
                        {item.job.title}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-slate-300 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300 font-semibold">
                          <Building className="w-3.5 h-3.5 text-amber-400" />
                          {item.job.company}
                        </span>
                        {item.job.location && (
                          <span className="flex items-center gap-1 text-slate-400">
                            <MapPin className="w-3.5 h-3.5 text-slate-500" />
                            {item.job.location}
                          </span>
                        )}
                        {item.job.salary && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                            {item.job.salary}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {item.job.applyLink && (
                        <a
                          href={item.job.applyLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-colors"
                        >
                          <span>Apply on Jooble</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                        </a>
                      )}

                      <button
                        type="button"
                        onClick={(e) => handleDelete(item.id, e)}
                        title="Remove saved job"
                        className="p-1.5 rounded-xl bg-rose-950/30 hover:bg-rose-950/60 border border-rose-800/30 text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 1. SECTION: JOB */}
                  {(activeSection === "all" || activeSection === "job") && (
                    <div className="p-4 rounded-2xl bg-[#20101D] border border-purple-500/30 space-y-3 shadow-inner">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-purple-600 text-white text-[10px] font-black uppercase tracking-wider">
                            SECTION 1
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                            <Briefcase className="w-4 h-4 text-purple-400" />
                            <span>JOB &amp; MY SKILLS</span>
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          Role: {item.job.title}
                        </span>
                      </div>

                      {/* Job details summary */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs bg-black/40 p-3 rounded-xl border border-white/5">
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Role</span>
                          <span className="font-semibold text-white">{item.job.title}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Company</span>
                          <span className="font-semibold text-white">{item.job.company}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block font-bold uppercase">Location</span>
                          <span className="font-semibold text-white">{item.job.location || "India"}</span>
                        </div>
                      </div>

                      {/* MY SKILLS (WHAT SKILLS I HAVE) */}
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-400">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>WHAT SKILLS I HAVE (Verified Strengths)</span>
                        </div>

                        {item.skillsIHave && item.skillsIHave.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {item.skillsIHave.map((skill, sIdx) => (
                              <span
                                key={sIdx}
                                className="px-3 py-1 rounded-lg bg-emerald-950/50 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                              >
                                <span className="text-emerald-400 font-bold">✓</span>
                                <span>{skill}</span>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 italic">No verified skills recorded yet.</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 2. SECTION: REQ */}
                  {(activeSection === "all" || activeSection === "req") && (
                    <div className="p-4 rounded-2xl bg-[#1C0D17] border border-amber-500/30 space-y-4 shadow-inner">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-0.5 rounded-md bg-amber-600 text-white text-[10px] font-black uppercase tracking-wider">
                            SECTION 2
                          </span>
                          <h4 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                            <ListChecks className="w-4 h-4 text-amber-400" />
                            <span>REQ (Job Requirements &amp; What to Learn)</span>
                          </h4>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Recruiter Requirements Sync
                        </span>
                      </div>

                      {/* All Required Skills for the Job */}
                      {item.requirements?.allRequiredSkills && item.requirements.allRequiredSkills.length > 0 && (
                        <div className="space-y-1.5">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300 block">
                            Job Skill Requirements:
                          </span>
                          <div className="flex flex-wrap gap-1.5">
                            {item.requirements.allRequiredSkills.map((req, rIdx) => (
                              <span
                                key={rIdx}
                                className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-slate-300 text-xs font-medium"
                              >
                                • {req}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* WHAT TO LEARN: Missing Requirements */}
                      {item.whatToLearn.missingSkills && item.whatToLearn.missingSkills.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-400">
                            <XCircle className="w-3.5 h-3.5 text-rose-400" />
                            <span>WHAT TO LEARN: Missing Requirements</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.whatToLearn.missingSkills.map((mSkill, mIdx) => (
                              <span
                                key={mIdx}
                                className="px-3 py-1 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center gap-1.5"
                              >
                                <span className="text-rose-400 font-bold">×</span>
                                <span>{mSkill}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Needs Development */}
                      {item.whatToLearn.needsDevelopment && item.whatToLearn.needsDevelopment.length > 0 && (
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                            <span>Proficiency Gaps (Needs Development)</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {item.whatToLearn.needsDevelopment.map((pSkill, pIdx) => (
                              <span
                                key={pIdx}
                                className="px-3 py-1 rounded-lg bg-amber-950/50 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5"
                              >
                                <span className="text-amber-400 font-bold">⚠</span>
                                <span>{pSkill}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Step-by-Step Learning Plan */}
                      {item.whatToLearn.learningSteps && item.whatToLearn.learningSteps.length > 0 && (
                        <div className="space-y-2 pt-1 border-t border-[#281321]">
                          <span className="text-[10px] font-bold uppercase text-cyan-300 flex items-center gap-1">
                            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Step-by-Step Learning Roadmap to Fulfill Requirements:</span>
                          </span>
                          <div className="space-y-2">
                            {item.whatToLearn.learningSteps.map((step, stIdx) => (
                              <div
                                key={stIdx}
                                className="p-3 rounded-xl bg-black/50 border border-cyan-500/25 flex items-start gap-3 text-xs text-slate-200"
                              >
                                <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-black text-xs flex items-center justify-center shrink-0 border border-cyan-500/40 mt-0.5">
                                  {step.sequence || stIdx + 1}
                                </div>
                                <div className="space-y-0.5">
                                  <span className="font-extrabold text-white text-xs block">{step.skill}</span>
                                  {step.focus && step.focus.length > 0 && (
                                    <p className="text-[11px] text-slate-300">
                                      <strong className="text-cyan-400 font-semibold">Focus:</strong> {step.focus.join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Bridge Portfolio Project */}
                      {item.whatToLearn.projectRecommendation && (
                        <div className="p-3 rounded-xl bg-purple-950/25 border border-purple-500/30 text-xs text-slate-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase text-purple-300 flex items-center gap-1.5">
                            <Code2 className="w-3.5 h-3.5 text-purple-400" />
                            <span>Recommended Portfolio Project to Bridge Requirements:</span>
                          </span>
                          <p className="text-xs text-slate-300 leading-relaxed">
                            {item.whatToLearn.projectRecommendation}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-5 border-t border-[#281321] flex items-center justify-between gap-3 relative z-10 bg-[#170C15]/95 backdrop-blur-md shrink-0">
            <span className="text-[11px] text-slate-400">
              Synced with your Job Fit analyses. Both <strong>JOB</strong> and <strong>REQ</strong> sections are saved.
            </span>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 rounded-full bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-xs font-bold text-white transition-all cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
