from typing import Any, Optional
import logging
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from app.supabase_client import supabase

logger = logging.getLogger("auth")
security = HTTPBearer(auto_error=False)


class AuthenticatedUser:
    """
    Wraps the Supabase User object while retaining the validated JWT token
    to allow user-scoped authenticated database calls respecting PostgreSQL RLS.
    """

    def __init__(self, user: Any, token: str):
        self._user = user
        self.token = token
        self.id = getattr(user, "id", None)
        self.email = getattr(user, "email", None)
        self.user_metadata = getattr(user, "user_metadata", {})

    def __getattr__(self, name: str) -> Any:
        return getattr(self._user, name)

    def __str__(self) -> str:
        return str(self.id)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
):
    """
    Verifies the Supabase JWT access token and extracts the authenticated user.
    Rejects missing, forged, or expired tokens with 401 Unauthorized.
    Never relies on client-supplied user IDs.
    """
    if not credentials or not credentials.credentials:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Extract the raw JWT string without any prefixes or whitespace
    token = credentials.credentials.strip()

    if not supabase:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Supabase client is not configured on the backend.",
        )

    try:
        # Cryptographically verify the JWT against Supabase Auth service
        user_response = supabase.auth.get_user(jwt=token)

        if not user_response or not user_response.user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired session token. Please sign in again.",
                headers={"WWW-Authenticate": "Bearer"},
            )

        return AuthenticatedUser(user_response.user, token)

    except HTTPException:
        raise
    except Exception as exc:
        # Log clean diagnostic without exposing secret token contents
        logger.warning(f"Token verification rejected: {type(exc).__name__}: {exc}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token. Please sign in again.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc
