import unittest
from krunker_recreation.weapons.hitscan import ray_intersects_box
from krunker_recreation.weapons.projectile import RocketProjectile
from krunker_recreation.engine.physics_engine import AABB

class TestDamageAndHitscan(unittest.TestCase):
    def test_ray_intersects_box(self):
        box = AABB(-1, -1, -1, 1, 1, 1)
        origin = [0, 0, 5]
        direction = [0, 0, -1]
        dist = ray_intersects_box(origin, direction, box)
        self.assertIsNotNone(dist)
        self.assertAlmostEqual(dist, 4.0, places=2)

    def test_ray_misses_box(self):
        box = AABB(5, 5, 5, 7, 7, 7)
        origin = [0, 0, 0]
        direction = [0, 0, 1]
        dist = ray_intersects_box(origin, direction, box)
        self.assertIsNone(dist)

    def test_rocket_splash_damage(self):
        rocket = RocketProjectile([0, 0, 0], [0, 0, 1], splash_radius=6.0, max_damage=100)
        dmg_close = rocket.calculate_splash_damage([0, 0, 0])
        dmg_mid = rocket.calculate_splash_damage([3, 0, 0])
        dmg_far = rocket.calculate_splash_damage([10, 0, 0])

        self.assertEqual(dmg_close, 100)
        self.assertEqual(dmg_mid, 50)
        self.assertEqual(dmg_far, 0)

if __name__ == '__main__':
    unittest.main()
