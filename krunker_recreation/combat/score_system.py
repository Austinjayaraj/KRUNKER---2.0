"""
Combat Score, Killstreak, and Multi-Kill Announcer System
Awards points for eliminations, headshots, mid-air kills, and tracks active streaks.
"""

from typing import Dict, Any, Optional


class ScoreSystem:
    def __init__(self):
        self.score = 0
        self.kills = 0
        self.deaths = 0
        self.assists = 0
        self.current_streak = 0
        self.best_streak = 0
        self.multi_kill_count = 0
        self.multi_kill_timer = 0.0

    def register_kill(self, is_headshot: bool = False, is_midair: bool = False) -> Dict[str, Any]:
        self.kills += 1
        self.current_streak += 1
        self.best_streak = max(self.best_streak, self.current_streak)

        if self.multi_kill_timer > 0.0:
            self.multi_kill_count += 1
        else:
            self.multi_kill_count = 1
        self.multi_kill_timer = 4.0

        points = 100
        bonuses = ["+100 ELIMINATION"]
        if is_headshot:
            points += 50
            bonuses.append("+50 HEADSHOT")
        if is_midair:
            points += 25
            bonuses.append("+25 MID-AIR")
        if self.current_streak >= 3:
            points += 25 * (self.current_streak - 2)
            bonuses.append(f"+{25 * (self.current_streak - 2)} STREAK BONUS")

        self.score += points
        banner = self.get_banner_title()
        return {
            "points_awarded": points,
            "total_score": self.score,
            "streak": self.current_streak,
            "multi_kill": self.multi_kill_count,
            "bonuses": bonuses,
            "banner": banner,
        }

    def register_death(self) -> None:
        self.deaths += 1
        self.current_streak = 0
        self.multi_kill_count = 0
        self.multi_kill_timer = 0.0

    def update(self, dt: float) -> None:
        if self.multi_kill_timer > 0.0:
            self.multi_kill_timer = max(0.0, self.multi_kill_timer - dt)
            if self.multi_kill_timer == 0.0:
                self.multi_kill_count = 0

    def get_banner_title(self) -> Optional[str]:
        if self.multi_kill_count >= 4:
            return "QUADRA ELIMINATION"
        if self.multi_kill_count == 3:
            return "TRIPLE ELIMINATION"
        if self.multi_kill_count == 2:
            return "DOUBLE ELIMINATION"
        if self.current_streak >= 10:
            return "GODLIKE SPREE"
        if self.current_streak >= 5:
            return "UNSTOPPABLE SPREE"
        if self.current_streak == 3:
            return "3X KILLSTREAK"
        return None
