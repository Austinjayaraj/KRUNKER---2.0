import unittest
from krunker_recreation.bots.bot_ai import BotAI

class TestBotAI(unittest.TestCase):
    def test_alert_transition(self):
        ai = BotAI("bot_1", difficulty="normal")
        # Player is close and alive
        state = ai.evaluate_state([0, 0, 0], [5, 0, 5], player_alive=True, is_player_shielded=False, health=100, max_health=100)
        self.assertEqual(state, "alerted")

        # After reaction timer expires, transitions to combat
        ai.update(0.7, [0, 0, 0], [5, 0, 5])
        self.assertEqual(ai.state, "combat")

    def test_retreat_on_low_health(self):
        ai = BotAI("bot_1")
        state = ai.evaluate_state([0, 0, 0], [5, 0, 5], player_alive=True, is_player_shielded=False, health=15, max_health=100)
        self.assertEqual(state, "retreat")

if __name__ == '__main__':
    unittest.main()
