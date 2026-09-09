"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "@/lib/api";
import { ArrowRight, Loader2, AlertCircle, Lock, Mail } from "lucide-react";
import AscendLogo from "@/components/common/AscendLogo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleStandardLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setErrorMessage("Please enter both your email address and password.");
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

    setIsLoading(true);
    try {
      const session = await api.auth.login(cleanEmail, password);
      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));
      // Redirect directly into the profile builder where student can upload resume or do manual entry
      router.push("/onboarding");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to log in. Please try again.");
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
              <span>Sign In to</span>
              <span className="text-amber-400">ASCEND</span>
            </h1>
          </div>
        </div>

        <p className="text-xs text-[#8E8E9C] mb-6 leading-relaxed">
          Enter your email and password to access your student profile, upload your resume, or build your intelligence profile.
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

        {/* Email and Password Form ONLY */}
        <form onSubmit={handleStandardLogin} className="space-y-4">
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
                placeholder="e.g. palamooradithyagoud@gmail.com"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm dark-input placeholder-[#5E5E6E] focus:outline-none"
                autoComplete="email"
                required
                suppressHydrationWarning
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
                autoComplete="current-password"
                required
                suppressHydrationWarning
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-white text-black text-sm font-semibold hover:bg-neutral-200 disabled:opacity-50 flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg"
            suppressHydrationWarning
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-black" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In & Continue to Profile</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-[#242434] text-center">
          <p className="text-[11px] text-[#6E6E82]">
            Need quick demo access? You can use{" "}
            <span className="text-amber-400 font-mono">palamooradithyagoud@gmail.com</span> or{" "}
            <span className="text-violet-400 font-mono">demo.student@skillcatalyst.dev</span> with any password.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
