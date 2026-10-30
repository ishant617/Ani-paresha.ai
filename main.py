import asyncio
import time
import uuid
import logging
from typing import Optional

from fastapi import FastAPI, WebSocket, WebSocketDisconnect, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from connection_manager import ConnectionManager
from agent_runner import simulated_agent_execution
from db_logger import log_execution_to_supabase, ExecutionSummary

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI App
app = FastAPI(
    title="Agent Reliability Engine - Trace API", 
    version="1.0.0",
    description="Real-time backend for streaming agent execution traces."
)

# CORS Middleware (Configure strictly for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Change to frontend URL in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize WebSocket Manager
manager = ConnectionManager()

class EvaluationRequest(BaseModel):
    prompt: str
    run_id: Optional[str] = None

@app.websocket("/ws/trace/{run_id}")
async def websocket_trace_endpoint(websocket: WebSocket, run_id: str):
    """
    WebSocket endpoint for the React frontend to listen to live trace steps.
    """
    await manager.connect(websocket, run_id)
    try:
        while True:
            # Keep the connection alive. The client mostly listens, but could send ping/pong
            _ = await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, run_id)
    except Exception as e:
        logger.error(f"WebSocket error on run {run_id}: {e}")
        manager.disconnect(websocket, run_id)


@app.post("/api/v1/evaluate")
async def evaluate_agent(request: EvaluationRequest, background_tasks: BackgroundTasks):
    """
    Triggers an agent run. Spawns an async task to execute the agent and stream
    results over WebSockets, returning HTTP 202 Accepted immediately.
    """
    run_id = request.run_id or str(uuid.uuid4())
    
    async def run_and_stream(execution_run_id: str, user_prompt: str):
        start_time = time.time()
        intercepted = False
        
        try:
            # Stream the agent execution steps iteratively
            async for step in simulated_agent_execution(execution_run_id, user_prompt):
                await manager.broadcast_to_run(execution_run_id, step.model_dump())
                if step.step == "guardrail_intercept":
                    intercepted = True
                    
            # Calculate final performance metrics
            duration_ms = int((time.time() - start_time) * 1000)
            summary = ExecutionSummary(
                run_id=execution_run_id,
                status="completed" if not intercepted else "intercepted",
                total_tokens=245, # Mock token count for demo
                duration_ms=duration_ms,
                intercepted=intercepted
            )
            
            # Fire-and-forget Supabase logging using Starlette's BackgroundTasks (threadpool)
            # This ensures the DB I/O does not block the async event loop.
            background_tasks.add_task(log_execution_to_supabase, summary)
            
        except Exception as e:
            logger.error(f"Execution error on run {execution_run_id}: {e}")
            await manager.broadcast_to_run(execution_run_id, {"error": str(e)})

    # Spawn the agent execution as an un-awaited background task so the HTTP request
    # returns immediately while the agent works asynchronously.
    asyncio.create_task(run_and_stream(run_id, request.prompt))
    
    # Return 202 Accepted to indicate the request is processing
    return {"status": "Execution started", "run_id": run_id}

if __name__ == "__main__":
    import uvicorn
    # Optimized for local execution
    uvicorn.run(app, host="0.0.0.0", port=8000)
