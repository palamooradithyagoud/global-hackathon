"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, ArrowUpRight, Compass, Sparkles, Award } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex-1 flex flex-col justify-between py-10 px-4 sm:px-6 max-w-6xl mx-auto w-full">
      {/* Hero Section styled after the reference phone display */}
      <section className="pt-6 pb-14 sm:pt-12 sm:pb-20 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
        {/* Left Headline & Intro */}
        <div className="lg:col-span-7 flex flex-col items-start">
          {/* Pill Badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-semibold bg-[#181824] border border-[#2B2B3C] text-violet-300 mb-6 shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-pink-500 animate-pulse" />
            <span>Phase 1.1 · Student Onboarding & Intelligence Profile</span>
          </motion.div>

          {/* Headline inspired by "Learn more & improve your skills." */}
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight text-white leading-[1.08] mb-6"
          >
            Your career journey, <br />
            <span className="bg-gradient-to-r from-violet-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
              intelligently
            </span>{" "}
            navigated.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-base sm:text-lg text-[#8E8E9C] leading-relaxed mb-10 max-w-xl"
          >
            SkillCatalyst creates a structured intelligence profile of who you are—adapting whether you are in
            <strong className="text-white font-medium"> Class 10</strong>,
            <strong className="text-white font-medium"> Intermediate</strong>, or
            <strong className="text-white font-medium"> B.Tech</strong>—and directly matches you to vetted institutional scholarships and career opportunities.
          </motion.p>

          {/* Action Row with Reference Circular Progress Button */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            className="flex items-center gap-5"
          >
            {/* Reference Circular Progress CTA */}
            <Link
              href="/login"
              className="group flex items-center gap-4 cursor-pointer"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                {/* Animated circular progress ring */}
                <svg className="w-16 h-16 transform -rotate-90">
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="#262634"
                    strokeWidth="3"
                    fill="transparent"
                  />
                  <circle
                    cx="32"
                    cy="32"
                    r="28"
                    stroke="url(#ctaGradient)"
                    strokeWidth="3.5"
                    strokeDasharray="175"
                    strokeDashoffset="45"
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 group-hover:stroke-dashoffset-0"
                  />
                  <defs>
                    <linearGradient id="ctaGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A78BFA" />
                      <stop offset="50%" stopColor="#F472B6" />
                      <stop offset="100%" stopColor="#FBBF24" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute w-11 h-11 rounded-full bg-white text-black flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-bold text-white group-hover:text-violet-300 transition-colors">
                  Get Started
                </span>
                <span className="text-xs text-[#8E8E9C]">
                  Launch student journey →
                </span>
              </div>
            </Link>

            <Link
              href="/login"
              className="px-5 py-3 rounded-full bg-[#181824] border border-[#2B2B3C] text-sm font-medium text-white hover:bg-[#202030] transition-colors"
            >
              Login
            </Link>
          </motion.div>
        </div>

        {/* Right 3D Fluid Ribbon Graphic Centerpiece */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="lg:col-span-5 flex items-center justify-center relative"
        >
          <div className="relative w-72 h-80 sm:w-88 sm:h-96 rounded-3xl bg-gradient-to-b from-[#181824] to-[#0E0E14] border border-[#262634] p-6 shadow-2xl flex flex-col justify-between overflow-hidden">
            {/* Ambient inner glow */}
            <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-violet-600/20 blur-3xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-48 h-48 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

            {/* Fluid organic loop art */}
            <div className="relative z-10 flex-1 flex items-center justify-center">
              <svg viewBox="0 0 200 220" className="w-48 h-56 drop-shadow-2xl">
                <defs>
                  <linearGradient id="fluidLoop" x1="10%" y1="0%" x2="90%" y2="100%">
                    <stop offset="0%" stopColor="#818CF8" />
                    <stop offset="35%" stopColor="#C084FC" />
                    <stop offset="65%" stopColor="#FB7185" />
                    <stop offset="100%" stopColor="#FBBF24" />
                  </linearGradient>
                  <filter id="shadowGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="10" stdDeviation="12" floodColor="#8B5CF6" floodOpacity="0.4" />
                  </filter>
                </defs>
                {/* 3D Helix / Loop Path matching the reference screenshot */}
                <path
                  d="M 100 20 C 145 20 170 55 170 85 C 170 125 120 135 90 145 C 60 155 35 175 40 200 C 45 220 85 220 120 200 C 150 180 165 140 160 100"
                  fill="none"
                  stroke="url(#fluidLoop)"
                  strokeWidth="32"
                  strokeLinecap="round"
                  filter="url(#shadowGlow)"
                />
              </svg>
            </div>

            {/* Floating Info Pill inside preview */}
            <div className="relative z-10 bg-[#12121A]/90 backdrop-blur-md border border-[#2B2B3C] rounded-xl p-3 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider block">
                  Intelligence Metric
                </span>
                <span className="text-xs font-bold text-white">Stage-Aware Opportunity Matching</span>
              </div>
              <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs">
                ↗
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 3 Value Pillars styled as glowing reference cards */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-10 border-t border-[#20202C]"
      >
        {/* Card 1: Lavender */}
        <div className="card-pastel-lavender rounded-2xl p-6 relative flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Stage Adaptive
              </span>
              <div className="btn-arrow-circle">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Adaptive Education Stages</h3>
            <p className="text-xs text-[#9E9EAE] leading-relaxed">
              Never answer irrelevant fields. Class 10 explores future tracks, Intermediate focuses on junior college streams, and B.Tech captures engineering proficiencies and projects.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-violet-500/20 text-[11px] text-violet-300 font-medium">
            Class 10 · Intermediate · B.Tech
          </div>
        </div>

        {/* Card 2: Amber */}
        <div className="card-pastel-amber rounded-2xl p-6 relative flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                AI Extraction
              </span>
              <div className="btn-arrow-circle">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Resume Extraction with Review</h3>
            <p className="text-xs text-[#9E9EAE] leading-relaxed">
              Upload your resume and our backend parses degree, CGPA, technical skills, and projects. You review, verify, and edit before saving to PostgreSQL.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-amber-500/20 text-[11px] text-amber-300 font-medium">
            Zero Unverified Trust · User Review Required
          </div>
        </div>

        {/* Card 3: Mint */}
        <div className="card-pastel-mint rounded-2xl p-6 relative flex flex-col justify-between group transition-all">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Opportunity Engine
              </span>
              <div className="btn-arrow-circle">
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Motivated Opportunity Matching</h3>
            <p className="text-xs text-[#9E9EAE] leading-relaxed">
              Preview real opportunities first. Completing your profile unlocks dynamic match scores, eligibility tags, and direct actionable reasons.
            </p>
          </div>
          <div className="mt-4 pt-3 border-t border-emerald-500/20 text-[11px] text-emerald-300 font-medium">
            Dynamic Match % · Criteria Verification
          </div>
        </div>
      </motion.section>

      {/* Footer minimal info */}
      <footer className="pt-12 pb-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#5E5E6E] border-t border-[#20202C] mt-12">
        <p>© 2026 SkillCatalyst Intelligence Platform. Phase 1.1 Production Demo.</p>
        <p className="font-mono text-[11px]">Stack: Next.js + FastAPI + Supabase PostgreSQL</p>
      </footer>
    </div>
  );
}
