"""
Authoritative Combat Damage & Falloff Calculation System
Computes distance dropoff, headshot multipliers, leg multipliers, and explosive splash damage.
"""

import math
from typing import Dict, Any, List


class DamageSystem:
    @staticmethod
    def calculate_damage(
        base_damage: float,
        headshot_mult: float,
        hit_zone: str = "body",
        distance: float = 10.0,
        max_range: float = 120.0,
    ) -> int:
        if distance > max_range:
            return 0
        # Smooth distance falloff beyond 50% of max range
        falloff = 1.0
        half_range = max_range * 0.5
        if distance > half_range:
            falloff = max(0.45, 1.0 - 0.55 * ((distance - half_range) / max(1.0, half_range)))

        zone_mult = 1.0
        if hit_zone == "head":
            zone_mult = headshot_mult
        elif hit_zone == "legs":
            zone_mult = 0.78

        return max(1, int(round(base_damage * zone_mult * falloff)))

    @staticmethod
    def calculate_explosion_damage(
        origin: List[float],
        target_pos: List[float],
        max_damage: float = 115.0,
        blast_radius: float = 9.0,
    ) -> int:
        dist = math.sqrt(sum((origin[i] - target_pos[i]) ** 2 for i in range(3)))
        if dist >= blast_radius:
            return 0
        ratio = 1.0 - (dist / blast_radius)
        return max(1, int(round(max_damage * ratio)))
