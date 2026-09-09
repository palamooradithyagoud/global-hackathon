import re
from typing import List, Dict, Any
from backend.app.services.skill_taxonomy import TAXONOMY, ALIAS_INDEX, normalize_skill


HIGH_IMPORTANCE_TRIGGERS = [
    r"\brequired\b", r"\bmust have\b", r"\bproficient\b", r"\bstrong\b",
    r"\bexpert\b", r"\bessential\b", r"\bcore\b", r"\bprimary\b"
]

ADVANCED_PROFICIENCY_TRIGGERS = [
    r"\bsenior\b", r"\blead\b", r"\badvanced\b", r"\bexpert\b", r"\barchitect\b",
    r"\bdeep understanding\b", r"\b5\+\s*years\b", r"\b3\+\s*years\b"
]

LOW_IMPORTANCE_TRIGGERS = [
    r"\bgood to have\b", r"\bplus\b", r"\bfamiliarity\b", r"\bexposure\b",
    r"\boptional\b", r"\bbonus\b", r"\bknowledge of\b"
]


def extract_skills_from_text(title: str, text: str) -> List[Dict[str, Any]]:
    """
    Identifies technical skills present in job title and description/snippet.
    Returns normalized requirements with importance and required proficiency.
    """
    combined = f"{title}\n{text}".lower()
    title_lower = title.lower()

    found_skills: Dict[str, Dict[str, Any]] = {}

    # Check each alias in taxonomy
    for alias, canonical_key in ALIAS_INDEX.items():
        # Match whole word / token boundary
        pattern = r"(?<![a-zA-Z0-9])" + re.escape(alias) + r"(?![a-zA-Z0-9])"
        if re.search(pattern, combined):
            norm_item = TAXONOMY.get(canonical_key)
            if not norm_item:
                continue

            display_name = norm_item["name"]
            category = norm_item["category"]

            # Determine importance
            importance = "medium"
            if re.search(pattern, title_lower):
                importance = "high"
            else:
                for trig in HIGH_IMPORTANCE_TRIGGERS:
                    if re.search(trig, combined):
                        importance = "high"
                        break

            for trig in LOW_IMPORTANCE_TRIGGERS:
                if re.search(trig, combined):
                    importance = "low"
                    break

            # Determine required proficiency
            required_proficiency = 3  # Default: Intermediate
            for adv_trig in ADVANCED_PROFICIENCY_TRIGGERS:
                if re.search(adv_trig, combined):
                    required_proficiency = 4  # Advanced
                    break

            # Store highest importance if multiple aliases match the same canonical skill
            if canonical_key not in found_skills:
                found_skills[canonical_key] = {
                    "skill": display_name,
                    "normalized_skill": canonical_key,
                    "category": category,
                    "importance": importance,
                    "required_proficiency": required_proficiency
                }
            else:
                if importance == "high":
                    found_skills[canonical_key]["importance"] = "high"

    # Default baseline if zero skills extracted
    if not found_skills:
        for default_key in ["python", "sql", "git"]:
            item = TAXONOMY[default_key]
            found_skills[default_key] = {
                "skill": item["name"],
                "normalized_skill": default_key,
                "category": item["category"],
                "importance": "medium",
                "required_proficiency": 3
            }

    return list(found_skills.values())
