"""
Directional Threat Arc & Low-Health Vignette Overlay Calculator
Computes incoming fire angle relative to player camera yaw.
"""

import math
from typing import List, Dict, Any


class DamageOverlayUI:
    def __init__(self):
        self.indicators: List[Dict[str, Any]] = []

    def add_threat_source(
        self,
        player_pos: List[float],
        player_yaw: float,
        attacker_pos: List[float],
        ttl: float = 1.2,
    ) -> float:
        dx = attacker_pos[0] - player_pos[0]
        dz = attacker_pos[2] - player_pos[2]
        world_angle = math.atan2(dx, -dz)
        rel_angle_deg = math.degrees(world_angle - player_yaw)
        self.indicators.append({"angle_deg": round(rel_angle_deg, 1), "ttl": ttl})
        return rel_angle_deg

    def update(self, dt: float) -> List[Dict[str, Any]]:
        self.indicators = [
            {**ind, "ttl": ind["ttl"] - dt}
            for ind in self.indicators
            if ind["ttl"] - dt > 0.0
        ]
        return self.indicators
