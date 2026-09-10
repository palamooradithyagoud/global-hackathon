from typing import Dict
from backend.app.services.agent.agent_context import AgentContext
from backend.app.services.agent.errors import UnauthorizedToolError

TOOL_PERMISSION_MAP: Dict[str, str] = {
    # Protected Student Operations (Require authenticated student context)
    "getStudentProfile": "require_student_auth",
    "calculateSkillGap": "require_student_auth",
    "findEligibleScholarships": "require_student_auth",
    "checkScholarshipEligibility": "require_student_auth",
    "updateStudentMemory": "require_student_auth",
    "getStudentMemories": "require_student_auth",

    # Public Read-Only Operations
    "searchCareers": "read_public",
    "getCareerRequirements": "read_public",
    "searchScholarships": "read_public",
    "searchJobs": "read_public",
    "searchLearningResources": "read_public",
    "searchKnowledgeBase": "read_public",
    "verifyClaim": "read_public",
    "getEducationCost": "read_public",
    "getSalaryEstimate": "read_public",
    "calculateEducationROI": "read_public",
    "compareCareerPathways": "read_public",
}


def check_tool_permission(tool_name: str, context: AgentContext) -> None:
    """
    Strict permission boundary enforcement.
    Raises UnauthorizedToolError if context lacks the required capability.
    """
    required_perm = TOOL_PERMISSION_MAP.get(tool_name, "require_student_auth")
    if required_perm not in context.permissions:
        raise UnauthorizedToolError(
            f"Permission denied: Tool '{tool_name}' requires '{required_perm}' privilege, "
            f"but current session only holds: {sorted(list(context.permissions))}."
        )


def get_authorized_tools_definitions(context: AgentContext, all_tools: list) -> list:
    """Returns only the tool schemas that the current session context is authorized to invoke."""
    return [
        t for t in all_tools
        if TOOL_PERMISSION_MAP.get(t.get("function", {}).get("name"), "require_student_auth") in context.permissions
    ]

