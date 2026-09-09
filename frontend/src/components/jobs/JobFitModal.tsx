"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  X,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Briefcase,
  Building,
  MapPin,
  ExternalLink,
  ArrowRight,
  Loader2,
  BookOpen,
  Code2,
  Layers,
  ChevronRight,
  TrendingUp,
  Cpu,
  UserCheck,
  BookmarkPlus,
  Check
} from "lucide-react";
import { JobFitAnalysisResult, SkillGapItem, PriorityGap, LearningStep } from "@/lib/jobData";
import { api } from "@/lib/api";
import { saveRoadmap, isRoadmapSaved, SavedSkillRoadmap } from "@/lib/roadmapStorage";

interface JobFitModalProps {
  job: any | null;
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | null;
}

export default function JobFitModal({
  job,
  isOpen,
  onClose,
  studentId
}: JobFitModalProps) {
  const router = useRouter();
  const [analysisResult, setAnalysisResult] = useState<JobFitAnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!isOpen || !job) {
      setAnalysisResult(null);
      setError(null);
      setIsSaved(false);
      return;
    }

    const jobId = String(job.id || job.external_id || "");
    setIsSaved(isRoadmapSaved(jobId));

    let isMounted = true;

    const runAnalysis = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const jobId = job.id || job.external_id || "job-default";
        const res = await api.jobs.analyze(jobId, studentId || undefined);
        if (isMounted) {
          setAnalysisResult(res);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || "Failed to analyze job fit.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    runAnalysis();

    return () => {
      isMounted = false;
    };
  }, [isOpen, job, studentId]);

  if (!isOpen || !job) return null;

  const analysis = analysisResult?.analysis;
  const aiInsight = analysisResult?.ai_insight;
  const status = analysis?.status || "needs_development";
  const statusLabel = analysis?.status_label || "Needs Development";

  const getStatusBadge = () => {
    if (status === "aligned") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5 shadow-sm">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Aligned</span>
        </span>
      );
    }
    if (status === "needs_development") {
      return (
        <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1.5 shadow-sm">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          <span>Needs Development</span>
        </span>
      );
    }
    return (
      <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40 flex items-center gap-1.5 shadow-sm">
        <XCircle className="w-3.5 h-3.5 text-rose-400" />
        <span>Major Skill Gaps</span>
      </span>
    );
  };

  const handleSaveRoadmap = () => {
    if (!job) return;
    const jobId = String(job.id || job.external_id || `job-${Date.now()}`);

    // WHAT SKILLS I HAVE
    const skillsIHave: string[] = [];
    if (analysis?.matched_skills && analysis.matched_skills.length > 0) {
      analysis.matched_skills.forEach((m: any) => {
        skillsIHave.push(`${m.skill}${m.level_label ? ` (${m.level_label})` : ""}`);
      });
    } else if (aiInsight?.strengths && aiInsight.strengths.length > 0) {
      aiInsight.strengths.forEach((str: string) => skillsIHave.push(str));
    } else {
      skillsIHave.push("Baseline profile match");
    }

    // WHAT TO LEARN
    const missingSkills = (analysis?.missing_skills || []).map((m: any) =>
      `${m.skill}${m.required_level_label ? ` (${m.required_level_label})` : ""}`
    );
    const needsDevelopment = (analysis?.partial_skills || []).map((p: any) =>
      `${p.skill} (Lvl ${p.student_level} → ${p.required_level})`
    );

    // ALL JOB REQUIREMENTS
    const allRequiredSkills: string[] = [];
    (analysis?.matched_skills || []).forEach((m: any) => {
      allRequiredSkills.push(`${m.skill}${m.required_level_label ? ` (${m.required_level_label})` : ""}`);
    });
    (analysis?.partial_skills || []).forEach((p: any) => {
      allRequiredSkills.push(`${p.skill} (Required Lvl: ${p.required_level})`);
    });
    (analysis?.missing_skills || []).forEach((m: any) => {
      allRequiredSkills.push(`${m.skill}${m.required_level_label ? ` (${m.required_level_label})` : ""}`);
    });

    const roadmap: SavedSkillRoadmap = {
      id: jobId,
      savedAt: new Date().toISOString(),
      job: {
        title: job.title || "Career Role",
        company: job.company || "Hiring Partner",
        location: job.location || "India",
        salary: job.salary || "Competitive / Industry Standard",
        applyLink: job.apply_link || job.source_url || "https://jooble.org",
        description: job.description || undefined,
      },
      skillsIHave,
      requirements: {
        allRequiredSkills: allRequiredSkills.length > 0 ? allRequiredSkills : (job.skills || []),
        missingSkills,
        needsDevelopment,
        learningSteps: aiInsight?.learning_plan || [],
        projectRecommendation: aiInsight?.project_recommendation || undefined,
      },
      whatToLearn: {
        missingSkills,
        needsDevelopment,
        learningSteps: aiInsight?.learning_plan || [],
        projectRecommendation: aiInsight?.project_recommendation || undefined,
      },
    };

    saveRoadmap(roadmap);
    setIsSaved(true);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        {/* Modal Backdrop / Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25 }}
          className="relative w-full max-w-3xl rounded-[28px] bg-[#140A12] border border-[#351E2D] shadow-2xl text-white overflow-hidden my-6 flex flex-col max-h-[90vh]"
        >
          {/* Subtle Ambient Plum Glow */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-[#4A2848]/20 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-blue-900/15 blur-3xl pointer-events-none" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-[#281321] flex items-start justify-between gap-4 relative z-10 bg-[#170C15]/90 backdrop-blur-md shrink-0">
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                {getStatusBadge()}
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-white/10 text-white/90 border border-white/15">
                  B.Tech Engineering Match
                </span>
                {job.salary && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-emerald-300 bg-emerald-950/40 border border-emerald-500/30">
                    {job.salary}
                  </span>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2 text-xs text-[#A0A0C0] font-semibold mb-0.5">
                  <span className="flex items-center gap-1 text-white/90">
                    <Building className="w-3.5 h-3.5 text-amber-400" />
                    <span>{job.company || "Tech Enterprise"}</span>
                  </span>
                  <span>·</span>
                  <span className="flex items-center gap-1 text-slate-300">
                    <MapPin className="w-3 h-3 text-red-400" />
                    <span>{job.location || "India"}</span>
                  </span>
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {job.title}
                </h2>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-full bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-white/80 hover:text-white flex items-center justify-center transition-all shrink-0 cursor-pointer shadow-md"
              title="Close Analysis"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Content Scrollable Area */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-6 relative z-10 flex-1">
            {isLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-3 text-center">
                <div className="relative">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-400" />
                  <Sparkles className="w-4 h-4 text-amber-300 absolute top-0 right-0 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-bold text-white">Analyzing Your Profile Against This Role...</p>
                  <p className="text-xs text-[#A0A0B8] max-w-sm">
                    Deterministic skill gap calculation active · Groq AI generating customized roadmap
                  </p>
                </div>
              </div>
            ) : error ? (
              <div className="p-6 rounded-2xl bg-rose-950/30 border border-rose-500/30 text-center space-y-2">
                <AlertTriangle className="w-8 h-8 text-rose-400 mx-auto" />
                <p className="text-sm font-bold text-white">Analysis Could Not Complete</p>
                <p className="text-xs text-rose-200/80">{error}</p>
              </div>
            ) : analysisResult?.has_skills === false ? (
              /* Profile Incomplete State */
              <div className="p-8 rounded-3xl bg-[#1C0E1A] border border-[#3D2034] text-center space-y-4">
                <UserCheck className="w-12 h-12 text-amber-400 mx-auto" />
                <div className="space-y-1 max-w-md mx-auto">
                  <h3 className="text-base font-bold text-white">Complete Your Skills Profile</h3>
                  <p className="text-xs text-[#A0A0B8]">
                    You haven&apos;t added verified technical skills yet. Add your programming languages, frameworks, and tools to unlock live Groq job-fit analysis.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => router.push(studentId ? `/profile?student_id=${studentId}` : "/profile")}
                  className="px-6 py-2.5 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white text-xs font-bold hover:scale-105 transition-all shadow-md cursor-pointer"
                >
                  Update Profile
                </button>
              </div>
            ) : (
              <>
                {/* 1. DETERMINISTIC SKILL BREAKDOWN: YOUR FIT */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-purple-400" />
                      <span>Your Fit Breakdown (Deterministic Verification)</span>
                    </span>
                    <span className="text-[11px] font-mono text-[#A0A0C0]">
                      {analysis?.summary_counts.matched} Matched · {analysis?.summary_counts.partial} Partial · {analysis?.summary_counts.missing} Missing
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {/* Strengths (Matched) */}
                    <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>Strengths</span>
                      </div>
                      <div className="space-y-1.5">
                        {analysis?.matched_skills && analysis.matched_skills.length > 0 ? (
                          analysis.matched_skills.map((m, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-black/40 px-2 py-1 rounded-lg border border-emerald-500/20">
                              <span className="font-semibold text-white">✓ {m.skill}</span>
                              <span className="text-[10px] text-emerald-400 font-mono">{m.student_level_label}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No exact proficiency matches yet.</p>
                        )}
                      </div>
                    </div>

                    {/* Needs Development (Partial) */}
                    <div className="p-4 rounded-2xl bg-amber-950/25 border border-amber-500/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-amber-300">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Needs Development</span>
                      </div>
                      <div className="space-y-1.5">
                        {analysis?.partial_skills && analysis.partial_skills.length > 0 ? (
                          analysis.partial_skills.map((p, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-black/40 px-2 py-1 rounded-lg border border-amber-500/20">
                              <span className="font-semibold text-white">⚠ {p.skill}</span>
                              <span className="text-[10px] text-amber-400 font-mono">
                                Lvl {p.student_level} → {p.required_level}
                              </span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No partial proficiency gaps.</p>
                        )}
                      </div>
                    </div>

                    {/* Skill Gaps (Missing) */}
                    <div className="p-4 rounded-2xl bg-rose-950/25 border border-rose-500/30 space-y-2">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-rose-300">
                        <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>Skill Gaps</span>
                      </div>
                      <div className="space-y-1.5">
                        {analysis?.missing_skills && analysis.missing_skills.length > 0 ? (
                          analysis.missing_skills.map((msg, idx) => (
                            <div key={idx} className="flex items-center justify-between text-[11px] bg-black/40 px-2 py-1 rounded-lg border border-rose-500/20">
                              <span className="font-semibold text-white">× {msg.skill}</span>
                              <span className="text-[10px] text-rose-400 font-mono">{msg.required_level_label}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-[11px] text-slate-400 italic">No missing requirements!</p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. GROQ AI REASONING & STRATEGIC EXPLANATION */}
                {aiInsight && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#281321]/90 via-[#1F0E1B] to-[#140A12] border border-[#4A2848] space-y-4 shadow-lg">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-purple-300 flex items-center gap-1.5">
                        <Sparkles className="w-4 h-4 text-purple-400" />
                        <span>Groq AI Fit Explanation &amp; Strategy</span>
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/15 text-purple-300 border border-purple-500/30">
                        Verified Facts Synced
                      </span>
                    </div>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
                      {aiInsight.summary}
                    </p>

                    {/* Key Strengths */}
                    {aiInsight.strengths && aiInsight.strengths.length > 0 && (
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block">
                          Why Your Profile Is Relevant:
                        </span>
                        <div className="space-y-1">
                          {aiInsight.strengths.map((str, sIdx) => (
                            <div key={sIdx} className="flex items-start gap-2 text-xs text-slate-300">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                              <span>{str}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Priority Skill Gaps */}
                    {aiInsight.priority_gaps && aiInsight.priority_gaps.length > 0 && (
                      <div className="space-y-2 pt-1 border-t border-[#351E2D]">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">
                          Priority Skill Gaps &amp; Impact:
                        </span>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {aiInsight.priority_gaps.map((gap, gIdx) => (
                            <div key={gIdx} className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-white">{gap.skill}</span>
                                <span
                                  className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                    gap.priority === "high"
                                      ? "bg-rose-500/20 text-rose-300 border border-rose-500/30"
                                      : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                  }`}
                                >
                                  {gap.priority} Priority
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 leading-snug">{gap.reason}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 3. PERSONALIZED LEARNING ROADMAP */}
                {aiInsight?.learning_plan && aiInsight.learning_plan.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-cyan-300 flex items-center gap-1.5">
                        <TrendingUp className="w-4 h-4 text-cyan-400" />
                        <span>Recommended Next Steps &amp; Learning Plan</span>
                      </span>
                    </div>

                    <div className="space-y-2">
                      {aiInsight.learning_plan.map((step, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-2xl bg-[#180D17] border border-[#2D1627] flex items-start gap-3 hover:border-purple-500/40 transition-all"
                        >
                          <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 border border-purple-500/40">
                            {step.sequence || idx + 1}
                          </span>

                          <div className="space-y-1 flex-1">
                            <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                              <span>{step.skill}</span>
                            </h4>
                            <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                              {step.focus.map((fItem, fIdx) => (
                                <span
                                  key={fIdx}
                                  className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-black/40 text-purple-200 border border-purple-500/20"
                                >
                                  {fItem}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. RECOMMENDED PORTFOLIO PROJECT */}
                {aiInsight?.project_recommendation && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-blue-950/30 via-indigo-950/20 to-transparent border border-blue-500/30 space-y-1.5">
                    <div className="flex items-center gap-1.5 text-xs font-bold text-blue-300">
                      <Code2 className="w-4 h-4 text-blue-400" />
                      <span>Recommended Portfolio Project (Bridge Multiple Gaps)</span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed">
                      {aiInsight.project_recommendation}
                    </p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Modal Actions Footer */}
          <div className="p-4 sm:p-5 border-t border-[#281321] flex items-center justify-between gap-3 relative z-10 bg-[#170C15]/95 backdrop-blur-md shrink-0 flex-wrap">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-full bg-[#281321] hover:bg-[#351E2D] border border-[#4A2848] text-xs font-bold text-[#A0A0C0] hover:text-white transition-all cursor-pointer"
            >
              Close
            </button>

            <div className="flex items-center gap-2 flex-wrap">
              <a
                href={job.apply_link || job.source_url || "https://jooble.org"}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 rounded-full bg-[#20101D] hover:bg-[#2C1729] border border-[#4A2848] text-xs font-bold text-slate-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>Apply on Jooble</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>

              <button
                type="button"
                onClick={() => {
                  if (!isSaved) {
                    handleSaveRoadmap();
                  } else {
                    onClose();
                    router.push(studentId ? `/dashboard/skill-tracks?student_id=${studentId}` : "/dashboard/skill-tracks");
                  }
                }}
                className={`px-5 py-2 rounded-full text-xs font-extrabold flex items-center gap-1.5 transition-all cursor-pointer shadow-lg ${
                  isSaved
                    ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25"
                    : "bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-500/25 hover:scale-105"
                }`}
              >
                {isSaved ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-white" />
                    <span>View in Skill Tracks →</span>
                  </>
                ) : (
                  <>
                    <BookmarkPlus className="w-3.5 h-3.5" />
                    <span>Save Roadmap</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
