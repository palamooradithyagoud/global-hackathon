"use client";

import React, { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { ArrowRight, Loader2, AlertCircle, Lock, Mail, User, GraduationCap } from "lucide-react";
import AscendLogo from "@/components/common/AscendLogo";

function AuthForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "signup" ? "signup" : "login";

  const [mode, setMode] = useState<"login" | "signup">(initialMode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [stage, setStage] = useState("b_tech");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please fill in all required credentials.");
      return;
    }

    if (!cleanEmail.includes("@") || !cleanEmail.includes(".")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    if (password.length < 4) {
      setErrorMessage("Password must be at least 4 characters.");
      return;
    }

    if (mode === "signup" && !name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }

    setIsLoading(true);
    try {
      if (mode === "signup") {
        const session = await api.auth.register({
          name: name.trim(),
          email: cleanEmail,
          password: password,
          education_stage: stage,
        });
        localStorage.setItem("skillcatalyst_session", JSON.stringify(session));
        window.dispatchEvent(new Event("storage"));
        router.push(`/onboarding?stage=${stage}`);
      } else {
        const session = await api.auth.login(cleanEmail, password);
        localStorage.setItem("skillcatalyst_session", JSON.stringify(session));
        window.dispatchEvent(new Event("storage"));
        router.push("/dashboard");
      }
    } catch (err: any) {
      setErrorMessage(err.message || `Failed to ${mode === "signup" ? "sign up" : "sign in"}. Please try again.`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-[#14141C] border border-[#282838] rounded-3xl p-8 sm:p-9 shadow-2xl relative overflow-hidden"
      >
        {/* Ambient background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 rounded-full bg-violet-600/15 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />

        {/* Brand Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <AscendLogo size="md" variant="icon" />
          <div>
            <span className="text-xs text-[#8E8E9C] block">Welcome</span>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-1.5">
              <span>{mode === "signup" ? "Create Account on" : "Sign In to"}</span>
              <span className="text-amber-400">ASCEND</span>
            </h1>
          </div>
        </div>

        {/* Auth Mode Toggle Tabs */}
        <div className="flex rounded-xl bg-[#0D0D12] p-1 border border-[#222230] mb-6">
          <button
            type="button"
            onClick={() => {
              setMode("login");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "login"
                ? "bg-white text-black shadow-sm"
                : "text-[#8E8E9C] hover:text-white"
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("signup");
              setErrorMessage(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
              mode === "signup"
                ? "bg-white text-black shadow-sm"
                : "text-[#8E8E9C] hover:text-white"
            }`}
          >
            Sign Up
          </button>
        </div>

        <p className="text-xs text-[#8E8E9C] mb-6 leading-relaxed">
          {mode === "signup"
            ? "Create your student account to unlock tailored scholarships, career fit intelligence, and stage-specific pathways."
            : "Enter your email and password to access your student profile, upload your resume, or build your intelligence profile."}
        </p>

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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-[#6A6A7E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Varma"
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm dark-input placeholder-[#5E5E6E] focus:outline-none"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6A6A7E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="e.g. student@example.edu"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm dark-input placeholder-[#5E5E6E] focus:outline-none"
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6A6A7E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm dark-input placeholder-[#5E5E6E] focus:outline-none"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                required
              />
            </div>
          </div>

          {mode === "signup" && (
            <div>
              <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
                Current Education Stage
              </label>
              <div className="relative">
                <GraduationCap className="w-4 h-4 text-[#6A6A7E] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-2.5 text-sm dark-input text-white focus:outline-none cursor-pointer"
                >
                  <option value="b_tech" className="bg-[#14141C] text-white">B.Tech Engineering (1st–4th Year)</option>
                  <option value="intermediate" className="bg-[#14141C] text-white">Intermediate (Class 11 & 12)</option>
                  <option value="class_10" className="bg-[#14141C] text-white">Class 10 (Secondary School)</option>
                </select>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>{mode === "signup" ? "Creating account..." : "Signing in..."}</span>
              </>
            ) : (
              <>
                <span>{mode === "signup" ? "Create Account & Continue" : "Sign In & Continue"}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#242434] text-center space-y-2">
          <p className="text-xs text-[#8E8E9C]">
            {mode === "login" ? (
              <>
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("signup");
                    setErrorMessage(null);
                  }}
                  className="text-amber-400 font-medium hover:underline cursor-pointer"
                >
                  Sign Up
                </button>
              </>
            ) : (
              <>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode("login");
                    setErrorMessage(null);
                  }}
                  className="text-amber-400 font-medium hover:underline cursor-pointer"
                >
                  Sign In
                </button>
              </>
            )}
          </p>

          <p className="text-[11px] text-[#6E6E82]">
            Demo access:{" "}
            <span className="text-amber-400 font-mono">palamooradithyagoud@gmail.com</span> or{" "}
            <span className="text-violet-400 font-mono">demo.student@skillcatalyst.dev</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex-1 flex items-center justify-center text-xs text-[#8E8E9C]">Loading authentication...</div>}>
      <AuthForm />
    </Suspense>
  );
}
