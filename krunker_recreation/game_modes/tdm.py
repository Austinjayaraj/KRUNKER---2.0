"""Team Deathmatch game mode rules."""

class TDMMode:
    def __init__(self, target_kills=25, duration_sec=180):
        self.target_kills = target_kills
        self.duration_sec = duration_sec
        self.time_remaining = duration_sec
        self.blue_score = 0
        self.red_score = 0
        self.is_game_over = False
        self.winner = None

    def update(self, dt):
        if self.is_game_over:
            return
        self.time_remaining = max(0.0, self.time_remaining - dt)
        if self.time_remaining <= 0:
            self.is_game_over = True
            if self.blue_score > self.red_score:
                self.winner = "Blue Team"
            elif self.red_score > self.blue_score:
                self.winner = "Red Team"
            else:
                self.winner = "Draw"

    def record_kill(self, team):
        if team == "blue":
            self.blue_score += 1
            if self.blue_score >= self.target_kills:
                self.is_game_over = True
                self.winner = "Blue Team"
        elif team == "red":
            self.red_score += 1
            if self.red_score >= self.target_kills:
                self.is_game_over = True
                self.winner = "Red Team"
        return self.is_game_over
