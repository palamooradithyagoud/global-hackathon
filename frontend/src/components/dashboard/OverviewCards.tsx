"use client";

import React from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";

interface OverviewCardsProps {
  scholarshipsCount: number;
  jobsCount?: number;
  selectedCard?: "scholarships" | "job" | "learning" | "explore" | "career";
  onSelectCard: (card: "scholarships" | "job" | "learning" | "explore" | "career") => void;
}

export default function OverviewCards({
  scholarshipsCount,
  jobsCount,
  selectedCard,
  onSelectCard,
}: OverviewCardsProps) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 gap-4 sm:gap-5">
      {/* 1. SCHOLARSHIPS CARD (Soft Periwinkle / Lavender Blue) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectCard("scholarships")}
        className="relative h-48 sm:h-52 rounded-[28px] p-5 flex flex-col justify-between cursor-pointer overflow-hidden select-none shadow-xl group transition-shadow hover:shadow-2xl"
        style={{
          backgroundColor: "#9DB8FE",
          backgroundImage: "radial-gradient(circle at 80% 30%, #7987FA 0%, #9DB8FE 65%)",
        }}
      >
        {/* 3D Fluid loop motif in background matching reference */}
        <div className="absolute top-1 right-2 w-32 h-32 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="blueTorus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7082FC" />
                <stop offset="100%" stopColor="#5364F0" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="40" r="30" fill="none" stroke="url(#blueTorus)" strokeWidth="18" opacity="0.85" />
          </svg>
        </div>

        {/* Top row: Pill badge & white circle arrow */}
        <div className="flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#1E2B58]/20 text-[#0F172A] tracking-wide backdrop-blur-xs">
            Scholarships
          </span>
          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        {/* Bottom Title & Counter */}
        <div className="z-10 mt-auto">
          <h3 className="font-extrabold text-xl sm:text-2xl text-[#0F172A] tracking-tight leading-none mb-1 group-hover:text-black transition-colors">
            Scholarships
          </h3>
          <p className="text-xs font-semibold text-[#1E293B]/80 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#1E293B]" />
            <span>{scholarshipsCount} Matched Opportunities</span>
          </p>
        </div>
      </motion.div>

      {/* 2. JOB & CAREER CARD (Vibrant Warm Yellow / Golden Orange) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectCard("job")}
        className="relative h-48 sm:h-52 rounded-[28px] p-5 flex flex-col justify-between cursor-pointer overflow-hidden select-none shadow-xl group transition-shadow hover:shadow-2xl"
        style={{
          backgroundColor: "#FED33C",
          backgroundImage: "radial-gradient(circle at 75% 30%, #F59E0B 0%, #FED33C 70%)",
        }}
      >
        <div className="absolute top-1 right-2 w-32 h-32 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="amberTorus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F97316" />
                <stop offset="100%" stopColor="#EA580C" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="40" r="30" fill="none" stroke="url(#amberTorus)" strokeWidth="18" opacity="0.85" />
          </svg>
        </div>

        <div className="flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#78350F]/20 text-[#3B1700] tracking-wide backdrop-blur-xs">
            Jobs
          </span>
          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="z-10 mt-auto">
          <h3 className="font-extrabold text-xl sm:text-2xl text-[#1C1917] tracking-tight leading-none mb-1 group-hover:text-black transition-colors">
            Job Pathways
          </h3>
          <p className="text-xs font-semibold text-[#451A03]/85 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-[#451A03]" />
            <span>{jobsCount !== undefined ? `${jobsCount} Verified Opportunities` : "8 Government Jobs"}</span>
          </p>
        </div>
      </motion.div>

      {/* 3. LEARNING CARD (Refreshing Pastel Mint / Aquamarine) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectCard("learning")}
        className="relative h-48 sm:h-52 rounded-[28px] p-5 flex flex-col justify-between cursor-pointer overflow-hidden select-none shadow-xl group transition-shadow hover:shadow-2xl"
        style={{
          backgroundColor: "#A5F3E4",
          backgroundImage: "radial-gradient(circle at 75% 30%, #2DD4BF 0%, #A5F3E4 70%)",
        }}
      >
        <div className="absolute top-1 right-2 w-32 h-32 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="mintTorus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#065F46" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="40" r="30" fill="none" stroke="url(#mintTorus)" strokeWidth="18" opacity="0.85" />
          </svg>
        </div>

        <div className="flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#134E4A]/20 text-[#042F2E] tracking-wide backdrop-blur-xs">
            Learning
          </span>
          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="z-10 mt-auto">
          <h3 className="font-extrabold text-xl sm:text-2xl text-[#042F2E] tracking-tight leading-none mb-1 group-hover:text-black transition-colors">
            Skill Tracks
          </h3>
          <p className="text-xs font-semibold text-[#064E3B]/80">
            Phase 1.3 Tracks
          </p>
        </div>
      </motion.div>

      {/* 4. CAREER PATHWAYS CARD (Soft Pastel Carnation Pink) */}
      <motion.div
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelectCard("career")}
        className="relative h-48 sm:h-52 rounded-[28px] p-5 flex flex-col justify-between cursor-pointer overflow-hidden select-none shadow-xl group transition-shadow hover:shadow-2xl"
        style={{
          backgroundColor: "#FBCFE8",
          backgroundImage: "radial-gradient(circle at 75% 30%, #F472B6 0%, #FBCFE8 70%)",
        }}
      >
        <div className="absolute top-1 right-2 w-32 h-32 pointer-events-none opacity-85 group-hover:scale-105 transition-transform duration-300">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="pinkTorus" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#DB2777" />
                <stop offset="100%" stopColor="#9D174D" />
              </linearGradient>
            </defs>
            <circle cx="65" cy="40" r="30" fill="none" stroke="url(#pinkTorus)" strokeWidth="18" opacity="0.85" />
          </svg>
        </div>

        <div className="flex items-center justify-between z-10">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-[#831843]/20 text-[#500724] tracking-wide backdrop-blur-xs">
            Pathways
          </span>
          <div className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center font-bold shadow-md transition-transform group-hover:scale-110">
            <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
          </div>
        </div>

        <div className="z-10 mt-auto">
          <h3 className="font-extrabold text-xl sm:text-2xl text-[#500724] tracking-tight leading-none mb-1 group-hover:text-black transition-colors">
            Career Pathways
          </h3>
          <p className="text-xs font-semibold text-[#700A38]/80">
            Interactive Career Map
          </p>
        </div>
      </motion.div>
    </div>
  );
}
