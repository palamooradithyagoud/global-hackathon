class AgentError(Exception):
    """Base exception for agent system."""
    pass


class UnauthorizedToolError(AgentError):
    """Raised when an agent tool invocation violates permission boundaries."""
    pass


class ToolExecutionError(AgentError):
    """Raised when a tool execution fails."""
    pass


class InvalidToolArgumentsError(AgentError):
    """Raised when tool arguments fail validation."""
    pass


class ContextError(AgentError):
    """Raised when agent context is invalid or violates IDOR security boundaries."""
    pass
