"""
Respawn Queue & Spawn Protection Timer System
"""

from typing import Dict, Tuple, List
from krunker_recreation.maps.spawn_points import SpawnPointSelector


class RespawnSystem:
    def __init__(self, respawn_delay: float = 3.0):
        self.respawn_delay = respawn_delay
        self.timers: Dict[str, float] = {}

    def queue_respawn(self, entity_id: str, custom_delay: float = None) -> None:
        self.timers[entity_id] = self.respawn_delay if custom_delay is None else custom_delay

    def update(
        self,
        dt: float,
        spawn_points: List[Tuple[float, float, float]],
        enemy_positions: List[List[float]],
    ) -> Dict[str, Tuple[float, float, float]]:
        respawned: Dict[str, Tuple[float, float, float]] = {}
        for eid in list(self.timers.keys()):
            self.timers[eid] -= dt
            if self.timers[eid] <= 0.0:
                del self.timers[eid]
                respawned[eid] = SpawnPointSelector.select_safest_spawn(spawn_points, enemy_positions)
        return respawned
