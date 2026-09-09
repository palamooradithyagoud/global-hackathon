from typing import List, Dict, Any

AGENT_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "getStudentProfile",
            "description": "Retrieves the authenticated student's profile, academic status, skills, and projects. Only operates on the server-authenticated session. NEVER accepts an arbitrary student_id.",
            "parameters": {
                "type": "object",
                "properties": {},
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "searchCareers",
            "description": "Searches canonical career pathways in technology, AI/ML, data science, core engineering, and public sector from the structured database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search keyword for career titles (e.g. 'Machine Learning', 'Full Stack', 'Cloud')"
                    },
                    "category": {
                        "type": "string",
                        "description": "Optional career category filter (e.g. 'Data & AI', 'Software & Web', 'Cloud & Systems')"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max number of careers to return (default 5)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "getCareerRequirements",
            "description": "Returns the exact, verified technical skill requirements, importance weights, and target levels for a specific career from the database.",
            "parameters": {
                "type": "object",
                "properties": {
                    "career_name_or_id": {
                        "type": "string",
                        "description": "Exact name or ID of the career (e.g. 'Machine Learning Engineer', 'Full Stack Developer')"
                    }
                },
                "required": ["career_name_or_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculateSkillGap",
            "description": "DETERMINISTICALLY calculates the authenticated student's skill gap against a target career. Evaluates matched skills, missing skills, partial proficiencies, and readiness percentage. The LLM must NEVER calculate this manually.",
            "parameters": {
                "type": "object",
                "properties": {
                    "career_name": {
                        "type": "string",
                        "description": "Target career to analyze (e.g. 'Machine Learning Engineer', 'Data Scientist', 'DevOps / SRE Engineer')"
                    }
                },
                "required": ["career_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "searchScholarships",
            "description": "Searches verified scholarships from the structured database by keyword or education stage.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Search term (e.g. 'NSP', 'Telangana ePASS', 'Reliance', 'LIC')"
                    },
                    "stage": {
                        "type": "string",
                        "description": "Filter by stage: 'class_10', 'intermediate', or 'b_tech'"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "Max records to return (default 5)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "checkScholarshipEligibility",
            "description": "DETERMINISTICALLY verifies whether the authenticated student meets all criteria (stage, CGPA, income, state domicile) for a specific scholarship ID. The LLM must NEVER guess eligibility.",
            "parameters": {
                "type": "object",
                "properties": {
                    "scholarship_id": {
                        "type": "string",
                        "description": "Unique identifier of the scholarship (e.g. 'nmms-class10', 'reliance-scholarship-btech-1st-year')"
                    }
                },
                "required": ["scholarship_id"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "findEligibleScholarships",
            "description": "DETERMINISTICALLY scans all verified scholarships and returns the top matched and eligible opportunities for the authenticated student.",
            "parameters": {
                "type": "object",
                "properties": {
                    "limit": {
                        "type": "integer",
                        "description": "Max number of matching scholarships to return (default 5)"
                    }
                },
                "required": []
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "searchJobs",
            "description": "Retrieves LIVE job listings and internships from the Jooble API. Never fabricate jobs, salaries, or URLs.",
            "parameters": {
                "type": "object",
                "properties": {
                    "keywords": {
                        "type": "string",
                        "description": "Job title or skill (e.g. 'Python Developer Intern', 'React Frontend')"
                    },
                    "location": {
                        "type": "string",
                        "description": "Location (e.g. 'India', 'Bengaluru', 'Hyderabad', 'Remote')"
                    }
                },
                "required": ["keywords"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "searchLearningResources",
            "description": "Retrieves verified high-quality video lectures and playlists for a specific skill from the learning catalog.",
            "parameters": {
                "type": "object",
                "properties": {
                    "skill_name": {
                        "type": "string",
                        "description": "Skill name to find tutorials for (e.g. 'Python', 'React', 'Data Structures', 'Docker')"
                    }
                },
                "required": ["skill_name"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "searchKnowledgeBase",
            "description": "Searches authoritative RAG guidelines (NSP rules, Telangana ePASS government orders, AICTE guidelines, GATE/EAMCET examination rules) with exact citations.",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {
                        "type": "string",
                        "description": "Factual question or policy term (e.g. 'NMMS parental income limit', 'Telangana ePASS documents required', 'GATE score validity')"
                    },
                    "top_k": {
                        "type": "integer",
                        "description": "Number of authoritative chunks to retrieve (default 3)"
                    }
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "verifyClaim",
            "description": "Cross-verifies a factual claim against the authoritative database and official RAG sources. Returns verified, unverified, or conflicting status with evidence.",
            "parameters": {
                "type": "object",
                "properties": {
                    "claim": {
                        "type": "string",
                        "description": "The specific factual statement to verify (e.g. 'NSP Central Sector scholarship pays ₹12,000 per year')"
                    }
                },
                "required": ["claim"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "updateStudentMemory",
            "description": "Persists or updates durable user preferences (e.g. preferred learning style, budget, language, target city) for future interactions. Only record durable user statements, not every query.",
            "parameters": {
                "type": "object",
                "properties": {
                    "key": {
                        "type": "string",
                        "description": "Preference key (e.g. 'preferred_learning_style', 'course_budget', 'preferred_location', 'preferred_language')"
                    },
                    "value": {
                        "type": "string",
                        "description": "Preference value (e.g. 'project_based', 'free', 'Hyderabad', 'English')"
                    },
                    "type": {
                        "type": "string",
                        "description": "Type: 'preference', 'goal', 'constraint'"
                    }
                },
                "required": ["key", "value"]
            }
        }
    }
]
