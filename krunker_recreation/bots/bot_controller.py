"""
Bot Entity Controller & Lifecycle Spawner
Integrates BotAI, WaypointNavigator, and BotCombatBehavior for each arena bot.
"""

from typing import List, Dict, Any, Tuple
from krunker_recreation.bots.bot_ai import BotAI
from krunker_recreation.bots.navigation import WaypointNavigator
from krunker_recreation.bots.combat_behavior import BotCombatBehavior


class BotController:
    def __init__(
        self,
        bot_id: str,
        name: str,
        team: str,
        spawn_pos: Tuple[float, float, float],
        difficulty: str = "normal",
        waypoints: List[Tuple[float, float, float]] = None,
    ):
        self.bot_id = bot_id
        self.name = name
        self.team = team
        self.position = [float(spawn_pos[0]), float(spawn_pos[1]), float(spawn_pos[2])]
        self.velocity = [0.0, 0.0, 0.0]
        self.max_health = 100
        self.health = 100
        self.is_alive = True
        self.respawn_timer = 0.0
        self.ai = BotAI(bot_id, difficulty)
        self.navigator = WaypointNavigator(waypoints)
        self.combat = BotCombatBehavior(accuracy=self.ai.config["accuracy"])

    def apply_damage(self, damage: int) -> bool:
        """Applies damage and returns True if bot was eliminated."""
        if not self.is_alive:
            return False
        self.health = max(0, self.health - int(damage))
        if self.health == 0:
            self.is_alive = False
            self.respawn_timer = 3.0
            return True
        return False

    def respawn(self, spawn_pos: Tuple[float, float, float]) -> None:
        self.position = [float(spawn_pos[0]), float(spawn_pos[1]), float(spawn_pos[2])]
        self.velocity = [0.0, 0.0, 0.0]
        self.health = self.max_health
        self.is_alive = True
        self.respawn_timer = 0.0

    def update(self, dt: float, player_pos: List[float], is_player_shielded: bool = False) -> Dict[str, Any]:
        if not self.is_alive:
            self.respawn_timer = max(0.0, self.respawn_timer - dt)
            return {"alive": False, "respawn_ready": self.respawn_timer <= 0.0}

        decision = self.ai.update(
            dt,
            self.position,
            player_pos,
            has_los=True,
            is_player_shielded=is_player_shielded,
            health=self.health,
            max_health=self.max_health,
            waypoints=self.navigator.waypoints,
        )
        vel = decision.get("velocity", [0.0, 0.0, 0.0])
        self.position[0] += vel[0] * dt
        self.position[2] += vel[2] * dt
        return {
            "alive": True,
            "state": decision["state"],
            "should_shoot": decision["should_shoot"],
            "position": list(self.position),
        }
