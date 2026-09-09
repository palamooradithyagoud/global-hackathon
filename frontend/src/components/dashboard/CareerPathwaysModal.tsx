"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  School,
  GraduationCap,
  Layers,
  Award,
  Sparkles,
  CheckCircle2,
  BookOpen,
  Briefcase,
  Compass,
  ArrowUpRight,
  RotateCcw,
  Search,
  Filter
} from "lucide-react";

interface CareerPathwaysModalProps {
  isOpen: boolean;
  onClose: () => void;
  educationStage?: "class_10" | "intermediate" | "b_tech" | string | null;
  onSelectStreamForScholarships?: (streamName: string) => void;
}

type MainRole = "10th" | "intermediate_diploma" | "degree" | null;
type TenthOption = "intermediate" | "diploma" | null;
type IntermediateStream = "MPC" | "BiPC" | "MEC" | "CEC" | null;

interface StreamInfo {
  code: string;
  name: string;
  fullTitle: string;
  badge: string;
  tagline: string;
  subjects: string[];
  careers: string[];
  exams: string[];
  matchingSubgroups: string[];
  color: string;
  borderColor: string;
  bgLight: string;
}

const INTERMEDIATE_STREAMS: Record<string, StreamInfo> = {
  MPC: {
    code: "MPC",
    name: "Mathematics, Physics, Chemistry",
    fullTitle: "MPC (Science & Engineering Stream)",
    badge: "Engineering & Tech",
    tagline: "The premier pathway for engineering, computer science, physical sciences, and technical innovation.",
    subjects: ["Mathematics", "Physics", "Chemistry", "English", "Second Language"],
    careers: [
      "Software Engineer & AI/ML Specialist",
      "Data Scientist & Cloud Architect",
      "Mechanical & Aerospace Engineer",
      "Civil & Structural Engineer",
      "Commercial Airline Pilot (CPL)",
      "Defense Services (NDA / Naval Academy)",
      "Architecture & Planning (B.Arch)"
    ],
    exams: ["JEE Main & Advanced", "BITSAT", "State Engineering CETs (EAMCET, KCET)", "NDA", "NATA"],
    matchingSubgroups: ["Engineering & Technology", "Defence & Uniformed Services", "Aviation & Travel", "Science & Research", "Design & Creative Fields"],
    color: "#60A5FA",
    borderColor: "rgba(96, 165, 250, 0.4)",
    bgLight: "rgba(96, 165, 250, 0.08)"
  },
  BiPC: {
    code: "BiPC",
    name: "Biology, Physics, Chemistry",
    fullTitle: "BiPC (Medical & Life Sciences Stream)",
    badge: "Medical & Healthcare",
    tagline: "The core foundation for medicine, dental surgery, pharmacy, biotechnology, and agricultural research.",
    subjects: ["Botany & Zoology (Biology)", "Physics", "Chemistry", "English", "Second Language"],
    careers: [
      "Doctor (MBBS - General Physician / Surgeon)",
      "Dental Surgeon (BDS)",
      "Pharmacist & Drug Researcher (B.Pharm / Pharm.D)",
      "Biotechnologist & Geneticist",
      "Veterinary Doctor (B.V.Sc)",
      "Agricultural Scientist & Food Technologist"
    ],
    exams: ["NEET-UG", "AIIMS / JIPMER (via NEET)", "ICAR AIEEA (Agriculture)", "State Medical CETs"],
    matchingSubgroups: ["Medicine & Healthcare", "Science & Research", "Agriculture & Environmental Sciences", "Education & Teaching"],
    color: "#34D399",
    borderColor: "rgba(52, 211, 153, 0.4)",
    bgLight: "rgba(52, 211, 153, 0.08)"
  },
  MEC: {
    code: "MEC",
    name: "Mathematics, Economics, Commerce",
    fullTitle: "MEC (Commerce, Finance & Math Stream)",
    badge: "Finance & Analytics",
    tagline: "The optimal track combining business acumen with mathematical logic for finance, CA, and economics.",
    subjects: ["Mathematics", "Economics", "Commerce / Accountancy", "English", "Second Language"],
    careers: [
      "Chartered Accountant (CA)",
      "Investment Banker & Financial Analyst",
      "Economist & Policy Advisor",
      "Actuarial Scientist & Risk Assessor",
      "Data & Business Analyst",
      "Corporate Finance & Management (BBA / MBA)"
    ],
    exams: ["CA Foundation (ICAI)", "CUET (B.Com / Eco Hons)", "IPMAT (IIM 5-Year Integrated)", "CFA (Level 1)"],
    matchingSubgroups: ["Commerce & Finance", "Law & Legal Services", "Government & Civil Services", "Hospitality & Tourism"],
    color: "#FBBF24",
    borderColor: "rgba(251, 191, 36, 0.4)",
    bgLight: "rgba(251, 191, 36, 0.08)"
  },
  CEC: {
    code: "CEC",
    name: "Civics, Economics, Commerce",
    fullTitle: "CEC (Commerce, Humanities & Law Stream)",
    badge: "Business, Law & Gov",
    tagline: "Designed for leaders aiming for corporate law, civil administration, business management, and public policy.",
    subjects: ["Civics / Political Science", "Economics", "Commerce", "English", "Second Language"],
    careers: [
      "Corporate & Criminal Lawyer (BA LLB)",
      "Civil Servant (UPSC IAS / IPS / IFS)",
      "Company Secretary (CS) & CMA",
      "Public Relations & Media Manager",
      "Banking & Financial Services Officer",
      "Business Administrator & Entrepreneur"
    ],
    exams: ["CLAT / AILET (National Law Universities)", "UPSC Prelims/Mains (Post-Grad)", "CUET", "CS Foundation"],
    matchingSubgroups: ["Law & Legal Services", "Government & Civil Services", "Media & Communication", "Arts & Humanities"],
    color: "#F472B6",
    borderColor: "rgba(244, 114, 182, 0.4)",
    bgLight: "rgba(244, 114, 182, 0.08)"
  }
};

interface DiplomaBranchInfo {
  id: string;
  name: string;
  desc: string;
  subjects: string[];
  careers: string[];
  lateralEntry: string;
}

const DIPLOMA_BRANCHES: DiplomaBranchInfo[] = [
  {
    id: "cse_it",
    name: "CSE / IT Polytechnic",
    desc: "Software, Web Dev, Networking & Programming Fundamentals",
    subjects: ["C/C++ & Java", "Data Structures", "Web Technologies", "Database Management", "Computer Networks"],
    careers: ["Junior Software Developer", "Network Support Engineer", "Web Specialist", "IT Support Analyst"],
    lateralEntry: "Direct 2nd Year admission into B.Tech CSE / IT via State ECET."
  },
  {
    id: "mechanical",
    name: "Mechanical Engineering",
    desc: "Automobile, Manufacturing, Thermodynamics & CAD Drafting",
    subjects: ["Engineering Mechanics", "Thermodynamics", "AutoCAD / SolidWorks", "Manufacturing Processes"],
    careers: ["CAD Design Technician", "Plant Maintenance Supervisor", "Automotive Assembly Engineer", "Quality Inspector"],
    lateralEntry: "Direct 2nd Year admission into B.Tech Mechanical Engineering via State ECET."
  },
  {
    id: "ece_eee",
    name: "ECE / Electrical Engineering",
    desc: "Circuits, Power Systems, Microcontrollers & IoT Devices",
    subjects: ["Analog & Digital Circuits", "Microprocessors", "Power Electronics", "Communication Systems"],
    careers: ["Hardware Testing Technician", "Power Grid Operator", "PCB Layout Specialist", "IoT Systems Assistant"],
    lateralEntry: "Direct 2nd Year admission into B.Tech ECE / EEE via State ECET."
  },
  {
    id: "civil",
    name: "Civil Engineering",
    desc: "Construction, Surveying, Structural Design & Material Testing",
    subjects: ["Building Materials", "Surveying & Leveling", "Structural Mechanics", "Hydraulics & Irrigation"],
    careers: ["Site Supervisor", "Survey Technician", "Draftsman (Civil)", "Material Testing Specialist"],
    lateralEntry: "Direct 2nd Year admission into B.Tech Civil Engineering via State ECET."
  }
];

// ============================================================================
// 14 CAREER SUBGROUPS AFTER INTERMEDIATE (AS SPECIFIED BY USER)
// ============================================================================
interface AfterIntermediateSubgroup {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  color: string;
  badge: string;
  degrees: string[];
  roles: string[];
  exams: string[];
  eligibleStreams: string[];
}

const AFTER_INTERMEDIATE_SUBGROUPS: AfterIntermediateSubgroup[] = [
  {
    id: "eng_tech",
    name: "Engineering & Technology",
    emoji: "⚙️",
    tagline: "Software, Computer Science, Electronics, Mechanical, Civil, etc.",
    color: "#60A5FA",
    badge: "Tech & Software",
    degrees: [
      "B.Tech / B.E. (Computer Science & Engineering)",
      "B.Tech Artificial Intelligence & Machine Learning",
      "B.Tech Electronics & Communication (ECE)",
      "B.Tech Mechanical & Mechatronics",
      "B.Tech Civil & Infrastructure Engineering",
      "B.Tech Aerospace & Automobile Engineering"
    ],
    roles: [
      "Software Engineer & Full Stack Developer",
      "Data Scientist & AI/ML Specialist",
      "Cloud Architect & DevOps Engineer",
      "Robotics & Embedded Systems Engineer",
      "Civil Project Engineer & Structural Consultant"
    ],
    exams: [
      "JEE Main & JEE Advanced (IITs/NITs/IIITs)",
      "BITSAT (BITS Pilani)",
      "State Engineering CETs (EAMCET, KCET, MHT-CET, WBJEE)",
      "VITEEE, SRMJEEE, MET"
    ],
    eligibleStreams: ["MPC"]
  },
  {
    id: "med_health",
    name: "Medicine & Healthcare",
    emoji: "🩺",
    tagline: "Doctor, Nursing, Pharmacy, Physiotherapy, Medical Lab, etc.",
    color: "#34D399",
    badge: "Clinical & Life Care",
    degrees: [
      "MBBS (Bachelor of Medicine & Bachelor of Surgery)",
      "BDS (Bachelor of Dental Surgery)",
      "Pharm.D (Doctor of Pharmacy - 6 Years)",
      "B.Pharm (Bachelor of Pharmacy - 4 Years)",
      "B.Sc Nursing (4 Years)",
      "BPT (Bachelor of Physiotherapy - 4.5 Years)",
      "B.Sc Medical Laboratory Technology (MLT)"
    ],
    roles: [
      "General Physician & Specialist Surgeon",
      "Dental Surgeon & Orthodontist",
      "Clinical Pharmacist & Formulation Scientist",
      "Critical Care Nurse & Healthcare Administrator",
      "Physiotherapist & Sports Rehabilitation Specialist",
      "Medical Diagnostic Lab Director"
    ],
    exams: [
      "NEET-UG (National Eligibility cum Entrance Test)",
      "AIIMS & JIPMER (via NEET counseling)",
      "State Medical & Paramedical Admission Counseling"
    ],
    eligibleStreams: ["BiPC"]
  },
  {
    id: "comm_fin",
    name: "Commerce & Finance",
    emoji: "💰",
    tagline: "CA, Banking, Accounting, Finance, Business, etc.",
    color: "#FBBF24",
    badge: "Corporate & Wealth",
    degrees: [
      "B.Com (Honours / Accounting & Finance)",
      "BBA (Bachelor of Business Administration - Finance)",
      "Chartered Accountancy (CA via ICAI)",
      "CMA (Cost & Management Accountancy)",
      "CS (Company Secretary via ICSI)",
      "CFA Foundation (Chartered Financial Analyst)"
    ],
    roles: [
      "Chartered Accountant (CA) & Statutory Auditor",
      "Investment Banking & Private Equity Analyst",
      "Corporate Finance & Treasury Manager",
      "Commercial Bank Operations Manager",
      "Tax Consultant & Wealth Advisor"
    ],
    exams: [
      "CA Foundation (ICAI)",
      "CUET-UG (Delhi University, SRCC, Central Universities)",
      "IPMAT (IIM Indore/Rohtak 5-Year Integrated Program in Management)",
      "CMA Foundation"
    ],
    eligibleStreams: ["MEC", "CEC", "MPC"]
  },
  {
    id: "law_legal",
    name: "Law & Legal Services",
    emoji: "⚖️",
    tagline: "Lawyer, Legal Advisor, Judiciary, etc.",
    color: "#A78BFA",
    badge: "Judiciary & Law",
    degrees: [
      "BA LLB (5-Year Integrated Law)",
      "BBA LLB (Corporate Law Specialization)",
      "B.Com LLB (Taxation & Corporate Governance)",
      "B.Sc LLB (Intellectual Property & Cyber Law)"
    ],
    roles: [
      "Corporate Legal Counsel for MNCs",
      "Advocate in High Courts & Supreme Court",
      "Civil Judge / Judicial Magistrate (via State Judicial Services)",
      "Legal Advisor & Policy Consultant",
      "Arbitrator & Human Rights Specialist"
    ],
    exams: [
      "CLAT (Common Law Admission Test for 26 National Law Universities)",
      "AILET (National Law University Delhi)",
      "LSAT India",
      "State Law CETs (TS LAWCET, AP LAWCET, MH CET Law)"
    ],
    eligibleStreams: ["CEC", "MEC", "MPC", "BiPC"]
  },
  {
    id: "design_creative",
    name: "Design & Creative Fields",
    emoji: "🎨",
    tagline: "UI/UX, Graphic Design, Fashion, Animation, Architecture, etc.",
    color: "#F472B6",
    badge: "Visual & Digital Art",
    degrees: [
      "B.Des (UI/UX & Interactive Design)",
      "B.Arch (Bachelor of Architecture - 5 Years)",
      "B.Des Fashion & Textile Design",
      "B.Sc 3D Animation, Gaming & Visual Effects (VFX)",
      "B.Des Industrial & Product Design"
    ],
    roles: [
      "UI/UX Product Designer for Web & Mobile Apps",
      "Licensed Architect & Urban Planner",
      "Lead 3D Animator & Game Asset Designer",
      "Fashion Stylist & Apparel Brand Director",
      "Creative Art Director & Brand Strategist"
    ],
    exams: [
      "UCEED (IIT Bombay / IIT Delhi / IIT Guwahati)",
      "NID DAT (National Institute of Design)",
      "NATA (National Aptitude Test in Architecture)",
      "NIFT Entrance Examination (Fashion Tech)",
      "JEE Main Paper 2 (Architecture)"
    ],
    eligibleStreams: ["MPC", "MEC", "CEC", "BiPC"]
  },
  {
    id: "arts_humanities",
    name: "Arts & Humanities",
    emoji: "📚",
    tagline: "Psychology, Journalism, Literature, Sociology, History, etc.",
    color: "#FB923C",
    badge: "Social Sciences",
    degrees: [
      "BA (Hons) Clinical Psychology",
      "BA Journalism & Mass Communication (BJMC)",
      "BA English & Comparative Literature",
      "BA Sociology & Social Work (BSW)",
      "BA History, Political Science & International Relations"
    ],
    roles: [
      "Clinical Psychologist & Mental Health Counselor",
      "Investigative Journalist & Media Editor",
      "Public Policy Analyst & Think Tank Researcher",
      "Content Strategist & Publishing Author",
      "Social Development Program Director (NGO/UN)"
    ],
    exams: [
      "CUET-UG (Central Universities & Top Colleges)",
      "TISS-BAT (Tata Institute of Social Sciences)",
      "University Merit & Entrance Tests",
      "IIMC Entrance Examination"
    ],
    eligibleStreams: ["CEC", "MEC", "BiPC", "MPC"]
  },
  {
    id: "agri_env",
    name: "Agriculture & Environmental Sciences",
    emoji: "🌾",
    tagline: "Agriculture, Horticulture, Forestry, Environmental Science, etc.",
    color: "#4ADE80",
    badge: "Agronomy & Ecology",
    degrees: [
      "B.Sc (Hons) Agriculture (4 Years)",
      "B.Sc Horticulture",
      "B.Sc Forestry & Wildlife Conservation",
      "B.Tech Agricultural Engineering & Precision Irrigation",
      "B.Sc Food Science & Nutrition Technology"
    ],
    roles: [
      "Agricultural Development Officer (ADO - State / NABARD)",
      "Agronomist & Soil Conservation Scientist",
      "Environmental Impact Assessment (EIA) Specialist",
      "Precision Agri-Tech Solutions Manager",
      "Seed Quality & Plant Geneticist"
    ],
    exams: [
      "ICAR AIEEA-UG (Indian Council of Agricultural Research)",
      "State Agricultural University CETs (PJTSAU, ANGRAU, TNAU, OUAT)"
    ],
    eligibleStreams: ["BiPC", "MPC"]
  },
  {
    id: "gov_civil",
    name: "Government & Civil Services",
    emoji: "🏛️",
    tagline: "UPSC, State PSC, SSC, Railways, Banking, etc.",
    color: "#E879F9",
    badge: "Governance & Bureaucracy",
    degrees: [
      "Any Recognized Undergrad Degree (BA, B.Sc, B.Com, B.Tech) with Civil Services Foundation & Competitive Exam Prep"
    ],
    roles: [
      "Indian Administrative Service (IAS) District Magistrate",
      "Indian Police Service (IPS) Superintendent of Police",
      "State Civil Service Group-1 Revenue / RDO Officer",
      "SSC CGL Income Tax / Customs Inspector",
      "Railway Operations Manager & Bank PO"
    ],
    exams: [
      "UPSC Civil Services Examination (CSE - IAS/IPS/IFS)",
      "State Public Service Commissions (TSPSC, APPSC, KPSC, MPSC)",
      "SSC CGL & CHSL Examinations",
      "IBPS PO & SBI PO Banking Exams",
      "RRB NTPC (Railway Recruitment Board)"
    ],
    eligibleStreams: ["CEC", "MEC", "MPC", "BiPC"]
  },
  {
    id: "defence_uniformed",
    name: "Defence & Uniformed Services",
    emoji: "🪖",
    tagline: "Army, Navy, Air Force, Police, Paramilitary, etc.",
    color: "#38BDF8",
    badge: "Armed Forces & Security",
    degrees: [
      "National Defence Academy (NDA - 3-Year Degree + 1-Year Military Academy)",
      "Indian Navy 10+2 B.Tech Cadet Entry Scheme",
      "State Police Sub-Inspector / Armed Forces Cadet Training"
    ],
    roles: [
      "Commissioned Lieutenant in Indian Army",
      "Sub-Lieutenant in Indian Navy",
      "Flying Officer (Fighter / Transport Pilot) in Indian Air Force",
      "State Police Sub-Inspector (SI) / DSP",
      "Paramilitary Assistant Commandant (CRPF, BSF, CISF)"
    ],
    exams: [
      "NDA & NA Exam (Conducted by UPSC twice every year for +2 students)",
      "SSB (Services Selection Board) 5-Day Interview & Medicals",
      "Indian Navy 10+2 B.Tech Cadet Scheme (via JEE Main)",
      "AFCAT & CDS Exams (Post-Graduation)"
    ],
    eligibleStreams: ["MPC", "MEC", "CEC", "BiPC"]
  },
  {
    id: "edu_teaching",
    name: "Education & Teaching",
    emoji: "👩‍🏫",
    tagline: "Teacher, Lecturer, Academic careers, etc.",
    color: "#FACC15",
    badge: "Pedagogy & Research",
    degrees: [
      "Integrated B.Ed (4-Year BA B.Ed / B.Sc B.Ed - ITEP Program)",
      "D.El.Ed (Diploma in Elementary Education)",
      "Bachelor of Elementary Education (B.El.Ed)",
      "Postgraduate Degree (MA/M.Sc) + UGC NET for College Lecturership"
    ],
    roles: [
      "Senior High School Teacher (PGT / TGT)",
      "Junior College Subject Lecturer",
      "Curriculum Developer & Instructional Designer",
      "EdTech Academic Specialist & Lead Trainer",
      "Special Needs & Remedial Educator"
    ],
    exams: [
      "CTET (Central Teacher Eligibility Test)",
      "State TETs (Teacher Eligibility Tests)",
      "CUET-UG for Integrated 4-Year B.Ed (ITEP)",
      "UGC-NET / CSIR-NET (Post-Graduation)"
    ],
    eligibleStreams: ["MPC", "BiPC", "MEC", "CEC"]
  },
  {
    id: "sci_research",
    name: "Science & Research",
    emoji: "🧪",
    tagline: "Physics, Chemistry, Biology, Mathematics, Biotechnology, etc.",
    color: "#2DD4BF",
    badge: "Pure & Applied Science",
    degrees: [
      "BS-MS Dual Degree (5 Years at IISER / NISER)",
      "IISc Bangalore Bachelor of Science (Research)",
      "B.Sc (Hons) in Physics, Chemistry, Mathematics, Statistics",
      "B.Tech / B.Sc in Biotechnology & Bioinformatics"
    ],
    roles: [
      "Research Scientist in ISRO, DRDO, BARC, CSIR Labs",
      "Quantum Computing & Computational Physicist",
      "Biopharmaceutical Researcher & Geneticist",
      "Statistical Modeler & Quantitative Analyst",
      "University Research Professor & Postdoctoral Fellow"
    ],
    exams: [
      "IAT (IISER Aptitude Test for 7 IISER Institutes)",
      "NEST (National Entrance Screening Test for NISER Bhubaneswar)",
      "IISc Research Admissions (via JEE / IAT)",
      "CUET-UG Pure Sciences"
    ],
    eligibleStreams: ["MPC", "BiPC"]
  },
  {
    id: "aviation_travel",
    name: "Aviation & Travel",
    emoji: "✈️",
    tagline: "Pilot, Cabin Crew, Airport Management, Tourism, etc.",
    color: "#818CF8",
    badge: "Aeronautics & Sky",
    degrees: [
      "Commercial Pilot License (CPL) Flight Training (200 Flying Hours)",
      "BBA in Aviation & Airport Ground Handling Management",
      "Diploma in In-Flight Cabin Services & Safety Procedures",
      "B.Sc Aeronautical Science"
    ],
    roles: [
      "Commercial Airline Captain / First Officer Pilot",
      "International In-Flight Cabin Crew Supervisor",
      "Airport Terminal Operations & Safety Manager",
      "Air Traffic Control Officer (ATC via AAI)",
      "Airline Flight Operations Dispatcher"
    ],
    exams: [
      "IGRUA Entrance Exam (Indira Gandhi Rashtriya Uran Akademi)",
      "DGCA Pilot Ground License Examinations",
      "Airline Cadet Pilot Programs (IndiGo, Air India, SpiceJet)"
    ],
    eligibleStreams: ["MPC", "MEC", "BiPC", "CEC"]
  },
  {
    id: "hospitality_tourism",
    name: "Hospitality & Tourism",
    emoji: "🏨",
    tagline: "Hotel Management, Culinary Arts, Travel Management, etc.",
    color: "#FB7185",
    badge: "Global Hospitality",
    degrees: [
      "B.Sc Hospitality & Hotel Administration (IHM)",
      "BA Culinary Arts & International Bakery Management",
      "BBA Tourism & Travel Management",
      "Diploma in Luxury Hotel & Cruise Operations"
    ],
    roles: [
      "Executive Chef & Culinary Director",
      "Luxury Hotel & Resort General Manager",
      "Director of Food & Beverage (F&B)",
      "International Luxury Cruise Hospitality Lead",
      "Global Tourism & Destination Operations Director"
    ],
    exams: [
      "NCHMCT JEE (National Council for Hotel Management Joint Entrance Exam)",
      "Oberoi STEP (System for Training & Education Program)",
      "IHM Aurangabad Entrance"
    ],
    eligibleStreams: ["MEC", "CEC", "MPC", "BiPC"]
  },
  {
    id: "media_comm",
    name: "Media & Communication",
    emoji: "📱",
    tagline: "Content Creation, Film, Photography, Digital Media, Advertising, etc.",
    color: "#C084FC",
    badge: "Digital Content & Film",
    degrees: [
      "BA Digital Film Making, Direction & Cinematography",
      "BA / B.Sc in Mass Media, New Journalism & Broadcasting",
      "B.Des / Professional Diploma in Commercial Photography",
      "BA Advertising, Public Relations & Digital Marketing",
      "B.Sc Sound Engineering & Audio Production"
    ],
    roles: [
      "Digital Content Creator & Social Media Director",
      "Film Director, Screenwriter & Cinematographer",
      "Advertising Creative Director & Copywriter",
      "Commercial & Fashion Photographer",
      "Podcast Producer & Audio Video Editor"
    ],
    exams: [
      "FTII JET (Film and Television Institute of India)",
      "SRFTI Entrance Exam (Satyajit Ray Film & TV Institute)",
      "Whistling Woods International Entrance",
      "CUET-UG Mass Media & Communication"
    ],
    eligibleStreams: ["CEC", "MEC", "MPC", "BiPC"]
  }
];

interface DegreeOptionInfo {
  id: string;
  title: string;
  badge: string;
  desc: string;
  color: string;
  highlights: string[];
  careers: string[];
}

const DEGREE_OPTIONS: DegreeOptionInfo[] = [
  {
    id: "post_grad",
    title: "Post-Graduation (M.Tech / MS / MBA)",
    badge: "Higher Studies",
    desc: "GATE, CAT, GRE/TOEFL for premier Indian & global universities.",
    color: "#60A5FA",
    highlights: ["M.Tech via GATE", "MBA via CAT/XAT/GMAT", "MS Abroad via GRE/TOEFL"],
    careers: ["Principal Engineer", "Strategic Management Consultant", "R&D Scientist"]
  },
  {
    id: "corporate_jobs",
    title: "Software & Corporate Placements",
    badge: "Industry Jobs",
    desc: "Campus hiring, frontend/backend engineering, product & analytics roles.",
    color: "#34D399",
    highlights: ["Campus Recruitment", "Off-campus hiring drives", "Full-stack & Cloud certifications"],
    careers: ["Senior Software Engineer", "Product Manager", "Tech Lead"]
  },
  {
    id: "civil_services",
    title: "Civil Services & Govt Sector",
    badge: "UPSC / PSC",
    desc: "IAS, IPS, State Group 1, Banking PO, and Defense officer commissions.",
    color: "#FBBF24",
    highlights: ["UPSC Civil Services Examination", "State Public Service Commission", "IBPS / SBI PO"],
    careers: ["IAS Officer", "IPS Officer", "Bank Branch Manager", "Defense Commissioned Officer"]
  },
  {
    id: "research",
    title: "Research & Academia (Ph.D)",
    badge: "Doctoral",
    desc: "CSIR-NET, UGC-NET, fellowship research in national laboratories.",
    color: "#F472B6",
    highlights: ["Junior Research Fellowship (JRF)", "Doctoral Dissertation", "Academic Teaching"],
    careers: ["University Professor", "Senior Research Fellow", "Scientist in National Labs"]
  }
];

interface ExamItem {
  name: string;
  target: string;
  badge?: string;
}

interface ExamGroup {
  category: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
  exams: ExamItem[];
}

const ENTRANCE_EXAMS_10TH: ExamItem[] = [
  { name: "AP POLYCET", target: "Diploma/Polytechnic", badge: "Andhra Pradesh" },
  { name: "TG POLYCET", target: "Diploma/Polytechnic", badge: "Telangana" }
];

const ENTRANCE_EXAMS_INTERMEDIATE: ExamGroup[] = [
  {
    category: "Engineering / Technology",
    icon: "💻",
    color: "#60A5FA",
    borderColor: "rgba(96, 165, 250, 0.3)",
    bgColor: "rgba(96, 165, 250, 0.08)",
    exams: [
      { name: "AP EAPCET", target: "AP Engineering", badge: "State Level" },
      { name: "TG EAPCET", target: "Telangana Engineering", badge: "State Level" },
      { name: "JEE Main", target: "NITs, IIITs, other engineering colleges", badge: "National" },
      { name: "JEE Advanced", target: "IITs", badge: "Premier National" },
      { name: "BITSAT", target: "BITS", badge: "Deemed Univ" },
      { name: "VITEEE", target: "VIT", badge: "Deemed Univ" },
      { name: "SRMJEEE", target: "SRM", badge: "Deemed Univ" }
    ]
  },
  {
    category: "Medical",
    icon: "🩺",
    color: "#34D399",
    borderColor: "rgba(52, 211, 153, 0.3)",
    bgColor: "rgba(52, 211, 153, 0.08)",
    exams: [
      { name: "NEET-UG", target: "MBBS, BDS, AYUSH, etc.", badge: "All India Medical" }
    ]
  },
  {
    category: "Architecture / Design",
    icon: "🎨",
    color: "#C084FC",
    borderColor: "rgba(192, 132, 252, 0.3)",
    bgColor: "rgba(192, 132, 252, 0.08)",
    exams: [
      { name: "NATA", target: "B.Arch", badge: "National Council" },
      { name: "JEE Main Paper 2", target: "B.Arch/B.Planning", badge: "NTA National" },
      { name: "UCEED", target: "Undergraduate Design", badge: "IIT Bombay" }
    ]
  }
];

const ENTRANCE_EXAMS_DEGREE: ExamGroup[] = [
  {
    category: "Engineering / Technology",
    icon: "⚙️",
    color: "#60A5FA",
    borderColor: "rgba(96, 165, 250, 0.3)",
    bgColor: "rgba(96, 165, 250, 0.08)",
    exams: [
      { name: "AP PGECET", target: "M.Tech/M.Pharm/related PG", badge: "AP State" },
      { name: "TG PGECET", target: "M.Tech/M.Pharm/related PG", badge: "TG State" },
      { name: "GATE", target: "M.Tech/MS/PSU opportunities", badge: "National Premier" }
    ]
  },
  {
    category: "MBA / Management",
    icon: "📈",
    color: "#FBBF24",
    borderColor: "rgba(251, 191, 36, 0.3)",
    bgColor: "rgba(251, 191, 36, 0.08)",
    exams: [
      { name: "AP ICET", target: "MBA/MCA", badge: "AP State" },
      { name: "TG ICET", target: "MBA/MCA", badge: "TG State" },
      { name: "CAT", target: "IIMs and other B-schools", badge: "Premier National" },
      { name: "XAT", target: "XLRI and other B-schools", badge: "XLRI National" },
      { name: "CMAT", target: "Management institutes", badge: "AICTE / NTA" },
      { name: "MAT", target: "Management institutes", badge: "AIMA National" }
    ]
  },
  {
    category: "Government / Competitive",
    icon: "🏛️",
    color: "#F472B6",
    borderColor: "rgba(244, 114, 182, 0.3)",
    bgColor: "rgba(244, 114, 182, 0.08)",
    exams: [
      { name: "UPSC CSE", target: "Civil Services", badge: "Union UPSC" },
      { name: "SSC CGL", target: "Central Government jobs", badge: "Staff Selection" },
      { name: "IBPS PO/Clerk", target: "Banking", badge: "Public Sector Banks" },
      { name: "SBI PO/Clerk", target: "Banking", badge: "State Bank of India" },
      { name: "RRB exams", target: "Railways", badge: "Railway Recruitment" },
      { name: "APPSC exams", target: "Andhra Pradesh government", badge: "AP State Public Service" },
      { name: "TSPSC/TGPSC exams", target: "Telangana government", badge: "TG State Public Service" }
    ]
  }
];

export default function CareerPathwaysModal({
  isOpen,
  onClose,
  educationStage,
  onSelectStreamForScholarships
}: CareerPathwaysModalProps) {
  // Active stage (auto-detected from educationStage prop or localStorage session, with header quick-switcher)
  const [currentStage, setCurrentStage] = useState<"class_10" | "intermediate" | "b_tech">("class_10");

  useEffect(() => {
    if (educationStage) {
      const s = educationStage.toLowerCase();
      if (s === "class_10" || s === "intermediate" || s === "b_tech") {
        setCurrentStage(s as any);
        return;
      }
    }
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("skillcatalyst_session");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed.education_stage) {
            const s = parsed.education_stage.toLowerCase();
            if (s === "class_10" || s === "intermediate" || s === "b_tech") {
              setCurrentStage(s as any);
              return;
            }
          }
        }
      } catch {}
    }
    setCurrentStage("class_10");
  }, [educationStage, isOpen]);

  // 10th student views:
  // "options" = shows the two post-10th choices: [Intermediate / Diploma] and [Degree Options]
  // "intermediate_diploma" = shows Intermediate and Diploma side-by-side
  // "subgroups" = shows 14 subgroups
  // "degree" = shows Degree options
  const [tenthView, setTenthView] = useState<"options" | "intermediate_diploma" | "subgroups" | "degree">("options");
  const [selected10thOption, setSelected10thOption] = useState<TenthOption>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(true);

  // Single-selection collapse states (when one is clicked, all others collapse)
  const [activeStreamDetail, setActiveStreamDetail] = useState<IntermediateStream>(null);
  const [activeDiplomaBranch, setActiveDiplomaBranch] = useState<string | null>(null);
  const [activeAfterInterSubgroup, setActiveAfterInterSubgroup] = useState<string | null>(null);
  const [activeDegreeOption, setActiveDegreeOption] = useState<string | null>(null);

  // Search and filter for the 14 subgroups
  const [subgroupSearch, setSubgroupSearch] = useState("");
  const [subgroupStreamFilter, setSubgroupStreamFilter] = useState<string>("ALL");

  // Filter and collapse states for Entrance Exams
  const [interExamCategoryFilter, setInterExamCategoryFilter] = useState<string>("ALL");
  const [degreeExamCategoryFilter, setDegreeExamCategoryFilter] = useState<string>("ALL");
  const [is10thExamsExpanded, setIs10thExamsExpanded] = useState(false);
  const [isInterExamsExpanded, setIsInterExamsExpanded] = useState(false);
  const [isDegreeExamsExpanded, setIsDegreeExamsExpanded] = useState(false);
  const [isDiplomaExamsExpanded, setIsDiplomaExamsExpanded] = useState(false);

  if (!isOpen) return null;

  const handleResetAll = (newStage?: "class_10" | "intermediate" | "b_tech") => {
    setTenthView("options");
    setSelected10thOption(null);
    setIsDropdownOpen(true);
    setActiveStreamDetail(null);
    setActiveDiplomaBranch(null);
    setActiveAfterInterSubgroup(null);
    setActiveDegreeOption(null);
    setSubgroupSearch("");
    setSubgroupStreamFilter("ALL");
    setIs10thExamsExpanded(false);
    setIsInterExamsExpanded(false);
    setIsDegreeExamsExpanded(false);
    setIsDiplomaExamsExpanded(false);
    if (newStage) {
      setCurrentStage(newStage);
    }
  };

  const canGoBack =
    currentStage === "class_10"
      ? tenthView !== "options" || is10thExamsExpanded || isDiplomaExamsExpanded
      : currentStage === "intermediate"
      ? activeAfterInterSubgroup !== null || isInterExamsExpanded
      : activeDegreeOption !== null || isDegreeExamsExpanded;

  const handleBack = () => {
    if (currentStage === "class_10") {
      if (is10thExamsExpanded) {
        setIs10thExamsExpanded(false);
        return;
      }
      if (tenthView === "intermediate_diploma") {
        if (isDiplomaExamsExpanded) {
          setIsDiplomaExamsExpanded(false);
        } else if (activeStreamDetail) {
          setActiveStreamDetail(null);
        } else if (activeDiplomaBranch) {
          setActiveDiplomaBranch(null);
        } else if (selected10thOption) {
          setSelected10thOption(null);
        } else {
          setTenthView("options");
        }
      } else if (tenthView === "subgroups") {
        if (isInterExamsExpanded) {
          setIsInterExamsExpanded(false);
        } else if (activeAfterInterSubgroup) {
          setActiveAfterInterSubgroup(null);
        } else {
          setTenthView("intermediate_diploma");
        }
      } else if (tenthView === "degree") {
        if (isDegreeExamsExpanded) {
          setIsDegreeExamsExpanded(false);
        } else if (activeDegreeOption) {
          setActiveDegreeOption(null);
        } else {
          setTenthView("options");
        }
      }
    } else if (currentStage === "intermediate") {
      if (isInterExamsExpanded) {
        setIsInterExamsExpanded(false);
      } else if (activeAfterInterSubgroup) {
        setActiveAfterInterSubgroup(null);
      }
    } else if (currentStage === "b_tech") {
      if (isDegreeExamsExpanded) {
        setIsDegreeExamsExpanded(false);
      } else if (activeDegreeOption) {
        setActiveDegreeOption(null);
      }
    }
  };

  const handleBackTo10thOptions = () => {
    setSelected10thOption(null);
    setActiveStreamDetail(null);
    setActiveDiplomaBranch(null);
  };

  // Filter the 14 subgroups based on search & stream filter
  const filteredSubgroups = AFTER_INTERMEDIATE_SUBGROUPS.filter((sg) => {
    const matchesSearch =
      sg.name.toLowerCase().includes(subgroupSearch.toLowerCase()) ||
      sg.tagline.toLowerCase().includes(subgroupSearch.toLowerCase()) ||
      sg.roles.some((r) => r.toLowerCase().includes(subgroupSearch.toLowerCase()));
    const matchesStream =
      subgroupStreamFilter === "ALL" || sg.eligibleStreams.includes(subgroupStreamFilter);
    return matchesSearch && matchesStream;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="bg-[#12121A] border border-[#2B2B3C] rounded-3xl w-full max-w-2xl max-h-[92vh] flex flex-col shadow-[0_20px_60px_rgba(0,0,0,0.85)] relative overflow-hidden"
      >
        {/* Glowing top ambient header accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-pink-500 via-amber-400 to-indigo-500" />

        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#20202C] flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {canGoBack && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="w-8 h-8 rounded-full bg-[#1C1C28] hover:bg-[#282838] text-white flex items-center justify-center border border-[#303044] transition-colors cursor-pointer shrink-0"
                  title="Go back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <Compass className="w-5 h-5 text-pink-400" />
                    <span>Career Pathways</span>
                  </h2>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-pink-500/15 border border-pink-500/30 text-pink-300">
                    {currentStage === "class_10" ? "Post-10th" : currentStage === "intermediate" ? "Degree Tracks" : "Post-Degree"}
                  </span>
                </div>
                <p className="text-xs text-[#8E8E9C] mt-0.5">
                  {currentStage === "class_10"
                    ? "Post-10th Pathways · Intermediate / Diploma & State Entrance Exams"
                    : currentStage === "intermediate"
                    ? "Degree Pathways · Career Trajectories after Intermediate / Diploma"
                    : "Post-Degree Specializations · Higher Studies, Placements, Civil & Research"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {canGoBack && (
                <button
                  type="button"
                  onClick={() => handleResetAll()}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs text-[#8E8E9C] hover:text-white bg-[#1A1A26] hover:bg-[#222234] border border-[#2B2B3C] transition-colors cursor-pointer"
                  title="Reset view"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className="p-2 text-[#8E8E9C] hover:text-white hover:bg-[#1E1E2C] rounded-full transition-colors cursor-pointer"
                title="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Stage Indicator & Switcher Tab Bar */}
          <div className="flex items-center justify-between pt-1 border-t border-[#1E1E2C] flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs text-[#7E7E94]">
              <span className="hidden sm:inline">Viewing as:</span>
              <div className="inline-flex items-center p-0.5 rounded-xl bg-[#0E0E16] border border-[#242436]">
                <button
                  type="button"
                  onClick={() => handleResetAll("class_10")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    currentStage === "class_10"
                      ? "bg-pink-500/25 text-pink-300 border border-pink-500/40 shadow-xs font-extrabold"
                      : "text-[#8E8E9C] hover:text-white"
                  }`}
                >
                  10th Student
                </button>
                <button
                  type="button"
                  onClick={() => handleResetAll("intermediate")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    currentStage === "intermediate"
                      ? "bg-amber-500/25 text-amber-300 border border-amber-500/40 shadow-xs font-extrabold"
                      : "text-[#8E8E9C] hover:text-white"
                  }`}
                >
                  Inter / Diploma
                </button>
                <button
                  type="button"
                  onClick={() => handleResetAll("b_tech")}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                    currentStage === "b_tech"
                      ? "bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-xs font-extrabold"
                      : "text-[#8E8E9C] hover:text-white"
                  }`}
                >
                  Undergrad
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 custom-scrollbar">

          {/* ========================================================================= */}
          {/* 10th STUDENT VIEW: POST-10th OPTIONS (Intermediate/Diploma & Degree)      */}
          {/* ========================================================================= */}
          {currentStage === "class_10" && tenthView === "options" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between pb-1">
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-[#8E8E9C] uppercase tracking-wider">
                    Post-10th Pathway Choices
                  </span>
                  {is10thExamsExpanded && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-pink-400">Entrance Exams</span>
                    </>
                  )}
                </div>
                {is10thExamsExpanded ? (
                  <button
                    type="button"
                    onClick={() => setIs10thExamsExpanded(false)}
                    className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Show All Choices</span>
                  </button>
                ) : (
                  <span className="text-xs text-pink-400 font-medium">
                    2 Pathways
                  </span>
                )}
              </div>

              <div className="space-y-3">
                {/* 1. Intermediate / Diploma Card (Only shown when entrance exams not expanded) */}
                {!is10thExamsExpanded && (
                  <motion.div
                    whileHover={{ scale: 1.01, borderColor: "rgba(244, 114, 182, 0.5)" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => {
                      setTenthView("intermediate_diploma");
                      setSelected10thOption(null);
                      setActiveStreamDetail(null);
                      setActiveDiplomaBranch(null);
                    }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181824] to-[#14141E] border border-[#2B2B3C] cursor-pointer group transition-all duration-200 shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                        <BookOpen className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                            Intermediate / Diploma
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-300">
                            Immediate Next Step
                          </span>
                        </div>
                        <p className="text-xs text-[#8E8E9C] mt-1 leading-relaxed">
                          Choose between <strong>Intermediate (+2 Junior College: MPC, BiPC, MEC, CEC)</strong> or <strong>Polytechnic (3-Year Technical Diploma)</strong>.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-pink-300 border border-pink-500/20">MPC</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-emerald-300 border border-emerald-500/20">BiPC</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-amber-300 border border-amber-500/20">MEC</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-pink-300 border border-pink-500/20">CEC</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-indigo-300 border border-indigo-500/20">Polytechnic Diploma</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1F1F2E] group-hover:bg-pink-500 text-white flex items-center justify-center shrink-0 transition-colors">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </motion.div>
                )}

                {/* 2. ENTRANCE EXAMS SECTION: AFTER 10TH (Collapsible / Expandible) */}
                {!is10thExamsExpanded ? (
                  <motion.div
                    whileHover={{ scale: 1.01, borderColor: "rgba(244, 114, 182, 0.5)" }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setIs10thExamsExpanded(true)}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181824] to-[#14141E] border border-[#2B2B3C] cursor-pointer group transition-all duration-200 shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base sm:text-lg font-bold text-white group-hover:text-pink-300 transition-colors">
                            Entrance Exams (After 10th)
                          </h3>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-500/15 border border-pink-500/30 text-pink-300">
                            Diploma / Polytechnic · 2 Entrances
                          </span>
                        </div>
                        <p className="text-xs text-[#8E8E9C] mt-1 leading-relaxed">
                          State-level entrance examinations for direct admission into 3-Year Technical Polytechnic Diplomas.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-pink-300 border border-pink-500/20">AP POLYCET</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#101018] text-pink-300 border border-pink-500/20">TG POLYCET</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1F1F2E] group-hover:bg-pink-500 text-white flex items-center justify-center shrink-0 transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161624] to-[#12121C] border border-pink-500/40 shadow-xl space-y-3.5 ring-1 ring-pink-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Entrance Exams: After 10th</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 font-semibold border border-pink-500/30">
                              Diploma / Polytechnic
                            </span>
                          </h4>
                          <p className="text-[11px] text-[#8E8E9C]">
                            State-level entrance examinations for direct admission into 3-Year Technical Polytechnic Diplomas:
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIs10thExamsExpanded(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C1C28] hover:bg-[#252536] text-pink-300 border border-pink-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Collapse</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {ENTRANCE_EXAMS_10TH.map((exam, idx) => (
                        <div
                          key={idx}
                          className="p-3.5 rounded-xl bg-[#181826] border border-[#2B2B3C] hover:border-pink-500/40 hover:bg-[#1B1B2A] transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-pink-300 tracking-tight group-hover:text-pink-200">
                                {exam.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">
                                {exam.badge}
                              </span>
                            </div>
                            <p className="text-xs text-[#CBCBD8] mt-1 flex items-center gap-1.5">
                              <span className="text-[#6E6E82]">—</span>
                              <span className="font-medium text-white/90">{exam.target}</span>
                            </p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* 10th STUDENT VIEW: INTERMEDIATE & DIPLOMA EXPLORER                        */}
          {/* Shows options: Intermediate              Diploma                          */}
          {/* When Intermediate is clicked, Diploma disappears and dropdown opens!     */}
          {/* ========================================================================= */}
          {currentStage === "class_10" && tenthView === "intermediate_diploma" && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-5"
            >
              {/* Breadcrumb path */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setTenthView("options")}
                    className="text-[#8E8E9C] hover:text-white transition-colors cursor-pointer"
                  >
                    Post-10th Options
                  </button>
                  <span className="text-[#55556A]">/</span>
                  <span className="font-bold text-pink-400">Intermediate & Diploma</span>
                  {selected10thOption && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-semibold text-white capitalize">{selected10thOption}</span>
                    </>
                  )}
                  {activeStreamDetail && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-amber-400">{activeStreamDetail}</span>
                    </>
                  )}
                  {activeDiplomaBranch && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-emerald-400">
                        {DIPLOMA_BRANCHES.find(b => b.id === activeDiplomaBranch)?.name || "Branch"}
                      </span>
                    </>
                  )}
                </div>

                {selected10thOption && (
                  <button
                    type="button"
                    onClick={handleBackTo10thOptions}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Show Both Options</span>
                  </button>
                )}
              </div>

              {/* Title & prompt */}
              <div>
                <h3 className="text-base sm:text-lg font-bold text-white">
                  {selected10thOption === "intermediate"
                    ? activeStreamDetail
                      ? `${activeStreamDetail} Stream Roadmap`
                      : "Intermediate (+2) Stream Options"
                    : selected10thOption === "diploma"
                    ? activeDiplomaBranch
                      ? "Polytechnic Branch Details"
                      : "Polytechnic Diploma Branches"
                    : "Select Pathway After 10th"}
                </h3>
                <p className="text-xs text-[#8E8E9C] mt-0.5">
                  {selected10thOption === "intermediate"
                    ? activeStreamDetail
                      ? `Viewing ${activeStreamDetail} details. Click option again or 'Show All Streams' to view all options.`
                      : "Click on any stream (MPC, BiPC, MEC, CEC) to inspect curriculum and collapse others."
                    : selected10thOption === "diploma"
                    ? activeDiplomaBranch
                      ? "Viewing polytechnic branch details and lateral entry pathways."
                      : "Choose a technical diploma specialization or view lateral entry."
                    : "Choose whether you wish to pursue academic Junior College or 3-Year Polytechnic."}
                </p>
              </div>

              {/* DUAL OPTIONS CONTAINER: Intermediate | Diploma */}
              <div className="w-full">
                <div
                  className={`grid transition-all duration-300 ${
                    selected10thOption === "intermediate" || selected10thOption === "diploma"
                      ? "grid-cols-1"
                      : "grid-cols-1 sm:grid-cols-2 gap-4"
                  }`}
                >
                  {/* OPTION 1: INTERMEDIATE */}
                  <AnimatePresence>
                    {(selected10thOption === null || selected10thOption === "intermediate") && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, width: 0, padding: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-2xl border transition-all ${
                          selected10thOption === "intermediate"
                            ? "border-pink-500/50 bg-[#161624] shadow-[0_0_25px_rgba(244,114,182,0.15)]"
                            : "border-[#2B2B3C] bg-[#161622] hover:border-pink-500/40 cursor-pointer shadow-md hover:scale-[1.02]"
                        }`}
                      >
                        {selected10thOption === "intermediate" ? (
                          /* EXPANDED HEADER: Full width with clean horizontal alignment */
                          <div
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                            className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-base sm:text-lg text-white">
                                    Intermediate
                                  </h4>
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 whitespace-nowrap">
                                    +2 (2 Years)
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    Active
                                  </span>
                                </div>
                                <p className="text-xs text-[#8E8E9C] mt-0.5 truncate">
                                  Higher Secondary Certificate / Junior College
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-pink-500/20 text-pink-300 flex items-center justify-center border border-pink-500/40 hover:bg-pink-500/30 transition-colors">
                                {isDropdownOpen ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* SIDE-BY-SIDE CARD: Properly aligned top-badge and bottom Select button */
                          <div
                            onClick={() => {
                              setSelected10thOption("intermediate");
                              setIsDropdownOpen(true);
                              setActiveStreamDetail(null);
                            }}
                            className="p-4 sm:p-5 cursor-pointer flex flex-col justify-between h-full group"
                          >
                            {/* Top row: Icon + +2 (2 Years) Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="w-10 h-10 rounded-xl bg-pink-500/15 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                                <BookOpen className="w-5 h-5" />
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-pink-500/20 text-pink-300 border border-pink-500/30 whitespace-nowrap shadow-xs">
                                +2 (2 Years)
                              </span>
                            </div>

                            {/* Middle: Title & Description */}
                            <div className="my-1">
                              <h4 className="font-extrabold text-base sm:text-lg text-white group-hover:text-pink-300 transition-colors">
                                Intermediate
                              </h4>
                              <p className="text-xs text-[#8E8E9C] mt-0.5 leading-relaxed">
                                Higher Secondary / Junior College
                              </p>
                            </div>

                            {/* Bottom row: Streams hint & properly aligned Select button */}
                            <div className="mt-3 pt-3 border-t border-[#262638] flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono text-[#7E7E94]">
                                MPC, BiPC, MEC, CEC
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-pink-500/25 group-hover:bg-pink-500/40 border border-pink-500/40 group-hover:border-pink-400 px-3.5 py-1.5 rounded-full transition-all shadow-sm">
                                <span>Select</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* =========================================================== */}
                        {/* DROPDOWN FOR INTERMEDIATE: MPC, BiPC, MEC, CEC              */}
                        {/* WHEN ONE IS CLICKED, ALL OTHER OPTIONS COLLAPSE!            */}
                        {/* =========================================================== */}
                        <AnimatePresence>
                          {selected10thOption === "intermediate" && isDropdownOpen && (
                            <motion.div
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: "auto" }}
                              exit={{ opacity: 0, height: 0 }}
                              transition={{ duration: 0.3 }}
                              className="border-t border-[#242434] p-4 sm:p-5 bg-[#12121C] rounded-b-2xl space-y-3.5"
                            >
                              <div className="flex items-center justify-between pb-1">
                                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E9C]">
                                  {activeStreamDetail
                                    ? `Selected Stream: ${activeStreamDetail}`
                                    : "Select Intermediate Stream:"}
                                </span>

                                {activeStreamDetail ? (
                                  <button
                                    type="button"
                                    onClick={() => setActiveStreamDetail(null)}
                                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Show All Streams (MPC, BiPC, MEC, CEC)</span>
                                  </button>
                                ) : (
                                  <span className="text-[11px] text-emerald-400 font-mono">
                                    4 Core Streams
                                  </span>
                                )}
                              </div>

                              {/* Streams Grid: Filters to ONLY the clicked option when active! */}
                              <div
                                className={`grid transition-all duration-300 ${
                                  activeStreamDetail ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 gap-3"
                                }`}
                              >
                                <AnimatePresence>
                                  {(["MPC", "BiPC", "MEC", "CEC"] as const)
                                    .filter((streamKey) => !activeStreamDetail || activeStreamDetail === streamKey)
                                    .map((streamKey) => {
                                      const stream = INTERMEDIATE_STREAMS[streamKey];
                                      const isSelected = activeStreamDetail === streamKey;

                                      return (
                                        <motion.div
                                          key={streamKey}
                                          layout
                                          initial={{ opacity: 0, scale: 0.95 }}
                                          animate={{ opacity: 1, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.85, height: 0, margin: 0, padding: 0 }}
                                          transition={{ duration: 0.25 }}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            // Toggle: click opens & collapses others; click again re-expands all
                                            setActiveStreamDetail(isSelected ? null : streamKey);
                                          }}
                                          className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                            isSelected
                                              ? "border-amber-400 bg-[#1A1A2A] shadow-lg ring-1 ring-amber-400/50"
                                              : "border-[#2A2A3C] bg-[#161622] hover:border-[#3E3E56] hover:bg-[#1A1A28] shadow-sm hover:scale-[1.01]"
                                          }`}
                                          style={{
                                            borderLeftColor: stream.color,
                                            borderLeftWidth: "4px"
                                          }}
                                        >
                                          <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                              <span
                                                className="font-extrabold text-base tracking-tight"
                                                style={{ color: stream.color }}
                                              >
                                                {stream.code}
                                              </span>
                                              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                                                {stream.badge}
                                              </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                              {isSelected && (
                                                <span className="text-[10px] font-bold text-amber-300 bg-amber-400/15 px-2 py-0.5 rounded-full">
                                                  Active Stream
                                                </span>
                                              )}
                                              <ChevronDown
                                                className={`w-4 h-4 text-[#8E8E9C] transition-transform duration-200 ${
                                                  isSelected ? "rotate-180 text-amber-400" : ""
                                                }`}
                                              />
                                            </div>
                                          </div>
                                          <p className="text-xs font-medium text-[#E2E2EC] mt-1">
                                            {stream.name}
                                          </p>
                                          <p className="text-[11px] text-[#8E8E9C] mt-1">
                                            {stream.tagline}
                                          </p>
                                        </motion.div>
                                      );
                                    })}
                                </AnimatePresence>
                              </div>

                              {/* ACTIVE STREAM EXPANDED DETAIL VIEW */}
                              <AnimatePresence>
                                {activeStreamDetail && (
                                  <motion.div
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    transition={{ duration: 0.25 }}
                                    className="p-4 rounded-xl border bg-[#181826] space-y-3.5 shadow-lg"
                                    style={{
                                      borderColor: INTERMEDIATE_STREAMS[activeStreamDetail].borderColor,
                                      backgroundColor: INTERMEDIATE_STREAMS[activeStreamDetail].bgLight
                                    }}
                                  >
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <Sparkles className="w-4 h-4" style={{ color: INTERMEDIATE_STREAMS[activeStreamDetail].color }} />
                                        <h5 className="font-bold text-sm text-white">
                                          {INTERMEDIATE_STREAMS[activeStreamDetail].fullTitle}
                                        </h5>
                                      </div>
                                      <button
                                        type="button"
                                        onClick={() => setActiveStreamDetail(null)}
                                        className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/40 text-amber-300 hover:text-white border border-white/10 transition-colors cursor-pointer"
                                      >
                                        Change Stream
                                      </button>
                                    </div>

                                    <p className="text-xs text-[#CBCBD8] leading-relaxed">
                                      {INTERMEDIATE_STREAMS[activeStreamDetail].tagline}
                                    </p>

                                    {/* Subjects */}
                                    <div>
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E8E9C] block mb-1.5">
                                        Core Subjects Covered:
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {INTERMEDIATE_STREAMS[activeStreamDetail].subjects.map((sub, idx) => (
                                          <span
                                            key={idx}
                                            className="px-2 py-0.5 rounded-md bg-[#12121A] border border-[#2B2B3C] text-[11px] text-[#E2E2EC]"
                                          >
                                            {sub}
                                          </span>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Top Career Subgroups matching this stream */}
                                    <div className="pt-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1.5">
                                        🚀 Matching Career Subgroups After {activeStreamDetail}:
                                      </span>
                                      <div className="flex flex-wrap gap-1.5">
                                        {INTERMEDIATE_STREAMS[activeStreamDetail].matchingSubgroups.map((sg, idx) => (
                                          <button
                                            key={idx}
                                            type="button"
                                            onClick={() => {
                                              setTenthView("subgroups");
                                              const match = AFTER_INTERMEDIATE_SUBGROUPS.find(item => item.name === sg);
                                              if (match) setActiveAfterInterSubgroup(match.id);
                                            }}
                                            className="px-2.5 py-1 rounded-lg bg-[#141420] hover:bg-[#1E1E2E] border border-amber-400/30 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors cursor-pointer"
                                          >
                                            <span>{sg}</span>
                                            <ArrowUpRight className="w-3 h-3 text-amber-300" />
                                          </button>
                                        ))}
                                      </div>
                                    </div>

                                    {/* Career Pathways & Entrance Exams */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                                      <div className="p-3 rounded-lg bg-[#12121A]/70 border border-[#262638]">
                                        <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block mb-1">
                                          🎯 Top Career Trajectories
                                        </span>
                                        <ul className="text-[11px] text-[#A6A6BC] space-y-1">
                                          {INTERMEDIATE_STREAMS[activeStreamDetail].careers.slice(0, 4).map((c, i) => (
                                            <li key={i} className="flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                                              <span className="truncate">{c}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>

                                      <div className="p-3 rounded-lg bg-[#12121A]/70 border border-[#262638]">
                                        <span className="text-[10px] font-bold text-cyan-300 uppercase tracking-wider block mb-1">
                                          📝 Major Entrance Exams
                                        </span>
                                        <ul className="text-[11px] text-[#A6A6BC] space-y-1">
                                          {INTERMEDIATE_STREAMS[activeStreamDetail].exams.map((exam, i) => (
                                            <li key={i} className="flex items-center gap-1.5">
                                              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shrink-0" />
                                              <span className="truncate">{exam}</span>
                                            </li>
                                          ))}
                                        </ul>
                                      </div>
                                    </div>

                                    {/* Action link directly to 14 Subgroups */}
                                    <div className="pt-2 flex justify-end">
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setTenthView("subgroups");
                                          setSubgroupStreamFilter(activeStreamDetail || "ALL");
                                        }}
                                        className="text-xs text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1 transition-colors cursor-pointer"
                                      >
                                        <span>View all 14 Career Subgroups after Intermediate</span>
                                        <ArrowUpRight className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

                              {/* Quick jump to all 14 subgroups button */}
                              {!activeStreamDetail && (
                                <div className="pt-2 text-center">
                                  <button
                                    type="button"
                                    onClick={() => setTenthView("subgroups")}
                                    className="text-xs text-amber-400 hover:text-amber-300 font-medium inline-flex items-center gap-1 transition-colors cursor-pointer"
                                  >
                                    <span>Looking for pathways after +2? Explore 14 Career Subgroups</span>
                                    <ArrowUpRight className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* OPTION 2: DIPLOMA */}
                  <AnimatePresence>
                    {(selected10thOption === null || selected10thOption === "diploma") && (
                      <motion.div
                        layout
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.85, width: 0, padding: 0 }}
                        transition={{ duration: 0.25 }}
                        className={`rounded-2xl border transition-all ${
                          selected10thOption === "diploma"
                            ? "border-emerald-500/50 bg-[#161624] shadow-[0_0_25px_rgba(52,211,153,0.15)]"
                            : "border-[#2B2B3C] bg-[#161622] hover:border-emerald-500/40 cursor-pointer shadow-md hover:scale-[1.02]"
                        }`}
                      >
                        {selected10thOption === "diploma" ? (
                          /* EXPANDED DIPLOMA HEADER */
                          <div
                            onClick={() => setSelected10thOption(null)}
                            className="p-4 sm:p-5 cursor-pointer flex items-center justify-between gap-4"
                          >
                            <div className="flex items-center gap-3.5 min-w-0">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
                                <Layers className="w-5 h-5" />
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-extrabold text-base sm:text-lg text-white">
                                    Diploma
                                  </h4>
                                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap">
                                    3 Years
                                  </span>
                                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
                                    Active
                                  </span>
                                </div>
                                <p className="text-xs text-[#8E8E9C] mt-0.5 truncate">
                                  Polytechnic Technical Diploma & Skill Programs
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/40">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            </div>
                          </div>
                        ) : (
                          /* SIDE-BY-SIDE DIPLOMA CARD */
                          <div
                            onClick={() => {
                              setSelected10thOption("diploma");
                              setActiveDiplomaBranch(null);
                            }}
                            className="p-4 sm:p-5 cursor-pointer flex flex-col justify-between h-full group"
                          >
                            {/* Top row: Icon + 3 Years Badge */}
                            <div className="flex items-center justify-between gap-2 mb-2.5">
                              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0 group-hover:scale-105 transition-transform">
                                <Layers className="w-5 h-5" />
                              </div>
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 whitespace-nowrap shadow-xs">
                                3 Years
                              </span>
                            </div>

                            {/* Middle: Title & Description */}
                            <div className="my-1">
                              <h4 className="font-extrabold text-base sm:text-lg text-white group-hover:text-emerald-300 transition-colors">
                                Diploma
                              </h4>
                              <p className="text-xs text-[#8E8E9C] mt-0.5 leading-relaxed">
                                Polytechnic Technical Diploma
                              </p>
                            </div>

                            {/* Bottom row: Branch hint & properly aligned Select button */}
                            <div className="mt-3 pt-3 border-t border-[#262638] flex items-center justify-between gap-2">
                              <span className="text-[11px] font-mono text-[#7E7E94]">
                                CSE, Mech, ECE...
                              </span>
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-500/25 group-hover:bg-emerald-500/40 border border-emerald-500/40 group-hover:border-emerald-400 px-3.5 py-1.5 rounded-full transition-all shadow-sm">
                                <span>Select</span>
                                <ArrowUpRight className="w-3.5 h-3.5" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Diploma Expanded Content with single-selection collapse */}
                        {selected10thOption === "diploma" && !isDiplomaExamsExpanded && (
                          <div className="border-t border-[#242434] p-4 sm:p-5 bg-[#12121C] rounded-b-2xl space-y-3.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E8E9C]">
                                {activeDiplomaBranch
                                  ? `Selected Branch: ${DIPLOMA_BRANCHES.find(b => b.id === activeDiplomaBranch)?.name}`
                                  : "Popular Polytechnic Streams:"}
                              </span>

                              {activeDiplomaBranch && (
                                <button
                                  type="button"
                                  onClick={() => setActiveDiplomaBranch(null)}
                                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3 h-3" />
                                  <span>Show All Branches</span>
                                </button>
                              )}
                            </div>

                            <div
                              className={`grid transition-all duration-300 ${
                                activeDiplomaBranch ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 gap-2.5"
                              }`}
                            >
                              <AnimatePresence>
                                {DIPLOMA_BRANCHES
                                  .filter((branch) => !activeDiplomaBranch || activeDiplomaBranch === branch.id)
                                  .map((branch) => {
                                    const isSelected = activeDiplomaBranch === branch.id;
                                    return (
                                      <motion.div
                                        key={branch.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.85, height: 0 }}
                                        transition={{ duration: 0.25 }}
                                        onClick={() => setActiveDiplomaBranch(isSelected ? null : branch.id)}
                                        className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                          isSelected
                                            ? "border-emerald-400 bg-[#16221D] shadow-lg ring-1 ring-emerald-400/50"
                                            : "border-[#2B2B3C] bg-[#181826] hover:border-[#3E3E56]"
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <h6 className="text-xs font-bold text-emerald-300">{branch.name}</h6>
                                          <ChevronDown
                                            className={`w-4 h-4 text-[#8E8E9C] transition-transform duration-200 ${
                                              isSelected ? "rotate-180 text-emerald-400" : ""
                                            }`}
                                          />
                                        </div>
                                        <p className="text-[10px] text-[#8E8E9C] mt-1">{branch.desc}</p>

                                        {isSelected && (
                                          <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="mt-3 pt-3 border-t border-[#2A3A30] space-y-2"
                                          >
                                            <div>
                                              <span className="text-[9px] font-bold uppercase text-emerald-400 block mb-1">
                                                Key Modules:
                                              </span>
                                              <div className="flex flex-wrap gap-1">
                                                {branch.subjects.map((sub, idx) => (
                                                  <span
                                                    key={idx}
                                                    className="px-2 py-0.5 rounded text-[10px] bg-[#12121A] text-[#C4E5D4]"
                                                  >
                                                    {sub}
                                                  </span>
                                                ))}
                                              </div>
                                            </div>
                                            <p className="text-[10px] text-[#A6C4B4] leading-relaxed">
                                              <strong>Lateral Entry Pathway:</strong> {branch.lateralEntry}
                                            </p>
                                          </motion.div>
                                        )}
                                      </motion.div>
                                    );
                                  })}
                              </AnimatePresence>
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Entrance Exams for Polytechnic / Diploma (Collapsible / Expandible) */}
                {!isDiplomaExamsExpanded ? (
                  <motion.div
                    whileHover={{ scale: 1.005, borderColor: "rgba(244, 114, 182, 0.5)" }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => setIsDiplomaExamsExpanded(true)}
                    className="p-4 rounded-xl bg-gradient-to-br from-[#181824] to-[#14141E] border border-[#2B2B3C] cursor-pointer group transition-all duration-200 shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-10 h-10 rounded-xl bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Award className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="text-sm font-bold text-white group-hover:text-pink-300 transition-colors">
                            Entrance Exams: After 10th for Polytechnic
                          </h5>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 font-semibold border border-pink-500/30">
                            State Board Entrances · 2 Exams
                          </span>
                        </div>
                        <p className="text-xs text-[#8E8E9C] mt-0.5">
                          Mandatory state polytechnic entrance tests: AP POLYCET & TG POLYCET.
                        </p>
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-pink-300 border border-pink-500/20 font-bold">AP POLYCET</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-pink-300 border border-pink-500/20 font-bold">TG POLYCET</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1F1F2E] group-hover:bg-pink-500 text-white flex items-center justify-center shrink-0 transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161624] to-[#12121C] border border-pink-500/40 shadow-xl space-y-3.5 ring-1 ring-pink-500/30"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-pink-500/10 border border-pink-500/30 flex items-center justify-center text-pink-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Entrance Exams: After 10th for Polytechnic</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-500/15 text-pink-300 font-semibold border border-pink-500/30">
                              State Board Entrances
                            </span>
                          </h4>
                          <p className="text-[11px] text-[#8E8E9C]">
                            Mandatory state polytechnic entrance tests for Diploma admissions:
                          </p>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setIsDiplomaExamsExpanded(false)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C1C28] hover:bg-[#252536] text-pink-300 border border-pink-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                        <span>Collapse</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                      {ENTRANCE_EXAMS_10TH.map((exam, idx) => (
                        <div
                          key={idx}
                          className="p-3 rounded-xl bg-[#181826] border border-[#2B2B3C] hover:border-pink-500/40 hover:bg-[#1B1B2A] transition-all flex items-center justify-between gap-3 group"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-extrabold text-sm text-pink-300 tracking-tight group-hover:text-pink-200">
                                {exam.name}
                              </span>
                              <span className="text-[9px] px-1.5 py-0.2 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold">
                                {exam.badge}
                              </span>
                            </div>
                            <p className="text-xs text-[#CBCBD8] mt-0.5 flex items-center gap-1.5">
                              <span className="text-[#6E6E82]">—</span>
                              <span className="font-medium text-white/90">{exam.target}</span>
                            </p>
                          </div>
                          <div className="w-6 h-6 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-400 shrink-0 group-hover:scale-110 transition-transform">
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* INTERMEDIATE / DEGREE PATHWAYS: 14 CAREER SUBGROUPS                       */}
          {/* Directly shown for Intermediate students (10th skipped); accessible for 10th*/}
          {/* When an option is clicked, all other 13 collapse!                         */}
          {/* ========================================================================= */}
          {(currentStage === "intermediate" || (currentStage === "class_10" && tenthView === "subgroups")) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {currentStage === "class_10" ? (
                    <button
                      type="button"
                      onClick={() => setTenthView("intermediate_diploma")}
                      className="text-[#8E8E9C] hover:text-white transition-colors cursor-pointer"
                    >
                      ← Intermediate Streams
                    </button>
                  ) : (
                    <span className="font-bold text-amber-400">Degree Pathways (Post Inter / Diploma)</span>
                  )}
                  {activeAfterInterSubgroup && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-white">
                        {AFTER_INTERMEDIATE_SUBGROUPS.find(o => o.id === activeAfterInterSubgroup)?.name}
                      </span>
                    </>
                  )}
                  {isInterExamsExpanded && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-amber-400">Entrance Exams</span>
                    </>
                  )}
                </div>

                {isInterExamsExpanded && (
                  <button
                    type="button"
                    onClick={() => setIsInterExamsExpanded(false)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Show All 14 Subgroups</span>
                  </button>
                )}

                {activeAfterInterSubgroup && (
                  <button
                    type="button"
                    onClick={() => setActiveAfterInterSubgroup(null)}
                    className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Show All 14 Subgroups</span>
                  </button>
                )}
              </div>

              {/* ENTRANCE EXAMS SECTION: AFTER INTERMEDIATE / DIPLOMA (Collapsible / Expandible) */}
              {!activeAfterInterSubgroup && (
                !isInterExamsExpanded ? (
                  <motion.div
                    whileHover={{ scale: 1.005, borderColor: "rgba(251, 191, 36, 0.5)" }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => setIsInterExamsExpanded(true)}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181824] to-[#14141E] border border-[#2B2B3C] cursor-pointer group transition-all duration-200 shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                            Entrance Exams (After Intermediate / Diploma)
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                            11 Key Entrances
                          </span>
                        </div>
                        <p className="text-xs text-[#8E8E9C] mt-1 leading-relaxed">
                          Major entrance tests across Engineering, Medical, and Architecture/Design (AP/TG EAPCET, JEE Main, JEE Adv, NEET-UG, BITSAT, etc.)
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-amber-300 border border-amber-500/20 font-bold">Engineering / Tech (7)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-emerald-300 border border-emerald-500/20 font-bold">Medical (1)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-indigo-300 border border-indigo-500/20 font-bold">Architecture / Design (3)</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1F1F2E] group-hover:bg-amber-500 text-white flex items-center justify-center shrink-0 transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161624] to-[#12121C] border border-amber-400/40 shadow-xl space-y-4 ring-1 ring-amber-400/30"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Entrance Exams: After Intermediate / Diploma</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30">
                              11 Key Entrances
                            </span>
                          </h4>
                          <p className="text-[11px] text-[#8E8E9C]">
                            Major entrance tests across Engineering, Medical, and Architecture/Design:
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Category filter pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setInterExamCategoryFilter("ALL")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              interExamCategoryFilter === "ALL"
                                ? "bg-amber-400 text-black font-extrabold shadow-xs"
                                : "bg-[#181826] text-[#8E8E9C] hover:text-white border border-[#2B2B3C]"
                            }`}
                          >
                            All (11)
                          </button>
                          {ENTRANCE_EXAMS_INTERMEDIATE.map((cat) => (
                            <button
                              key={cat.category}
                              type="button"
                              onClick={() => setInterExamCategoryFilter(cat.category)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                interExamCategoryFilter === cat.category
                                  ? "bg-amber-400 text-black font-extrabold shadow-xs"
                                  : "bg-[#181826] text-[#8E8E9C] hover:text-white border border-[#2B2B3C]"
                              }`}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.category.split(" / ")[0]}</span>
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsInterExamsExpanded(false)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C1C28] hover:bg-[#252536] text-amber-300 border border-amber-400/30 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Collapse</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {ENTRANCE_EXAMS_INTERMEDIATE
                        .filter((cat) => interExamCategoryFilter === "ALL" || interExamCategoryFilter === cat.category)
                        .map((cat) => (
                          <div key={cat.category} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{cat.icon}</span>
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cat.color }}>
                                {cat.category}
                              </span>
                              <span className="text-[10px] text-[#6E6E82]">({cat.exams.length} exams)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {cat.exams.map((exam, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-[#181826] border border-[#262638] hover:border-[#3E3E56] hover:bg-[#1B1B2A] transition-all flex flex-col justify-between gap-1 group"
                                  style={{ borderLeftColor: cat.color, borderLeftWidth: "3px" }}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="font-extrabold text-xs tracking-tight text-white group-hover:text-amber-300 transition-colors">
                                      {exam.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-[#A6A6BC] font-semibold border border-white/10 shrink-0">
                                      {exam.badge}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#A6A6BC] flex items-center gap-1">
                                    <span className="text-[#6E6E82] shrink-0">—</span>
                                    <span className="truncate">{exam.target}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )
              )}

              {/* 14 CAREER SUBGROUPS (Only shown when Entrance Exams is NOT expanded) */}
              {!isInterExamsExpanded && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#161622] border border-[#2B2B3C] space-y-4">
                  {/* Header info */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-bold text-white text-base sm:text-lg flex items-center gap-2">
                        <span>Degree Pathways</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                          14 Fields
                        </span>
                      </h3>
                      <p className="text-xs text-[#8E8E9C] mt-0.5">
                        {activeAfterInterSubgroup
                          ? "Viewing specialized degrees, careers, and entrance exams. Click again or 'Show All' to restore others."
                          : "Post-intermediate undergraduate degree paths. Click on any field to inspect career trajectories and collapse others:"}
                      </p>
                    </div>
                  </div>

                  {/* Stream Quick Filter and Search Bar (Only shown when not collapsed) */}
                  {!activeAfterInterSubgroup && (
                    <div className="space-y-2.5 pt-1">
                      {/* Search bar */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-[#8E8E9C] absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Search subgroups, careers (e.g. Software, Doctor, CA, Pilot, Lawyer)..."
                          value={subgroupSearch}
                          onChange={(e) => setSubgroupSearch(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#101018] border border-[#2B2B3C] focus:border-amber-400/60 text-xs text-white placeholder:text-[#6C6C7E] outline-hidden transition-colors"
                        />
                        {subgroupSearch && (
                          <button
                            type="button"
                            onClick={() => setSubgroupSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#8E8E9C] hover:text-white"
                          >
                            ✕
                          </button>
                        )}
                      </div>

                      {/* Stream filter pills */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-[11px] font-bold text-[#7E7E92] mr-1 flex items-center gap-1">
                          <Filter className="w-3 h-3" />
                          <span>Filter by Stream:</span>
                        </span>
                        {[
                          { label: "All Fields (14)", value: "ALL" },
                          { label: "MPC", value: "MPC" },
                          { label: "BiPC", value: "BiPC" },
                          { label: "MEC", value: "MEC" },
                          { label: "CEC", value: "CEC" }
                        ].map((tab) => (
                          <button
                            key={tab.value}
                            type="button"
                            onClick={() => setSubgroupStreamFilter(tab.value)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                              subgroupStreamFilter === tab.value
                                ? "bg-amber-400 text-black shadow-xs font-extrabold"
                                : "bg-[#1C1C28] text-[#8E8E9C] hover:text-white border border-[#2C2C3E]"
                            }`}
                          >
                            {tab.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* SUBGROUPS LIST: Exactly 1 per row taking the full space */}
                  <div className="grid grid-cols-1 gap-3.5 w-full transition-all duration-300">
                    <AnimatePresence>
                      {filteredSubgroups
                        .filter((item) => !activeAfterInterSubgroup || activeAfterInterSubgroup === item.id)
                        .map((item) => {
                          const isSelected = activeAfterInterSubgroup === item.id;
                          return (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85, height: 0, padding: 0 }}
                              transition={{ duration: 0.25 }}
                              onClick={() => setActiveAfterInterSubgroup(isSelected ? null : item.id)}
                              className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer w-full ${
                                isSelected
                                  ? "border-amber-400 bg-[#1A1A2A] shadow-xl ring-1 ring-amber-400/50"
                                  : "border-[#2B2B3C] bg-[#181826] hover:border-[#3E3E56] hover:bg-[#1B1B2A] hover:scale-[1.005] shadow-xs"
                              }`}
                              style={{
                                borderLeftColor: item.color,
                                borderLeftWidth: "4px"
                              }}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3.5 min-w-0">
                                  <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl shrink-0">
                                    {item.emoji}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <h4
                                        className="font-extrabold text-sm sm:text-base tracking-tight truncate"
                                        style={{ color: item.color }}
                                      >
                                        {item.name}
                                      </h4>
                                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/10 text-white">
                                        {item.badge}
                                      </span>
                                    </div>
                                    <p className="text-xs text-[#8E8E9C] mt-0.5 line-clamp-1">
                                      {item.tagline}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  <ChevronDown
                                    className={`w-4 h-4 text-[#8E8E9C] transition-transform duration-300 ${
                                      isSelected ? "rotate-180 text-amber-400" : ""
                                    }`}
                                  />
                                </div>
                              </div>

                              {/* EXPANDED CONTENT FOR ACTIVE SUBGROUP */}
                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="mt-4 pt-4 border-t border-[#26263A] space-y-3.5"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {/* Key Degrees & Programs */}
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block mb-1.5">
                                      🎓 Premier Undergrad Degrees & Programs:
                                    </span>
                                    <ul className="space-y-1">
                                      {item.degrees.map((deg, idx) => (
                                        <li key={idx} className="flex items-start gap-2 text-xs text-[#E2E2EC]">
                                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
                                          <span>{deg}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  {/* Key Career Roles */}
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300 block mb-1.5">
                                      💼 Top Career Trajectories & Roles:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {item.roles.map((role, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2.5 py-1 rounded-lg text-xs bg-[#12121A] text-[#D8E6DF] border border-[#2B2B3C]"
                                        >
                                          {role}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  {/* Major Entrance Exams */}
                                  <div>
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 block mb-1.5">
                                      📝 Major Entrance Exams & Gateways:
                                    </span>
                                    <div className="flex flex-wrap gap-1.5">
                                      {item.exams.map((exam, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded-lg text-xs font-semibold bg-cyan-500/10 text-cyan-300 border border-cyan-500/20"
                                        >
                                          {exam}
                                        </span>
                                      ))}
                                    </div>
                                  </div>

                                  <div className="pt-2 flex items-center justify-between border-t border-white/5">
                                    <span className="text-[11px] text-[#8E8E9C]">
                                      Click this card again to restore all 14 subgroups
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveAfterInterSubgroup(null);
                                      }}
                                      className="px-3 py-1 rounded-full text-xs font-bold text-amber-300 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 transition-colors cursor-pointer"
                                    >
                                      Show All 14 Subgroups
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* POST-DEGREE / DEGREE OPTIONS DETAIL VIEW                                  */}
          {/* Directly shown for Undergrad (pre-degree skipped); accessible for 10th    */}
          {/* When an option is clicked, all others collapse!                          */}
          {/* ========================================================================= */}
          {(currentStage === "b_tech" || (currentStage === "class_10" && tenthView === "degree")) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs">
                  {currentStage === "class_10" ? (
                    <button
                      type="button"
                      onClick={() => setTenthView("options")}
                      className="text-[#8E8E9C] hover:text-white transition-colors cursor-pointer"
                    >
                      ← Post-10th Options
                    </button>
                  ) : (
                    <span className="font-bold text-blue-400">Post-Degree Pathways</span>
                  )}
                  {activeDegreeOption && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-white">
                        {DEGREE_OPTIONS.find(o => o.id === activeDegreeOption)?.title}
                      </span>
                    </>
                  )}
                  {isDegreeExamsExpanded && (
                    <>
                      <span className="text-[#55556A]">/</span>
                      <span className="font-bold text-blue-400">Entrance & Competitive Exams</span>
                    </>
                  )}
                </div>

                {isDegreeExamsExpanded && (
                  <button
                    type="button"
                    onClick={() => setIsDegreeExamsExpanded(false)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Show All Options</span>
                  </button>
                )}

                {activeDegreeOption && (
                  <button
                    type="button"
                    onClick={() => setActiveDegreeOption(null)}
                    className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Show All Options</span>
                  </button>
                )}
              </div>

              {/* ENTRANCE & COMPETITIVE EXAMS SECTION: AFTER DEGREE / UNDERGRADUATE (Collapsible / Expandible) */}
              {!activeDegreeOption && (
                !isDegreeExamsExpanded ? (
                  <motion.div
                    whileHover={{ scale: 1.005, borderColor: "rgba(96, 165, 250, 0.5)" }}
                    whileTap={{ scale: 0.995 }}
                    onClick={() => setIsDegreeExamsExpanded(true)}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#181824] to-[#14141E] border border-[#2B2B3C] cursor-pointer group transition-all duration-200 shadow-md flex items-center justify-between gap-4"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0 group-hover:scale-105 transition-transform">
                        <Award className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-base sm:text-lg font-bold text-white group-hover:text-blue-300 transition-colors">
                            Entrance & Competitive Exams (After Degree)
                          </h4>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30">
                            16 Key Gateways
                          </span>
                        </div>
                        <p className="text-xs text-[#8E8E9C] mt-1 leading-relaxed">
                          Premier national & state competitive examinations across Engineering, MBA, and Government (GATE, CAT, ICET, UPSC, SSC, Banking, etc.)
                        </p>
                        <div className="flex items-center gap-1.5 mt-2.5 flex-wrap">
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-blue-300 border border-blue-500/20 font-bold">Engineering / Tech (3)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-emerald-300 border border-emerald-500/20 font-bold">MBA / Management (6)</span>
                          <span className="text-[10px] px-2 py-0.5 rounded bg-[#101018] text-purple-300 border border-purple-500/20 font-bold">Government / Competitive (7)</span>
                        </div>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#1F1F2E] group-hover:bg-blue-500 text-white flex items-center justify-center shrink-0 transition-colors">
                      <ChevronDown className="w-4 h-4" />
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#161624] to-[#12121C] border border-blue-500/40 shadow-xl space-y-4 ring-1 ring-blue-500/30"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                          <Award className="w-4 h-4" />
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-white flex items-center gap-2">
                            <span>Entrance & Competitive Exams: After Degree</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/30">
                              16 Key Gateways
                            </span>
                          </h4>
                          <p className="text-[11px] text-[#8E8E9C]">
                            Premier national & state competitive examinations across Engineering, MBA, and Government:
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Category filter pills */}
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            type="button"
                            onClick={() => setDegreeExamCategoryFilter("ALL")}
                            className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                              degreeExamCategoryFilter === "ALL"
                                ? "bg-blue-400 text-black font-extrabold shadow-xs"
                                : "bg-[#181826] text-[#8E8E9C] hover:text-white border border-[#2B2B3C]"
                            }`}
                          >
                            All (16)
                          </button>
                          {ENTRANCE_EXAMS_DEGREE.map((cat) => (
                            <button
                              key={cat.category}
                              type="button"
                              onClick={() => setDegreeExamCategoryFilter(cat.category)}
                              className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all cursor-pointer flex items-center gap-1 ${
                                degreeExamCategoryFilter === cat.category
                                  ? "bg-blue-400 text-black font-extrabold shadow-xs"
                                  : "bg-[#181826] text-[#8E8E9C] hover:text-white border border-[#2B2B3C]"
                              }`}
                            >
                              <span>{cat.icon}</span>
                              <span>{cat.category.split(" / ")[0]}</span>
                            </button>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => setIsDegreeExamsExpanded(false)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[#1C1C28] hover:bg-[#252536] text-blue-300 border border-blue-500/30 flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                          <span>Collapse</span>
                        </button>
                      </div>
                    </div>

                    <div className="space-y-3.5">
                      {ENTRANCE_EXAMS_DEGREE
                        .filter((cat) => degreeExamCategoryFilter === "ALL" || degreeExamCategoryFilter === cat.category)
                        .map((cat) => (
                          <div key={cat.category} className="space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm">{cat.icon}</span>
                              <span className="text-xs font-bold uppercase tracking-wider" style={{ color: cat.color }}>
                                {cat.category}
                              </span>
                              <span className="text-[10px] text-[#6E6E82]">({cat.exams.length} exams)</span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                              {cat.exams.map((exam, idx) => (
                                <div
                                  key={idx}
                                  className="p-2.5 rounded-xl bg-[#181826] border border-[#262638] hover:border-[#3E3E56] hover:bg-[#1B1B2A] transition-all flex flex-col justify-between gap-1 group"
                                  style={{ borderLeftColor: cat.color, borderLeftWidth: "3px" }}
                                >
                                  <div className="flex items-center justify-between gap-1.5">
                                    <span className="font-extrabold text-xs tracking-tight text-white group-hover:text-blue-300 transition-colors">
                                      {exam.name}
                                    </span>
                                    <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-[#A6A6BC] font-semibold border border-white/10 shrink-0">
                                      {exam.badge}
                                    </span>
                                  </div>
                                  <p className="text-[11px] text-[#A6A6BC] flex items-center gap-1">
                                    <span className="text-[#6E6E82] shrink-0">—</span>
                                    <span className="truncate">{exam.target}</span>
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </motion.div>
                )
              )}

              {/* POST-DEGREE OPTIONS (Only shown when Entrance Exams is NOT expanded) */}
              {!isDegreeExamsExpanded && (
                <div className="p-4 sm:p-5 rounded-2xl bg-[#161622] border border-[#2B2B3C] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base">
                        {currentStage === "b_tech"
                          ? "Post-Degree & Career Milestones"
                          : "Graduation & Degree Pathways"}
                      </h3>
                      <p className="text-xs text-[#8E8E9C] mt-0.5">
                        {activeDegreeOption
                          ? "Click the active card again or 'Show All' to restore other options."
                          : currentStage === "b_tech"
                          ? "Specialized post-undergrad pathways: Higher studies, tech corporate placements, civil services, and research:"
                          : "Preview undergraduate degree trajectories and future outcomes after 10+2:"}
                      </p>
                    </div>
                  </div>

                  <div
                    className={`grid transition-all duration-300 ${
                      activeDegreeOption ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-2 gap-3"
                    }`}
                  >
                    <AnimatePresence>
                      {DEGREE_OPTIONS
                        .filter((item) => !activeDegreeOption || activeDegreeOption === item.id)
                        .map((item) => {
                          const isSelected = activeDegreeOption === item.id;
                          return (
                            <motion.div
                              key={item.id}
                              layout
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.85, height: 0 }}
                              transition={{ duration: 0.25 }}
                              onClick={() => setActiveDegreeOption(isSelected ? null : item.id)}
                              className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                                isSelected
                                  ? "border-blue-400 bg-[#1A1A2A] shadow-lg ring-1 ring-blue-400/50"
                                  : "border-[#2B2B3C] bg-[#181826] hover:border-[#3E3E56]"
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm" style={{ color: item.color }}>
                                  {item.title}
                                </span>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-white">
                                    {item.badge}
                                  </span>
                                  <ChevronDown
                                    className={`w-4 h-4 text-[#8E8E9C] transition-transform duration-200 ${
                                      isSelected ? "rotate-180 text-blue-400" : ""
                                    }`}
                                  />
                                </div>
                              </div>
                              <p className="text-[11px] text-[#8E8E9C] mt-1">{item.desc}</p>

                              {isSelected && (
                                <motion.div
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  className="mt-3 pt-3 border-t border-[#26263A] space-y-2.5"
                                >
                                  <div>
                                    <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block mb-1">
                                      Pathway Focus Areas:
                                    </span>
                                    <ul className="text-[11px] text-[#A6A6BC] space-y-1">
                                      {item.highlights.map((h, idx) => (
                                        <li key={idx} className="flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                                          <span>{h}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>

                                  <div>
                                    <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block mb-1">
                                      Key Career Roles:
                                    </span>
                                    <div className="flex flex-wrap gap-1">
                                      {item.careers.map((career, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded text-[10px] bg-[#12121A] text-[#E2E2EC] border border-[#2B2B3C]"
                                        >
                                          {career}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-[#20202C] bg-[#0E0E16] flex items-center justify-between">
          <div className="text-xs text-[#7E7E90]">
            SkillCatalyst Career Intelligence
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white text-black text-xs font-bold hover:bg-neutral-200 transition-colors shadow-md cursor-pointer"
          >
            Close Roadmap
          </button>
        </div>
      </motion.div>
    </div>
  );
}
