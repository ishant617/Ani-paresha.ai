import os
import logging
from pydantic import BaseModel

# Initialize supabase client safely. 
# Depending on the version, the standard supabase-py is synchronous.
# Running this inside a FastAPI BackgroundTask ensures it utilizes the Starlette threadpool
# so it does not block the main async event loop.
try:
    from supabase import create_client, Client
except ImportError:
    Client = None

logger = logging.getLogger(__name__)

class ExecutionSummary(BaseModel):
    run_id: str
    status: str
    total_tokens: int
    duration_ms: int
    intercepted: bool

def log_execution_to_supabase(summary: ExecutionSummary):
    """
    Writes the final execution trace metrics to PostgreSQL (via Supabase).
    Designed to be fired off as a FastAPI BackgroundTask.
    """
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_KEY")
    
    if not supabase_url or not supabase_key:
        logger.warning(f"Mock logging run {summary.run_id} (Supabase keys missing).")
        return

    if Client is None:
        logger.error("supabase-py is not installed. Run `pip install supabase`")
        return

    try:
        # Lazy initialization for thread-safety in BackgroundTasks
        supabase: Client = create_client(supabase_url, supabase_key)
        
        data, count = supabase.table("Execution_Traces").insert({
            "run_id": summary.run_id,
            "status": summary.status,
            "total_tokens": summary.total_tokens,
            "duration_ms": summary.duration_ms,
            "intercepted": summary.intercepted
        }).execute()
        
        logger.info(f"Successfully logged run {summary.run_id} to Supabase.")
    except Exception as e:
        logger.error(f"Failed to log execution to Supabase for run {summary.run_id}: {e}")
