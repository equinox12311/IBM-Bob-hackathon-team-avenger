"""MCP tool definitions.

Phase 2 (M2): wire each tool to call the matching FastAPI handler so that the
REST and MCP transports share business logic. Bob will call these via
``use_mcp_tool`` once the MCP stdio transport is active (see ``mcp_server``).
"""

# TODO(M2 Phase 2):
# - Define five MCP tools matching docs/CONTRACTS.md exactly:
#     diary_save, diary_recall, diary_link_code, diary_feedback, diary_timeline
# - Each tool function should be thin: validate inputs, dispatch to storage/retrieval
# - Tool descriptions should be specific so Bob picks them up correctly
