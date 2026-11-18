"""Game mode rules for Free For All (FFA)."""

class FFAMode:
    def __init__(self, target_kills=15, duration_sec=180):
        self.target_kills = target_kills
        self.duration_sec = duration_sec
        self.time_remaining = duration_sec
        self.scores = {}
        self.is_game_over = False
        self.winner = None

    def update(self, dt):
        if self.is_game_over:
            return
        self.time_remaining = max(0.0, self.time_remaining - dt)
        if self.time_remaining <= 0:
            self.is_game_over = True
            sorted_players = sorted(self.scores.items(), key=lambda kv: kv[1], reverse=True)
            self.winner = sorted_players[0][0] if sorted_players else "Time Up"

    def record_kill(self, killer_id):
        self.scores[killer_id] = self.scores.get(killer_id, 0) + 1
        if self.scores[killer_id] >= self.target_kills:
            self.is_game_over = True
            self.winner = killer_id
        return self.is_game_over
