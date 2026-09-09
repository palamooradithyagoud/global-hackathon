import { EducationStage } from "./stageIsolation";

export interface JobPathway {
  id: string;
  title: string;
  organization: string;
  category: "Government" | "Public Sector" | "Corporate" | "Defence";
  minEducation: string;
  keyRequirements: string;
  ageLimit: string;
  selectionProcess: string;
  payScale?: string;
  officialPortal?: string;
  eligibleStages: EducationStage[];
  tags: string[];
}

export const JOB_PATHWAYS: JobPathway[] = [
  // --- CLASS 10TH GOVERNMENT JOBS (EXACT MATCH TO REQUIREMENTS) ---
  {
    id: "gov-ssc-mts",
    title: "SSC MTS",
    organization: "Staff Selection Commission (Central Government)",
    category: "Government",
    minEducation: "10th Pass",
    keyRequirements: "Age usually 18–25/27 depending on post; Indian citizenship; SSC selection process",
    ageLimit: "18–25 or 18–27 years",
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
    ageLimit: "18–40 years (Relaxations for reserved categories)",
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
    ageLimit: "18–35/40 years (varies per state)",
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
    ageLimit: "18–22/25 years (per state police norms)",
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
    ageLimit: "19–40/50 years (varies per state)",
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
    ageLimit: "18–28/32 years (per state wildlife/forest rules)",
    selectionProcess: "Physical Walking Test (25km/14km endurance) + Written Test + Medical Fitness",
    payScale: "Level-1 / Level-2 State Forest Matrix",
    officialPortal: "State Forest Department Portals",
    eligibleStages: ["class_10"],
    tags: ["Forestry", "Van Rakshak", "Wildlife Guard", "Outdoor Patrol"]
  },

  // --- INTERMEDIATE (11TH/12TH) GOVERNMENT & CAREER PATHS ---
  {
    id: "gov-ssc-chsl",
    title: "SSC CHSL (LDC / JSA / Data Entry)",
    organization: "Staff Selection Commission (Central Government)",
    category: "Government",
    minEducation: "12th Pass",
    keyRequirements: "Age 18–27; 12th Standard from recognized Board; typing speed test",
    ageLimit: "18–27 years",
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
    selectionProcess: "UPSC Written Exam + SSB Interview + Medical Board",
    payScale: "Cadet Stipend ₹56,100/month during training",
    officialPortal: "https://upsc.gov.in",
    eligibleStages: ["intermediate"],
    tags: ["Armed Forces", "Officer Cadre", "SSB", "UPSC"]
  },

  // --- B.TECH / UNDERGRADUATE TECH & ENGINEERING PATHS ---
  {
    id: "tech-graduate-swe",
    title: "Software Development Engineer (SDE-1)",
    organization: "Top Tech Enterprise & High-Growth Startups",
    category: "Corporate",
    minEducation: "B.Tech / B.E. (CS, IT, ECE or related)",
    keyRequirements: "Strong Data Structures & Algorithms, System Design, REST APIs, Git & Cloud",
    ageLimit: "No upper age limit for entry-level",
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
