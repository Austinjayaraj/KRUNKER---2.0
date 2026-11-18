"""
Player Health, Spawn Protection Shield, and Auto-Regeneration System
"""


class HealthComponent:
    def __init__(self, max_health: int = 100, regen_delay: float = 4.5, regen_rate: float = 15.0):
        self.max_health = float(max_health)
        self.health = float(max_health)
        self.regen_delay = regen_delay
        self.regen_rate = regen_rate
        self.time_since_last_hit = 999.0
        self.spawn_shield_timer = 3.0
        self.is_alive = True

    @property
    def is_shielded(self) -> bool:
        return self.spawn_shield_timer > 0.0

    def apply_damage(self, amount: float) -> float:
        """Applies damage if not spawn-shielded; returns actual damage dealt."""
        if not self.is_alive or self.is_shielded or amount <= 0:
            return 0.0
        actual = min(self.health, float(amount))
        self.health = max(0.0, self.health - actual)
        self.time_since_last_hit = 0.0
        if self.health <= 0.0:
            self.is_alive = False
        return actual

    def heal(self, amount: float) -> float:
        if not self.is_alive:
            return 0.0
        prev = self.health
        self.health = min(self.max_health, self.health + float(amount))
        return self.health - prev

    def respawn(self, max_health: int = None, shield_duration: float = 3.0) -> None:
        if max_health is not None:
            self.max_health = float(max_health)
        self.health = self.max_health
        self.is_alive = True
        self.spawn_shield_timer = shield_duration
        self.time_since_last_hit = 999.0

    def update(self, dt: float) -> None:
        if self.spawn_shield_timer > 0.0:
            self.spawn_shield_timer = max(0.0, self.spawn_shield_timer - dt)
        if not self.is_alive:
            return
        self.time_since_last_hit += dt
        if self.time_since_last_hit >= self.regen_delay and self.health < self.max_health:
            self.health = min(self.max_health, self.health + self.regen_rate * dt)
