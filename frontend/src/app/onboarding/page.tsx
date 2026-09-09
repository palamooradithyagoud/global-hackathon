"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  EducationStage,
  StudentProfileCreatePayload,
  ExtractedResumeData,
  StudentProfile,
} from "@/types";
import { api } from "@/lib/api";

import EntryChoiceStep from "@/components/onboarding/EntryChoiceStep";
import EducationStageStep from "@/components/onboarding/EducationStageStep";
import ResumeUploadModal from "@/components/onboarding/ResumeUploadModal";
import Class10Form from "@/components/onboarding/Class10Form";
import IntermediateForm from "@/components/onboarding/IntermediateForm";
import BTechForm from "@/components/onboarding/BTechForm";
import ProfileReviewStep from "@/components/onboarding/ProfileReviewStep";
import ProfileSuccessStep from "@/components/onboarding/ProfileSuccessStep";
import { UploadCloud, ArrowRight } from "lucide-react";

type OnboardingStep = "choice" | "stage" | "form" | "review" | "success";

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [currentStep, setCurrentStep] = useState<OnboardingStep>("choice");
  const [isResumeModalOpen, setIsResumeModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [createdProfile, setCreatedProfile] = useState<StudentProfile | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<StudentProfileCreatePayload>({
    name: "Arjun Sharma",
    email: "arjun.sharma@example.edu",
    date_of_birth: "2004-05-12",
    location: "Hyderabad, Telangana",
    education_stage: "b_tech",
    target_role: "Software Engineer",
    academic_profile: {
      school_or_college: "Hyderabad Institute of Technology & Management",
      board: "CBSE",
      university: "JNTU Hyderabad",
      branch: "Computer Science and Engineering",
      year: "3rd Year",
      cgpa: 8.42,
      percentage: null,
      stream: "MPC",
      future_direction: "Engineering",
    },
    skills: [
      { skill_name: "Python", proficiency: "Advanced" },
      { skill_name: "React", proficiency: "Intermediate" },
      { skill_name: "SQL", proficiency: "Intermediate" },
      { skill_name: "Git & GitHub", proficiency: "Advanced" },
    ],
    projects: [
      {
        name: "SkillCatalyst Opportunity Navigator",
        description: "Intelligent navigation tool matching student credentials to curated institutional scholarships.",
        technologies: "Python, FastAPI, Next.js",
        github_url: "https://github.com/arjun/skillcatalyst",
      },
    ],
    certifications: [],
    experience: [],
    interests: ["Technology & Computers", "Science & Physics"],
    preferences: {
      preferred_location: "Hyderabad / Bengaluru",
      available_learning_time: "2–4 hours/day",
    },
    financial_context: {
      education_budget: "₹1,50,000 / year",
      certification_budget: "₹15,000",
    },
  });

  useEffect(() => {
    const saved = localStorage.getItem("skillcatalyst_session");
    if (saved) {
      try {
        const session = JSON.parse(saved);
        if (session.email && session.name && session.name !== "Demo Student") {
          setFormData((prev) => ({
            ...prev,
            name: session.name,
            email: session.email,
          }));
        }
      } catch {
        // ignore
      }
    }
  }, []);

  const updateFormData = (updates: Partial<StudentProfileCreatePayload>) => {
    setFormData((prev) => ({
      ...prev,
      ...updates,
      academic_profile: {
        ...prev.academic_profile,
        ...(updates.academic_profile || {}),
      },
      preferences: {
        ...prev.preferences,
        ...(updates.preferences || {}),
      },
      financial_context: {
        ...prev.financial_context,
        ...(updates.financial_context || {}),
      },
    }));
  };

  const handleSelectChoice = (choice: "resume" | "manual") => {
    if (choice === "resume") {
      setIsResumeModalOpen(true);
    } else {
      setCurrentStep("stage");
    }
  };

  const handleApplyExtractedData = (extracted: ExtractedResumeData) => {
    setFormData((prev) => ({
      ...prev,
      name: extracted.name || prev.name,
      email: extracted.email || prev.email,
      location: extracted.location || prev.location,
      education_stage: extracted.education_stage || "b_tech",
      target_role: extracted.target_role || prev.target_role,
      academic_profile: {
        ...prev.academic_profile,
        school_or_college: extracted.college || prev.academic_profile.school_or_college,
        branch: extracted.branch || prev.academic_profile.branch,
        cgpa: extracted.cgpa ?? prev.academic_profile.cgpa,
        percentage: extracted.percentage ?? prev.academic_profile.percentage,
        year: extracted.graduation_year ? `Class of ${extracted.graduation_year}` : prev.academic_profile.year,
      },
      skills: extracted.skills.length > 0 ? extracted.skills : prev.skills,
      projects: extracted.projects.length > 0 ? extracted.projects : prev.projects,
      certifications: extracted.certifications.length > 0 ? extracted.certifications : prev.certifications,
    }));
    setCurrentStep("form");
  };

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = "Full name is required.";
    if (!formData.email.trim() || !formData.email.includes("@")) {
      errors.email = "Valid email address is required.";
    }

    const acad = formData.academic_profile;
    if (formData.education_stage === "b_tech") {
      if (!acad.branch?.trim()) errors.branch = "Branch is required for B.Tech.";
      if (acad.cgpa === null || acad.cgpa === undefined || isNaN(acad.cgpa)) {
        errors.cgpa = "CGPA is required for B.Tech.";
      } else if (acad.cgpa < 0 || acad.cgpa > 10) {
        errors.cgpa = "CGPA must be between 0.00 and 10.00.";
      }
    } else if (formData.education_stage === "intermediate") {
      if (!acad.stream) errors.stream = "Junior College stream (MPC, BiPC, etc.) is required.";
    } else if (formData.education_stage === "class_10") {
      if (!acad.school_or_college?.trim()) errors.school_or_college = "School name is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProceedToReview = () => {
    if (validateForm()) {
      setCurrentStep("review");
    }
  };

  const handleConfirmAndPersist = async () => {
    setIsSubmitting(true);
    setSubmissionError(null);

    try {
      const response = await api.profile.create(formData);
      setCreatedProfile(response);

      const currentSession = localStorage.getItem("skillcatalyst_session");
      const sessionObj = currentSession ? JSON.parse(currentSession) : {};
      sessionObj.student_id = response.id;
      sessionObj.name = response.name;
      sessionObj.has_profile = true;
      sessionObj.education_stage = response.education_stage;
      localStorage.setItem("skillcatalyst_session", JSON.stringify(sessionObj));

      setCurrentStep("success");
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to save profile. Please check your inputs.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col py-8 px-4 sm:px-6 max-w-5xl mx-auto w-full">
      {/* Step Progress Tracker in Dark Theme */}
      {currentStep !== "success" && (
        <div className="mb-8 max-w-3xl mx-auto w-full">
          <div className="flex items-center justify-between text-xs font-medium text-[#7E7E8E] mb-2.5">
            <span className={currentStep === "choice" ? "text-white font-bold" : ""}>
              1. Entry Choice
            </span>
            <span className={currentStep === "stage" ? "text-white font-bold" : ""}>
              2. Stage Selection
            </span>
            <span className={currentStep === "form" ? "text-white font-bold" : ""}>
              3. Dynamic Form
            </span>
            <span className={currentStep === "review" ? "text-white font-bold" : ""}>
              4. Review & Confirm
            </span>
          </div>
          <div className="h-1.5 w-full bg-[#1C1C28] rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-pink-500 to-amber-400 transition-all duration-300 rounded-full"
              style={{
                width:
                  currentStep === "choice"
                    ? "25%"
                    : currentStep === "stage"
                    ? "50%"
                    : currentStep === "form"
                    ? "75%"
                    : "100%",
              }}
            />
          </div>
        </div>
      )}

      {/* Step 1: Entry Choice */}
      {currentStep === "choice" && (
        <EntryChoiceStep onSelectChoice={handleSelectChoice} />
      )}

      {/* Step 2: Education Stage Selection */}
      {currentStep === "stage" && (
        <EducationStageStep
          selectedStage={formData.education_stage}
          onSelectStage={(stage) => updateFormData({ education_stage: stage })}
          onContinue={() => setCurrentStep("form")}
          onBack={() => setCurrentStep("choice")}
        />
      )}

      {/* Step 3: Dynamic Adaptive Form */}
      {currentStep === "form" && (
        <div className="max-w-3xl mx-auto w-full py-6">
          {/* Top Bar with Stage switcher & Resume extract trigger */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-[#14141C] border border-[#262634] rounded-2xl mb-6 shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-xs text-[#8E8E9C]">Active Stage:</span>
              <span className="text-xs font-bold text-white px-3 py-1 rounded-full bg-[#1E1E2C] border border-[#303044]">
                {formData.education_stage === "b_tech"
                  ? "B.Tech Engineering"
                  : formData.education_stage === "intermediate"
                  ? "Intermediate"
                  : "Class 10"}
              </span>
              <button
                type="button"
                onClick={() => setCurrentStep("stage")}
                className="text-xs text-violet-400 hover:text-violet-300 underline ml-1 cursor-pointer"
              >
                Change
              </button>
            </div>

            <button
              type="button"
              onClick={() => setIsResumeModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#1A1A26] border border-[#34344A] text-xs font-semibold text-white hover:bg-[#222234] transition-colors cursor-pointer"
            >
              <UploadCloud className="w-3.5 h-3.5 text-violet-400" />
              <span>Autofill from Resume</span>
            </button>
          </div>

          {/* Form Content by Stage */}
          <div className="bg-[#14141C] border border-[#262634] rounded-3xl p-6 sm:p-8 shadow-2xl">
            {formData.education_stage === "class_10" && (
              <Class10Form
                formData={formData}
                onChange={updateFormData}
                errors={formErrors}
              />
            )}

            {formData.education_stage === "intermediate" && (
              <IntermediateForm
                formData={formData}
                onChange={updateFormData}
                errors={formErrors}
              />
            )}

            {formData.education_stage === "b_tech" && (
              <BTechForm
                formData={formData}
                onChange={updateFormData}
                errors={formErrors}
              />
            )}

            {/* Step 3 Navigation Controls */}
            <div className="flex items-center justify-between pt-8 mt-8 border-t border-[#20202C]">
              <button
                type="button"
                onClick={() => setCurrentStep("stage")}
                className="px-4 py-2 text-xs font-medium text-[#8E8E9C] hover:text-white cursor-pointer"
              >
                ← Back to Stage
              </button>

              <button
                type="button"
                onClick={handleProceedToReview}
                className="px-7 py-3 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 flex items-center gap-2 transition-all cursor-pointer shadow-lg"
              >
                <span>Continue to Profile Review</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Final Profile Review */}
      {currentStep === "review" && (
        <ProfileReviewStep
          formData={formData}
          onEdit={() => setCurrentStep("form")}
          onConfirm={handleConfirmAndPersist}
          isSubmitting={isSubmitting}
          errorMessage={submissionError}
        />
      )}

      {/* Step 5: Profile Success */}
      {currentStep === "success" && createdProfile && (
        <ProfileSuccessStep profile={createdProfile} />
      )}

      {/* Resume Extraction Modal */}
      <ResumeUploadModal
        isOpen={isResumeModalOpen}
        onClose={() => setIsResumeModalOpen(false)}
        onApplyExtractedData={handleApplyExtractedData}
      />
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="max-w-3xl mx-auto py-20 text-center text-xs text-[#8E8E9C]">
          Loading profile journey...
        </div>
      }
    >
      <OnboardingContent />
    </React.Suspense>
  );
}
