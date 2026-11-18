import unittest
from krunker_recreation.weapons.weapon_base import calculate_damage, consume_ammo, reload_ammo

class TestWeapons(unittest.TestCase):
    def test_damage_calc(self):
        body = calculate_damage(100, 1.75, False)
        head = calculate_damage(100, 1.75, True)
        self.assertEqual(body, 100)
        self.assertEqual(head, 175)

    def test_ammo_consumption(self):
        can_shoot, mag, res = consume_ammo(30, 90)
        self.assertTrue(can_shoot)
        self.assertEqual(mag, 29)

    def test_reloading(self):
        mag, res = reload_ammo(10, 50, 30)
        self.assertEqual(mag, 30)
        self.assertEqual(res, 30)

if __name__ == '__main__':
    unittest.main()
