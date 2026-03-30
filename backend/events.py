import asyncio
from typing import Set


class EventBus:
    """In-memory pub/sub for broadcasting SSE events.

    Each subscriber gets a bounded asyncio.Queue (maxsize=100).
    If a slow client falls too far behind, new events are dropped for
    that subscriber rather than growing memory unboundedly.
    """

    def __init__(self):
        self._subscribers: Set[asyncio.Queue] = set()

    async def subscribe(self) -> asyncio.Queue:
        queue = asyncio.Queue(maxsize=100)
        self._subscribers.add(queue)
        return queue

    def unsubscribe(self, queue: asyncio.Queue):
        self._subscribers.discard(queue)

    async def publish(self, event: dict):
        dead: list[asyncio.Queue] = []
        for queue in self._subscribers:
            try:
                queue.put_nowait(event)
            except asyncio.QueueFull:
                # Drop event for this slow subscriber — do not block the broadcaster
                dead.append(queue)
        # Clean up consistently full queues (subscriber likely disconnected)
        for q in dead:
            self._subscribers.discard(q)


# Singleton
event_bus = EventBus()
