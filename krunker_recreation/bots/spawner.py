"""
Bot Wave & Team Spawner for Krunker 3D FPS
"""

from typing import List, Tuple
from krunker_recreation.bots.bot_controller import BotController

CALLSIGNS = [
    "Viper_01",
    "Striker_75",
    "Ghost_X",
    "Phantom_9",
    "Raptor_42",
    "Titan_08",
    "Spectre_11",
    "Vortex_99",
]


class BotSpawner:
    @staticmethod
    def spawn_bots(
        count: int,
        difficulty: str,
        spawn_points: List[Tuple[float, float, float]],
        waypoints: List[Tuple[float, float, float]],
    ) -> List[BotController]:
        bots: List[BotController] = []
        if not spawn_points:
            spawn_points = [(15.0, 0.0, 15.0), (-15.0, 0.0, -15.0)]
        for i in range(count):
            sp = spawn_points[i % len(spawn_points)]
            team = "alpha" if i % 2 == 0 else "bravo"
            callsign = CALLSIGNS[i % len(CALLSIGNS)]
            bots.append(
                BotController(
                    bot_id=f"bot_{i}",
                    name=callsign,
                    team=team,
                    spawn_pos=sp,
                    difficulty=difficulty,
                    waypoints=waypoints,
                )
            )
        return bots
