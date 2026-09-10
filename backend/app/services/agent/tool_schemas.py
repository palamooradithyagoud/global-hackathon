from typing import List, Dict, Any

AGENT_TOOLS_DEFINITIONS: List[Dict[str, Any]] = [
    {
        "type": "function",
        "function": {
            "name": "getStudentProfile",
            "description": "Retrieves the authenticated student's profile, academic status, skills, and projects. Only operates on the server-authenticated session. Only call when the user specifically asks about their personal profile, saved skills, or user account. NEVER call for general queries about degree fees, salaries, or career options.",
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
    },
    {
        "type": "function",
        "function": {
            "name": "getEducationCost",
            "description": "Returns structured, verified benchmark education costs (tuition, hostel, mess, books, transport, annual total, and 2/4-year program total) for academic degrees and programs in India (e.g. M.Tech, B.Tech, MCA, MBA, Intermediate).",
            "parameters": {
                "type": "object",
                "properties": {
                    "program": {
                        "type": "string",
                        "description": "Program or degree (e.g. 'M.Tech CSE', 'B.Tech', 'MCA', 'MBA', 'Intermediate')"
                    },
                    "institution_type": {
                        "type": "string",
                        "description": "Optional: 'government_premier' (IIT/NIT/IIIT), 'private_tier1' (BITS/VIT/SRM), 'state_university', or 'all'"
                    },
                    "location": {
                        "type": "string",
                        "description": "Optional city or state (e.g. 'Hyderabad', 'Bengaluru', 'India')"
                    }
                },
                "required": ["program"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "getSalaryEstimate",
            "description": "Returns realistic, verified market CTC and salary benchmark packages across Fresher (0-2 yrs), Mid-Level (2-5 yrs), Senior (5+ yrs), and Tier-1 Product Companies for specific careers and degree pathways.",
            "parameters": {
                "type": "object",
                "properties": {
                    "career_or_role": {
                        "type": "string",
                        "description": "Target career or role (e.g. 'AI Engineer', 'Software Engineer', 'Machine Learning Engineer', 'M.Tech Graduate', 'Data Scientist')"
                    },
                    "location": {
                        "type": "string",
                        "description": "Optional location (e.g. 'India', 'Bengaluru', 'Hyderabad')"
                    }
                },
                "required": ["career_or_role"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "calculateEducationROI",
            "description": "Calculates return on investment (ROI), net savings, and estimated payback period (in years) by comparing total education cost against expected starting salary packages.",
            "parameters": {
                "type": "object",
                "properties": {
                    "program": {
                        "type": "string",
                        "description": "Degree or program (e.g. 'M.Tech CSE', 'B.Tech', 'MCA')"
                    },
                    "career_goal": {
                        "type": "string",
                        "description": "Target job role after graduation (e.g. 'AI Engineer', 'Software Engineer')"
                    }
                },
                "required": ["program", "career_goal"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "compareCareerPathways",
            "description": "Provides a side-by-side structured financial and career comparison between two educational or degree pathways (e.g. 'M.Tech CSE' vs 'MCA', 'B.Tech CSE' vs 'B.Tech ECE').",
            "parameters": {
                "type": "object",
                "properties": {
                    "pathway_a": {
                        "type": "string",
                        "description": "First degree or path (e.g. 'M.Tech CSE')"
                    },
                    "pathway_b": {
                        "type": "string",
                        "description": "Second degree or path (e.g. 'MCA')"
                    }
                },
                "required": ["pathway_a", "pathway_b"]
            }
        }
    }
]
