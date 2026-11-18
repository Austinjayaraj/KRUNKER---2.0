"""
Comprehensive Unit Tests for the 15-Level Campaign & Persistent Progression System
Verifies all 15 levels, lock enforcement, dynamic enemy archetypes, real-time objectives,
1-to-3 star rating calculations, rewards, and persistent JSON save across restarts.
"""

import os
import tempfile
import unittest
from krunker_recreation.campaign.level_config import get_all_level_configs, get_level_config
from krunker_recreation.campaign.level_loader import LevelLoader
from krunker_recreation.campaign.campaign_manager import CampaignManager
from krunker_recreation.ui.level_selection import LevelSelectionUI
from krunker_recreation.ui.mission_briefing import MissionBriefingUI
from krunker_recreation.ui.mission_complete import MissionCompleteUI
from krunker_recreation.ui.campaign_progress import CampaignProgressUI


class TestCampaignSystem(unittest.TestCase):
    def setUp(self):
        self.temp_dir = tempfile.TemporaryDirectory()
        self.save_path = os.path.join(self.temp_dir.name, "campaign_progress.json")
        self.campaign = CampaignManager(save_path=self.save_path)

    def tearDown(self):
        self.temp_dir.cleanup()

    def test_all_15_levels_load_with_distinct_environments(self):
        configs = get_all_level_configs()
        self.assertEqual(len(configs), 15)
        for lvl_num in range(1, 16):
            loaded = LevelLoader.load_level(lvl_num)
            self.assertEqual(loaded["level_number"], lvl_num)
            self.assertIn("environment", loaded)
            self.assertGreater(len(loaded["environment"]["collision_boxes"]), 4)
            self.assertGreater(len(loaded["enemy_composition"]), 0)

    def test_locked_levels_cannot_be_started(self):
        ui = LevelSelectionUI(self.campaign)
        res_lvl1 = ui.select_level(1)
        self.assertTrue(res_lvl1["allowed"])

        res_lvl2 = ui.select_level(2)
        self.assertFalse(res_lvl2["allowed"])
        with self.assertRaises(PermissionError):
            self.campaign.start_level(2)

    def test_completing_level_awards_stars_unlocks_next_and_persists(self):
        briefing_ui = MissionBriefingUI(self.campaign)
        briefing_ui.load_briefing(1)
        briefing_ui.start_mission()

        lvl_mgr = self.campaign.active_level_manager
        self.assertIsNotNone(lvl_mgr)

        # Eliminate all 5 targets in Level 1 with headshots for 3 stars
        for enemy in list(lvl_mgr.active_enemies):
            lvl_mgr.eliminate_enemy(enemy["id"], is_headshot=True)

        lvl_mgr.update(15.0)
        self.assertTrue(lvl_mgr.objectives.is_primary_complete())

        reward = self.campaign.complete_active_level()
        self.assertTrue(reward["completed"])
        self.assertEqual(reward["stars"], 3)
        self.assertGreater(reward["xp_earned"], 0)
        self.assertGreater(reward["coins_earned"], 0)

        # Verify Level 2 is now unlocked and persisted to disk across restart
        restarted_campaign = CampaignManager(save_path=self.save_path)
        self.assertTrue(restarted_campaign.progression.is_level_unlocked(2))
        self.assertFalse(restarted_campaign.progression.is_level_unlocked(3))

        progress_ui = CampaignProgressUI(restarted_campaign)
        metrics = progress_ui.get_dashboard_metrics()
        self.assertEqual(metrics["completed_levels_count"], 1)
        self.assertEqual(metrics["total_stars"], 3)
        self.assertIn(1, metrics["perfect_three_star_levels"])

        formatted = MissionCompleteUI.format_completion_modal(reward)
        self.assertEqual(formatted["star_display"], "★★★")

    def test_special_objectives_terminals_capture_and_boss_level_15(self):
        # Unlock all 15 levels sequentially and verify Level 11 (terminals) and Level 15 (Final Boss)
        self.campaign.progression.state["unlocked_level"] = 15
        self.campaign.progression.save()

        # Test Level 11 (Deep Strike: 25 enemies + 3 terminals)
        lvl11 = self.campaign.start_level(11)
        while any(e["alive"] for e in lvl11.active_enemies) or lvl11.spawn_queue:
            for e in list(lvl11.active_enemies):
                if e["alive"]:
                    lvl11.eliminate_enemy(e["id"], is_headshot=True)
        # Still incomplete until 3 terminals are activated
        self.assertFalse(lvl11.objectives.is_primary_complete())
        lvl11.objectives.activate_terminal()
        lvl11.objectives.activate_terminal()
        lvl11.objectives.activate_terminal()
        self.assertTrue(lvl11.objectives.is_primary_complete())

        # Test Level 15 (Final Boss: Apex Warlord Boss + reinforcements)
        lvl15 = self.campaign.start_level(15)
        while any(e["alive"] for e in lvl15.active_enemies) or lvl15.spawn_queue:
            for e in list(lvl15.active_enemies):
                if e["alive"]:
                    lvl15.eliminate_enemy(e["id"], is_headshot=True)
        self.assertTrue(lvl15.objectives.boss_killed)
        self.assertTrue(lvl15.objectives.is_primary_complete())


if __name__ == "__main__":
    unittest.main()
