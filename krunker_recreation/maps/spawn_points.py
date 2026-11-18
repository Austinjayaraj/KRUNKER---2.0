"""
Safe Spawn Point Selection & Distance Scoring
Selects the spawn point farthest from active enemies to prevent spawn-camping.
"""

import math
from typing import List, Tuple


class SpawnPointSelector:
    @staticmethod
    def select_safest_spawn(
        spawn_points: List[Tuple[float, float, float]],
        enemy_positions: List[List[float]],
    ) -> Tuple[float, float, float]:
        if not spawn_points:
            return (0.0, 0.5, 0.0)
        if not enemy_positions:
            return spawn_points[0]

        best_spawn = spawn_points[0]
        best_min_dist = -1.0
        for sp in spawn_points:
            min_dist = min(
                math.hypot(sp[0] - ep[0], sp[2] - ep[2]) for ep in enemy_positions
            )
            if min_dist > best_min_dist:
                best_min_dist = min_dist
                best_spawn = sp
        return best_spawn
