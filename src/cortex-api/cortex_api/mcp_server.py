"""Cortex MCP stdio server — what IBM Bob talks to.

Run via ``python -m cortex_api.mcp_server`` and configure Bob's MCP settings
to launch this command for the ``cortex`` MCP server. The server exposes the
five tools defined in ``cortex_api.tools`` over stdio.

Implementation uses the official ``mcp`` Python SDK. The protocol is:
  - Client sends a ``tools/list`` request → we return TOOL_DEFINITIONS.
  - Client sends a ``tools/call`` request → we dispatch to ``tools.call_tool``.

The server reuses the same ``storage`` / ``retrieval`` layer as the REST API
so a single codebase serves both transports.
"""

from __future__ import annotations

import asyncio
import logging
import sys

from cortex_api import storage, tools
from cortex_api.embeddings import get_provider

log = logging.getLogger(__name__)


async def _run() -> None:
    # Initialise DB before serving so the first tool call is fast.
    provider = get_provider()
    storage.init_db(embedding_dim=provider.dim)
    log.info(
        "cortex MCP stdio server ready (provider=%s, dim=%d)",
        provider.name,
        provider.dim,
    )

    try:
        from mcp import types  # type: ignore[import-not-found]
        from mcp.server import Server  # type: ignore[import-not-found]
        from mcp.server.stdio import stdio_server  # type: ignore[import-not-found]
    except ImportError as exc:  # pragma: no cover — dependency missing
        log.error("mcp SDK missing — install with `pip install mcp`: %s", exc)
        raise

    server: Server = Server("cortex")

    @server.list_tools()
    async def list_tools() -> list[types.Tool]:
        return [
            types.Tool(
                name=spec["name"],
                description=spec["description"],
                inputSchema=spec["inputSchema"],
            )
            for spec in tools.TOOL_DEFINITIONS
        ]

    @server.call_tool()
    async def call_tool(
        name: str,
        arguments: dict | None,
    ) -> list[types.TextContent]:
        text = tools.call_tool(name, arguments or {})
        return [types.TextContent(type="text", text=text)]

    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


def main() -> None:
    logging.basicConfig(
        level=logging.INFO,
        stream=sys.stderr,  # stdout is reserved for MCP framing
        format="%(asctime)s %(levelname)s %(name)s: %(message)s",
    )
    asyncio.run(_run())


if __name__ == "__main__":
    main()
