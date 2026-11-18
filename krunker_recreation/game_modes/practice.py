"""
Practice & Aim Training Game Mode
Unlimited time or custom timer, instant target resets, and movement telemetry tracking.
"""


class PracticeMode:
    def __init__(self, duration_sec: float = 9999.0):
        self.mode_name = "Practice Range"
        self.time_remaining = duration_sec
        self.targets_destroyed = 0
        self.shots_fired = 0
        self.shots_hit = 0
        self.top_speed_recorded = 0.0
        self.is_over = False

    def record_target_hit(self, destroyed: bool = False) -> None:
        self.shots_Hit_inc()
        if destroyed:
            self.targets_destroyed += 1

    def shots_Hit_inc(self) -> None:
        self.shots_hit += 1

    def update(self, dt: float, current_speed: float = 0.0) -> None:
        if self.is_over:
            return
        self.time_remaining = max(0.0, self.time_remaining - dt)
        if current_speed > self.top_speed_recorded:
            self.top_speed_recorded = round(current_speed, 2)
        if self.time_remaining <= 0.0:
            self.is_over = True
