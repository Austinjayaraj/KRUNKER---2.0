"""
Panda3D DirectGUI Mission Briefing Screen Controller
Displays mission number, name, description, primary/secondary objectives, enemy intel, recommended weapon, and START MISSION trigger.
"""

from typing import Dict, Any
from krunker_recreation.campaign.campaign_manager import CampaignManager


class MissionBriefingUI:
    def __init__(self, campaign_mgr: CampaignManager):
        self.campaign_mgr = campaign_mgr
        self.current_briefing: Dict[str, Any] = {}

    def load_briefing(self, level_number: int) -> Dict[str, Any]:
        self.current_briefing = self.campaign_mgr.get_mission_briefing(level_number)
        return self.current_briefing

    def start_mission(self) -> Dict[str, Any]:
        lvl = int(self.current_briefing.get("mission_number", 1))
        lvl_mgr = self.campaign_mgr.start_level(lvl)
        return lvl_mgr.get_status()
