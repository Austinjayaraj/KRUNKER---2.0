"""
Campaign Mission Completion & 1-to-3 Star Rating Calculator
Computes earned stars, XP, Coins, weapon unlocks, and cosmetic rewards.
"""

from typing import Dict, Any
from krunker_recreation.campaign.objective_manager import ObjectiveManager


class RewardManager:
    @staticmethod
    def evaluate_mission_rewards(
        level_cfg: Dict[str, Any],
        obj_mgr: ObjectiveManager,
    ) -> Dict[str, Any]:
        primary_ok = obj_mgr.is_primary_complete()
        if not primary_ok:
            return {
                "completed": False,
                "stars": 0,
                "xp_earned": int(obj_mgr.kills * 15),
                "coins_earned": int(obj_mgr.kills * 5),
                "weapon_unlock": None,
                "cosmetic_reward": None,
                "score": obj_mgr.score,
            }

        secondary_ok = obj_mgr.is_secondary_complete()
        score_target = int(level_cfg.get("score_target_3star", 1000))
        score_ok = obj_mgr.score >= score_target

        stars = 1
        if secondary_ok:
            stars = 2
            if score_ok:
                stars = 3

        base_rewards = level_cfg.get("rewards", {})
        star_bonus_mult = 1.0 + (stars - 1) * 0.25
        xp_earned = int(round(base_rewards.get("xp", 300) * star_bonus_mult))
        coins_earned = int(round(base_rewards.get("coins", 150) * star_bonus_mult))

        accuracy = round((obj_mgr.shots_hit / max(1, obj_mgr.shots_fired)) * 100.0, 1)

        return {
            "completed": True,
            "level_number": level_cfg["level_number"],
            "mission_name": level_cfg["name"],
            "stars": stars,
            "secondary_achieved": secondary_ok,
            "score_target_achieved": score_ok,
            "completion_time_sec": round(obj_mgr.elapsed_sec, 1),
            "enemies_eliminated": obj_mgr.kills,
            "headshots": obj_mgr.headshots,
            "accuracy_pct": accuracy,
            "deaths": obj_mgr.deaths,
            "score": obj_mgr.score,
            "xp_earned": xp_earned,
            "coins_earned": coins_earned,
            "weapon_unlock": base_rewards.get("weapon_unlock"),
            "cosmetic_reward": base_rewards.get("cosmetic_reward"),
            "next_level_unlocked": min(15, int(level_cfg["level_number"]) + 1),
        }
