"""
Arena Map specification for the Python Panda3D game engine.
Defines collision boundaries, obstacles, spawn points, bot navigation waypoints,
jump pads, and interactive map entities.
"""

from typing import List, Dict, Any, Tuple
from krunker_recreation.engine.physics_engine import AABB

class MapData:
    def __init__(self, name: str, theme: str):
        self.name = name
        self.theme = theme
        self.collision_boxes: List[AABB] = []
        self.spawn_points: List[Tuple[float, float, float]] = []
        self.bot_waypoints: List[Tuple[float, float, float]] = []
        self.jump_pads: List[Dict[str, Any]] = []
        self.pickups: List[Dict[str, Any]] = []
        self.explosive_barrels: List[Dict[str, Any]] = []

def create_urban_arena_map() -> MapData:
    """Builds the primary competitive urban arena map."""
    arena = MapData("Urban Block Arena", "cyberpunk")

    # Outer perimeter boundary walls
    arena.collision_boxes.extend([
        # North wall
        AABB(min_x=-45.0, min_y=0.0, min_z=-47.0, max_x=45.0, max_y=12.0, max_z=-44.0),
        # South wall
        AABB(min_x=-45.0, min_y=0.0, min_z=44.0, max_x=45.0, max_y=12.0, max_z=47.0),
        # West wall
        AABB(min_x=-47.0, min_y=0.0, min_z=-45.0, max_x=-44.0, max_y=12.0, max_z=45.0),
        # East wall
        AABB(min_x=44.0, min_y=0.0, min_z=-45.0, max_x=47.0, max_y=12.0, max_z=45.0),
    ])

    # Central Courtyard Tower & Shipping Containers
    arena.collision_boxes.extend([
        # Center Tower base
        AABB(min_x=-6.0, min_y=0.0, min_z=-6.0, max_x=6.0, max_y=5.0, max_z=6.0),
        # Center Tower upper catwalk
        AABB(min_x=-4.0, min_y=5.0, min_z=-4.0, max_x=4.0, max_y=9.0, max_z=4.0),
        # Blue Container West
        AABB(min_x=-20.0, min_y=0.0, min_z=-12.0, max_x=-14.0, max_y=3.5, max_z=-6.0),
        # Red Container East
        AABB(min_x=14.0, min_y=0.0, min_z=6.0, max_x=20.0, max_y=3.5, max_z=12.0),
        # Orange Ramp North
        AABB(min_x=-8.0, min_y=0.0, min_z=-26.0, max_x=8.0, max_y=2.5, max_z=-20.0),
        # Concrete Bunker South
        AABB(min_x=-12.0, min_y=0.0, min_z=20.0, max_x=-4.0, max_y=4.0, max_z=28.0),
    ])

    # Player and Bot Spawn Points
    arena.spawn_points = [
        (0.0, 1.0, 30.0),
        (0.0, 1.0, -30.0),
        (28.0, 1.0, 0.0),
        (-28.0, 1.0, 0.0),
        (22.0, 1.0, 22.0),
        (-22.0, 1.0, -22.0),
    ]

    # Bot Waypoints for FSM Tactical Patrol & Pursuit
    arena.bot_waypoints = [
        (0.0, 0.5, 20.0),
        (15.0, 0.5, 15.0),
        (25.0, 0.5, 0.0),
        (15.0, 0.5, -15.0),
        (0.0, 0.5, -20.0),
        (-15.0, 0.5, -15.0),
        (-25.0, 0.5, 0.0),
        (-15.0, 0.5, 15.0),
        (0.0, 5.5, 0.0),  # High ground catwalk
    ]

    # Tactical Jump Pads (Launches player 18 m/s vertically)
    arena.jump_pads = [
        {'id': 'pad_north', 'pos': (0.0, 0.1, -14.0), 'impulse': (0.0, 18.5, 8.0)},
        {'id': 'pad_south', 'pos': (0.0, 0.1, 14.0), 'impulse': (0.0, 18.5, -8.0)},
    ]

    # Floating Pickups
    arena.pickups = [
        {'id': 'med_west', 'type': 'health', 'pos': (-17.0, 1.0, -9.0), 'respawn_time': 15.0},
        {'id': 'ammo_east', 'type': 'ammo', 'pos': (17.0, 1.0, 9.0), 'respawn_time': 12.0},
    ]

    # Explosive Barrels
    arena.explosive_barrels = [
        {'id': 'barrel_1', 'pos': (-7.0, 1.0, 5.0), 'health': 40, 'radius': 8.0, 'damage': 95},
        {'id': 'barrel_2', 'pos': (7.0, 1.0, -5.0), 'health': 40, 'radius': 8.0, 'damage': 95},
    ]

    return arena
