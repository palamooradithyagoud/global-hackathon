import re
from typing import Dict, Any, Optional

TAXONOMY: Dict[str, Dict[str, Any]] = {
    "react": {
        "name": "React",
        "category": "Frontend",
        "aliases": ["react.js", "react js", "reactjs", "react native"]
    },
    "nodejs": {
        "name": "Node.js",
        "category": "Backend",
        "aliases": ["node.js", "node js", "nodejs", "node"]
    },
    "python": {
        "name": "Python",
        "category": "Programming",
        "aliases": ["python3", "python 3", "py"]
    },
    "sql": {
        "name": "SQL",
        "category": "Database",
        "aliases": ["structured query language", "rdbms", "relational database", "relational databases"]
    },
    "postgresql": {
        "name": "PostgreSQL",
        "category": "Database",
        "aliases": ["postgres", "pgsql"]
    },
    "mysql": {
        "name": "MySQL",
        "category": "Database",
        "aliases": ["my sql"]
    },
    "fastapi": {
        "name": "FastAPI",
        "category": "Backend",
        "aliases": ["fast api", "fast-api"]
    },
    "django": {
        "name": "Django",
        "category": "Backend",
        "aliases": ["django rest framework", "drf"]
    },
    "flask": {
        "name": "Flask",
        "category": "Backend",
        "aliases": []
    },
    "javascript": {
        "name": "JavaScript",
        "category": "Programming",
        "aliases": ["js", "es6", "ecmascript"]
    },
    "typescript": {
        "name": "TypeScript",
        "category": "Programming",
        "aliases": ["ts"]
    },
    "docker": {
        "name": "Docker",
        "category": "DevOps",
        "aliases": ["containerization", "containers"]
    },
    "kubernetes": {
        "name": "Kubernetes",
        "category": "DevOps",
        "aliases": ["k8s"]
    },
    "git": {
        "name": "Git",
        "category": "Tools",
        "aliases": ["github", "gitlab", "version control", "git & github"]
    },
    "aws": {
        "name": "AWS",
        "category": "Cloud",
        "aliases": ["amazon web services", "cloud computing", "ec2", "s3", "lambda"]
    },
    "azure": {
        "name": "Azure",
        "category": "Cloud",
        "aliases": ["microsoft azure"]
    },
    "gcp": {
        "name": "Google Cloud",
        "category": "Cloud",
        "aliases": ["google cloud platform", "google cloud"]
    },
    "rest_apis": {
        "name": "REST APIs",
        "category": "Backend",
        "aliases": ["rest api", "restful api", "restful apis", "rest", "api design", "microservices"]
    },
    "graphql": {
        "name": "GraphQL",
        "category": "Backend",
        "aliases": ["gql"]
    },
    "data_structures": {
        "name": "Data Structures & Algorithms",
        "category": "Computer Science",
        "aliases": ["data structures", "dsa", "algorithms", "problem solving"]
    },
    "machine_learning": {
        "name": "Machine Learning",
        "category": "AI/ML",
        "aliases": ["ml", "deep learning", "nlp", "artificial intelligence", "data science", "pytorch", "tensorflow"]
    },
    "mongodb": {
        "name": "MongoDB",
        "category": "Database",
        "aliases": ["mongo", "nosql"]
    },
    "redis": {
        "name": "Redis",
        "category": "Database",
        "aliases": ["caching", "in-memory cache"]
    },
    "html_css": {
        "name": "HTML & CSS",
        "category": "Frontend",
        "aliases": ["html", "css", "html5", "css3", "tailwind", "tailwind css", "bootstrap"]
    },
    "linux": {
        "name": "Linux",
        "category": "Systems",
        "aliases": ["unix", "bash", "shell scripting", "terminal"]
    },
    "java": {
        "name": "Java",
        "category": "Programming",
        "aliases": ["core java", "j2ee"]
    },
    "spring_boot": {
        "name": "Spring Boot",
        "category": "Backend",
        "aliases": ["spring", "springboot"]
    },
    "c_plus_plus": {
        "name": "C++",
        "category": "Programming",
        "aliases": ["cpp", "c/c++"]
    }
}

# Build reverse lookup index from alias to canonical normalized key
ALIAS_INDEX: Dict[str, str] = {}
for norm_key, info in TAXONOMY.items():
    ALIAS_INDEX[norm_key] = norm_key
    clean_display = info["name"].lower()
    ALIAS_INDEX[clean_display] = norm_key
    for alias in info.get("aliases", []):
        ALIAS_INDEX[alias.lower()] = norm_key


def normalize_skill(raw_name: str) -> Dict[str, Any]:
    """
    Normalizes a skill name string into its canonical taxonomy representation.
    E.g., "React.js" -> {"name": "React", "normalized_name": "react", "category": "Frontend"}
    """
    if not raw_name:
        return {"name": "General Tech", "normalized_name": "general_tech", "category": "Other"}
    
    clean = raw_name.strip().lower()
    # Remove surrounding punctuation
    clean = re.sub(r"^[\s\-_.,]+|[\s\-_.,]+$", "", clean)

    if clean in ALIAS_INDEX:
        canonical_key = ALIAS_INDEX[clean]
        item = TAXONOMY[canonical_key]
        return {
            "name": item["name"],
            "normalized_name": canonical_key,
            "category": item["category"]
        }
    
    # Try removing special characters (.js, js, etc.)
    simplified = re.sub(r"[\._\-]", " ", clean).strip()
    if simplified in ALIAS_INDEX:
        canonical_key = ALIAS_INDEX[simplified]
        item = TAXONOMY[canonical_key]
        return {
            "name": item["name"],
            "normalized_name": canonical_key,
            "category": item["category"]
        }

    # Fallback for unregistered skills: Title-cased display with slugified key
    slug = re.sub(r"[^a-z0-9]+", "_", clean).strip("_")
    display_title = raw_name.strip().title()
    return {
        "name": display_title,
        "normalized_name": slug or "tech_skill",
        "category": "Domain Skill"
    }
