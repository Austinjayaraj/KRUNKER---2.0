import unittest
from krunker_recreation.engine.game_loop import GameLoop
from krunker_recreation.engine.collision_system import CollisionSystem
from krunker_recreation.player.slide_mechanics import SlideMechanics
from krunker_recreation.player.health import HealthComponent
from krunker_recreation.weapons.recoil import RecoilSystem
from krunker_recreation.weapons.reload import ReloadMechanics
from krunker_recreation.bots.spawner import BotSpawner
from krunker_recreation.maps.map_loader import MapLoader
from krunker_recreation.combat.damage_system import DamageSystem
from krunker_recreation.combat.hit_detection import HitDetection
from krunker_recreation.combat.score_system import ScoreSystem
from krunker_recreation.progression.xp_system import XPSystem
from krunker_recreation.progression.unlocks import UnlockManager
from krunker_recreation.ui.hud import CombatHUD
from krunker_recreation.ui.crosshair import CrosshairUI
from krunker_recreation.ui.damage_overlay import DamageOverlayUI
from krunker_recreation.ui.scoreboard import ScoreboardUI


class TestPythonSubsystems(unittest.TestCase):
    def test_game_loop_headless_ticks(self):
        loop = GameLoop(target_fps=60)
        res = loop.run_headless(120, 1.0 / 60.0)
        self.assertEqual(res["ticks"], 120)
        self.assertAlmostEqual(res["simulated_seconds"], 2.0, places=2)

    def test_slide_mechanics_boost_and_crouch(self):
        slide = SlideMechanics()
        vel = slide.start_slide([10.0, 0.0, 0.0], is_grounded=True)
        self.assertTrue(slide.is_sliding)
        self.assertGreater(vel[0], 10.0)
        vel, eye_h = slide.update_slide(vel, 0.1, is_crouch_held=True)
        self.assertLess(eye_h, 1.7)

    def test_health_shield_and_regen(self):
        hp = HealthComponent(max_health=100, regen_delay=2.0, regen_rate=20.0)
        # Spawn shield active initially (3.0s)
        self.assertEqual(hp.apply_damage(40), 0.0)
        hp.update(3.5)
        self.assertFalse(hp.is_shielded)
        self.assertEqual(hp.apply_damage(40), 40.0)
        self.assertEqual(hp.health, 60.0)
        hp.update(2.5)
        self.assertGreater(hp.health, 60.0)

    def test_recoil_and_reload_mechanics(self):
        recoil = RecoilSystem()
        dp, _ = recoil.apply_shot_kick(0.03, 0.01, is_ads=False)
        self.assertGreater(dp, 0.0)
        recoil.update(0.2)
        self.assertLess(recoil.pitch_offset, dp)

        mag, res = ReloadMechanics.compute_magazine_refill(12, 60, 30)
        self.assertEqual(mag, 30)
        self.assertEqual(res, 42)

    def test_bot_spawner_and_map_loader(self):
        desert_map = MapLoader.load_map("desert")
        self.assertEqual(desert_map["id"], "desert")
        bots = BotSpawner.spawn_bots(4, "hard", desert_map["spawn_points"], desert_map["waypoints"])
        self.assertEqual(len(bots), 4)
        self.assertEqual(bots[0].ai.difficulty, "hard")

    def test_combat_damage_hit_and_score_streaks(self):
        dmg_head = DamageSystem.calculate_damage(34, 1.5, "head", distance=10.0, max_range=100.0)
        dmg_body = DamageSystem.calculate_damage(34, 1.5, "body", distance=10.0, max_range=100.0)
        self.assertGreater(dmg_head, dmg_body)

        hit = HitDetection.check_character_hit([0.0, 2.2, 0.0], [0.0, 0.0, 1.0], [0.0, 0.0, 10.0])
        self.assertIsNotNone(hit)
        self.assertTrue(hit["is_headshot"])

        scores = ScoreSystem()
        r1 = scores.register_kill(is_headshot=True)
        r2 = scores.register_kill(is_headshot=False)
        self.assertEqual(r2["banner"], "DOUBLE ELIMINATION")
        self.assertGreater(r2["total_score"], r1["points_awarded"])

    def test_xp_unlocks_and_reactive_ui_controllers(self):
        xp = XPSystem(level=1, xp=0)
        out = xp.award_xp(1200)
        self.assertGreater(out["level"], 1)
        unlocked = UnlockManager.get_unlocked_items(out["level"])
        self.assertGreaterEqual(len(unlocked), 2)

        hud = CombatHUD()
        hud.push_damage_number(51, [0.0, 2.0, 5.0], is_headshot=True)
        hud.trigger_banner("DOUBLE ELIMINATION")
        snap = hud.format_telemetry(85, 100, 24, 90, 16.5, is_sliding=True)
        self.assertTrue(snap["slide_boost_active"])
        self.assertEqual(snap["active_banner"], "DOUBLE ELIMINATION")

        crosshair = CrosshairUI(style="chevron")
        crosshair.trigger_hitmarker(is_headshot=True)
        self.assertGreater(crosshair.compute_dynamic_gap(15.0, False, True), crosshair.base_gap)

        overlay = DamageOverlayUI()
        angle = overlay.add_threat_source([0.0, 0.0, 0.0], 0.0, [10.0, 0.0, 0.0])
        self.assertAlmostEqual(angle, 90.0, places=1)

        standings = ScoreboardUI.build_standings([
            {"name": "Bot_A", "kills": 3, "deaths": 5, "score": 300},
            {"name": "Player", "kills": 10, "deaths": 2, "score": 1250},
        ])
        self.assertEqual(standings[0]["name"], "Player")
        self.assertEqual(standings[0]["rank"], 1)


if __name__ == "__main__":
    unittest.main()
