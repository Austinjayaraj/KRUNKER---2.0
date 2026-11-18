"""Progression, XP rewards, and career statistics."""
import math

class CareerStatistics:
    def __init__(self):
        self.level = 1
        self.xp = 0
        self.total_kills = 0
        self.total_deaths = 0
        self.headshots = 0
        self.shots_fired = 0
        self.shots_hit = 0
        self.matches_played = 0
        self.matches_won = 0

    @property
    def kd_ratio(self):
        if self.total_deaths <= 0:
            return float(self.total_kills)
        return round(self.total_kills / self.total_deaths, 2)

    @property
    def accuracy_percent(self):
        if self.shots_fired <= 0:
            return 0.0
        return round((self.shots_hit / self.shots_fired) * 100.0, 1)

    def get_xp_for_level(self, lvl):
        return int(1000 * (1.18 ** max(0, lvl - 1)))

    def add_match_result(self, kills, headshots, is_victory):
        xp_gain = kills * 100 + headshots * 50 + (500 if is_victory else 200)
        self.xp += xp_gain
        self.total_kills += kills
        self.headshots += headshots
        self.matches_played += 1
        if is_victory:
            self.matches_won += 1

        req = self.get_xp_for_level(self.level)
        did_level_up = False
        while self.xp >= req:
            self.xp -= req
            self.level += 1
            req = self.get_xp_for_level(self.level)
            did_level_up = True

        return xp_gain, did_level_up
