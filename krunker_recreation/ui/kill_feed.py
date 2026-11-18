"""
Real-Time Combat Kill Feed Queue
"""

from typing import List, Dict, Any


class KillFeedUI:
    def __init__(self, max_items: int = 5, item_ttl: float = 5.0):
        self.max_items = max_items
        self.item_ttl = item_ttl
        self.entries: List[Dict[str, Any]] = []

    def push_kill(self, killer: str, victim: str, weapon: str, is_headshot: bool = False) -> Dict[str, Any]:
        item = {
            "killer": killer,
            "victim": victim,
            "weapon": weapon,
            "is_headshot": is_headshot,
            "ttl": self.item_ttl,
        }
        self.entries.insert(0, item)
        self.entries = self.entries[: self.max_items]
        return item

    def update(self, dt: float) -> List[Dict[str, Any]]:
        self.entries = [
            {**e, "ttl": e["ttl"] - dt}
            for e in self.entries
            if e["ttl"] - dt > 0.0
        ]
        return self.entries
