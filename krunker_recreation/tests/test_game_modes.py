import unittest
from krunker_recreation.game_modes.ffa import FFAMode
from krunker_recreation.game_modes.tdm import TDMMode

class TestGameModes(unittest.TestCase):
    def test_ffa_kill_target(self):
        ffa = FFAMode(target_kills=5, duration_sec=100)
        for _ in range(4):
            is_over = ffa.record_kill("Player")
            self.assertFalse(is_over)
        is_over = ffa.record_kill("Player")
        self.assertTrue(is_over)
        self.assertEqual(ffa.winner, "Player")

    def test_tdm_victory(self):
        tdm = TDMMode(target_kills=10)
        for _ in range(10):
            tdm.record_kill("blue")
        self.assertTrue(tdm.is_game_over)
        self.assertEqual(tdm.winner, "Blue Team")

if __name__ == '__main__':
    unittest.main()
