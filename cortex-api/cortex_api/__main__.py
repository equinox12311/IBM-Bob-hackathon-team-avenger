"""Entrypoint: ``python -m cortex_api`` runs the REST/SSE server."""

import uvicorn

from cortex_api.config import settings


def main() -> None:
    uvicorn.run(
        "cortex_api.server:app",
        host=settings.host,
        port=settings.port,
        reload=settings.reload,
    )


if __name__ == "__main__":
    main()
