"""
Top-Level Campaign Orchestrator
Coordinates level selection, lock enforcement, mission briefing, active LevelManager, and persistent saving.
"""

from typing import Dict, Any, Optional, List
from krunker_recreation.campaign.level_config import get_all_level_configs, get_level_config
from krunker_recreation.campaign.progression_manager import ProgressionManager
from krunker_recreation.campaign.level_loader import LevelLoader
from krunker_recreation.campaign.level_manager import LevelManager


class CampaignManager:
    def __init__(self, save_path: str = None):
        self.progression = ProgressionManager(save_path=save_path)
        self.active_level_manager: Optional[LevelManager] = None

    def get_level_selection_cards(self) -> List[Dict[str, Any]]:
        summary = self.progression.get_campaign_summary()
        unlocked_upto = int(summary["unlocked_level"])
        completed_map = summary["completed_levels"]

        cards: List[Dict[str, Any]] = []
        for cfg in get_all_level_configs():
            lvl_num = int(cfg["level_number"])
            comp = completed_map.get(str(lvl_num))
            if comp:
                state = "COMPLETED"
            elif lvl_num <= unlocked_upto:
                state = "UNLOCKED"
            else:
                state = "LOCKED"

            cards.append({
                **cfg,
                "state": state,
                "is_locked": state == "LOCKED",
                "is_completed": state == "COMPLETED",
                "stars_earned": int(comp["stars"]) if comp else 0,
                "best_score": int(comp["best_score"]) if comp else 0,
                "best_time_sec": float(comp["best_time_sec"]) if comp else None,
            })
        return cards

    def get_mission_briefing(self, level_number: int) -> Dict[str, Any]:
        cfg = get_level_config(level_number)
        unlocked = self.progression.is_level_unlocked(level_number)
        return {
            "mission_number": cfg["level_number"],
            "mission_name": cfg["name"],
            "description": cfg["description"],
            "primary_objectives": cfg["primary_objectives"],
            "secondary_objective": cfg["secondary_objective"],
            "enemy_intelligence": cfg["enemy_intel"],
            "recommended_weapon": cfg["recommended_weapon"],
            "recommended_class": cfg["recommended_class"],
            "difficulty": cfg["difficulty"],
            "is_unlocked": unlocked,
        }

    def start_level(self, level_number: int) -> LevelManager:
        if not self.progression.is_level_unlocked(level_number):
            raise PermissionError(
                f"Level {level_number} is locked. Complete Level {level_number - 1} first."
            )
        level_data = LevelLoader.load_level(level_number)
        self.active_level_manager = LevelManager(level_data)
        return self.active_level_manager

    def complete_active_level(self) -> Dict[str, Any]:
        if not self.active_level_manager:
            raise RuntimeError("No active campaign level running.")
        reward_summary = self.active_level_manager.finalize_mission()
        if reward_summary.get("completed"):
            self.progression.record_level_completion(reward_summary)
        return reward_summary
