"""
Panda3D DirectGUI Level Selection Screen Controller
Manages the 15-level campaign grid, lock/unlock validation, and transition to Mission Briefing.
"""

from typing import Dict, Any, List
from krunker_recreation.campaign.campaign_manager import CampaignManager


class LevelSelectionUI:
    def __init__(self, campaign_mgr: CampaignManager):
        self.campaign_mgr = campaign_mgr
        self.selected_level_number: int = 1
        self.last_error: str = ""

    def get_level_grid(self) -> List[Dict[str, Any]]:
        return self.campaign_mgr.get_level_selection_cards()

    def select_level(self, level_number: int) -> Dict[str, Any]:
        cards = {c["level_number"]: c for c in self.get_level_grid()}
        card = cards.get(level_number)
        if not card:
            raise ValueError(f"Level {level_number} does not exist.")
        if card["is_locked"]:
            self.last_error = f"Locked: {card['unlock_requirement']}"
            return {"allowed": False, "error": self.last_error, "card": card}

        self.selected_level_number = level_number
        self.last_error = ""
        return {"allowed": True, "briefing": self.campaign_mgr.get_mission_briefing(level_number), "card": card}
