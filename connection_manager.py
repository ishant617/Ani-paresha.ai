import logging
from typing import Dict, List
from fastapi import WebSocket, WebSocketDisconnect

logger = logging.getLogger(__name__)

class ConnectionManager:
    """
    Manages active WebSocket connections for real-time trace streaming.
    Memory Optimization: Groups connections by `run_id` and cleanly removes dropped clients
    to prevent memory leaks on the 16GB local environment.
    """
    def __init__(self):
        # Maps run_id -> List of active WebSocket connections
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, run_id: str):
        await websocket.accept()
        if run_id not in self.active_connections:
            self.active_connections[run_id] = []
        self.active_connections[run_id].append(websocket)
        logger.info(f"Client connected to run {run_id}. Total clients for run: {len(self.active_connections[run_id])}")

    def disconnect(self, websocket: WebSocket, run_id: str):
        if run_id in self.active_connections:
            try:
                self.active_connections[run_id].remove(websocket)
                if not self.active_connections[run_id]:
                    # Clean up the key entirely if no clients are left to prevent dict bloat
                    del self.active_connections[run_id]
                logger.info(f"Client disconnected from run {run_id}.")
            except ValueError:
                pass

    async def broadcast_to_run(self, run_id: str, message: dict):
        """
        Broadcasts a JSON message to all connected clients observing a specific run.
        """
        if run_id in self.active_connections:
            # Iterate over a shallow copy of the list in case a disconnect mutates the list mid-iteration
            for connection in list(self.active_connections[run_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send message to a client for run {run_id}: {e}")
                    self.disconnect(connection, run_id)
