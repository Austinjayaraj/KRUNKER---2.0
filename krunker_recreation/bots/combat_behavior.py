"""
Bot Combat Behavior: Burst Firing, Strafe Dodging, and Accuracy Scaling
"""

import math
import random
from typing import Dict, Any, List


class BotCombatBehavior:
    def __init__(self, accuracy: float = 0.65, burst_length: int = 4):
        self.accuracy = accuracy
        self.burst_length = burst_length
        self.shots_in_burst = 0
        self.burst_cooldown = 0.0
        self.strafe_dir = 1.0
        self.strafe_timer = 1.2

    def update_combat(
        self,
        dt: float,
        bot_pos: List[float],
        target_pos: List[float],
        base_speed: float = 11.0,
    ) -> Dict[str, Any]:
        self.strafe_timer -= dt
        if self.strafe_timer <= 0.0:
            self.strafe_dir *= -1.0
            self.strafe_timer = 0.8 + random.random() * 0.9

        if self.burst_cooldown > 0.0:
            self.burst_cooldown = max(0.0, self.burst_cooldown - dt)

        dx = target_pos[0] - bot_pos[0]
        dz = target_pos[2] - bot_pos[2]
        dist = max(0.001, math.hypot(dx, dz))
        nx, nz = dx / dist, dz / dist

        # Perpendicular tactical strafe vector
        strafe_x = -nz * self.strafe_dir * base_speed * 0.75
        strafe_z = nx * self.strafe_dir * base_speed * 0.75

        can_fire = self.burst_cooldown <= 0.0
        did_hit = False
        if can_fire:
            self.shots_in_burst += 1
            hit_chance = self.accuracy * max(0.25, 1.0 - dist / 95.0)
            did_hit = random.random() < hit_chance
            if self.shots_in_burst >= self.burst_length:
                self.shots_in_burst = 0
                self.burst_cooldown = 0.55

        return {
            "velocity": [strafe_x, 0.0, strafe_z],
            "fired": can_fire,
            "hit_target": did_hit,
            "yaw": math.atan2(dx, dz),
        }
