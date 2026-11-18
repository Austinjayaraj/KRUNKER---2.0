"""
Active Campaign Level Runtime Manager
Coordinates enemy spawning, special enemy archetype stats, interactive objects, checkpoints, and objective ticks.
"""

from typing import Dict, Any, List
from krunker_recreation.config.bot_config import ENEMY_ARCHETYPES, BOT_DIFFICULTIES
from krunker_recreation.campaign.objective_manager import ObjectiveManager
from krunker_recreation.campaign.reward_manager import RewardManager


class LevelManager:
    def __init__(self, level_data: Dict[str, Any]):
        self.level_data = level_data
        self.level_number = int(level_data["level_number"])
        self.objectives = ObjectiveManager(level_data)
        self.is_paused = False
        self.is_finished = False
        self.active_enemies: List[Dict[str, Any]] = []
        self.spawn_queue: List[str] = list(level_data.get("enemy_composition", []))
        self.checkpoints_reached: List[str] = []
        self._spawn_initial_wave()

    def _spawn_initial_wave(self) -> None:
        total_waves = max(1, int(self.level_data.get("waves", 1)))
        per_wave = max(1, len(self.spawn_queue) // total_waves)
        batch = self.spawn_queue[:per_wave] if total_waves > 1 else list(self.spawn_queue)
        self.spawn_queue = self.spawn_queue[len(batch) :]
        for idx, arch_id in enumerate(batch):
            self._spawn_enemy_entity(arch_id, idx)

    def _spawn_enemy_entity(self, archetype_id: str, index: int) -> Dict[str, Any]:
        arch = ENEMY_ARCHETYPES.get(archetype_id, ENEMY_ARCHETYPES["standard_soldier"])
        diff_key = self.level_data.get("difficulty_key", "normal")
        diff = BOT_DIFFICULTIES.get(diff_key, BOT_DIFFICULTIES["normal"])
        spawns = self.level_data.get("environment", {}).get("enemy_spawns", [(15.0, 0.5, 15.0)])
        sp = spawns[index % len(spawns)]

        entity = {
            "id": f"enemy_{self.level_number}_{len(self.active_enemies) + index}",
            "archetype": archetype_id,
            "name": arch["name"],
            "health": arch["health"],
            "max_health": arch["health"],
            "speed": round(diff["movement_speed"] * arch["speed_multiplier"], 2),
            "accuracy": min(0.95, max(0.10, diff["accuracy"] + arch["accuracy_bonus"])),
            "damage_multiplier": arch["damage_multiplier"],
            "weapon": arch["weapon"],
            "behavior": arch["behavior"],
            "score_value": arch["score_value"],
            "position": list(sp),
            "alive": True,
        }
        self.active_enemies.append(entity)
        return entity

    def eliminate_enemy(self, enemy_id: str, is_headshot: bool = False) -> Dict[str, Any]:
        for enemy in self.active_enemies:
            if enemy["id"] == enemy_id and enemy["alive"]:
                enemy["alive"] = False
                enemy["health"] = 0
                self.objectives.record_shot(did_hit=True)
                self.objectives.record_kill(
                    archetype=enemy["archetype"],
                    is_headshot=is_headshot,
                    score_value=enemy["score_value"],
                )
                break

        alive_count = sum(1 for e in self.active_enemies if e["alive"])
        if alive_count == 0 and self.spawn_queue:
            self.objectives.advance_wave()
            next_batch_size = max(1, min(6, len(self.spawn_queue)))
            batch = self.spawn_queue[:next_batch_size]
            self.spawn_queue = self.spawn_queue[next_batch_size:]
            for idx, arch_id in enumerate(batch):
                self._spawn_enemy_entity(arch_id, idx)

        return self.get_status()

    def update(self, dt: float, player_in_capture_zone: bool = False) -> Dict[str, Any]:
        if self.is_paused or self.is_finished:
            return self.get_status()

        self.objectives.update(dt)
        if player_in_capture_zone:
            self.objectives.update_capture_zone(dt, True)

        if self.objectives.is_primary_complete() or self.objectives.is_failed():
            self.is_finished = True

        return self.get_status()

    def finalize_mission(self) -> Dict[str, Any]:
        self.is_finished = True
        return RewardManager.evaluate_mission_rewards(self.level_data, self.objectives)

    def get_status(self) -> Dict[str, Any]:
        return {
            "level_number": self.level_number,
            "name": self.level_data["name"],
            "is_paused": self.is_paused,
            "is_finished": self.is_finished,
            "primary_complete": self.objectives.is_primary_complete(),
            "failed": self.objectives.is_failed(),
            "kills": self.objectives.kills,
            "target_kills": self.objectives.target_kills,
            "headshots": self.objectives.headshots,
            "wave": self.objectives.current_wave,
            "total_waves": self.objectives.total_waves,
            "alive_enemies": sum(1 for e in self.active_enemies if e["alive"]),
            "checklist": self.objectives.get_progress_checklist(),
        }
