"""Pydantic models for session extraction."""

from pydantic import BaseModel


class EpisodicMemory(BaseModel):
    """A specific incident or problem encountered during a session."""
    incident: str
    context: str
    resolution: str
    file: str | None = None
    severity: str = "info"
    scope: str = "universal"  # "universal" | "environment-specific"


class SemanticMemory(BaseModel):
    """A piece of knowledge or fact learned about the codebase."""
    knowledge: str
    category: str
    confidence: str = "medium"


class ProceduralMemory(BaseModel):
    """A workflow or process discovered during the session."""
    workflow: str
    steps: list[str]
    trigger: str | None = None


class Decision(BaseModel):
    """An architectural or design decision made during the session."""
    decision: str
    rationale: str
    alternatives_considered: list[str] = []
    date: str | None = None


class Gotcha(BaseModel):
    """A non-obvious issue or pitfall discovered in the codebase."""
    issue: str
    cause: str | None = None
    solution: str | None = None
    tags: list[str] = []
    scope: str = "universal"  # "universal" | "environment-specific"


class SessionExtraction(BaseModel):
    """Complete extraction result from a session."""
    session_id: str
    project: str
    extracted_at: str
    session_summary: str
    episodic: list[EpisodicMemory] = []
    semantic: list[SemanticMemory] = []
    procedural: list[ProceduralMemory] = []
    decisions: list[Decision] = []
    gotchas: list[Gotcha] = []


class ConsolidatedEpisodic(BaseModel):
    """Consolidated episodic memory with frequency tracking."""
    incident: str
    resolution: str
    occurrences: int = 1
    sessions: list[str] = []
    last_seen: str | None = None
    scope: str = "universal"  # "universal" | "environment-specific"


class ConsolidatedSemantic(BaseModel):
    """Consolidated semantic memory with confidence weighting."""
    knowledge: str
    category: str
    frequency: int = 1
    confidence: str = "medium"


class ConsolidatedProcedural(BaseModel):
    """Consolidated procedural memory with usage tracking."""
    workflow: str
    steps: list[str]
    trigger: str | None = None
    times_used: int = 1


class ConsolidatedDecision(BaseModel):
    """Consolidated decision with status tracking."""
    decision: str
    rationale: str
    alternatives_considered: list[str] = []
    status: str = "active"
    date: str | None = None


class ConsolidatedGotcha(BaseModel):
    """Consolidated gotcha with frequency tracking."""
    issue: str
    cause: str | None = None
    solution: str | None = None
    tags: list[str] = []
    frequency: int = 1
    scope: str = "universal"  # "universal" | "environment-specific"


class ActionableTask(BaseModel):
    """A task generated from session analysis to fix a root cause."""
    title: str
    description: str
    task_type: str = "fix"  # "fix" | "improvement" | "automation" | "investigation"
    priority: str = "medium"  # "high" | "medium" | "low"
    source_issue: str | None = None  # The gotcha/incident that triggered this
    suggested_approach: str | None = None
    tags: list[str] = []


class ProjectMemory(BaseModel):
    """Consolidated project memory from all sessions."""
    project: str
    project_path: str | None = None
    generated_at: str
    sessions_analyzed: int = 0
    last_session: str | None = None
    episodic: list[ConsolidatedEpisodic] = []
    semantic: list[ConsolidatedSemantic] = []
    procedural: list[ConsolidatedProcedural] = []
    decisions: list[ConsolidatedDecision] = []
    gotchas: list[ConsolidatedGotcha] = []
    tasks: list[ActionableTask] = []  # Generated tasks to fix issues
