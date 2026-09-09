"use client";

import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import { ExtractedResumeData } from "@/types";
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Sparkles,
  ArrowRight,
  Info
} from "lucide-react";

interface ResumeUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyExtractedData: (data: ExtractedResumeData) => void;
}

export default function ResumeUploadModal({
  isOpen,
  onClose,
  onApplyExtractedData,
}: ResumeUploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedResumeData | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      const ext = selected.name.toLowerCase();
      if (!ext.endsWith(".pdf") && !ext.endsWith(".txt")) {
        setErrorMessage("Please select a PDF or TXT resume document.");
        return;
      }
      setErrorMessage(null);
      setFile(selected);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      const ext = dropped.name.toLowerCase();
      if (!ext.endsWith(".pdf") && !ext.endsWith(".txt")) {
        setErrorMessage("Please drop a PDF or TXT resume document.");
        return;
      }
      setErrorMessage(null);
      setFile(dropped);
    }
  };

  const handleUploadAndExtract = async () => {
    if (!file) return;
    setIsUploading(true);
    setErrorMessage(null);

    try {
      const result = await api.resume.extract(file);
      setExtractedData(result);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to process resume. Please enter details manually.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmAndProceed = () => {
    if (extractedData) {
      onApplyExtractedData(extractedData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-[#14141C] border border-[#2A2A3C] rounded-3xl max-w-xl w-full p-6 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#222230]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">
                Resume Intelligence Extractor
              </h3>
              <p className="text-xs text-[#8E8E9C]">
                Extract structured academics, proficiencies, and projects
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8E8E9C] hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 overflow-y-auto flex-1 space-y-5">
          {!extractedData ? (
            <>
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#2E2E40] hover:border-violet-500 bg-[#161622] rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-white mb-3 shadow-xs">
                  <UploadCloud className="w-6 h-6 text-violet-300" />
                </div>
                <p className="text-sm font-semibold text-white">
                  {file ? file.name : "Click to browse or drop your resume here"}
                </p>
                <p className="text-xs text-[#8E8E9C] mt-1">
                  Supports PDF or TXT formats (up to 10MB)
                </p>
              </div>

              {errorMessage && (
                <div className="p-3 bg-red-950/40 border border-red-800/40 rounded-xl text-xs text-red-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="p-4 bg-[#181824] border border-[#282838] rounded-2xl text-xs text-[#8E8E9C] flex items-start gap-2.5">
                <Info className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                <span>
                  Never worry about extraction errors: you will review, verify, and freely edit every single pre-filled field before final confirmation.
                </span>
              </div>
            </>
          ) : (
            /* Review Extracted Summary */
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-950/30 border border-emerald-500/30 rounded-2xl text-xs text-emerald-300 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="font-semibold">Information Extracted Successfully</span>
                </div>
                <span className="text-[11px] bg-emerald-500/20 px-2.5 py-0.5 rounded-full font-mono">
                  Confidence: {extractedData.extraction_confidence}
                </span>
              </div>

              {/* Extracted preview card */}
              <div className="bg-[#181824] border border-[#282838] rounded-2xl p-5 space-y-3.5 text-xs">
                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#282838]">
                  <div>
                    <span className="text-[#8E8E9C] block">Candidate Name</span>
                    <span className="font-bold text-white text-sm">
                      {extractedData.name || "Identified Student"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E9C] block">Degree & Stage</span>
                    <span className="font-bold text-white text-sm">
                      {extractedData.degree} ({extractedData.education_stage.toUpperCase()})
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 pb-3 border-b border-[#282838]">
                  <div>
                    <span className="text-[#8E8E9C] block">Branch / Stream</span>
                    <span className="font-semibold text-white">
                      {extractedData.branch || "General"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#8E8E9C] block">Detected CGPA / Score</span>
                    <span className="font-semibold text-emerald-400 font-mono">
                      {extractedData.cgpa ? `${extractedData.cgpa} / 10.0` : "Not detected (Editable)"}
                    </span>
                  </div>
                </div>

                {/* Skills found */}
                <div>
                  <span className="text-[#8E8E9C] block mb-2">
                    Detected Technical Skills ({extractedData.skills.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {extractedData.skills.map((s) => (
                      <span
                        key={s.skill_name}
                        className="px-2.5 py-1 rounded-full bg-[#20202E] border border-[#343448] text-white text-[11px]"
                      >
                        {s.skill_name} · <span className="text-violet-300">{s.proficiency}</span>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Projects found */}
                {extractedData.projects.length > 0 && (
                  <div className="pt-2 border-t border-[#282838]">
                    <span className="text-[#8E8E9C] block mb-1.5">
                      Detected Projects ({extractedData.projects.length})
                    </span>
                    <div className="space-y-1">
                      {extractedData.projects.map((p) => (
                        <div key={p.name} className="font-medium text-white">
                          • {p.name}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verification notes */}
                {extractedData.verification_notes.length > 0 && (
                  <div className="pt-2 border-t border-[#282838] text-[11px] text-amber-300 bg-amber-950/20 p-2.5 rounded-xl">
                    <span className="font-semibold block mb-0.5">Verification note:</span>
                    {extractedData.verification_notes.map((note, i) => (
                      <p key={i}>• {note}</p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-[#222230] flex items-center justify-between">
          {!extractedData ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#8E8E9C] hover:text-white"
              >
                Cancel & Fill Manually
              </button>
              <button
                type="button"
                onClick={handleUploadAndExtract}
                disabled={!file || isUploading}
                className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 disabled:opacity-50 flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Extracting Structured Fields...</span>
                  </>
                ) : (
                  <>
                    <span>Extract Information</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setExtractedData(null)}
                className="px-4 py-2 text-xs font-medium text-[#8E8E9C] hover:text-white"
              >
                Re-upload File
              </button>
              <button
                type="button"
                onClick={handleConfirmAndProceed}
                className="px-6 py-2.5 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 flex items-center gap-2 transition-colors cursor-pointer shadow-md"
              >
                <span>Looks Correct · Continue to Review & Edit</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
