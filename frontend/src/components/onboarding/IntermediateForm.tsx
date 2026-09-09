"use client";

import React from "react";
import { StudentProfileCreatePayload } from "@/types";
import { Layers, Check } from "lucide-react";

interface IntermediateFormProps {
  formData: StudentProfileCreatePayload;
  onChange: (data: Partial<StudentProfileCreatePayload>) => void;
  errors: Record<string, string>;
}

const STREAMS = [
  { id: "MPC", label: "MPC", desc: "Maths, Physics, Chemistry" },
  { id: "BiPC", label: "BiPC", desc: "Biology, Physics, Chemistry" },
  { id: "MEC", label: "MEC", desc: "Maths, Economics, Commerce" },
  { id: "CEC", label: "CEC", desc: "Civics, Economics, Commerce" },
  { id: "Other", label: "Other", desc: "Arts / Vocational" },
];

const FUTURE_PLANS = [
  "Engineering (B.Tech/BE)",
  "Medicine (MBBS/BDS)",
  "Degree (B.Sc/BA)",
  "Commerce (B.Com/CA)",
  "Law / Design",
  "Not sure yet",
];

export default function IntermediateForm({
  formData,
  onChange,
  errors,
}: IntermediateFormProps) {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#20202C]">
        <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
          <Layers className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">
            Intermediate / Senior Secondary Profile
          </h2>
          <p className="text-xs text-[#8E8E9C]">
            Junior College stream specialization, academic performance, and higher education targets
          </p>
        </div>
      </div>

      {/* 1. Basic Info */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-3">
          1. Student Identity
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
              placeholder="e.g. Sneha Reddy"
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
              placeholder="e.g. sneha.reddy@example.edu"
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
              placeholder="e.g. Vijayawada, Andhra Pradesh"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Stream Selection */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-2.5">
          2. Junior College Stream <span className="text-red-400">*</span>
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {STREAMS.map((s) => {
            const isSelected = formData.academic_profile.stream === s.id;
            return (
              <div
                key={s.id}
                onClick={() =>
                  onChange({
                    academic_profile: {
                      ...formData.academic_profile,
                      stream: s.id,
                    },
                  })
                }
                className={`p-4 rounded-2xl border cursor-pointer transition-all ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400 shadow-md"
                    : "bg-[#14141C] border-[#262634] text-[#8E8E9C] hover:border-[#424256]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-white">{s.label}</span>
                  {isSelected && <Check className="w-3.5 h-3.5 text-amber-300 stroke-[3]" />}
                </div>
                <p className="text-[11px] text-[#8E8E9C] mt-1">{s.desc}</p>
              </div>
            );
          })}
        </div>
        {errors.stream && <p className="text-[11px] text-red-400 mt-1">{errors.stream}</p>}
      </div>

      {/* 3. Academic Details */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-3">
          3. College & Academic Performance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Junior College / School Name
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
              placeholder="e.g. Narayana Junior College"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Current Year <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.academic_profile.year || "2nd Year"}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    year: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-2 text-xs dark-input focus:outline-none"
            >
              <option value="1st Year">1st Year (Class 11)</option>
              <option value="2nd Year">2nd Year (Class 12)</option>
              <option value="Completed">Completed / Gap Year</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Percentage / Score (%)
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
              placeholder="e.g. 94.2"
              className="w-full px-3.5 py-2 text-xs dark-input focus:outline-none font-mono"
            />
          </div>
        </div>
      </div>

      {/* 4. Future Direction */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-2">
          4. What are you planning after Intermediate?
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {FUTURE_PLANS.map((plan) => {
            const isSelected = formData.academic_profile.future_direction === plan;
            return (
              <button
                key={plan}
                type="button"
                onClick={() =>
                  onChange({
                    academic_profile: {
                      ...formData.academic_profile,
                      future_direction: plan,
                    },
                  })
                }
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-amber-500/20 border-amber-400 text-white ring-1 ring-amber-400"
                    : "bg-[#14141C] border-[#262634] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
                }`}
              >
                {plan}
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Financial Context (Optional) */}
      <div className="p-5 bg-[#14141C] border border-[#262634] rounded-2xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-white">
            Optional Financial Context
          </span>
          <span className="text-[11px] text-[#8E8E9C]">Helps match need-based grants</span>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-[#8E8E9C] mb-1.5">
            Approximate annual education budget
          </label>
          <input
            type="text"
            value={formData.financial_context?.education_budget || ""}
            onChange={(e) =>
              onChange({
                financial_context: {
                  ...formData.financial_context,
                  education_budget: e.target.value,
                },
              })
            }
            placeholder="e.g. ₹50,000 - ₹1,00,000 / year"
            className="w-full sm:w-1/2 px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
