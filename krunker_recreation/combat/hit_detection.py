"""
3D Hitbox Raycast & Head/Body/Legs Zone Detection
"""

from typing import Optional, Dict, Any, List
from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.weapons.hitscan import ray_intersects_box


class HitDetection:
    @staticmethod
    def check_character_hit(
        ray_origin: List[float],
        ray_dir: List[float],
        target_pos: List[float],
        radius: float = 0.65,
        height: float = 2.6,
        max_range: float = 150.0,
    ) -> Optional[Dict[str, Any]]:
        box = AABB(
            target_pos[0] - radius,
            target_pos[1],
            target_pos[2] - radius,
            target_pos[0] + radius,
            target_pos[1] + height,
            target_pos[2] + radius,
        )
        t = ray_intersects_box(ray_origin, ray_dir, box)
        if t is None or t > max_range:
            return None

        hit_point = [ray_origin[i] + ray_dir[i] * t for i in range(3)]
        rel_y = (hit_point[1] - target_pos[1]) / max(0.1, height)
        if rel_y >= 0.74:
            zone = "head"
        elif rel_y <= 0.30:
            zone = "legs"
        else:
            zone = "body"

        return {
            "distance": t,
            "hit_point": hit_point,
            "zone": zone,
            "is_headshot": zone == "head",
        }
