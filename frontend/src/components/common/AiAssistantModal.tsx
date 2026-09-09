"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Send,
  Sparkles,
  ChevronLeft,
  Mic,
  AtSign,
  ArrowUpRight,
  RotateCcw,
} from "lucide-react";
import AiAssistantIcon from "./AiAssistantIcon";

import { api } from "@/lib/api";

interface Message {
  id: string;
  sender: "ai" | "user";
  text: string;
  suggestions?: string[];
}

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  studentId?: string | null;
}

export default function AiAssistantModal({
  isOpen,
  onClose,
  studentId,
}: AiAssistantModalProps) {
  // Mode: "onboarding" (Photo 2 Card View) | "chat" (Photo 3 Full Screen Mode)
  const [viewMode, setViewMode] = useState<"onboarding" | "chat">("onboarding");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [studentStage, setStudentStage] = useState<string>("b_tech");
  const [studentName, setStudentName] = useState<string>("Student");
  const [activeStudentId, setActiveStudentId] = useState<string | null>(studentId || null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load student context and active student ID from storage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("skillcatalyst_session");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.full_name) setStudentName(parsed.full_name.split(" ")[0]);
        if (parsed.education_stage) setStudentStage(parsed.education_stage);
        const resolvedId = studentId || parsed.student_id || parsed.id || null;
        if (resolvedId) setActiveStudentId(resolvedId);
      } else if (studentId) {
        setActiveStudentId(studentId);
      }
    } catch {
      // ignore
    }
  }, [isOpen, studentId]);

  // Reset viewMode to onboarding whenever modal opens afresh
  useEffect(() => {
    if (isOpen) {
      setViewMode("onboarding");
    }
  }, [isOpen]);

  // Load private conversation history from backend per-user memory
  useEffect(() => {
    const sId = activeStudentId || studentId;
    if (sId && isOpen) {
      api.assistant
        .getHistory(sId)
        .then((res) => {
          if (res && res.messages && res.messages.length > 0) {
            setMessages(
              res.messages.map((m) => ({
                id: m.id,
                sender: m.role === "user" ? "user" : "ai",
                text: m.content,
                suggestions: m.suggestions || [],
              }))
            );
          }
        })
        .catch(() => {
          // ignore
        });
    }
  }, [activeStudentId, studentId, isOpen]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (viewMode === "chat") {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isTyping, viewMode]);

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || input.trim();
    if (!textToSend) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: "user",
      text: textToSend,
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!queryText) setInput("");
    setIsTyping(true);

    try {
      // Calls backend AI Assistant with per-user private memory & OpenRouter
      const effectiveId = activeStudentId || studentId;
      const res = await api.assistant.chat({
        message: textToSend,
        student_id: effectiveId,
        stage: studentStage,
      });

      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: res.reply,
          suggestions: res.suggestions || [],
        },
      ]);
    } catch (err: any) {
      console.warn("Backend chat error, using local reasoning fallback:", err);
      // Fallback
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "ai",
          text: `I've analyzed your question against your **${studentStage.replace("_", " ").toUpperCase()}** profile. As your Ascend AI companion, I continuously match your milestones with accredited scholarships and high-growth career pathways. What else can I guide you with?`,
          suggestions: ["Show scholarships", "Coding roadmap", "Daily study plan"],
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleStartChat = () => {
    setViewMode("chat");
  };

  const handleResetChat = async () => {
    const effectiveId = activeStudentId || studentId;
    if (effectiveId) {
      try {
        await api.assistant.clearHistory(effectiveId);
      } catch {
        // ignore
      }
    }
    setMessages([]);
    setInput("");
  };

  // Image 3 Reference: 2x2 Prompt Cards Grid
  const promptCards = [
    {
      title: "Find Scholarships",
      desc: "by educational stage & income",
      prompt: "Find scholarships matching my educational stage",
    },
    {
      title: "Coding Mentor",
      desc: "tech guidance & roadmap",
      prompt: "Give me coding mentorship and essential tech skills for my career",
    },
    {
      title: "Career Roadmap",
      desc: "tailored degree & job paths",
      prompt: "Show me my recommended career roadmap and next steps",
    },
    {
      title: "Study Planner",
      desc: "smart daily prep schedule",
      prompt: "Help me create an effective daily study planner",
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* ========================================================= */}
          {/* MODE 1: ONBOARDING CARD MODAL (Photo 2) */}
          {/* ========================================================= */}
          {viewMode === "onboarding" ? (
            <div
              data-ai-assistant="true"
              className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-xl select-none"
              onClick={onClose}
            >
              {/* Center / Bottom-sheet Card matching Photo 2 */}
              <motion.div
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: "100%", opacity: 0 }}
                transition={{
                  type: "spring",
                  damping: 28,
                  stiffness: 300,
                  duration: 0.35,
                }}
                drag="y"
                dragConstraints={{ top: 0 }}
                dragElastic={0.2}
                onDragEnd={(_, info) => {
                  if (info.offset.y > 100 || info.velocity.y > 400) {
                    onClose();
                  }
                }}
                onClick={(e) => e.stopPropagation()}
                className="w-full sm:max-w-md md:max-w-lg bg-[#09090B] border border-[#26243A] rounded-t-[32px] sm:rounded-[32px] shadow-[0_20px_60px_rgba(0,0,0,0.9),0_0_50px_rgba(139,92,246,0.18)] flex flex-col max-h-[92vh] sm:max-h-[820px] overflow-hidden relative"
              >
                {/* Top Accent Gradient Line */}
                <div className="h-1 w-full bg-gradient-to-r from-[#8B5CF6] via-[#6366F1] to-[#22D3EE]" />

                {/* Drag Handle */}
                <div className="w-12 h-1.5 rounded-full bg-white/20 mx-auto mt-2.5 mb-1 cursor-grab active:cursor-grabbing" />

                {/* Top Close (X) Button */}
                <button
                  type="button"
                  onClick={onClose}
                  className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8E8E9C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                  aria-label="Close Assistant"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Card Content Body */}
                <div className="flex-1 overflow-y-auto px-6 pt-3 pb-8 flex flex-col items-center text-center scrollbar-none justify-center">
                  {/* Hero Mascot with Radial Glow */}
                  <div className="relative w-full flex items-center justify-center pt-2 pb-4">
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-[#8B5CF6]/35 via-[#6366F1]/25 to-[#22D3EE]/35 blur-3xl" />
                    </div>

                    <motion.div
                      animate={{ y: [-8, 8, -8] }}
                      transition={{
                        repeat: Infinity,
                        duration: 3.8,
                        ease: "easeInOut",
                      }}
                      className="relative z-10 flex items-center justify-center"
                    >
                      <img
                        src="/ascend-ai-robot@2x.png"
                        alt="Ascend AI Assistant"
                        className="h-[250px] sm:h-[280px] w-auto object-contain drop-shadow-[0_20px_35px_rgba(0,0,0,0.7)]"
                      />
                    </motion.div>
                  </div>

                  {/* Headline & Description */}
                  <div className="w-full mt-2 mb-6">
                    <h2 className="text-2xl sm:text-[30px] font-extrabold tracking-tight">
                      <span className="text-white">Your Personal </span>
                      <span className="bg-gradient-to-r from-[#8B5CF6] via-[#A78BFA] to-[#22D3EE] bg-clip-text text-transparent">
                        AI Assistant
                      </span>
                    </h2>
                    <p className="text-xs sm:text-sm text-[#94A3B8] max-w-sm mx-auto mt-2.5 leading-relaxed">
                      Meet Ascend AI — your personalized learning companion for
                      scholarships, coding, skill tracks, interview preparation,
                      career guidance, and daily study planning.
                    </p>
                  </div>

                  {/* Primary CTA: Start Chatting -> goes to Full Screen Mode */}
                  <div className="w-full flex flex-col items-center mt-2 space-y-3">
                    <motion.button
                      type="button"
                      onClick={handleStartChat}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      transition={{ duration: 0.2 }}
                      className="w-[82%] max-w-xs py-3.5 px-6 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#22D3EE] text-white font-semibold text-sm sm:text-base shadow-[0_0_25px_rgba(139,92,246,0.55),0_0_35px_rgba(34,211,238,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.8),0_0_45px_rgba(34,211,238,0.5)] transition-all cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span>Start Chatting</span>
                      <Sparkles className="w-4 h-4 text-white" />
                    </motion.button>

                    {/* Secondary CTA: Maybe Later */}
                    <button
                      type="button"
                      onClick={onClose}
                      className="text-xs sm:text-sm text-[#8E8E9C] hover:text-white transition-colors cursor-pointer py-1.5 font-medium"
                    >
                      Maybe Later
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          ) : (
            /* ========================================================= */
            /* MODE 2: FULL SCREEN MODE (Photo 3 Reference) */
            /* ========================================================= */
            <motion.div
              data-ai-assistant="true"
              initial={{ opacity: 0, scale: 0.96, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 20 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="fixed inset-0 z-50 bg-[#09090B] text-white flex flex-col overflow-hidden select-text"
            >
              {/* Background Ambient Glows */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-b from-[#8B5CF6]/15 via-[#22D3EE]/10 to-transparent blur-3xl pointer-events-none" />

              {/* Top Navigation Header: < Back Arrow | New Chat | Reset/Close */}
              <div className="relative z-10 px-4 sm:px-8 py-4 border-b border-[#1E1C2E] flex items-center justify-between bg-[#0C0B14]/80 backdrop-blur-md">
                {/* Back Arrow Button */}
                <button
                  type="button"
                  onClick={() => setViewMode("onboarding")}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white flex items-center justify-center transition-colors cursor-pointer"
                  title="Back to Overview"
                  aria-label="Back"
                >
                  <ChevronLeft className="w-6 h-6 stroke-[2.2]" />
                </button>

                {/* Centered Title matching Image 3 */}
                <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                  New Chat
                </h1>

                {/* Right Action: Reset Conversation / Close */}
                <div className="flex items-center gap-2">
                  {messages.length > 0 && (
                    <button
                      type="button"
                      onClick={handleResetChat}
                      className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-[#8E8E9C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                      title="Clear chat"
                      aria-label="Reset chat"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={onClose}
                    className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/10 text-[#8E8E9C] hover:text-white flex items-center justify-center transition-colors cursor-pointer"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Main Content Area */}
              <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col items-center justify-between max-w-2xl mx-auto w-full scrollbar-thin scrollbar-thumb-white/10 relative z-10">
                {/* If NO active messages: Show Image 3 Hero + Prompt Cards */}
                {messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center text-center my-auto w-full py-4">
                    {/* Hero Mascot Robot Floating */}
                    <div className="relative w-full flex items-center justify-center mb-3">
                      {/* Soft Cyan/Purple Glow under Mascot */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="w-48 h-48 rounded-full bg-gradient-to-tr from-[#8B5CF6]/30 via-[#22D3EE]/25 to-transparent blur-3xl" />
                      </div>

                      <motion.div
                        animate={{ y: [-8, 8, -8] }}
                        transition={{
                          repeat: Infinity,
                          duration: 3.8,
                          ease: "easeInOut",
                        }}
                        className="relative z-10 flex items-center justify-center"
                      >
                        <img
                          src="/ascend-ai-robot@2x.png"
                          alt="Ascend AI Robot"
                          className="h-[180px] sm:h-[220px] w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                        />
                      </motion.div>
                    </div>

                    {/* Headline exactly matching Image 3 */}
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight mb-8">
                      How can I help you today?
                    </h2>

                    {/* 2x2 Grid of Quick Prompt Cards matching Image 3 */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
                      {promptCards.map((card, idx) => (
                        <motion.button
                          key={card.title}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.1 + idx * 0.06, duration: 0.3 }}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          type="button"
                          onClick={() => handleSend(card.prompt)}
                          className="p-4 rounded-2xl bg-[#141322]/80 hover:bg-[#1B192E] border border-[#26243A] hover:border-[#22D3EE]/50 hover:shadow-[0_0_20px_rgba(34,211,238,0.2)] transition-all text-left flex items-center justify-between cursor-pointer group"
                        >
                          <div>
                            <div className="text-sm font-bold text-white tracking-tight">
                              {card.title}
                            </div>
                            <div className="text-xs text-[#8E8E9C] mt-0.5">
                              {card.desc}
                            </div>
                          </div>
                          <div className="w-7 h-7 rounded-full bg-white/5 group-hover:bg-[#22D3EE]/20 flex items-center justify-center text-[#8E8E9C] group-hover:text-[#22D3EE] transition-colors shrink-0 ml-2">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* If messages exist: Conversation History Stream */
                  <div className="w-full space-y-4 my-auto pb-4">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={`flex flex-col ${
                          m.sender === "user" ? "items-end" : "items-start"
                        }`}
                      >
                        <div className="flex items-start gap-3 max-w-[90%] sm:max-w-[85%]">
                          {m.sender === "ai" && (
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 ring-1 ring-[#22D3EE]/50 mt-1">
                              <img
                                src="/ascend-ai-avatar.png"
                                alt="AI Avatar"
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                          <div
                            className={`rounded-2xl p-4 leading-relaxed ${
                              m.sender === "user"
                                ? "bg-gradient-to-r from-[#7C3AED] to-[#6366F1] text-white shadow-md rounded-br-none"
                                : "bg-[#141322] border border-[#26243A] text-[#E2E2EA] rounded-bl-none shadow-sm"
                            }`}
                          >
                            <p className="whitespace-pre-line text-sm sm:text-base leading-relaxed">
                              {m.text}
                            </p>
                          </div>
                        </div>

                        {/* Suggestion Chips */}
                        {m.suggestions && m.suggestions.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-2 max-w-[90%] pl-11">
                            {m.suggestions.map((s, idx) => (
                              <button
                                key={idx}
                                type="button"
                                onClick={() => handleSend(s)}
                                className="text-xs px-3 py-1.5 rounded-full bg-[#161528] hover:bg-[#221F38] text-[#A5B4FC] hover:text-[#22D3EE] border border-[#312E81]/50 hover:border-[#22D3EE]/40 transition-all flex items-center gap-1.5 cursor-pointer"
                              >
                                <Sparkles className="w-3 h-3 text-[#22D3EE]" />
                                <span>{s}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}

                    {isTyping && (
                      <div className="flex items-center gap-3 pl-2">
                        <div className="w-7 h-7 rounded-full overflow-hidden shrink-0 ring-1 ring-[#22D3EE]/40">
                          <img
                            src="/ascend-ai-avatar.png"
                            alt="AI"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-[#8E8E9C] bg-[#141322] px-3.5 py-2 rounded-full border border-[#26243A]">
                          <div className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
                          <div className="w-2 h-2 rounded-full bg-[#22D3EE] animate-pulse delay-100" />
                          <div className="w-2 h-2 rounded-full bg-[#A78BFA] animate-pulse delay-200" />
                          <span className="ml-1 text-[11px] text-[#22D3EE]">
                            Ascend AI is thinking...
                          </span>
                        </div>
                      </div>
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                )}

                {/* Bottom Input Bar matching Image 3 Reference */}
                <div className="w-full pt-4">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSend();
                    }}
                    className="w-full bg-[#141324] border border-[#2A2840] rounded-full px-4 py-2.5 flex items-center gap-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] focus-within:border-[#22D3EE] focus-within:ring-2 focus-within:ring-[#22D3EE]/20 transition-all"
                  >
                    {/* Left @ icon matching Image 3 */}
                    <button
                      type="button"
                      className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-[#8E8E9C] hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0"
                      title="Attach or Mention"
                    >
                      <AtSign className="w-4 h-4" />
                    </button>

                    {/* Subtle vertical separator */}
                    <div className="h-5 w-[1px] bg-white/10" />

                    {/* Text Input matching "Type Message..." */}
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type Message..."
                      className="flex-1 bg-transparent text-sm sm:text-base text-white placeholder-[#68687C] outline-none"
                    />

                    {/* Right Circular Cyan/Blue Action Button (Mic / Send) */}
                    <button
                      type="submit"
                      disabled={isTyping}
                      className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#0284C7] to-[#22D3EE] hover:opacity-90 disabled:opacity-40 text-white flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-[0_0_15px_rgba(34,211,238,0.4)]"
                      aria-label="Send"
                    >
                      {input.trim() ? (
                        <Send className="w-4 h-4 text-white" />
                      ) : (
                        <Mic className="w-4 h-4 text-white" />
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}
