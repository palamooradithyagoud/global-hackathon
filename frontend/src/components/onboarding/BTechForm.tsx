"use client";

import React, { useState } from "react";
import {
  StudentProfileCreatePayload,
  SkillProficiency,
  ProjectItem,
  CertificationItem,
  ExperienceItem,
} from "@/types";
import { Laptop, Plus, Trash2, GitBranch, Sparkles } from "lucide-react";

interface BTechFormProps {
  formData: StudentProfileCreatePayload;
  onChange: (data: Partial<StudentProfileCreatePayload>) => void;
  errors: Record<string, string>;
}

const TARGET_ROLES = [
  "Software Engineer",
  "Data Engineer",
  "Data Scientist",
  "AI/ML Engineer",
  "Cybersecurity",
  "Product Manager",
  "Cloud / DevOps",
  "Not sure yet",
];

const LEARNING_TIMES = [
  "Less than 1 hour/day",
  "1–2 hours/day",
  "2–4 hours/day",
  "4+ hours/day",
];

export default function BTechForm({ formData, onChange, errors }: BTechFormProps) {
  const [newSkillName, setNewSkillName] = useState("");
  const [newSkillProf, setNewSkillProf] = useState<SkillProficiency>("Intermediate");

  const [showAddProject, setShowAddProject] = useState(false);
  const [projName, setProjName] = useState("");
  const [projDesc, setProjDesc] = useState("");
  const [projTech, setProjTech] = useState("");
  const [projGithub, setProjGithub] = useState("");

  const handleAddSkill = () => {
    if (!newSkillName.trim()) return;
    const exists = formData.skills.some(
      (s) => s.skill_name.toLowerCase() === newSkillName.trim().toLowerCase()
    );
    if (exists) return;

    onChange({
      skills: [
        ...formData.skills,
        { skill_name: newSkillName.trim(), proficiency: newSkillProf },
      ],
    });
    setNewSkillName("");
  };

  const handleRemoveSkill = (name: string) => {
    onChange({
      skills: formData.skills.filter((s) => s.skill_name !== name),
    });
  };

  const handleAddProject = () => {
    if (!projName.trim()) return;
    const newProject: ProjectItem = {
      name: projName.trim(),
      description: projDesc.trim(),
      technologies: projTech.trim(),
      github_url: projGithub.trim() || undefined,
    };
    onChange({
      projects: [...formData.projects, newProject],
    });
    setProjName("");
    setProjDesc("");
    setProjTech("");
    setProjGithub("");
    setShowAddProject(false);
  };

  const handleRemoveProject = (index: number) => {
    onChange({
      projects: formData.projects.filter((_, i) => i !== index),
    });
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3 pb-4 border-b border-[#20202C]">
        <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
          <Laptop className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-white">B.Tech Engineering Profile</h2>
          <p className="text-xs text-[#8E8E9C]">
            Branch specializations, verified CGPA, technical competencies, and project portfolio
          </p>
        </div>
      </div>

      {/* 1. Student Identity */}
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
              placeholder="e.g. Arjun Sharma"
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
              placeholder="e.g. arjun.sharma@example.edu"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
            {errors.email && <p className="text-[11px] text-red-400 mt-1">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Current Location
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
          2. College & Engineering Academics
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              College / Institute Name <span className="text-red-400">*</span>
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
              placeholder="e.g. HITAM / VIT / SRM"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Engineering Branch <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.academic_profile.branch || ""}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    branch: e.target.value,
                  },
                })
              }
              placeholder="e.g. Computer Science and Engineering"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
            {errors.branch && <p className="text-[11px] text-red-400 mt-1">{errors.branch}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Year of Study <span className="text-red-400">*</span>
            </label>
            <select
              value={formData.academic_profile.year || "3rd Year"}
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
              <option value="1st Year">1st Year</option>
              <option value="2nd Year">2nd Year</option>
              <option value="3rd Year">3rd Year</option>
              <option value="4th Year">4th Year</option>
              <option value="Graduated">Graduated</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Cumulative CGPA (0.00 – 10.00) <span className="text-red-400">*</span>
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="10"
              value={formData.academic_profile.cgpa ?? ""}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    cgpa: e.target.value ? parseFloat(e.target.value) : null,
                  },
                })
              }
              placeholder="e.g. 8.42"
              className="w-full px-3.5 py-2 text-xs dark-input focus:outline-none font-mono"
            />
            {errors.cgpa && <p className="text-[11px] text-red-400 mt-1">{errors.cgpa}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Affiliated University
            </label>
            <input
              type="text"
              value={formData.academic_profile.university || ""}
              onChange={(e) =>
                onChange({
                  academic_profile: {
                    ...formData.academic_profile,
                    university: e.target.value,
                  },
                })
              }
              placeholder="e.g. JNTU / Anna University"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Technical Skills & Proficiency */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C]">
            3. Technical Skills & Proficiency Model
          </h3>
          <span className="text-[11px] text-[#717180]">
            Proficiency: Beginner · Intermediate · Advanced
          </span>
        </div>

        {/* Existing skills pills in dark container */}
        <div className="flex flex-wrap gap-2 mb-3 min-h-[44px] p-2.5 bg-[#14141C] border border-[#262634] rounded-2xl">
          {formData.skills.length === 0 ? (
            <p className="text-xs text-[#5E5E6E] italic p-1">No skills added yet. Add below or extract from resume.</p>
          ) : (
            formData.skills.map((skill) => (
              <span
                key={skill.skill_name}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1C1C28] border border-[#2F2F42] text-xs font-medium text-white shadow-xs"
              >
                <span>{skill.skill_name}</span>
                <span className="text-[10px] text-violet-300 px-1.5 py-0.2 rounded-full bg-violet-500/20">
                  {skill.proficiency}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill.skill_name)}
                  className="text-[#717180] hover:text-red-400 transition-colors ml-0.5"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </span>
            ))
          )}
        </div>

        {/* Add skill input row */}
        <div className="flex items-center gap-2.5">
          <input
            type="text"
            value={newSkillName}
            onChange={(e) => setNewSkillName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAddSkill();
              }
            }}
            placeholder="Add skill (e.g. Python, Docker, React, SQL)"
            className="flex-1 px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
          />
          <select
            value={newSkillProf}
            onChange={(e) => setNewSkillProf(e.target.value as SkillProficiency)}
            className="px-3 py-2 text-xs dark-input focus:outline-none"
          >
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
          </select>
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
      </div>

      {/* 4. Projects Portfolio */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C]">
            4. Projects ({formData.projects.length})
          </h3>
          <button
            type="button"
            onClick={() => setShowAddProject(!showAddProject)}
            className="text-xs text-white hover:text-violet-300 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{showAddProject ? "Cancel" : "Add Project"}</span>
          </button>
        </div>

        {/* Existing projects list */}
        <div className="space-y-2.5 mb-3">
          {formData.projects.map((proj, idx) => (
            <div
              key={idx}
              className="p-4 bg-[#14141C] border border-[#262634] rounded-2xl text-xs flex items-start justify-between gap-3 shadow-xs"
            >
              <div>
                <h4 className="font-bold text-white text-sm">{proj.name}</h4>
                {proj.description && (
                  <p className="text-[#8E8E9C] mt-1 leading-relaxed">{proj.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-[#717180]">
                  {proj.technologies && (
                    <span className="bg-[#1E1E2C] text-violet-300 px-2 py-0.5 rounded-full text-[10px] font-mono">
                      {proj.technologies}
                    </span>
                  )}
                  {proj.github_url && (
                    <span className="flex items-center gap-1 text-[10px] text-emerald-400">
                      <GitBranch className="w-3 h-3" />
                      <span>Repository Linked</span>
                    </span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveProject(idx)}
                className="text-[#717180] hover:text-red-400 p-1 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Add project form drawer */}
        {showAddProject && (
          <div className="p-5 bg-[#161622] border border-[#2E2E40] rounded-2xl space-y-3">
            <h4 className="text-xs font-bold text-white">Add Technical Project</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                value={projName}
                onChange={(e) => setProjName(e.target.value)}
                placeholder="Project title (e.g. Distributed Cache Engine)"
                className="px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
              />
              <input
                type="text"
                value={projTech}
                onChange={(e) => setProjTech(e.target.value)}
                placeholder="Technologies used (e.g. Go, Redis, Docker)"
                className="px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
              />
            </div>
            <textarea
              rows={2}
              value={projDesc}
              onChange={(e) => setProjDesc(e.target.value)}
              placeholder="Brief description of architecture and outcomes..."
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
            <div className="flex items-center justify-between gap-3">
              <input
                type="url"
                value={projGithub}
                onChange={(e) => setProjGithub(e.target.value)}
                placeholder="GitHub link (optional)"
                className="flex-1 px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddProject}
                className="px-5 py-2 rounded-xl bg-white text-black text-xs font-bold hover:bg-neutral-200 cursor-pointer shadow-sm"
              >
                Save Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 5. Career Goal & Target Role */}
      <div>
        <label className="block text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-2.5">
          5. Target Role / Career Goal
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {TARGET_ROLES.map((role) => {
            const isSelected = formData.target_role === role;
            return (
              <button
                key={role}
                type="button"
                onClick={() => onChange({ target_role: role })}
                className={`p-3 rounded-2xl border text-left text-xs font-semibold transition-all cursor-pointer ${
                  isSelected
                    ? "bg-emerald-500/20 border-emerald-400 text-white ring-1 ring-emerald-400 shadow-sm"
                    : "bg-[#14141C] border-[#262634] text-[#8E8E9C] hover:text-white hover:border-[#38384C]"
                }`}
              >
                {role}
              </button>
            );
          })}
        </div>
      </div>

      {/* 6. Preferences & Availability */}
      <div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-[#8E8E9C] mb-3">
          6. Preferences & Available Time
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Available Daily Learning Time
            </label>
            <select
              value={formData.preferences?.available_learning_time || "2–4 hours/day"}
              onChange={(e) =>
                onChange({
                  preferences: {
                    ...formData.preferences,
                    available_learning_time: e.target.value,
                  },
                })
              }
              className="w-full px-3.5 py-2 text-xs dark-input focus:outline-none"
            >
              {LEARNING_TIMES.map((time) => (
                <option key={time} value={time}>
                  {time}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#A1A1AA] mb-1.5">
              Preferred Work / Internship Location
            </label>
            <input
              type="text"
              value={formData.preferences?.preferred_location || ""}
              onChange={(e) =>
                onChange({
                  preferences: {
                    ...formData.preferences,
                    preferred_location: e.target.value,
                  },
                })
              }
              placeholder="e.g. Hyderabad / Bengaluru / Remote"
              className="w-full px-3.5 py-2 text-xs dark-input placeholder-[#5E5E6E] focus:outline-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
