"""
Player Experience (XP), Level Progression, and Rank Tier System
"""

from typing import Dict, Any

RANK_TIERS = [
    (1, "Recruit I"),
    (3, "Operative II"),
    (5, "Vanguard III"),
    (10, "Centurion IV"),
    (15, "Apex Phantom V"),
    (25, "Grandmaster Krunker"),
]


class XPSystem:
    def __init__(self, level: int = 1, xp: int = 0):
        self.level = max(1, int(level))
        self.xp = max(0, int(xp))

    @staticmethod
    def xp_for_next_level(level: int) -> int:
        return int(round(500 * (1.22 ** (max(1, level) - 1))))

    def get_rank_title(self) -> str:
        title = RANK_TIERS[0][1]
        for req_lvl, name in RANK_TIERS:
            if self.level >= req_lvl:
                title = name
        return title

    def award_xp(self, amount: int) -> Dict[str, Any]:
        self.xp += max(0, int(amount))
        levels_gained = 0
        while self.xp >= self.xp_for_next_level(self.level):
            self.xp -= self.xp_for_next_level(self.level)
            self.level += 1
            levels_gained += 1
        return {
            "level": self.level,
            "xp": self.xp,
            "next_level_xp": self.xp_for_next_level(self.level),
            "levels_gained": levels_gained,
            "rank_title": self.get_rank_title(),
        }
