"""First-person player controller with slide-hopping and weapon management."""
import math
from krunker_recreation.config.movement_config import (
    MAX_GROUND_SPEED, GROUND_ACCELERATION, AIR_ACCELERATION,
    GROUND_FRICTION, SLIDE_FRICTION, SLIDE_SPEED_BOOST,
    JUMP_VELOCITY, GRAVITY, CROUCH_HEIGHT, STAND_HEIGHT, PLAYER_RADIUS
)
from krunker_recreation.player.movement import apply_acceleration, apply_friction
from krunker_recreation.engine.physics_engine import PhysicsEngine

class PlayerController:
    def __init__(self, initial_class="triggerman", initial_health=100):
        self.class_id = initial_class
        self.health = initial_health
        self.max_health = initial_health
        self.position = [0.0, 1.8, 30.0]
        self.velocity = [0.0, 0.0, 0.0]
        self.yaw = 0.0
        self.pitch = 0.0
        self.on_ground = True
        self.is_crouching = False
        self.is_sliding = False
        self.slide_timer = 0.0
        self.is_aiming_down_sights = False
        self.spawn_shield_timer = 3.5
        self.physics = PhysicsEngine(GRAVITY, GROUND_FRICTION, SLIDE_FRICTION)

    def handle_mouse_look(self, delta_x, delta_y, sensitivity=1.0, invert_y=False):
        sens = sensitivity * 0.0022
        self.yaw -= delta_x * sens
        invert = -1.0 if invert_y else 1.0
        self.pitch -= delta_y * sens * invert
        self.pitch = max(-math.pi / 2.05, min(math.pi / 2.05, self.pitch))

    def trigger_slide(self):
        horiz_speed = math.hypot(self.velocity[0], self.velocity[2])
        if self.on_ground and horiz_speed > 8.0:
            self.is_sliding = True
            self.slide_timer = 0.65
            self.velocity[0] *= SLIDE_SPEED_BOOST
            self.velocity[2] *= SLIDE_SPEED_BOOST

    def trigger_jump(self):
        if self.on_ground:
            self.velocity[1] = JUMP_VELOCITY
            self.on_ground = False
            if self.is_sliding:
                self.velocity[0] *= 1.08
                self.velocity[2] *= 1.08

    def update(self, dt, wish_dir, obstacles):
        if self.spawn_shield_timer > 0:
            self.spawn_shield_timer -= dt

        if self.is_sliding:
            self.slide_timer -= dt
            if self.slide_timer <= 0:
                self.is_sliding = False

        height = CROUCH_HEIGHT if self.is_crouching else STAND_HEIGHT

        if self.on_ground:
            friction = SLIDE_FRICTION if self.is_sliding else GROUND_FRICTION
            self.velocity = apply_friction(self.velocity, friction, dt)
            self.velocity = apply_acceleration(self.velocity, wish_dir, MAX_GROUND_SPEED, GROUND_ACCELERATION, dt)
        else:
            self.velocity = apply_acceleration(self.velocity, wish_dir, MAX_GROUND_SPEED * 1.1, AIR_ACCELERATION, dt)
            self.velocity[1] -= GRAVITY * dt

        self.position, self.velocity, self.on_ground = self.physics.integrate_movement(
            self.position, self.velocity, dt, PLAYER_RADIUS, height, obstacles, self.is_sliding
        )
