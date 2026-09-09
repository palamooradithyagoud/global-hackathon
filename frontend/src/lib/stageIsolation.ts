/**
 * Centralized Stage Isolation Architecture
 * 
 * Provides strict educational stage segregation across user profile, scholarships,
 * and future-ready extensible scaffolding for jobs, internships, and skill roadmaps.
 */

export type EducationStage = "class_10" | "intermediate" | "b_tech";

export interface StageConfig {
  id: EducationStage;
  label: string;
  shortLabel: string;
  gradeBadge: string;
  category: string;
  description: string;
  accentColor: string;
  badgeBg: string;
  borderColor: string;
  demoStudentId: string;
  // Extensible module configuration
  modules: {
    scholarships: {
      active: boolean;
      description: string;
    };
    jobs: {
      active: boolean;
      plannedPhase: string;
      description: string;
    };
    internships: {
      active: boolean;
      plannedPhase: string;
      description: string;
    };
    careerRoadmaps: {
      active: boolean;
      plannedPhase: string;
      description: string;
    };
  };
}

export const STAGE_CONFIGS: Record<EducationStage, StageConfig> = {
  class_10: {
    id: "class_10",
    label: "Class 10th (Secondary School)",
    shortLabel: "Class 10th",
    gradeBadge: "10th Foundation",
    category: "Secondary Education",
    description: "Tailored for Class 10 students focusing on Olympiads, NTSE, Board excellence, and secondary talent scholarships.",
    accentColor: "from-emerald-400 to-teal-500",
    badgeBg: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    borderColor: "border-emerald-500/30",
    demoStudentId: "demo-student-uuid-002",
    modules: {
      scholarships: {
        active: true,
        description: "Strictly isolated Class 10 talent, merit, and STEM foundation scholarships."
      },
      jobs: {
        active: false,
        plannedPhase: "Phase 1.2",
        description: "Class 10 students are not eligible for industry employment; exploratory science apprenticeships planned."
      },
      internships: {
        active: false,
        plannedPhase: "Phase 1.2",
        description: "Junior STEM fellowships & science project shadowing tracks."
      },
      careerRoadmaps: {
        active: false,
        plannedPhase: "Phase 1.3",
        description: "Stream selection advisory (MPC vs BiPC vs Commerce/Arts)."
      }
    }
  },
  intermediate: {
    id: "intermediate",
    label: "Class 11th / 12th (Intermediate / +2)",
    shortLabel: "11th / 12th",
    gradeBadge: "Intermediate (+2)",
    category: "Higher Secondary",
    description: "Curated for Junior College (+2 / Inter) students aiming for competitive entrances (JEE/NEET) and national pre-university schemes.",
    accentColor: "from-purple-400 to-indigo-500",
    badgeBg: "bg-purple-500/10 text-purple-400 border-purple-500/20",
    borderColor: "border-purple-500/30",
    demoStudentId: "demo-student-uuid-003",
    modules: {
      scholarships: {
        active: true,
        description: "INSPIRE-SHE, STEM pre-university awards, and girl child higher secondary grants."
      },
      jobs: {
        active: false,
        plannedPhase: "Phase 1.2",
        description: "Micro-tutoring & junior lab assistant opportunities planned."
      },
      internships: {
        active: false,
        plannedPhase: "Phase 1.2",
        description: "Summer research institute attachments & olympiad bootcamps."
      },
      careerRoadmaps: {
        active: false,
        plannedPhase: "Phase 1.3",
        description: "Engineering & Medical entrance guidance pathways."
      }
    }
  },
  b_tech: {
    id: "b_tech",
    label: "B.Tech / Undergraduate Engineering",
    shortLabel: "B.Tech",
    gradeBadge: "Undergraduate (B.Tech)",
    category: "Higher Technical Education",
    description: "Designed for engineering undergraduates seeking tech industry corporate grants, global fellowships, and research sponsorships.",
    accentColor: "from-amber-400 to-orange-500",
    badgeBg: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    borderColor: "border-amber-500/30",
    demoStudentId: "demo-student-uuid-001",
    modules: {
      scholarships: {
        active: true,
        description: "Google APAC, Amazon Future Engineer, Reliance Foundation, and AICTE Degree grants."
      },
      jobs: {
        active: false,
        plannedPhase: "Phase 1.2",
        description: "Full-time graduate software engineering, devops, and data engineering roles."
      },
      internships: {
        active: false,
        plannedPhase: "Phase 1.2",
        description: "Summer software engineer and core engineering internships."
      },
      careerRoadmaps: {
        active: false,
        plannedPhase: "Phase 1.3",
        description: "Production-grade system design & full-stack specialization roadmaps."
      }
    }
  }
};

/**
 * Validates if an opportunity (scholarship, job, etc.) is strictly eligible for the user's educational stage.
 */
export function isOpportunityStrictlyEligible(eligibleStages: string[] | undefined, userStage: EducationStage): boolean {
  if (!eligibleStages || !Array.isArray(eligibleStages) || eligibleStages.length === 0) {
    return false;
  }
  return eligibleStages.includes(userStage);
}

/**
 * Strict filtering function for client-side enforcement across any collection.
 */
export function filterByEducationStage<T extends { eligible_stages?: string[] }>(
  items: T[],
  userStage: EducationStage
): T[] {
  return items.filter(item => isOpportunityStrictlyEligible(item.eligible_stages, userStage));
}
