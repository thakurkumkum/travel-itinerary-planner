from fastapi import APIRouter, Depends
from app.dependencies.auth import get_current_user

router = APIRouter(
    prefix="/api/auth",
    tags=["Authentication"],
)


@router.get("/me")
def get_my_profile(current_user=Depends(get_current_user)):
    """
    Protected test endpoint.
    Verifies that the Supabase access token is valid and extracts
    the authenticated user's ID and email.
    """
    return {
        "user_id": str(current_user.id),
        "email": current_user.email,
        "metadata": getattr(current_user, "user_metadata", {}),
    }
