import asyncio
from typing import Set

class EventBus:
    """In-memory pub/sub for broadcasting SSE events."""

    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    async def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue()
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        self._subscribers.discard(queue)
        
    async def publish(self, event: dict):
        for queue in self._subscribers:
            await queue.put(event)

# Singleton
event_bus = EventBus()
