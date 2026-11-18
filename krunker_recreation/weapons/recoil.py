"""
Weapon Recoil & Spread Bloom Mechanics
Handles vertical pitch kick, horizontal jitter, dynamic spread bloom, and smooth recovery.
"""

import random
from typing import Tuple


class RecoilSystem:
    def __init__(self, recovery_speed: float = 12.0):
        self.recovery_speed = recovery_speed
        self.pitch_offset = 0.0
        self.yaw_offset = 0.0
        self.spread_bloom = 0.0

    def apply_shot_kick(self, recoil_pitch: float, base_spread: float, is_ads: bool = False) -> Tuple[float, float]:
        """Applies per-shot pitch kick and spread bloom; returns (pitch_delta, yaw_delta)."""
        mult = 0.55 if is_ads else 1.0
        dp = recoil_pitch * mult
        dy = (random.random() - 0.5) * recoil_pitch * 0.4 * mult
        self.pitch_offset += dp
        self.yaw_offset += dy
        self.spread_bloom = min(0.08, self.spread_bloom + base_spread * 0.35 * mult)
        return dp, dy

    def update(self, dt: float) -> Tuple[float, float]:
        """Smoothly recovers pitch, yaw, and bloom toward zero."""
        decay = min(1.0, dt * self.recovery_speed)
        self.pitch_offset *= (1.0 - decay)
        self.yaw_offset *= (1.0 - decay)
        self.spread_bloom *= (1.0 - decay)
        return self.pitch_offset, self.yaw_offset
