export type EducationStage = "class_10" | "intermediate" | "b_tech";

export type SkillProficiency = "Beginner" | "Intermediate" | "Advanced";

export interface SkillItem {
  id?: string;
  skill_name: string;
  proficiency: SkillProficiency;
}

export interface ProjectItem {
  id?: string;
  name: string;
  description?: string;
  technologies?: string;
  github_url?: string;
}

export interface CertificationItem {
  id?: string;
  name: string;
  issuer?: string;
  date?: string;
  credential_url?: string;
}

export interface ExperienceItem {
  id?: string;
  type: string;
  organization: string;
  role: string;
  description?: string;
  start_date?: string;
  end_date?: string;
}

export interface AcademicProfile {
  id?: string;
  school_or_college?: string;
  board?: string;
  university?: string;
  branch?: string;
  year?: string;
  percentage?: number | null;
  cgpa?: number | null;
  stream?: string;
  future_direction?: string;
}

export interface StudentPreferences {
  preferred_location?: string;
  available_learning_time?: string;
}

export interface StudentFinancialContext {
  education_budget?: string;
  certification_budget?: string;
}

export interface IntelligenceSummary {
  eligible_scholarships_count: number;
  relevant_opportunities_count: number;
  priority_improvement_areas: string[];
  completeness_percentage: number;
  stage_label: string;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  date_of_birth?: string;
  location?: string;
  education_stage: EducationStage;
  target_role?: string;
  academic_profile?: AcademicProfile;
  skills: SkillItem[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  experience: ExperienceItem[];
  interests: string[];
  preferences?: StudentPreferences;
  financial_context?: StudentFinancialContext;
  intelligence_summary?: IntelligenceSummary;
  created_at?: string;
  updated_at?: string;
}

export interface StudentProfileCreatePayload {
  name: string;
  email: string;
  date_of_birth?: string;
  location?: string;
  education_stage: EducationStage;
  target_role?: string;
  academic_profile: AcademicProfile;
  skills: { skill_name: string; proficiency: SkillProficiency }[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  experience: ExperienceItem[];
  interests: string[];
  preferences?: StudentPreferences;
  financial_context?: StudentFinancialContext;
}

export interface Scholarship {
  id: string;
  title: string;
  provider: string;
  description: string;
  benefit_value: string;
  deadline: string;
  min_cgpa_or_percentage?: number | null;
  eligible_stages: string[];
  eligible_streams_or_branches?: string[] | null;
  tags: string[];
  eligibility_status: string;
  application_url?: string;
  application_link?: string;
  current_study?: string;
  amount_inr?: number;
  award_amount?: string;
  criteria?: string;
}

export interface PersonalizedScholarship extends Scholarship {
  match_score: number;
  is_eligible: boolean;
  match_reasons: string[];
  action_item?: string | null;
}

export interface ExtractedResumeData {
  name?: string;
  email?: string;
  phone?: string;
  location?: string;
  education_stage: EducationStage;
  degree?: string;
  branch?: string;
  college?: string;
  graduation_year?: string;
  cgpa?: number | null;
  percentage?: number | null;
  skills: { skill_name: string; proficiency: SkillProficiency }[];
  projects: ProjectItem[];
  certifications: CertificationItem[];
  target_role?: string;
  raw_text_length: number;
  extraction_confidence: string;
  verification_notes: string[];
}

export interface AuthSession {
  token: string;
  student_id: string | null;
  email: string;
  name: string;
  has_profile: boolean;
  education_stage?: EducationStage | null;
}
