import unittest
from krunker_recreation.player.movement import apply_acceleration, apply_friction

class TestMovement(unittest.TestCase):
    def test_acceleration(self):
        cur = [0, 0, 0]
        wish = [1, 0, 0]
        res = apply_acceleration(cur, wish, 10, 5, 0.1)
        self.assertGreater(res[0], 0)

    def test_friction(self):
        cur = [10, 0, 5]
        slow = apply_friction(cur, 2.0, 0.1)
        orig_speed = (cur[0]**2 + cur[2]**2)**0.5
        new_speed = (slow[0]**2 + slow[2]**2)**0.5
        self.assertLess(new_speed, orig_speed)

if __name__ == '__main__':
    unittest.main()
