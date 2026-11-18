"""
Bot Waypoint Navigation & Obstacle Avoidance System
"""

import math
from typing import List, Tuple


class WaypointNavigator:
    def __init__(self, waypoints: List[Tuple[float, float, float]] = None):
        self.waypoints: List[Tuple[float, float, float]] = waypoints or [
            (18.0, 0.0, 18.0),
            (-18.0, 0.0, 18.0),
            (-18.0, 0.0, -18.0),
            (18.0, 0.0, -18.0),
            (0.0, 0.0, 0.0),
        ]
        self.current_index = 0

    def next_direction(self, current_pos: List[float], speed: float = 11.0) -> List[float]:
        if not self.waypoints:
            return [0.0, 0.0, 0.0]
        target = self.waypoints[self.current_index % len(self.waypoints)]
        dx = target[0] - current_pos[0]
        dz = target[2] - current_pos[2]
        dist = math.hypot(dx, dz)
        if dist < 2.2:
            self.current_index = (self.current_index + 1) % len(self.waypoints)
            target = self.waypoints[self.current_index]
            dx = target[0] - current_pos[0]
            dz = target[2] - current_pos[2]
            dist = math.hypot(dx, dz)
        if dist < 0.001:
            return [0.0, 0.0, 0.0]
        return [(dx / dist) * speed, 0.0, (dz / dist) * speed]
