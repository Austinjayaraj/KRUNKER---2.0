"""Weapon manager and inventory management."""
from krunker_recreation.config.weapon_config import WEAPONS
from krunker_recreation.weapons.weapon_base import calculate_damage, consume_ammo, reload_ammo

class WeaponManager:
    def __init__(self, primary_id="assault_rifle", secondary_id="revolver"):
        self.primary_id = primary_id
        self.secondary_id = secondary_id
        self.equipped_id = primary_id

        self.magazines = {
            wid: data['magazine_size'] for wid, data in WEAPONS.items()
        }
        self.reserves = {
            wid: data['reserve_ammo'] for wid, data in WEAPONS.items()
        }

        self.fire_timer = 0.0
        self.is_reloading = False
        self.reload_timer = 0.0

    def switch_weapon(self):
        if self.is_reloading:
            return
        if self.equipped_id == self.primary_id:
            self.equipped_id = self.secondary_id
        else:
            self.equipped_id = self.primary_id

    def fire(self):
        if self.fire_timer > 0 or self.is_reloading:
            return False, 0
        cur_mag = self.magazines[self.equipped_id]
        cur_res = self.reserves[self.equipped_id]

        can_shoot, new_mag, new_res = consume_ammo(cur_mag, cur_res)
        if not can_shoot:
            self.trigger_reload()
            return False, 0

        self.magazines[self.equipped_id] = new_mag
        wpn_data = WEAPONS[self.equipped_id]
        self.fire_timer = 1.0 / wpn_data['fire_rate_rps']
        return True, wpn_data['damage']

    def trigger_reload(self):
        wpn_data = WEAPONS[self.equipped_id]
        if self.is_reloading or self.magazines[self.equipped_id] == wpn_data['magazine_size'] or self.reserves[self.equipped_id] <= 0:
            return
        self.is_reloading = True
        self.reload_timer = wpn_data['reload_time']

    def update(self, dt):
        if self.fire_timer > 0:
            self.fire_timer -= dt
        if self.is_reloading:
            self.reload_timer -= dt
            if self.reload_timer <= 0:
                self.is_reloading = False
                wpn_data = WEAPONS[self.equipped_id]
                new_mag, new_res = reload_ammo(
                    self.magazines[self.equipped_id],
                    self.reserves[self.equipped_id],
                    wpn_data['magazine_size']
                )
                self.magazines[self.equipped_id] = new_mag
                self.reserves[self.equipped_id] = new_res
