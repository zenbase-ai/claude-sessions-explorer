"""
Prompts for session analysis and memory generation.

Inspired by:
- GEPA (arxiv.org/abs/2507.19457): Reflective analysis of execution traces
- Mem0 (mem0.ai): Multi-level memory extraction with ADD/UPDATE/DELETE operations
- DSPy (dspy.ai): Structured signature-based prompting with tips
"""

# Extraction prompts and helpers
from .extract import (
    EXTRACTION_SYSTEM_PROMPT,
    EXTRACTION_PROMPT,
    EXTRACTION_TIPS,
    get_extraction_prompt,
)

# Consolidation prompts and helpers
from .consolidate import (
    CONSOLIDATION_SYSTEM_PROMPT,
    CONSOLIDATION_PROMPT,
    get_consolidation_prompt,
)

# Generation prompts and helpers
from .generate import (
    GENERATION_TIPS,
    CLAUDEMD_SYSTEM_PROMPT,
    CLAUDEMD_PROMPT,
    SKILLS_SYSTEM_PROMPT,
    SKILLS_PROMPT,
    VERIFY_SYSTEM_PROMPT,
    VERIFY_PROMPT,
    QUERY_SYSTEM_PROMPT,
    QUERY_PROMPT,
    TASKS_SYSTEM_PROMPT,
    TASKS_PROMPT,
    get_claudemd_prompt,
    get_skills_prompt,
    get_verify_prompt,
    get_query_prompt,
    get_tasks_prompt,
)

__all__ = [
    # Extraction
    "EXTRACTION_SYSTEM_PROMPT",
    "EXTRACTION_PROMPT",
    "EXTRACTION_TIPS",
    "get_extraction_prompt",
    # Consolidation
    "CONSOLIDATION_SYSTEM_PROMPT",
    "CONSOLIDATION_PROMPT",
    "get_consolidation_prompt",
    # Generation
    "GENERATION_TIPS",
    "CLAUDEMD_SYSTEM_PROMPT",
    "CLAUDEMD_PROMPT",
    "SKILLS_SYSTEM_PROMPT",
    "SKILLS_PROMPT",
    "VERIFY_SYSTEM_PROMPT",
    "VERIFY_PROMPT",
    "QUERY_SYSTEM_PROMPT",
    "QUERY_PROMPT",
    "TASKS_SYSTEM_PROMPT",
    "TASKS_PROMPT",
    "get_claudemd_prompt",
    "get_skills_prompt",
    "get_verify_prompt",
    "get_query_prompt",
    "get_tasks_prompt",
]
