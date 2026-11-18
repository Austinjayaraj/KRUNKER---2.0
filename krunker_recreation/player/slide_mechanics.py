"""
Krunker Slide-Hop & Crouch-Slide Momentum Mechanics
Implements impulse burst on landing-slide and low-friction slide preservation.
"""

import math
from typing import List, Tuple
from krunker_recreation.config.movement_config import (
    SLIDE_SPEED_BOOST,
    SLIDE_FRICTION,
    CROUCH_HEIGHT,
    STAND_HEIGHT,
)
from krunker_recreation.player.movement import apply_friction


class SlideMechanics:
    def __init__(self):
        self.is_sliding = False
        self.slide_timer = 0.0
        self.max_slide_duration = 0.85
        self.current_eye_height = STAND_HEIGHT

    def start_slide(self, velocity: List[float], is_grounded: bool) -> List[float]:
        """Triggers a Krunker slide-hop velocity impulse along horizontal movement direction."""
        horiz_speed = math.hypot(velocity[0], velocity[2])
        if not is_grounded or horiz_speed < 4.0:
            self.is_sliding = False
            return velocity

        self.is_sliding = True
        self.slide_timer = self.max_slide_duration
        nx = velocity[0] / horiz_speed
        nz = velocity[2] / horiz_speed
        return [
            velocity[0] + nx * SLIDE_SPEED_BOOST,
            velocity[1],
            velocity[2] + nz * SLIDE_SPEED_BOOST,
        ]

    def update_slide(self, velocity: List[float], dt: float, is_crouch_held: bool) -> Tuple[List[float], float]:
        """Updates slide friction, timer, and smooth camera crouch height."""
        if self.is_sliding:
            self.slide_timer -= dt
            velocity = apply_friction(velocity, SLIDE_FRICTION, dt)
            if self.slide_timer <= 0.0 or not is_crouch_held:
                self.is_sliding = False

        target_height = CROUCH_HEIGHT if (self.is_sliding or is_crouch_held) else STAND_HEIGHT
        self.current_eye_height += (target_height - self.current_eye_height) * min(1.0, dt * 14.0)
        return velocity, self.current_eye_height
