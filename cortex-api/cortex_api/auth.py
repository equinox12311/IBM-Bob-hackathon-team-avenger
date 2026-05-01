"""Bearer-token authentication dependency for the REST API."""

from fastapi import Depends, Header, HTTPException, status

from cortex_api.config import settings


def require_bearer(authorization: str | None = Header(default=None)) -> None:
    """Reject requests missing or with the wrong bearer token."""

    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing bearer token",
        )
    token = authorization.split(" ", 1)[1]
    if token != settings.diary_token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid bearer token",
        )


# Convenience alias for FastAPI route dependencies.
AuthDep = Depends(require_bearer)
