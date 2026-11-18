"""
Campaign Progression Header & Path Visualizer Controller
Computes overall campaign percentage, total stars, unlocked levels, and 3-star mastery nodes.
"""

from typing import Dict, Any, List
from krunker_recreation.campaign.campaign_manager import CampaignManager


class CampaignProgressUI:
    def __init__(self, campaign_mgr: CampaignManager):
        self.campaign_mgr = campaign_mgr

    def get_dashboard_metrics(self) -> Dict[str, Any]:
        summary = self.campaign_mgr.progression.get_campaign_summary()
        cards = self.campaign_mgr.get_level_selection_cards()
        perfect_levels: List[int] = [
            c["level_number"] for c in cards if c.get("stars_earned") == 3
        ]
        path_nodes = [
            {
                "level_number": c["level_number"],
                "name": c["name"],
                "status": (
                    "perfect_3star"
                    if c.get("stars_earned") == 3
                    else "completed"
                    if c["is_completed"]
                    else "current"
                    if c["level_number"] == summary["unlocked_level"]
                    else "locked"
                ),
                "stars": c.get("stars_earned", 0),
            }
            for c in cards
        ]
        return {
            **summary,
            "perfect_three_star_levels": perfect_levels,
            "progression_path": path_nodes,
        }
