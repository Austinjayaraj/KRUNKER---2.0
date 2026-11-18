"""Rocket launcher projectile physics and splash radius."""
import math

class RocketProjectile:
    def __init__(self, start_pos, direction, speed=36.0, splash_radius=6.0, max_damage=95):
        self.position = list(start_pos)
        mag = math.sqrt(sum(d*d for d in direction)) or 1.0
        self.velocity = [(d / mag) * speed for d in direction]
        self.splash_radius = splash_radius
        self.max_damage = max_damage
        self.alive_time = 0.0
        self.is_exploded = False

    def update(self, dt):
        self.alive_time += dt
        for i in range(3):
            self.position[i] += self.velocity[i] * dt
        if self.position[1] <= 0.2 or self.alive_time > 4.0:
            self.is_exploded = True

    def calculate_splash_damage(self, target_pos):
        dist = math.sqrt(sum((self.position[i] - target_pos[i])**2 for i in range(3)))
        if dist > self.splash_radius:
            return 0
        falloff = 1.0 - (dist / self.splash_radius)
        return int(round(self.max_damage * falloff))
