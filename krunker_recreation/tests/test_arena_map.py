"""Unit tests for arena map geometry, collision bounding boxes, and entities."""
import unittest
from krunker_recreation.maps.arena_map import create_urban_arena_map

class TestArenaMap(unittest.TestCase):
    def setUp(self):
        self.arena = create_urban_arena_map()

    def test_map_initialization(self):
        self.assertEqual(self.arena.name, "Urban Block Arena")
        self.assertEqual(self.arena.theme, "cyberpunk")
        self.assertGreater(len(self.arena.collision_boxes), 5)
        self.assertGreater(len(self.arena.spawn_points), 3)
        self.assertGreater(len(self.arena.bot_waypoints), 4)

    def test_jump_pads_have_vertical_impulse(self):
        self.assertGreaterEqual(len(self.arena.jump_pads), 1)
        for pad in self.arena.jump_pads:
            impulse = pad['impulse']
            self.assertGreater(impulse[1], 10.0, "Jump pad must provide substantial vertical boost")

    def test_pickups_and_barrels(self):
        self.assertGreaterEqual(len(self.arena.pickups), 2)
        self.assertGreaterEqual(len(self.arena.explosive_barrels), 2)
        for barrel in self.arena.explosive_barrels:
            self.assertGreater(barrel['damage'], 50)
            self.assertGreater(barrel['radius'], 4.0)

if __name__ == '__main__':
    unittest.main()
