"""Base weapon logic and damage calculations."""

def calculate_damage(base_damage, multiplier, is_headshot):
    if is_headshot:
        return int(round(base_damage * multiplier))
    return int(base_damage)

def consume_ammo(current_mag, reserve):
    if current_mag <= 0:
        return False, current_mag, reserve
    return True, current_mag - 1, reserve

def reload_ammo(current_mag, reserve, mag_size):
    needed = mag_size - current_mag
    if needed <= 0 or reserve <= 0:
        return current_mag, reserve
    to_load = min(needed, reserve)
    return current_mag + to_load, reserve - to_load
