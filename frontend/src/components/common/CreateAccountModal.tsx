"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { AuthSession } from "@/types";
import {
  X,
  User,
  Mail,
  Lock,
  GraduationCap,
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building,
  Award
} from "lucide-react";

interface CreateAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (session: AuthSession) => void;
  initialStage?: "class_10" | "intermediate" | "b_tech";
}

export default function CreateAccountModal({
  isOpen,
  onClose,
  onSuccess,
  initialStage = "b_tech",
}: CreateAccountModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [educationStage, setEducationStage] = useState<"class_10" | "intermediate" | "b_tech">(initialStage);
  
  // Stage specific fields
  const [btechYear, setBtechYear] = useState<string>("1st Year");
  const [interYear, setInterYear] = useState<string>("1st Year (11th)");
  const [branch, setBranch] = useState<string>("Computer Science and Engineering");
  const [stream, setStream] = useState<string>("MPC");
  const [institution, setInstitution] = useState<string>("");
  const [score, setScore] = useState<string>("8.5");
  const [location, setLocation] = useState<string>("Hyderabad, India");

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!name.trim()) {
      setErrorMessage("Please enter your full name.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    const yearSelected = educationStage === "b_tech" ? btechYear : educationStage === "intermediate" ? interYear : "10th";
    const branchOrStream = educationStage === "b_tech" ? branch : stream;
    const numericScore = parseFloat(score) || (educationStage === "b_tech" ? 8.0 : 80.0);

    setIsLoading(true);
    try {
      const session = await api.auth.register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: password || "password123",
        education_stage: educationStage,
        year: yearSelected,
        branch_or_stream: branchOrStream,
        school_or_college: institution.trim() || (educationStage === "b_tech" ? "Engineering College" : "Junior College"),
        score: numericScore,
        location: location.trim() || "Hyderabad, India"
      });

      localStorage.setItem("skillcatalyst_session", JSON.stringify(session));

      if (onSuccess) {
        onSuccess(session);
      }
      onClose();
    } catch (err: any) {
      console.error("Account creation failed:", err);
      setErrorMessage(err.message || "Failed to create account. Please check your details.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="bg-[#13131B] border border-[#2B2B3E] rounded-3xl p-6 sm:p-7 max-w-lg w-full text-left shadow-2xl relative overflow-hidden my-auto max-h-[92vh] flex flex-col"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-16 -right-16 w-44 h-44 rounded-full bg-amber-500/15 blur-3xl pointer-events-none" />

          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-[#222234] shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-400 to-pink-500 p-[2px]">
                <div className="w-full h-full rounded-[14px] bg-[#161622] flex items-center justify-center text-white">
                  <User className="w-5 h-5 text-amber-400" />
                </div>
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Create Student Account
                </h2>
                <p className="text-xs text-[#8E8E9C]">
                  Personalize scholarships and track career fit
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-[#8E8E9C] hover:text-white rounded-full bg-[#1C1C28] hover:bg-[#262638] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {errorMessage && (
            <div className="mt-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-xs text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto pr-1 mt-3 flex-1 custom-scrollbar">
            {/* Full Name & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">
                  Full Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Adithya Goud"
                    className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#1A1A26] border border-[#2B2B3E] text-white placeholder-[#6E6E85] focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-white/90 mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="adithya@example.com"
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#1A1A26] border border-[#2B2B3E] text-white placeholder-[#6E6E85] focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Educational Stage Selection */}
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1.5">
                Educational Stage *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setEducationStage("b_tech")}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    educationStage === "b_tech"
                      ? "bg-amber-500/20 border-amber-500 text-white font-bold ring-1 ring-amber-500/50"
                      : "bg-[#181824] border-[#2A2A3C] text-[#8E8E9C] hover:text-white"
                  }`}
                >
                  <span className="block text-xs">B.Tech</span>
                  <span className="block text-[10px] text-amber-400">Engineering</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEducationStage("intermediate")}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    educationStage === "intermediate"
                      ? "bg-purple-500/20 border-purple-500 text-white font-bold ring-1 ring-purple-500/50"
                      : "bg-[#181824] border-[#2A2A3C] text-[#8E8E9C] hover:text-white"
                  }`}
                >
                  <span className="block text-xs">Intermediate</span>
                  <span className="block text-[10px] text-purple-400">11th & 12th</span>
                </button>

                <button
                  type="button"
                  onClick={() => setEducationStage("class_10")}
                  className={`py-2 px-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    educationStage === "class_10"
                      ? "bg-emerald-500/20 border-emerald-500 text-white font-bold ring-1 ring-emerald-500/50"
                      : "bg-[#181824] border-[#2A2A3C] text-[#8E8E9C] hover:text-white"
                  }`}
                >
                  <span className="block text-xs">Class 10th</span>
                  <span className="block text-[10px] text-emerald-400">Secondary</span>
                </button>
              </div>
            </div>

            {/* B.TECH SPECIFIC: YEAR OF STUDY (Prominent as requested) */}
            {educationStage === "b_tech" && (
              <div className="p-3.5 rounded-2xl bg-[#181826] border border-amber-500/30 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
                    <GraduationCap className="w-4 h-4 text-amber-400" />
                    <span>Select B.Tech Year of Study *</span>
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                    Matches Year Scholarships
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {["1st Year", "2nd Year", "3rd Year", "4th Year"].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setBtechYear(yr)}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                        btechYear === yr
                          ? "bg-amber-400 text-black border-amber-300 shadow-md font-extrabold"
                          : "bg-[#1E1E2C] text-white/80 border-[#303046] hover:bg-[#252538] hover:text-white"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-[#A0A0B8] mb-1 font-medium">
                      Branch / Stream
                    </label>
                    <select
                      value={branch}
                      onChange={(e) => setBranch(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#14141E] border border-[#2B2B3E] text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="Computer Science and Engineering">Computer Science (CSE)</option>
                      <option value="Information Technology">Information Technology (IT)</option>
                      <option value="Electronics & Communication">Electronics (ECE)</option>
                      <option value="Electrical & Electronics">Electrical (EEE)</option>
                      <option value="Mechanical Engineering">Mechanical Engineering</option>
                      <option value="Civil Engineering">Civil Engineering</option>
                      <option value="Data Science & AI">Data Science &amp; AI</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#A0A0B8] mb-1 font-medium">
                      Cumulative CGPA (0 - 10)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="10"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="e.g. 8.5"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#14141E] border border-[#2B2B3E] text-white focus:outline-none focus:border-amber-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* INTERMEDIATE SPECIFIC: YEAR & STREAM */}
            {educationStage === "intermediate" && (
              <div className="p-3.5 rounded-2xl bg-[#181826] border border-purple-500/30 space-y-3">
                <span className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-purple-400" />
                  <span>Intermediate Class &amp; Stream</span>
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {["1st Year (11th)", "2nd Year (12th)"].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => setInterYear(yr)}
                      className={`py-2 px-2 rounded-xl text-center font-bold text-xs transition-all cursor-pointer border ${
                        interYear === yr
                          ? "bg-purple-500 text-white border-purple-400 shadow-md"
                          : "bg-[#1E1E2C] text-white/80 border-[#303046] hover:bg-[#252538]"
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] text-[#A0A0B8] mb-1 font-medium">
                      Stream
                    </label>
                    <select
                      value={stream}
                      onChange={(e) => setStream(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#14141E] border border-[#2B2B3E] text-white focus:outline-none focus:border-purple-400"
                    >
                      <option value="MPC">MPC (Maths, Physics, Chem)</option>
                      <option value="BiPC">BiPC (Biology, Physics, Chem)</option>
                      <option value="MEC">MEC (Maths, Econ, Commerce)</option>
                      <option value="CEC">CEC (Civics, Econ, Commerce)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-[#A0A0B8] mb-1 font-medium">
                      Percentage (%)
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="100"
                      value={score}
                      onChange={(e) => setScore(e.target.value)}
                      placeholder="e.g. 85.0"
                      className="w-full px-3 py-1.5 text-xs rounded-xl bg-[#14141E] border border-[#2B2B3E] text-white focus:outline-none focus:border-purple-400 font-mono"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Institution / College Name */}
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">
                {educationStage === "b_tech" ? "College / University Name" : "School / Junior College Name"}
              </label>
              <input
                type="text"
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                placeholder={educationStage === "b_tech" ? "e.g. JNTU Hyderabad / Osmania University" : "e.g. Narayana Junior College"}
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#1A1A26] border border-[#2B2B3E] text-white placeholder-[#6E6E85] focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-xs font-semibold text-white/90 mb-1">
                Preferred Location / City
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g. Hyderabad, Telangana"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#1A1A26] border border-[#2B2B3E] text-white placeholder-[#6E6E85] focus:outline-none focus:border-amber-400"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 text-black font-extrabold text-xs hover:from-amber-300 hover:to-amber-400 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-black" />
                    <span>Creating Account &amp; Setting Year...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-black" />
                    <span>Create Account &amp; Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
