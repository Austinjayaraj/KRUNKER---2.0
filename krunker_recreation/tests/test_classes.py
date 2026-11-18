"""Unit tests for player classes configuration and stat balancing."""
import unittest
from krunker_recreation.config.class_config import CLASSES

class TestPlayerClasses(unittest.TestCase):
    def test_all_classes_exist(self):
        expected_classes = [
            'triggerman', 'hunter', 'run_n_gun', 'vince',
            'detective', 'marksman', 'rocketeer', 'runner'
        ]
        for c in expected_classes:
            self.assertIn(c, CLASSES, f"Class {c} missing from CLASSES dictionary")

    def test_class_health_and_speed_ranges(self):
        for class_id, data in CLASSES.items():
            self.assertGreaterEqual(data['base_health'], 60, f"{class_id} health too low")
            self.assertLessEqual(data['base_health'], 150, f"{class_id} health too high")
            self.assertGreaterEqual(data['speed_multiplier'], 0.8, f"{class_id} speed too slow")
            self.assertLessEqual(data['speed_multiplier'], 1.4, f"{class_id} speed too fast")
            self.assertIn('primary_weapon', data)
            self.assertIn('name', data)

    def test_hunter_fragile_but_fast(self):
        hunter = CLASSES['hunter']
        self.assertEqual(hunter['base_health'], 60)
        self.assertGreater(hunter['speed_multiplier'], 1.0)
        self.assertEqual(hunter['primary_weapon'], 'sniper_rifle')

    def test_runner_fastest_class(self):
        runner = CLASSES['runner']
        self.assertEqual(runner['speed_multiplier'], 1.25)
        self.assertEqual(runner['base_health'], 120)

if __name__ == '__main__':
    unittest.main()
