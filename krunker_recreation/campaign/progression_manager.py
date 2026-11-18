"""
Persistent Campaign Progression Manager
Saves and loads player campaign state in krunker_recreation/saves/campaign_progress.json.
Ensures progress survives application restarts and enforces sequential level unlocking (Levels 1-15).
"""

import os
import json
from typing import Dict, Any

DEFAULT_SAVE_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "saves",
    "campaign_progress.json",
)


class ProgressionManager:
    def __init__(self, save_path: str = None):
        self.save_path = save_path or DEFAULT_SAVE_PATH
        self.state: Dict[str, Any] = self._default_state()
        self.load()

    @staticmethod
    def _default_state() -> Dict[str, Any]:
        return {
            "unlocked_level": 1,
            "total_xp": 0,
            "total_coins": 0,
            "unlocked_weapons": ["assault_rifle", "sniper_rifle", "smg"],
            "unlocked_cosmetics": ["tactical"],
            "completed_levels": {},
        }

    def load(self) -> Dict[str, Any]:
        os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
        if os.path.exists(self.save_path):
            try:
                with open(self.save_path, "r", encoding="utf-8") as fp:
                    loaded = json.load(fp)
                if isinstance(loaded, dict):
                    self.state = {**self._default_state(), **loaded}
                    self.state["unlocked_level"] = max(1, int(self.state.get("unlocked_level", 1)))
                    return self.state
            except Exception:
                pass
        self.state = self._default_state()
        self.save()
        return self.state

    def save(self) -> None:
        os.makedirs(os.path.dirname(self.save_path), exist_ok=True)
        with open(self.save_path, "w", encoding="utf-8") as fp:
            json.dump(self.state, fp, indent=2)

    def is_level_unlocked(self, level_number: int) -> bool:
        return 1 <= int(level_number) <= int(self.state.get("unlocked_level", 1))

    def record_level_completion(self, reward_summary: Dict[str, Any]) -> Dict[str, Any]:
        if not reward_summary.get("completed"):
            return self.state

        lvl = int(reward_summary["level_number"])
        lvl_key = str(lvl)
        stars = int(reward_summary.get("stars", 1))
        score = int(reward_summary.get("score", 0))
        comp_time = float(reward_summary.get("completion_time_sec", 0.0))

        prev = self.state["completed_levels"].get(lvl_key, {})
        best_stars = max(int(prev.get("stars", 0)), stars)
        best_score = max(int(prev.get("best_score", 0)), score)
        prev_time = float(prev.get("best_time_sec", 9999.0))
        best_time = min(prev_time, comp_time) if comp_time > 0 else prev_time

        self.state["completed_levels"][lvl_key] = {
            "level_number": lvl,
            "stars": best_stars,
            "best_score": best_score,
            "best_time_sec": round(best_time, 1),
            "times_completed": int(prev.get("times_completed", 0)) + 1,
        }

        if lvl >= int(self.state["unlocked_level"]) and lvl < 15:
            self.state["unlocked_level"] = lvl + 1

        self.state["total_xp"] = int(self.state.get("total_xp", 0)) + int(reward_summary.get("xp_earned", 0))
        self.state["total_coins"] = int(self.state.get("total_coins", 0)) + int(reward_summary.get("coins_earned", 0))

        wpn = reward_summary.get("weapon_unlock")
        if wpn and wpn not in self.state["unlocked_weapons"]:
            self.state["unlocked_weapons"].append(wpn)

        cosmetic = reward_summary.get("cosmetic_reward")
        if cosmetic and cosmetic not in self.state["unlocked_cosmetics"]:
            self.state["unlocked_cosmetics"].append(cosmetic)

        self.save()
        return self.state

    def get_campaign_summary(self) -> Dict[str, Any]:
        completed_count = len(self.state.get("completed_levels", {}))
        total_stars = sum(
            int(v.get("stars", 0)) for v in self.state.get("completed_levels", {}).values()
        )
        completion_pct = int(round((completed_count / 15.0) * 100))
        return {
            "completion_percentage": completion_pct,
            "completed_levels_count": completed_count,
            "total_levels": 15,
            "unlocked_level": self.state["unlocked_level"],
            "total_stars": total_stars,
            "max_stars": 45,
            "total_xp": self.state["total_xp"],
            "total_coins": self.state["total_coins"],
            "unlocked_weapons": list(self.state["unlocked_weapons"]),
            "unlocked_cosmetics": list(self.state["unlocked_cosmetics"]),
            "completed_levels": dict(self.state["completed_levels"]),
        }
