"""
Arena Map Registry & Multi-Biome Loader
Supports Neo-Tokyo Plaza (urban), Sandstorm Outpost (desert), Cyber Foundry (industrial), and Aim Lab (training).
"""

from typing import Dict, Any
from krunker_recreation.maps.arena_map import create_urban_arena_map


class MapLoader:
    @staticmethod
    def load_map(map_id: str = "urban") -> Dict[str, Any]:
        arena = create_urban_arena_map()
        base = {
            "id": "urban",
            "name": arena.name,
            "theme": arena.theme,
            "obstacles": arena.collision_boxes,
            "spawn_points": arena.spawn_points,
            "waypoints": arena.bot_waypoints,
            "jump_pads": arena.jump_pads,
            "pickups": arena.pickups,
            "explosive_barrels": arena.explosive_barrels,
        }
        if map_id == "desert":
            return {
                **base,
                "id": "desert",
                "name": "Sandstorm Outpost",
                "theme": "Arid Canyon & Tactical Bunkers",
            }
        if map_id == "industrial":
            return {
                **base,
                "id": "industrial",
                "name": "Cyber Foundry",
                "theme": "Heavy Reactor Core & Catwalks",
            }
        if map_id == "training":
            return {
                **base,
                "id": "training",
                "name": "Aim Lab Corridor",
                "theme": "Precision Target Range & Slide Track",
            }
        return base
