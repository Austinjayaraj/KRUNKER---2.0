import os
import tempfile
import unittest
from krunker_recreation.core.database import GameDatabase


class TestGameDatabase(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.db_path = os.path.join(self.temp_dir.name, "test_krunker.db")
        self.db = GameDatabase(self.db_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_initial_schema_defaults(self):
        state = self.db.get_full_state()
        self.assertEqual(state["userStats"]["level"], 1)
        self.assertEqual(state["campaignProgress"]["unlocked_level"], 1)
        self.assertEqual(state["preferences"]["currentClass"], "triggerman")
        self.assertEqual(len(state["matchHistory"]), 0)

    def test_save_and_load_full_state(self):
        updated = self.db.save_full_state(
            {
                "userStats": {
                    "level": 4,
                    "xp": 650,
                    "xpToNextLevel": 1643,
                    "totalKills": 42,
                    "totalDeaths": 12,
                    "headshots": 18,
                    "shotsFired": 210,
                    "shotsHit": 95,
                    "matchesPlayed": 5,
                    "matchesWon": 4,
                    "unlockedSkins": ["tactical", "cyber", "gold"],
                },
                "preferences": {
                    "currentClass": "hunter",
                    "selectedMap": "desert",
                    "selectedMode": "tdm",
                    "botDifficulty": "hard",
                    "botCount": 6,
                    "settings": {"fov": 95, "mouseSensitivity": 1.25},
                },
                "matchRecord": {
                    "mode": "tdm",
                    "mapId": "desert",
                    "kills": 15,
                    "deaths": 3,
                    "headshots": 7,
                    "score": 1850,
                    "isVictory": True,
                },
            }
        )
        self.assertEqual(updated["userStats"]["level"], 4)
        self.assertEqual(updated["userStats"]["totalKills"], 42)
        self.assertEqual(updated["preferences"]["currentClass"], "hunter")
        self.assertEqual(updated["preferences"]["selectedMap"], "desert")
        self.assertEqual(updated["preferences"]["settings"]["fov"], 95)
        self.assertEqual(len(updated["matchHistory"]), 1)
        self.assertEqual(updated["matchHistory"][0]["kills"], 15)

    def test_campaign_completion_sql_persistence(self):
        prog = self.db.record_campaign_completion(
            level_number=1,
            stars=3,
            score=1400,
            time_sec=41.5,
            xp_earned=350,
            coins_earned=150,
            weapon_unlock="revolver",
            cosmetic_reward="neon_pulse",
        )
        self.assertEqual(prog["unlocked_level"], 2)
        self.assertEqual(prog["total_xp"], 350)
        self.assertEqual(prog["total_coins"], 150)
        self.assertIn("revolver", prog["unlocked_weapons"])
        self.assertEqual(prog["completed_levels"]["1"]["stars"], 3)


if __name__ == "__main__":
    unittest.main()
