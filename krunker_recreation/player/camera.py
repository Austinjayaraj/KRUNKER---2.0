"""First-person camera and viewmodel kinematics."""
import math

class FPSCamera:
    def __init__(self, fov=85.0):
        self.fov = fov
        self.target_fov = fov
        self.bob_timer = 0.0
        self.sway_x = 0.0
        self.sway_y = 0.0

    def update(self, dt, speed, is_ads, ads_fov=30.0, base_fov=85.0):
        self.target_fov = ads_fov if is_ads else base_fov
        self.fov += (self.target_fov - self.fov) * min(1.0, dt * 14.0)

        if speed > 1.0:
            self.bob_timer += dt * speed * 0.8
        
        bob_x = math.cos(self.bob_timer) * 0.015
        bob_y = math.sin(self.bob_timer * 2) * 0.015
        return bob_x, bob_y
