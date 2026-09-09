import {
  StudentProfileCreatePayload,
  StudentProfile,
  Scholarship,
  PersonalizedScholarship,
  ExtractedResumeData,
  AuthSession
} from "@/types";
import { MatchedJoobleJob, JobFitAnalysisResult } from "./jobData";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function fetchJSON<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  try {
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-TransType": "application/json",
        ...(options?.headers || {}),
      },
    });

    if (!res.ok) {
      let errorDetail = `Request failed with status ${res.status}`;
      try {
        const errorJson = await res.json();
        errorDetail = errorJson.detail || errorDetail;
      } catch {
        // use default status message
      }
      throw new Error(errorDetail);
    }

    return await res.json();
  } catch (err: any) {
    console.error(`API Error on ${endpoint}:`, err);
    throw new Error(err.message || "Unable to communicate with the intelligence backend.");
  }
}

export const api = {
  auth: {
    demoLogin: async (stage: string = "b_tech"): Promise<AuthSession> => {
      return fetchJSON<AuthSession>("/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "demo_student", education_stage: stage }),
      });
    },

    login: async (email: string, password: string): Promise<AuthSession> => {
      return fetchJSON<AuthSession>("/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
    },
  },

  scholarships: {
    getPreview: async (limit: number = 6, stage?: string): Promise<Scholarship[]> => {
      const query = stage
        ? `/scholarships/preview?limit=${limit}&stage=${encodeURIComponent(stage)}`
        : `/scholarships/preview?limit=${limit}`;
      return fetchJSON<Scholarship[]>(query);
    },

    getPersonalized: async (studentId: string): Promise<PersonalizedScholarship[]> => {
      return fetchJSON<PersonalizedScholarship[]>(`/scholarships/personalized?student_id=${studentId}`);
    },
  },

  profile: {
    create: async (payload: StudentProfileCreatePayload): Promise<StudentProfile> => {
      return fetchJSON<StudentProfile>("/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },

    get: async (studentId: string): Promise<StudentProfile> => {
      return fetchJSON<StudentProfile>(`/profile/${studentId}`);
    },

    update: async (studentId: string, payload: any): Promise<StudentProfile> => {
      return fetchJSON<StudentProfile>(`/profile/${studentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    },
  },

  resume: {
    extract: async (file: File): Promise<ExtractedResumeData> => {
      const formData = new FormData();
      formData.append("file", file);

      const url = `${API_BASE_URL}/profile/resume/extract`;
      const res = await fetch(url, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        let errorDetail = `Upload failed with status ${res.status}`;
        try {
          const errJson = await res.json();
          errorDetail = errJson.detail || errorDetail;
        } catch {
          // fallback
        }
        throw new Error(errorDetail);
      }

      return await res.json();
    },
  },

  jobs: {
    list: async (params?: {
      keyword?: string;
      location?: string;
      page?: number;
      limit?: number;
      experience?: string;
      remote?: boolean;
    }): Promise<any> => {
      const query = new URLSearchParams();
      if (params?.keyword) query.append("keyword", params.keyword);
      if (params?.location) query.append("location", params.location);
      if (params?.page) query.append("page", String(params.page));
      if (params?.limit) query.append("limit", String(params.limit));
      if (params?.experience) query.append("experience", params.experience);
      if (params?.remote !== undefined) query.append("remote", String(params.remote));
      return fetchJSON(`/jobs?${query.toString()}`);
    },

    get: async (jobId: string): Promise<any> => {
      return fetchJSON(`/jobs/${encodeURIComponent(jobId)}`);
    },

    analyze: async (jobId: string, studentId?: string): Promise<JobFitAnalysisResult> => {
      const query = studentId ? `?student_id=${encodeURIComponent(studentId)}` : "";
      return fetchJSON<JobFitAnalysisResult>(`/jobs/${encodeURIComponent(jobId)}/analyze${query}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId })
      });
    },

    searchBTechJobs: async (params?: {
      studentId?: string;
      keywords?: string;
      location?: string;
      page?: number;
    }): Promise<{
      total_count: number;
      page: number;
      location: string;
      search_keywords: string;
      student_profile_used?: any;
      jobs: MatchedJoobleJob[];
    }> => {
      const query = new URLSearchParams();
      if (params?.studentId) query.append("student_id", params.studentId);
      if (params?.keywords) query.append("keywords", params.keywords);
      if (params?.location) query.append("location", params.location);
      if (params?.page) query.append("page", String(params.page));

      return fetchJSON(`/jobs/btech/search?${query.toString()}`);
    },
  },
};

