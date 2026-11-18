"""
Weapon Reload State Machine & Magazine Transfer Calculations
"""

from typing import Tuple


class ReloadMechanics:
    @staticmethod
    def compute_magazine_refill(current_mag: int, current_reserve: int, mag_capacity: int) -> Tuple[int, int]:
        """Transfers rounds from reserve to magazine up to capacity."""
        if current_mag >= mag_capacity or current_reserve <= 0:
            return current_mag, current_reserve
        needed = mag_capacity - current_mag
        transferred = min(needed, current_reserve)
        return current_mag + transferred, current_reserve - transferred
