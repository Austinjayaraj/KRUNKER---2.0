"""
Weapon Skin & Reticle Unlock Registry by Player Level
"""

from typing import List, Dict, Any

UNLOCK_MILESTONES: List[Dict[str, Any]] = [
    {"id": "tactical", "type": "skin", "name": "Tactical Carbon", "required_level": 1},
    {"id": "cyber", "type": "skin", "name": "Cyber Neon", "required_level": 2},
    {"id": "camo", "type": "skin", "name": "Desert Spec-Ops", "required_level": 4},
    {"id": "gold", "type": "skin", "name": "24K Damascus Gold", "required_level": 6},
    {"id": "hyperbeast", "type": "skin", "name": "Hyperbeast Crimson", "required_level": 10},
]


class UnlockManager:
    @staticmethod
    def get_unlocked_items(player_level: int) -> List[Dict[str, Any]]:
        return [item for item in UNLOCK_MILESTONES if player_level >= item["required_level"]]

    @staticmethod
    def is_unlocked(item_id: str, player_level: int) -> bool:
        for item in UNLOCK_MILESTONES:
            if item["id"] == item_id:
                return player_level >= item["required_level"]
        return True
