"""
Reusable Level Environment Builder Template for Krunker 3D FPS Campaign (Levels 1-15)
Constructs distinct layouts, lighting, obstacles, elevation tiers, interactive objects, and enemy spawn routes.
"""

from typing import Dict, Any, List, Tuple
from krunker_recreation.engine.physics_engine import AABB


def create_level_environment(
    level_number: int,
    layout_style: str,
    sky_color: Tuple[float, float, float],
    ambient_color: Tuple[float, float, float],
    fog_density: float,
    combat_distance: str,
    elevation_tiers: int,
    custom_boxes: List[AABB],
    enemy_spawns: List[Tuple[float, float, float]],
    interactive_objects: List[Dict[str, Any]],
) -> Dict[str, Any]:
    perimeter = [
        AABB(-48.0, 0.0, -50.0, 48.0, 14.0, -47.0),
        AABB(-48.0, 0.0, 47.0, 48.0, 14.0, 50.0),
        AABB(-50.0, 0.0, -48.0, -47.0, 14.0, 48.0),
        AABB(47.0, 0.0, -48.0, 50.0, 14.0, 48.0),
    ]
    return {
        "level_number": level_number,
        "layout_style": layout_style,
        "lighting": {
            "sky_rgb": sky_color,
            "ambient_rgb": ambient_color,
            "fog_density": fog_density,
        },
        "combat_distance": combat_distance,
        "elevation_tiers": elevation_tiers,
        "collision_boxes": perimeter + custom_boxes,
        "enemy_spawns": enemy_spawns,
        "interactive_objects": interactive_objects,
        "player_spawn": (0.0, 0.5, 34.0),
    }
