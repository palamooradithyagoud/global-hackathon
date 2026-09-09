"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { ArrowRight, Loader2, Sparkles, ShieldCheck, AlertCircle, ArrowUpRight, Lock, Mail } from "lucide-react";
import AscendLogo from "@/components/common/AscendLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!email || !password) {
      setErrorMessage("Please enter both your email address and password.");
      return;
    }

    if (!email.includes("@") || !email.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    setIsLoading(true);
    try {
      const session = await api.auth.login(email, password);
      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));
      router.push("/scholarships");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const [activeDemoStage, setActiveDemoStage] = useState<"class_10" | "intermediate" | "b_tech">("class_10");

  const handleDemoLogin = async (stage: "class_10" | "intermediate" | "b_tech") => {
    setErrorMessage(null);
    setIsDemoLoading(true);
    setActiveDemoStage(stage);
    try {
      const session = await api.auth.demoLogin(stage);
      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));
      if (session.student_id) {
        router.push(`/dashboard?student_id=${session.student_id}`);
      } else {
        router.push("/scholarships");
      }
    } catch (err: any) {
      const fallbackEmail = stage === "class_10"
        ? "demo.class10@skillcatalyst.dev"
        : stage === "intermediate"
        ? "demo.intermediate@skillcatalyst.dev"
        : "demo.student@skillcatalyst.dev";
      const fallbackName = stage === "class_10"
        ? "Rohan Verma"
        : stage === "intermediate"
        ? "Priya Nair"
        : "Arjun Sharma";
      const fallbackId = stage === "class_10"
        ? "demo-class10-student"
        : stage === "intermediate"
        ? "demo-intermediate-student"
        : "demo-btech-student";
      const fallbackSession = {
        token: `demo-fallback-token-${stage}`,
        student_id: fallbackId,
        email: fallbackEmail,
        name: fallbackName,
        has_profile: true,
        education_stage: stage,
      };
      localStorage.setItem("skillcatalyst_session", JSON.stringify(fallbackSession));
      router.push(`/dashboard?student_id=${fallbackId}`);
    } finally {
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#14141C] border border-[#282838] rounded-3xl p-8 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient top-right glow */}
        <div className="absolute -top-10 -right-10 w-36 h-36 rounded-full bg-violet-600/15 blur-2xl pointer-events-none" />

        {/* ASCEND Logo & Greeting matching reference */}
        <div className="flex items-center gap-3.5 mb-6">
          <AscendLogo size="md" variant="icon" />
          <div>
            <span className="text-xs text-[#8E8E9C] block">Welcome back</span>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>Sign In to</span>
              <span className="text-amber-400">ASCEND</span>
            </h1>
          </div>
        </div>

        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-300 flex items-start gap-2"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
            <span>{errorMessage}</span>
          </motion.div>
        )}

        {/* Standard Login Form */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email address
            </label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. rohan.verma@example.edu"
                className="w-full px-3.5 py-2.5 text-sm dark-input placeholder-[#5E5E6E] focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-medium text-[#A1A1AA]">
                Password
              </label>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3.5 py-2.5 text-sm dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading || isDemoLoading}
            className="w-full py-3 px-4 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-[#262634]" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#14141C] px-3 text-[#7E7E8E]">Instant Judge Access by Class</span>
          </div>
        </div>

        {/* 3 Stage Demo Profiles */}
        <div className="space-y-2.5">
          {/* Class 10 */}
          <button
            type="button"
            onClick={() => handleDemoLogin("class_10")}
            disabled={isLoading || isDemoLoading}
            className="w-full p-3 rounded-2xl bg-[#181824] hover:bg-[#1E1E2C] border border-[#2B2B3C] hover:border-amber-500/50 text-white text-sm flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-xs">
                10th
              </div>
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-amber-300 transition-colors">
                  Class 10 Student Profile
                </span>
                <span className="block text-[10px] text-[#8E8E9C]">
                  Rohan Verma · 10th CBSE (91.4%) · 5 Class 10 Scholarships
                </span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#262638] group-hover:bg-amber-400 group-hover:text-black flex items-center justify-center text-xs transition-colors">
              {isDemoLoading && activeDemoStage === "class_10" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {/* Intermediate (11th & 12th) */}
          <button
            type="button"
            onClick={() => handleDemoLogin("intermediate")}
            disabled={isLoading || isDemoLoading}
            className="w-full p-3 rounded-2xl bg-[#181824] hover:bg-[#1E1E2C] border border-[#2B2B3C] hover:border-emerald-500/50 text-white text-sm flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 font-bold text-xs">
                +2
              </div>
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-emerald-300 transition-colors">
                  Intermediate (11th/12th) Profile
                </span>
                <span className="block text-[10px] text-[#8E8E9C]">
                  Priya Nair · MPC Stream (89.2%) · 5 Inter Scholarships
                </span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#262638] group-hover:bg-emerald-400 group-hover:text-black flex items-center justify-center text-xs transition-colors">
              {isDemoLoading && activeDemoStage === "intermediate" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>

          {/* B.Tech */}
          <button
            type="button"
            onClick={() => handleDemoLogin("b_tech")}
            disabled={isLoading || isDemoLoading}
            className="w-full p-3 rounded-2xl bg-[#181824] hover:bg-[#1E1E2C] border border-[#2B2B3C] hover:border-violet-500/50 text-white text-sm flex items-center justify-between transition-all cursor-pointer group"
          >
            <div className="flex items-center gap-2.5 text-left">
              <div className="w-8 h-8 rounded-full bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400 font-bold text-xs">
                B.T
              </div>
              <div>
                <span className="block text-xs font-bold text-white group-hover:text-violet-300 transition-colors">
                  B.Tech Engineering Profile
                </span>
                <span className="block text-[10px] text-[#8E8E9C]">
                  Arjun Sharma · CSE 3rd Year (8.75 CGPA) · 6 B.Tech Scholarships
                </span>
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-[#262638] group-hover:bg-violet-400 group-hover:text-black flex items-center justify-center text-xs transition-colors">
              {isDemoLoading && activeDemoStage === "b_tech" ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ArrowUpRight className="w-3.5 h-3.5" />
              )}
            </div>
          </button>
        </div>

        <p className="text-[11px] text-[#717180] text-center mt-4 leading-relaxed">
          Selecting any stage logs in as that student with strict scholarship isolation.
        </p>
      </motion.div>
    </div>
  );
}
