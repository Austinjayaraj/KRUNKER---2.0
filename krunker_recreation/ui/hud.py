"""
Panda3D DirectGUI Combat Heads-Up Display (HUD)
Tracks health bar, ammo pips, velocity speedometer, slide-hop status, and match timer.
"""

from typing import Dict, Any, List


class CombatHUD:
    def __init__(self):
        self.floating_damage_numbers: List[Dict[str, Any]] = []
        self.active_banner: str = ""
        self.banner_timer: float = 0.0

    def push_damage_number(self, value: int, position: List[float], is_headshot: bool = False) -> None:
        self.floating_damage_numbers.append({
            "value": int(value),
            "position": list(position),
            "is_headshot": is_headshot,
            "ttl": 0.95,
        })

    def trigger_banner(self, text: str, duration: float = 2.5) -> None:
        if text:
            self.active_banner = text
            self.banner_timer = duration

    def update(self, dt: float) -> None:
        if self.banner_timer > 0.0:
            self.banner_timer = max(0.0, self.banner_timer - dt)
            if self.banner_timer == 0.0:
                self.active_banner = ""
        self.floating_damage_numbers = [
            {**d, "ttl": d["ttl"] - dt}
            for d in self.floating_damage_numbers
            if d["ttl"] - dt > 0.0
        ]

    def format_telemetry(self, health: float, max_health: float, mag: int, reserve: int, speed: float, is_sliding: bool) -> Dict[str, Any]:
        return {
            "hp_text": f"{int(health)} / {int(max_health)} HP",
            "ammo_text": f"{mag} / {reserve}",
            "speed_kmh": int(round(speed * 3.6)),
            "slide_boost_active": bool(is_sliding and speed > 14.0),
            "active_banner": self.active_banner,
            "floating_numbers_count": len(self.floating_damage_numbers),
        }
