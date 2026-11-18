"""
Dynamic Crosshair & Hitmarker Feedback Controller
Supports 5 reticle architectures (cross, dot, circle_dot, chevron, t_post) and dynamic movement spread.
"""

from typing import Dict, Any

VALID_RETICLE_STYLES = ("cross", "dot", "circle_dot", "chevron", "t_post")


class CrosshairUI:
    def __init__(self, style: str = "cross", color: str = "#38bdf8", size: int = 10, gap: int = 5):
        self.style = style if style in VALID_RETICLE_STYLES else "cross"
        self.color = color
        self.size = size
        self.base_gap = gap
        self.hitmarker_timer = 0.0
        self.hitmarker_headshot = False

    def trigger_hitmarker(self, is_headshot: bool = False) -> None:
        self.hitmarker_timer = 0.18
        self.hitmarker_headshot = is_headshot

    def compute_dynamic_gap(self, speed: float, is_ads: bool, is_jumping: bool) -> float:
        if is_ads:
            return 2.0
        gap = float(self.base_gap) + min(18.0, speed * 0.45)
        if is_jumping:
            gap += 8.0
        return round(gap, 2)

    def update(self, dt: float) -> Dict[str, Any]:
        if self.hitmarker_timer > 0.0:
            self.hitmarker_timer = max(0.0, self.hitmarker_timer - dt)
        return {
            "style": self.style,
            "hitmarker_active": self.hitmarker_timer > 0.0,
            "is_headshot": self.hitmarker_headshot,
        }
