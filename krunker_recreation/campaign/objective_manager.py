"""
Real-Time Campaign Objective Tracker & Completion Evaluator
Tracks kills, headshots, wave completion, capture/defense zones, terminals, extraction, and boss defeat.
"""

from typing import Dict, Any, List


class ObjectiveManager:
    def __init__(self, level_cfg: Dict[str, Any]):
        self.level_cfg = level_cfg
        self.spec = level_cfg.get("objective_spec", {})
        self.obj_type = self.spec.get("type", "eliminate")

        self.target_kills = int(self.spec.get("target_kills", level_cfg.get("enemy_count", 5)))
        self.required_headshots = int(self.spec.get("required_headshots", 0))
        self.required_elites = int(self.spec.get("required_elites", 0))
        self.required_terminals = int(self.spec.get("required_terminals", 0))
        self.capture_seconds_required = float(self.spec.get("capture_seconds_required", 0.0))
        self.requires_extraction = bool(self.spec.get("requires_extraction", False))
        self.requires_boss_kill = bool(self.spec.get("requires_boss_kill", False))
        self.total_waves = int(self.spec.get("total_waves", level_cfg.get("waves", 1)))

        # Runtime counters
        self.kills = 0
        self.headshots = 0
        self.elites_killed = 0
        self.boss_killed = False
        self.terminals_activated = 0
        self.capture_progress_sec = 0.0
        self.defense_integrity = 100.0
        self.extraction_reached = False
        self.current_wave = 1
        self.max_streak = 0
        self.current_streak = 0
        self.deaths = 0
        self.shots_fired = 0
        self.shots_hit = 0
        self.elapsed_sec = 0.0
        self.score = 0

    def record_shot(self, did_hit: bool = False) -> None:
        self.shots_fired += 1
        if did_hit:
            self.shots_hit += 1

    def record_kill(
        self,
        archetype: str = "standard_soldier",
        is_headshot: bool = False,
        score_value: int = 100,
    ) -> None:
        self.kills += 1
        self.current_streak += 1
        self.max_streak = max(self.max_streak, self.current_streak)
        if is_headshot:
            self.headshots += 1
            score_value += 50
        if archetype == "elite_soldier":
            self.elites_killed += 1
        elif archetype == "boss_enemy":
            self.boss_killed = True
        self.score += score_value

    def record_death(self) -> None:
        self.deaths += 1
        self.current_streak = 0

    def activate_terminal(self) -> int:
        if self.terminals_activated < self.required_terminals:
            self.terminals_activated += 1
            self.score += 200
        return self.terminals_activated

    def update_capture_zone(self, dt: float, player_in_zone: bool) -> float:
        if player_in_zone and self.capture_seconds_required > 0:
            self.capture_progress_sec = min(
                self.capture_seconds_required, self.capture_progress_sec + dt
            )
        return self.capture_progress_sec

    def reach_extraction(self) -> None:
        if self.kills >= self.target_kills:
            self.extraction_reached = True
            self.score += 250

    def advance_wave(self) -> int:
        if self.current_wave < self.total_waves:
            self.current_wave += 1
        return self.current_wave

    def update(self, dt: float, enemies_in_defense_zone: int = 0) -> None:
        self.elapsed_sec += dt
        if self.obj_type == "defend_zone" and enemies_in_defense_zone > 0:
            self.defense_integrity = max(
                0.0, self.defense_integrity - (enemies_in_defense_zone * 2.5 * dt)
            )

    def is_primary_complete(self) -> bool:
        if self.kills < self.target_kills:
            return False
        if self.required_headshots > 0 and self.headshots < self.required_headshots:
            return False
        if self.required_elites > 0 and self.elites_killed < self.required_elites:
            return False
        if self.required_terminals > 0 and self.terminals_activated < self.required_terminals:
            return False
        if self.capture_seconds_required > 0 and self.capture_progress_sec < self.capture_seconds_required:
            return False
        if self.requires_extraction and not self.extraction_reached:
            return False
        if self.requires_boss_kill and not self.boss_killed:
            return False
        if self.obj_type == "defend_zone" and self.defense_integrity <= 0.0:
            return False
        return True

    def is_secondary_complete(self) -> bool:
        if "secondary_headshots" in self.spec:
            return self.headshots >= int(self.spec["secondary_headshots"])
        if "max_deaths_secondary" in self.spec:
            return self.deaths <= int(self.spec["max_deaths_secondary"])
        if "secondary_time_limit" in self.spec:
            return self.elapsed_sec <= float(self.spec["secondary_time_limit"])
        if "secondary_time_remaining" in self.spec:
            rem = self.level_cfg.get("time_limit_sec", 180) - self.elapsed_sec
            return rem >= float(self.spec["secondary_time_remaining"])
        if "secondary_accuracy_pct" in self.spec:
            acc = (self.shots_hit / max(1, self.shots_fired)) * 100.0
            return acc >= float(self.spec["secondary_accuracy_pct"])
        if "defense_integrity_min" in self.spec:
            return self.defense_integrity >= float(self.spec["defense_integrity_min"])
        if "secondary_streak" in self.spec:
            return self.max_streak >= int(self.spec["secondary_streak"])
        return True

    def is_failed(self) -> bool:
        max_lives = int(self.level_cfg.get("max_lives", 99))
        time_limit = float(self.level_cfg.get("time_limit_sec", 300))
        if self.deaths >= max_lives:
            return True
        if self.elapsed_sec >= time_limit and not self.is_primary_complete():
            return True
        if self.obj_type == "defend_zone" and self.defense_integrity <= 0.0:
            return True
        return False

    def get_progress_checklist(self) -> List[Dict[str, Any]]:
        items = [
            {
                "label": f"Eliminate Hostiles ({min(self.kills, self.target_kills)}/{self.target_kills})",
                "completed": self.kills >= self.target_kills,
            }
        ]
        if self.required_headshots > 0:
            items.append({
                "label": f"Land Headshots ({min(self.headshots, self.required_headshots)}/{self.required_headshots})",
                "completed": self.headshots >= self.required_headshots,
            })
        if self.required_elites > 0:
            items.append({
                "label": f"Defeat Elite Enemies ({min(self.elites_killed, self.required_elites)}/{self.required_elites})",
                "completed": self.elites_killed >= self.required_elites,
            })
        if self.required_terminals > 0:
            items.append({
                "label": f"Activate Terminals ({self.terminals_activated}/{self.required_terminals})",
                "completed": self.terminals_activated >= self.required_terminals,
            })
        if self.capture_seconds_required > 0:
            pct = int(round((self.capture_progress_sec / self.capture_seconds_required) * 100))
            items.append({
                "label": f"Capture Outpost Zone ({min(100, pct)}%)",
                "completed": self.capture_progress_sec >= self.capture_seconds_required,
            })
        if self.requires_extraction:
            items.append({
                "label": "Reach Extraction Beacon",
                "completed": self.extraction_reached,
            })
        if self.requires_boss_kill:
            items.append({
                "label": "Eliminate Enemy Commander / Boss",
                "completed": self.boss_killed,
            })
        return items
