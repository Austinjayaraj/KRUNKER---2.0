"""Hardpoint rotating capture zone mode."""

class HardpointMode:
    def __init__(self, target_score=150, zone_interval=45.0):
        self.target_score = target_score
        self.zone_interval = zone_interval
        self.zone_timer = zone_interval
        self.active_zone_index = 0
        self.zones = [
            {'name': 'Central Plaza', 'pos': [0, 0, 0], 'radius': 4.5},
            {'name': 'North Rooftop', 'pos': [0, 6, -25], 'radius': 4.5},
            {'name': 'South Depot', 'pos': [0, 0, 25], 'radius': 4.5},
        ]
        self.blue_score = 0
        self.red_score = 0
        self.is_game_over = False
        self.winner = None

    def update(self, dt, blue_in_zone, red_in_zone):
        if self.is_game_over:
            return

        self.zone_timer -= dt
        if self.zone_timer <= 0:
            self.active_zone_index = (self.active_zone_index + 1) % len(self.zones)
            self.zone_timer = self.zone_interval

        if blue_in_zone > 0 and red_in_zone == 0:
            self.blue_score += int(round(5 * dt))
            if self.blue_score >= self.target_score:
                self.is_game_over = True
                self.winner = "Blue Team"
        elif red_in_zone > 0 and blue_in_zone == 0:
            self.red_score += int(round(5 * dt))
            if self.red_score >= self.target_score:
                self.is_game_over = True
                self.winner = "Red Team"
