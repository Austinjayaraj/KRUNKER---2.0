"""
End-of-Match Victory/Defeat Summary & XP Breakdown Screen
"""

from typing import Dict, Any, List
from krunker_recreation.ui.scoreboard import ScoreboardUI


class EndScreenUI:
    @staticmethod
    def build_summary(
        winner_name: str,
        player_name: str,
        entries: List[Dict[str, Any]],
        xp_earned: int,
    ) -> Dict[str, Any]:
        standings = ScoreboardUI.build_standings(entries)
        return {
            "is_victory": winner_name == player_name,
            "winner": winner_name,
            "xp_earned": xp_earned,
            "standings": standings,
        }
