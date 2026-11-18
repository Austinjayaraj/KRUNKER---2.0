"""Movement math and physics logic for player."""
import math

def apply_acceleration(current_vel, wish_dir, wish_speed, accel, dt):
    current_speed_in_wish = current_vel[0] * wish_dir[0] + current_vel[2] * wish_dir[2]
    add_speed = wish_speed - current_speed_in_wish
    if add_speed <= 0:
        return list(current_vel)

    accel_speed = min(accel * wish_speed * dt, add_speed)
    return [
        current_vel[0] + wish_dir[0] * accel_speed,
        current_vel[1],
        current_vel[2] + wish_dir[2] * accel_speed
    ]

def apply_friction(current_vel, friction, dt):
    horiz_speed = math.hypot(current_vel[0], current_vel[2])
    if horiz_speed < 0.001:
        return [0, current_vel[1], 0]

    drop = horiz_speed * friction * dt
    new_speed = max(0, horiz_speed - drop)
    factor = new_speed / horiz_speed
    return [
        current_vel[0] * factor,
        current_vel[1],
        current_vel[2] * factor
    ]
