"use client";

import React from "react";
import { motion } from "framer-motion";
import { EducationStage } from "@/types";
import { BookOpen, Layers, Laptop, Check, ArrowRight } from "lucide-react";

interface EducationStageStepProps {
  selectedStage: EducationStage;
  onSelectStage: (stage: EducationStage) => void;
  onContinue: () => void;
  onBack: () => void;
}

export default function EducationStageStep({
  selectedStage,
  onSelectStage,
  onContinue,
  onBack,
}: EducationStageStepProps) {
  const stages: {
    id: EducationStage;
    title: string;
    subtitle: string;
    description: string;
    icon: React.ReactNode;
    features: string[];
    cardClass: string;
    accentText: string;
  }[] = [
    {
      id: "class_10",
      title: "Class 10",
      subtitle: "Exploring what comes next",
      description: "Academic boards, percentage goals, subject passions, and higher secondary track exploration.",
      icon: <BookOpen className="w-5 h-5 text-violet-300" />,
      features: ["School & Board", "Interests & Passions", "Stream Direction"],
      cardClass: "card-pastel-lavender",
      accentText: "text-violet-300",
    },
    {
      id: "intermediate",
      title: "Intermediate",
      subtitle: "Choosing your next pathway",
      description: "Junior College stream specializations (MPC, BiPC, MEC, CEC) and university exam targets.",
      icon: <Layers className="w-5 h-5 text-amber-300" />,
      features: ["Stream Specialization", "Academic Scores", "Future Degree Plans"],
      cardClass: "card-pastel-amber",
      accentText: "text-amber-300",
    },
    {
      id: "b_tech",
      title: "B.Tech",
      subtitle: "Building toward your career",
      description: "Engineering branches, verified CGPA, technical skills proficiency, and project portfolio.",
      icon: <Laptop className="w-5 h-5 text-emerald-300" />,
      features: ["Branch & CGPA", "Proficiencies & Projects", "Target Industry Roles"],
      cardClass: "card-pastel-mint",
      accentText: "text-emerald-300",
    },
  ];

  return (
    <div className="max-w-3xl mx-auto py-8">
      <div className="text-center mb-8">
        <span className="text-xs font-semibold uppercase tracking-wider text-violet-300 px-3 py-1 bg-[#181824] border border-violet-500/30 rounded-full">
          Step 2 of 4 · Academic Pathway
        </span>
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-white mt-3">
          Where are you currently in your education journey?
        </h1>
        <p className="text-xs sm:text-sm text-[#8E8E9C] mt-2 max-w-lg mx-auto">
          We customize your profile form to ask only questions that are strictly relevant to your current stage.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
        {stages.map((st) => {
          const isSelected = selectedStage === st.id;
          return (
            <motion.div
              key={st.id}
              whileHover={{ y: -2 }}
              transition={{ duration: 0.15 }}
              onClick={() => onSelectStage(st.id)}
              className={`${st.cardClass} p-6 rounded-3xl cursor-pointer transition-all flex flex-col justify-between relative shadow-lg ${
                isSelected
                  ? "ring-2 ring-white border-transparent"
                  : "opacity-85 hover:opacity-100"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center">
                    {st.icon}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${
                      isSelected
                        ? "bg-white text-black font-bold"
                        : "border border-white/30 text-transparent"
                    }`}
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                </div>

                <h3 className="text-xl font-bold text-white">{st.title}</h3>
                <p className={`text-xs font-semibold mt-0.5 ${st.accentText}`}>{st.subtitle}</p>
                <p className="text-xs text-[#9E9EAE] mt-2 leading-relaxed">
                  {st.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 space-y-1.5">
                {st.features.map((feat) => (
                  <div key={feat} className="text-[11px] text-[#A1A1B2] flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-white/60" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-6 border-t border-[#20202C]">
        <button
          type="button"
          onClick={onBack}
          className="px-5 py-2.5 rounded-full bg-[#181824] border border-[#2A2A3A] text-white text-xs font-medium hover:bg-[#202030] transition-colors cursor-pointer"
        >
          Back
        </button>

        <button
          type="button"
          onClick={onContinue}
          className="px-7 py-3 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
        >
          <span>Continue with {stages.find((s) => s.id === selectedStage)?.title}</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
