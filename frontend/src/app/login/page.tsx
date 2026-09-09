"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { ArrowRight, Loader2, Sparkles, ShieldCheck, AlertCircle, ArrowUpRight, Lock, Mail } from "lucide-react";

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

  const handleDemoLogin = async () => {
    setErrorMessage(null);
    setIsDemoLoading(true);
    try {
      const session = await api.auth.demoLogin("b_tech");
      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));
      router.push("/scholarships");
    } catch (err: any) {
      const fallbackSession = {
        token: "demo-fallback-token",
        student_id: null,
        email: "demo.student@skillcatalyst.dev",
        name: "Demo Student",
        has_profile: false,
        education_stage: "b_tech",
      };
      localStorage.setItem("skillcatalyst_session", JSON.stringify(fallbackSession));
      router.push("/scholarships");
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

        {/* User Avatar & Greeting matching reference "Welcome back" */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 via-pink-500 to-violet-600 p-[2px]">
            <div className="w-full h-full rounded-full bg-[#14141C] flex items-center justify-center text-white font-bold text-sm">
              AW
            </div>
          </div>
          <div>
            <span className="text-xs text-[#8E8E9C] block">Welcome back</span>
            <h1 className="text-xl font-bold text-white tracking-tight">
              Sign In to SkillCatalyst
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
                placeholder="e.g. arjun.sharma@example.edu"
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
            <span className="bg-[#14141C] px-3 text-[#7E7E8E]">Instant Judge Access</span>
          </div>
        </div>

        {/* Demo Login Button with Gradient Border & Arrow */}
        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={isLoading || isDemoLoading}
          className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-violet-600/10 via-pink-600/10 to-amber-600/10 border border-violet-500/30 hover:border-violet-500/60 text-white text-sm font-semibold flex items-center justify-between transition-all cursor-pointer group"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-violet-600 to-amber-400 flex items-center justify-center text-white">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-left">
              <span className="block text-xs font-bold text-white">Continue as Demo Student</span>
              <span className="block text-[10px] text-[#8E8E9C]">Arjun Sharma · B.Tech Engineering</span>
            </div>
          </div>
          <div className="w-7 h-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs group-hover:scale-105 transition-transform">
            <ArrowUpRight className="w-3.5 h-3.5" />
          </div>
        </button>

        <p className="text-[11px] text-[#717180] text-center mt-4 leading-relaxed">
          Instantly creates a demo session and guides you through the scholarship preview and adaptive onboarding journey.
        </p>
      </motion.div>
    </div>
  );
}
