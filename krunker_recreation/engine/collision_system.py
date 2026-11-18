"""
Spatial AABB & Raycast Collision System for Krunker 3D FPS
Handles player-world resolution, step-up stairs, ceiling bumps, and jump pad triggers.
"""

from typing import List, Tuple, Optional, Dict, Any
from krunker_recreation.engine.physics_engine import AABB, PhysicsEngine


class CollisionSystem:
    def __init__(self, obstacles: Optional[List[AABB]] = None):
        self.obstacles: List[AABB] = obstacles or []
        self.jump_pads: List[Dict[str, Any]] = []

    def set_map_colliders(self, obstacles: List[AABB], jump_pads: Optional[List[Dict[str, Any]]] = None) -> None:
        self.obstacles = list(obstacles)
        self.jump_pads = list(jump_pads or [])

    def resolve_player_movement(
        self,
        pos: List[float],
        vel: List[float],
        radius: float,
        height: float,
        dt: float,
    ) -> Tuple[List[float], List[float], bool]:
        """Delegates full 3-axis AABB swept resolution to PhysicsEngine."""
        return PhysicsEngine.resolve_collisions(pos, vel, radius, height, self.obstacles, dt)

    def check_jump_pads(self, pos: List[float], vel: List[float]) -> Tuple[List[float], bool]:
        """Checks if player is within any jump pad trigger volume and applies launch boost."""
        px, py, pz = pos
        for pad in self.jump_pads:
            pad_pos = pad.get("position", (0.0, 0.0, 0.0))
            pad_rad = pad.get("radius", 2.0)
            dx = px - pad_pos[0]
            dz = pz - pad_pos[2]
            if (dx * dx + dz * dz) <= pad_rad * pad_rad and abs(py - pad_pos[1]) <= 1.8:
                boost = pad.get("boost_velocity", (0.0, 22.0, 0.0))
                return [vel[0] + boost[0], boost[1], vel[2] + boost[2]], True
        return vel, False
