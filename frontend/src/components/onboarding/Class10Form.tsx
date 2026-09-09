"use client";

import React from "react";
import { StudentProfileCreatePayload } from "@/types";
import { BookOpen } from "lucide-react";

interface Class10FormProps {
  formData: StudentProfileCreatePayload;
  onChange: (data: Partial<StudentProfileCreatePayload>) => void;
  errors: Record<string, string>;
}

const INTEREST_AREAS = [
  "Technology & Computers",
  "Science & Physics",
  "Medicine & Biology",
  "Business & Commerce",
  "Design & Arts",
  "Government Services / Civil",
  "Aviation & Defense",
  "Sports & Athletics",
];

const FUTURE_DIRECTIONS = ["Intermediate", "Diploma", "Vocational", "Not sure"];

export default function Class10Form({
  formData,
  onChange,
  errors,
}: Class10FormProps) {
  const toggleInterest = (interest: string) => {
    const current = formData.interests || [];
    if (current.includes(interest)) {
      onChange({ interests: current.filter((i) => i !== interest) });
    } else {
      onChange({ interests: [...current, interest] });
    }
  };

  return (
    <div className="space-y-8">
      {/* Section Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#20202C]">
        <div className="w-10 h-10 rounded-2xl bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
          <BookOpen className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">Class 10 Academic Profile</h2>
          <p className="text-xs text-[#8E8E9C]">
            Foundational subjects, school board details, and future study pathway exploration
          </p>
        </div>
      </div>

      {/* 1. Basic Information */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-3">
          1. Basic Student Information
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Full Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange({ name: e.target.value })}
              placeholder="e.g. Rohan Gupta"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
            {errors.name && <p className="text-[11px] text-red-400 mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Email Address <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="e.g. rohan.gupta@example.edu"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
            {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Location (City, State)
            </label>
            <input
              type="text"
              value={formData.location || ""}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="e.g. Hyderabad, Telangana"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Academic Information */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-3">
          2. Academic Details
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              School Name <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.academic_profile.school_or_college || ""}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    school_or_college: e.target.value,
                  },
                })
              }
              placeholder="e.g. Delhi Public School"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
            {errors.school_or_college && (
              <p className="text-[11px] text-red-400 mt-1">{errors.school_or_college}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Education Board <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.academic_profile.board || "CBSE"}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    board: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-2 text-xs dark-input focus:outline-none"
            >
              <option value="CBSE">CBSE (Central Board)</option>
              <option value="ICSE">ICSE / CISCE</option>
              <option value="State Board">State Board</option>
              <option value="IB / International">IB / Cambridge</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Current / Expected Percentage (%) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={formData.academic_profile.percentage ?? ""}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    percentage: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              placeholder="e.g. 91.5"
              className="w-full px-3.5 py-2 text-xs dark-input focus:outline-none font-mono"
            />
            {errors.percentage && (
              <p className="text-[11px] text-red-400 mt-1">{errors.percentage}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. Subject Passions & Areas of Interest */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-2">
          3. Areas of Interest & Favorite Subjects
        </h3>
        <p className="text-xs text-[#717180] mb-3">
          Select areas you are genuinely excited about exploring:
        </p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_AREAS.map((interest) => {
            const isSelected = (formData.interests || []).includes(interest);
            return (
              <button
                key={interest}
                type="button"
                onClick={() => toggleInterest(interest)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                  isSelected
                    ? "bg-white text-black font-semibold shadow-xs"
                    : "bg-[#181824] text-[#A1A1AA] border border-[#2B2B3C] hover:text-white hover:border-[#424258]"
                }`}
              >
                {interest}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Future Direction */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-2">
          4. What are you considering after Class 10?
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {FUTURE_DIRECTIONS.map((direction) => {
            const isSelected = formData.academic_profile.future_direction === direction;
            return (
              <button
                key={direction}
                type="button"
                onClick={() =>
                  onChange({
                    academic_profile: {
                      ...formData.academic_profile,
                      future_direction: direction,
                    },
                  })
                }
                className={`p-3.5 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-violet-500/20 border-violet-400 text-white ring-1 ring-violet-400"
                    : "bg-[#14141C] border-[#262634] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
                }`}
              >
                {direction}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
