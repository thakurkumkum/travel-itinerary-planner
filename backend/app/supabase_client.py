import os
from pathlib import Path
from typing import Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from postgrest import SyncPostgrestClient

env_path = Path(__file__).resolve().parents[1] / ".env"
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
else:
    load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_ROLE_KEY = (
    os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    or os.getenv("SUPABASE_SERVICE_KEY")
    or os.getenv("SUPABASE_SECRET_KEY")
)

supabase: Client | None = None

if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


def get_user_supabase_client(token: Optional[str] = None):
    """
    Returns a database client configured for the specific request.
    If a service role key is configured in the environment, uses it for admin bypass.
    If a user JWT token is provided, requests to Supabase PostgREST include
    'Authorization: Bearer <token>', allowing PostgreSQL Row Level Security (RLS)
    policies (e.g. auth.uid() = user_id) to evaluate correctly as the authenticated user.
    Otherwise falls back to the default anon client.
    """
    if not SUPABASE_URL:
        return None

    # 1. Prefer service role key if available in environment (admin privileges)
    if SUPABASE_SERVICE_ROLE_KEY:
        headers = {
            "apiKey": SUPABASE_SERVICE_ROLE_KEY,
            "Authorization": f"Bearer {SUPABASE_SERVICE_ROLE_KEY}",
        }
        return SyncPostgrestClient(
            f"{SUPABASE_URL}/rest/v1",
            headers=headers,
            schema="public",
        )

    # 2. Scope client to the authenticated user's JWT to satisfy PostgreSQL RLS
    if token and SUPABASE_KEY:
        headers = {
            "apiKey": SUPABASE_KEY,
            "Authorization": f"Bearer {token}",
        }
        return SyncPostgrestClient(
            f"{SUPABASE_URL}/rest/v1",
            headers=headers,
            schema="public",
        )

    # 3. Fallback to standard client
    return supabase
