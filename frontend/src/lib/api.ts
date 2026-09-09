import {
  StudentProfileCreatePayload,
  StudentProfile,
  Scholarship,
  PersonalizedScholarship,
  ExtractedResumeData,
  AuthSession
} from "@/types";

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
    getPreview: async (limit: number = 5): Promise<Scholarship[]> => {
      return fetchJSON<Scholarship[]>(`/scholarships/preview?limit=${limit}`);
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
};
