"""Bot tactical AI state machine and decision logic."""
import math
from krunker_recreation.config.bot_config import BOT_DIFFICULTIES

class BotAI:
    def __init__(self, bot_id, difficulty="normal"):
        self.bot_id = bot_id
        self.difficulty = difficulty
        self.config = BOT_DIFFICULTIES.get(difficulty, BOT_DIFFICULTIES['normal'])
        self.state = "patrol"  # patrol, alerted, combat, retreat
        self.alert_timer = 0.0
        self.burst_count = 0
        self.burst_pause_timer = 0.0
        self.target_position = None
        self.current_waypoint_idx = 0

    def evaluate_state(self, bot_pos, player_pos, player_alive=True, is_player_shielded=False, health=100, max_health=100):
        if health < max_health * 0.25:
            self.state = "retreat"
            return self.state

        dist_to_player = math.hypot(bot_pos[0] - player_pos[0], bot_pos[2] - player_pos[2])

        if player_alive and dist_to_player < 40.0 and not is_player_shielded:
            if self.state != "combat" and self.state != "alerted":
                self.state = "alerted"
                self.alert_timer = self.config['reaction_time']
        else:
            self.state = "patrol"

        return self.state

    def update(self, dt, bot_pos, player_pos, is_player_shielded=False, health=100, max_health=100, waypoints=None, obstacles=None):
        self.evaluate_state(bot_pos, player_pos, True, is_player_shielded, health, max_health)

        if self.state == "alerted":
            self.alert_timer -= dt
            if self.alert_timer <= 0:
                self.state = "combat"

        if self.burst_pause_timer > 0:
            self.burst_pause_timer -= dt

        # Advance patrol waypoint when close
        if waypoints and self.state == "patrol":
            wp = waypoints[self.current_waypoint_idx % len(waypoints)]
            dist_to_wp = math.hypot(bot_pos[0] - wp[0], bot_pos[2] - wp[2])
            if dist_to_wp < 2.5:
                self.current_waypoint_idx = (self.current_waypoint_idx + 1) % len(waypoints)

    def should_fire(self):
        if self.state != "combat" or self.burst_pause_timer > 0:
            return False
        return True

    def register_shot(self):
        self.burst_count += 1
        if self.burst_count >= self.config['burst_rounds']:
            self.burst_count = 0
            self.burst_pause_timer = self.config['burst_pause']
