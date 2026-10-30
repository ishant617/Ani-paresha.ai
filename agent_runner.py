import asyncio
import time
from typing import AsyncGenerator, Optional
from pydantic import BaseModel

class TraceStep(BaseModel):
    step: str
    content: Optional[str] = None
    tool: Optional[str] = None
    reason: Optional[str] = None
    timestamp: float

async def simulated_agent_execution(run_id: str, prompt: str) -> AsyncGenerator[TraceStep, None]:
    """
    Simulates a step-by-step LLM reasoning loop.
    Uses asyncio.sleep to emulate network latency without blocking the main event loop.
    """
    
    # Simulate Initial Thought
    await asyncio.sleep(0.5)
    yield TraceStep(
        step="thought", 
        content=f"Received prompt: '{prompt}'. Devising execution plan.",
        timestamp=time.time()
    )

    # Simulate Tool Call Invocation
    await asyncio.sleep(1.2)
    yield TraceStep(
        step="tool_call",
        tool="search_db",
        content="Executing search_db with extracted parameters.",
        timestamp=time.time()
    )

    # Simulate Guardrail Intervention (Destructive Action Test)
    await asyncio.sleep(0.8)
    destructive_keywords = ["drop table", "rm -rf", "delete user", "truncate"]
    if any(keyword in prompt.lower() for keyword in destructive_keywords):
        yield TraceStep(
            step="guardrail_intercept",
            reason="Destructive Action Blocked: High-risk system modification pattern detected.",
            timestamp=time.time()
        )
        # Terminate execution early due to security block
        return 

    # Simulate Follow-up Thought based on Tool Output
    await asyncio.sleep(1.5)
    yield TraceStep(
        step="thought",
        content="Analyzing search results. Found relevant records. Formulating final response.",
        timestamp=time.time()
    )
    
    # Simulate Final Answer
    await asyncio.sleep(0.5)
    yield TraceStep(
        step="final_response",
        content="The requested information has been successfully retrieved from the database.",
        timestamp=time.time()
    )
