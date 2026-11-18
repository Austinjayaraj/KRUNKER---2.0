"""Physics engine module for player and entity kinematic simulation."""
import math

class AABB:
    def __init__(self, min_x, min_y, min_z, max_x, max_y, max_z):
        self.min_x = min_x
        self.min_y = min_y
        self.min_z = min_z
        self.max_x = max_x
        self.max_y = max_y
        self.max_z = max_z

    def intersects(self, other):
        return (
            self.min_x <= other.max_x and self.max_x >= other.min_x and
            self.min_y <= other.max_y and self.max_y >= other.min_y and
            self.min_z <= other.max_z and self.max_z >= other.min_z
        )

class PhysicsEngine:
    def __init__(self, gravity=34.0, ground_friction=8.5, slide_friction=1.2):
        self.gravity = gravity
        self.ground_friction = ground_friction
        self.slide_friction = slide_friction

    def integrate_movement(self, pos, vel, dt, radius, height, obstacles, is_sliding=False):
        """Simulates Quake/Krunker kinematic step and resolves axis collisions."""
        px, py, pz = pos
        vx, vy, vz = vel
        on_ground = False

        # Apply gravity if in air
        vy -= self.gravity * dt

        # Apply friction
        horiz_speed = math.hypot(vx, vz)
        if horiz_speed > 0.001:
            friction = self.slide_friction if is_sliding else self.ground_friction
            drop = horiz_speed * friction * dt
            new_speed = max(0.0, horiz_speed - drop)
            factor = new_speed / horiz_speed
            vx *= factor
            vz *= factor
        else:
            vx, vz = 0.0, 0.0

        # Step X
        px += vx * dt
        p_box_x = AABB(px - radius, py, pz - radius, px + radius, py + height, pz + radius)
        for obs in obstacles:
            if p_box_x.intersects(obs):
                if vx > 0:
                    px = obs.min_x - radius - 0.001
                elif vx < 0:
                    px = obs.max_x + radius + 0.001
                vx = 0.0
                break

        # Step Z
        pz += vz * dt
        p_box_z = AABB(px - radius, py, pz - radius, px + radius, py + height, pz + radius)
        for obs in obstacles:
            if p_box_z.intersects(obs):
                if vz > 0:
                    pz = obs.min_z - radius - 0.001
                elif vz < 0:
                    pz = obs.max_z + radius + 0.001
                vz = 0.0
                break

        # Step Y
        py += vy * dt
        p_box_y = AABB(px - radius, py, pz - radius, px + radius, py + height, pz + radius)
        for obs in obstacles:
            if p_box_y.intersects(obs):
                if vy < 0:
                    py = obs.max_y + 0.001
                    vy = 0.0
                    on_ground = True
                elif vy > 0:
                    py = obs.min_y - height - 0.001
                    vy = 0.0
                break

        # Ground plane at y = 0
        if py <= 0:
            py = 0.0
            vy = 0.0
            on_ground = True

        return [px, py, pz], [vx, vy, vz], on_ground
