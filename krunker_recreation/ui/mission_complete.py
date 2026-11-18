"""
Panda3D DirectGUI Mission Complete Screen Controller
Formats 1-to-3 star rating, completion time, eliminations, headshots, accuracy, XP, coins, and unlocked rewards.
"""

from typing import Dict, Any


class MissionCompleteUI:
    @staticmethod
    def format_completion_modal(reward_data: Dict[str, Any]) -> Dict[str, Any]:
        stars = int(reward_data.get("stars", 0))
        star_icons = "★" * stars + "☆" * max(0, 3 - stars)
        return {
            "title": "MISSION COMPLETE" if reward_data.get("completed") else "MISSION FAILED",
            "mission_name": reward_data.get("mission_name", "Unknown Operation"),
            "stars_earned": stars,
            "star_display": star_icons,
            "completion_time": f"{reward_data.get('completion_time_sec', 0.0):.1f}s",
            "enemies_eliminated": reward_data.get("enemies_eliminated", 0),
            "headshots": reward_data.get("headshots", 0),
            "accuracy": f"{reward_data.get('accuracy_pct', 0.0):.1f}%",
            "deaths": reward_data.get("deaths", 0),
            "score": reward_data.get("score", 0),
            "xp_earned": reward_data.get("xp_earned", 0),
            "coins_earned": reward_data.get("coins_earned", 0),
            "weapon_unlock": reward_data.get("weapon_unlock"),
            "cosmetic_reward": reward_data.get("cosmetic_reward"),
            "next_level_unlocked": reward_data.get("next_level_unlocked", 1),
        }
