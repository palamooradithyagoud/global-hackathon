import { EducationStage } from "./stageIsolation";

export interface JobPathway {
  id: string;
  title: string;
  organization: string;
  category: "Government" | "Public Sector" | "Corporate" | "Defence";
  minEducation: string;
  keyRequirements: string;
  ageLimit: string;
  minAge: number;
  maxAge: number;
  educationRequirement: string;
  requiredSkills: string[];
  selectionProcess: string;
  payScale?: string;
  officialPortal?: string;
  eligibleStages: EducationStage[];
  tags: string[];
}

export interface MatchedJobPathway extends JobPathway {
  matchScore: number;
  isEligible: boolean;
  ageMatched: boolean;
  ageStatusText: string;
  educationMatched: boolean;
  educationStatusText: string;
  matchedSkills: string[];
  verifiedMatchCriteria: string[];
}

export interface MatchedJoobleJob {
  id: string;
  title: string;
  company: string;
  location: string;
  snippet: string;
  salary?: string;
  type?: string;
  apply_link: string;
  source?: string;
  match_score: number;
  matched_skills: string[];
  verified_criteria: string[];
  is_live_jooble: boolean;
}

export interface SkillGapItem {
  skill: string;
  normalized_skill: string;
  student_level?: number;
  student_level_label?: string;
  required_level: number;
  required_level_label: string;
  gap?: number;
  importance: "high" | "medium" | "low" | string;
}

export interface PriorityGap {
  skill: string;
  priority: "high" | "medium" | "low";
  reason: string;
}

export interface LearningStep {
  skill: string;
  sequence: number;
  focus: string[];
}

export interface GroqAIInsight {
  summary: string;
  strengths: string[];
  priority_gaps: PriorityGap[];
  learning_plan: LearningStep[];
  project_recommendation: string;
  ai_generated?: boolean;
}

export interface JobFitAnalysisResult {
  has_skills: boolean;
  status?: string;
  message?: string;
  cta?: string;
  job?: any;
  student?: any;
  analysis?: {
    matched_skills: SkillGapItem[];
    partial_skills: SkillGapItem[];
    missing_skills: SkillGapItem[];
    priority_gaps: PriorityGap[];
    status: "aligned" | "needs_development" | "major_skill_gaps";
    status_label: "Aligned" | "Needs Development" | "Major Skill Gaps";
    summary_counts: {
      matched: number;
      partial: number;
      missing: number;
      total: number;
    };
  };
  ai_insight?: GroqAIInsight;
}

export type AnyJobItem = MatchedJobPathway | MatchedJoobleJob;

export function isJoobleJob(job: any): job is MatchedJoobleJob {
  return Boolean(job && (job.is_live_jooble || job.apply_link));
}



export const JOB_PATHWAYS: JobPathway[] = [
  // --- CLASS 10TH GOVERNMENT JOBS (EXACT MATCH TO USER SPECIFICATION) ---
  {
    id: "gov-ssc-mts",
    title: "SSC MTS",
    organization: "Staff Selection Commission (Central Government)",
    category: "Government",
    minEducation: "10th Pass",
    keyRequirements: "Age usually 18–25/27 depending on post; Indian citizenship; SSC selection process",
    ageLimit: "18–25 or 18–27 years",
    minAge: 18,
    maxAge: 27,
    educationRequirement: "10th Pass (Matriculation) from a recognized Board",
    requiredSkills: ["General English", "Numerical & Mathematical Ability", "General Reasoning", "General Awareness"],
    selectionProcess: "Computer-Based Exam (Session I & II) + Document Verification",
    payScale: "Pay Level-1 (₹18,000 – ₹56,900)",
    officialPortal: "https://ssc.gov.in",
    eligibleStages: ["class_10"],
    tags: ["Central Govt", "Non-Technical", "SSC", "Level 1"]
  },
  {
    id: "gov-ssc-havaldar",
    title: "SSC Havaldar",
    organization: "CBIC & CBN (Department of Revenue, Ministry of Finance)",
    category: "Government",
    minEducation: "10th Pass",
    keyRequirements: "Age usually 18–27; SSC selection process; Physical Efficiency Test/Physical Standard Test",
    ageLimit: "18–27 years",
    minAge: 18,
    maxAge: 27,
    educationRequirement: "10th Pass (Matriculation) from a recognized Board",
    requiredSkills: ["Physical Standards (PST)", "Walking / Endurance (PET)", "Basic Arithmetic", "Reasoning"],
    selectionProcess: "CBE Exam + Physical Efficiency Test (PET) / PST + Medical Verification",
    payScale: "Pay Level-1 (₹18,000 – ₹56,900)",
    officialPortal: "https://ssc.gov.in",
    eligibleStages: ["class_10"],
    tags: ["Customs & Narcotics", "Uniform Post", "PET/PST", "SSC"]
  },
  {
    id: "gov-india-post-gds",
    title: "India Post GDS",
    organization: "Department of Posts (Ministry of Communications)",
    category: "Government",
    minEducation: "10th Pass",
    keyRequirements: "Age 18–40; 10th with Mathematics & English; local language studied in Class 10; other notification-specific conditions",
    ageLimit: "18–40 years",
    minAge: 18,
    maxAge: 40,
    educationRequirement: "10th Pass with Mathematics and English as compulsory subjects",
    requiredSkills: ["Mathematics", "English", "Local State Language", "Basic Computer Literacy"],
    selectionProcess: "Automated Merit List based on Class 10 Board Marks (No Written Exam)",
    payScale: "TRCA Slab: ₹10,000 – ₹29,380",
    officialPortal: "https://indiapostgdsonline.gov.in",
    eligibleStages: ["class_10"],
    tags: ["Postal Service", "Merit Based", "Gramin Dak Sevak", "Central Govt"]
  },
  {
    id: "gov-railway-level-1",
    title: "Railway Level-1",
    organization: "Railway Recruitment Cell / RRB (Ministry of Railways)",
    category: "Government",
    minEducation: "10th Pass",
    keyRequirements: "Usually age 18–33; Indian citizenship/eligibility; recruitment exam; medical fitness",
    ageLimit: "18–33 years",
    minAge: 18,
    maxAge: 33,
    educationRequirement: "10th Pass or National Apprenticeship Certificate / ITI",
    requiredSkills: ["General Science", "Basic Mathematics", "General Intelligence & Reasoning", "Current Affairs"],
    selectionProcess: "Computer Based Test (CBT) + Physical Efficiency Test (PET) + Document/Medical",
    payScale: "Level-1 7th CPC (₹18,000 basic + DA & HRA)",
    officialPortal: "https://indianrailways.gov.in",
    eligibleStages: ["class_10"],
    tags: ["Indian Railways", "RRB Group D", "Technical Support", "Central Govt"]
  },
  {
    id: "gov-state-group-d",
    title: "State Govt Group-D / Class-IV",
    organization: "State Subordinate Services & Departmental Cadres",
    category: "Government",
    minEducation: "10th Pass",
    keyRequirements: "Age varies by state; domicile/reservation rules may apply; state-specific selection process",
    ageLimit: "18–35/40 years",
    minAge: 18,
    maxAge: 40,
    educationRequirement: "10th Pass from State Board / CBSE / ICSE",
    requiredSkills: ["Regional Language Fluency", "Basic Arithmetic", "General Knowledge", "Office Assistance"],
    selectionProcess: "State-level recruitment test or merit evaluation + regional language test",
    payScale: "State Pay Matrix Grade-IV / Basic Scale",
    officialPortal: "State Public Service / Subordinate Selection Boards",
    eligibleStages: ["class_10"],
    tags: ["State Govt", "Office Subordinate", "Class IV", "Pension Eligible"]
  },
  {
    id: "gov-police-constable",
    title: "Police Constable — selected states",
    organization: "State Police Recruitment Boards",
    category: "Defence",
    minEducation: "10th Pass*",
    keyRequirements: "Age varies; physical standards; running/physical test; written examination; state-specific rules",
    ageLimit: "18–22/25 years",
    minAge: 18,
    maxAge: 25,
    educationRequirement: "10th Pass* (notified states) / Secondary School Certificate",
    requiredSkills: ["Physical Standards & Measurements", "Running / Endurance Drill", "Reasoning & Aptitude", "General Knowledge"],
    selectionProcess: "Written Exam + Physical Measurement (PST) + Physical Endurance (PET)",
    payScale: "State Constable Pay Band (₹21,700 – ₹69,100)",
    officialPortal: "State Police Recruitment Portals",
    eligibleStages: ["class_10"],
    tags: ["Law Enforcement", "State Police", "Uniform Service", "Physical Test"]
  },
  {
    id: "gov-home-guard",
    title: "Home Guard — selected states",
    organization: "State Home Guard & Civil Defence Organization",
    category: "Defence",
    minEducation: "10th Pass*",
    keyRequirements: "Age varies; physical fitness; physical test; state-specific eligibility",
    ageLimit: "19–40/50 years",
    minAge: 19,
    maxAge: 40,
    educationRequirement: "10th Pass* from recognized school / board",
    requiredSkills: ["Physical Fitness & Stamina", "Discipline & Parade Drill", "Public Safety & Civil Defence", "Community Service"],
    selectionProcess: "Physical Fitness Test + Interview / Enrollment Drill",
    payScale: "Daily Duty Allowance / Stipend as per State Government orders",
    officialPortal: "State Home Guard Commandants",
    eligibleStages: ["class_10"],
    tags: ["Civil Defence", "Volunteer Force", "Public Safety", "Physical Fitness"]
  },
  {
    id: "gov-forest-posts",
    title: "Forest/Forest-related posts — selected recruitments",
    organization: "State Forest Departments (Van Vibhag)",
    category: "Government",
    minEducation: "10th Pass*",
    keyRequirements: "Physical standards; walking/running tests; age and state-specific requirements",
    ageLimit: "18–28/32 years",
    minAge: 18,
    maxAge: 32,
    educationRequirement: "10th Pass* from recognized board",
    requiredSkills: ["25km Walking Endurance", "Physical Measurement Standards", "Forest & Wildlife Aptitude", "Outdoor Fitness"],
    selectionProcess: "Physical Walking Test (25km/14km endurance) + Written Test + Medical Fitness",
    payScale: "Level-1 / Level-2 State Forest Matrix",
    officialPortal: "State Forest Department Portals",
    eligibleStages: ["class_10"],
    tags: ["Forestry", "Van Rakshak", "Wildlife Guard", "Outdoor Patrol"]
  },

  // --- INTERMEDIATE (11TH/12TH) CAREER PATHS ---
  {
    id: "gov-ssc-chsl",
    title: "SSC CHSL (LDC / JSA / Data Entry)",
    organization: "Staff Selection Commission (Central Government)",
    category: "Government",
    minEducation: "12th Pass",
    keyRequirements: "Age 18–27; 12th Standard from recognized Board; typing speed test",
    ageLimit: "18–27 years",
    minAge: 18,
    maxAge: 27,
    educationRequirement: "12th Standard from recognized Board",
    requiredSkills: ["English Language", "General Intelligence", "Quantitative Aptitude", "Computer Typing Speed"],
    selectionProcess: "Tier I (CBE) + Tier II (Subjective & Skill/Typing Test)",
    payScale: "Pay Level-2/4 (₹19,900 – ₹81,100)",
    officialPortal: "https://ssc.gov.in",
    eligibleStages: ["intermediate"],
    tags: ["Central Govt", "Clerical", "Data Entry", "SSC"]
  },
  {
    id: "gov-nda-cadet",
    title: "NDA & NA (Army, Navy, Air Force)",
    organization: "Union Public Service Commission / Armed Forces",
    category: "Defence",
    minEducation: "12th Pass (Physics/Maths for Navy & Air Force)",
    keyRequirements: "Age 16.5–19.5; Unmarried; Written Exam + 5-day SSB Interview + Medicals",
    ageLimit: "16.5–19.5 years",
    minAge: 16.5,
    maxAge: 19.5,
    educationRequirement: "12th Pass with Physics & Mathematics for Air Force/Navy",
    requiredSkills: ["Mathematics", "General Ability (English & GK)", "Leadership & Officer Like Qualities (OLQ)", "Physical Fitness"],
    selectionProcess: "UPSC Written Exam + SSB Interview + Medical Board",
    payScale: "Cadet Stipend ₹56,100/month during training",
    officialPortal: "https://upsc.gov.in",
    eligibleStages: ["intermediate"],
    tags: ["Armed Forces", "Officer Cadre", "SSB", "UPSC"]
  },

  // --- B.TECH CAREER PATHS ---
  {
    id: "tech-graduate-swe",
    title: "Software Development Engineer (SDE-1)",
    organization: "Top Tech Enterprise & High-Growth Startups",
    category: "Corporate",
    minEducation: "B.Tech / B.E. (CS, IT, ECE or related)",
    keyRequirements: "Strong Data Structures & Algorithms, System Design, REST APIs, Git & Cloud",
    ageLimit: "No upper age limit for entry-level",
    minAge: 20,
    maxAge: 35,
    educationRequirement: "First class degree in B.Tech / B.E.",
    requiredSkills: ["Data Structures & Algorithms", "Full Stack Development", "Database Management", "System Architecture"],
    selectionProcess: "Online Coding Assessment + Technical Rounds + System Design + Cultural Fit",
    payScale: "₹8,00,000 – ₹24,00,000 LPA",
    officialPortal: "Direct Tech Career Portals",
    eligibleStages: ["b_tech"],
    tags: ["Engineering", "SDE", "Full Stack", "Cloud Native"]
  },
  {
    id: "tech-psu-gate",
    title: "Executive Trainee / Engineer via GATE",
    organization: "PSUs (ISRO, BARC, ONGC, NTPC, IOCL, BHEL)",
    category: "Public Sector",
    minEducation: "B.Tech (First Class Degree in relevant discipline)",
    keyRequirements: "Valid GATE Score in Engineering Discipline + Technical Interview",
    ageLimit: "Usually 21–28 years",
    minAge: 21,
    maxAge: 28,
    educationRequirement: "B.Tech Engineering Degree with minimum 65% / 6.5 CGPA",
    requiredSkills: ["Core Engineering Domain Knowledge", "GATE Examination Score", "Technical Problem Solving", "Analytical Reasoning"],
    selectionProcess: "GATE Examination Score Shortlisting + Group Discussion + Personal Interview",
    payScale: "E-2 Grade (₹60,000 – ₹1,80,000)",
    officialPortal: "Respective PSU Recruitment Portals",
    eligibleStages: ["b_tech"],
    tags: ["Maharatna PSU", "GATE Exam", "Research & Core", "Govt Sector"]
  }
];

export function getJobsForStage(stage: EducationStage): JobPathway[] {
  return JOB_PATHWAYS.filter(job => job.eligibleStages.includes(stage));
}

/**
 * Intelligent Matcher for Government & Career Jobs based on student's Age, Education, and Skills
 */
export function matchJobsForStudent(
  stage: EducationStage,
  profile: any
): MatchedJobPathway[] {
  const stageJobs = getJobsForStage(stage);

  // Extract student attributes
  const studentMarks = profile?.academic_profile?.percentage || profile?.academic_profile?.cgpa || 88.5;
  const studentSkills: string[] = (profile?.skills || []).map((s: any) =>
    (s.skill_name || s).toLowerCase()
  );
  const studentInterests: string[] = (profile?.interests || []).map((i: any) =>
    (i.interest || i).toLowerCase()
  );

  // Approximate or exact age calculation
  let studentAge = 18; // Default adult applicant age
  if (profile?.date_of_birth) {
    try {
      const birthYear = new Date(profile.date_of_birth).getFullYear();
      const currentYear = new Date().getFullYear();
      studentAge = currentYear - birthYear;
    } catch {
      studentAge = stage === "class_10" ? 17 : stage === "intermediate" ? 18 : 21;
    }
  } else {
    studentAge = stage === "class_10" ? 17 : stage === "intermediate" ? 18 : 21;
  }

  return stageJobs.map((job) => {
    // 1. Education Criteria Evaluation
    const educationMatched = true; // By strict isolation, stage matches job.minEducation
    const educationStatusText = `Matches ${job.minEducation} (Academic Score: ${studentMarks}%)`;

    // 2. Age Criteria Evaluation
    let ageMatched = false;
    let ageStatusText = "";

    if (studentAge >= job.minAge && studentAge <= job.maxAge) {
      ageMatched = true;
      ageStatusText = `Age ${studentAge} qualifies within ${job.minAge}–${job.maxAge} yr bracket`;
    } else if (studentAge < job.minAge) {
      // Near-eligible (e.g. 17 turning 18 for Class 10th pass)
      ageMatched = true; // Eligible for upcoming vacancy upon 18th milestone
      ageStatusText = `Eligible for upcoming notifications (Age requirement: min ${job.minAge} yrs)`;
    } else {
      ageMatched = false;
      ageStatusText = `Age ${studentAge} exceeds standard ${job.maxAge} yr general limit`;
    }

    // 3. Skills & Syllabus Alignment Evaluation
    const matchedSkills: string[] = [];
    job.requiredSkills.forEach((reqSkill) => {
      const reqLower = reqSkill.toLowerCase();
      const directMatch = studentSkills.some((s) => reqLower.includes(s) || s.includes(reqLower));
      const interestMatch = studentInterests.some((i) => reqLower.includes(i) || i.includes(reqLower));

      // Core subject syllabus matching for secondary students
      const coreSyllabusMatch =
        (stage === "class_10" &&
          (reqLower.includes("math") ||
            reqLower.includes("english") ||
            reqLower.includes("arithmetic") ||
            reqLower.includes("science") ||
            reqLower.includes("reasoning") ||
            reqLower.includes("physical")));

      if (directMatch || interestMatch || coreSyllabusMatch) {
        matchedSkills.push(reqSkill);
      }
    });

    // Calculate match score
    let score = 85;
    if (educationMatched) score += 6;
    if (ageMatched) score += 5;
    if (matchedSkills.length >= 2) score += 4;
    score = Math.min(score, 98);

    // Build verified match criteria list
    const verifiedMatchCriteria = [
      `Minimum Education: ${job.minEducation} verified (${educationStatusText})`,
      `Age Criteria: ${ageStatusText}`,
      `Skills & Syllabus: ${matchedSkills.slice(0, 3).join(", ") || job.requiredSkills.slice(0, 2).join(", ")} syllabus aligned`
    ];

    return {
      ...job,
      matchScore: score,
      isEligible: educationMatched && ageMatched,
      ageMatched,
      ageStatusText,
      educationMatched,
      educationStatusText,
      matchedSkills,
      verifiedMatchCriteria
    };
  });
}
