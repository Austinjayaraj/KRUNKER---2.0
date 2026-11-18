"""LEVEL 7: SURVIVAL (Hard) - 5-wave arena survival."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-8.0, 0.0, -8.0, 8.0, 3.0, 8.0),
        AABB(-24.0, 0.0, -6.0, -18.0, 4.0, 6.0),
        AABB(18.0, 0.0, -6.0, 24.0, 4.0, 6.0),
    ]
    spawns = [(0.0, 0.5, -32.0), (0.0, 0.5, 32.0), (-32.0, 0.5, 0.0), (32.0, 0.5, 0.0)]
    objs = [
        {"id": "arena_med", "type": "health_pack", "pos": (-12.0, 0.5, 0.0)},
        {"id": "arena_ammo", "type": "ammo_station", "pos": (12.0, 0.5, 0.0)},
    ]
    return create_level_environment(
        level_number=7,
        layout_style="circular_gladiator_arena",
        sky_color=(0.20, 0.05, 0.08),
        ambient_color=(0.58, 0.36, 0.40),
        fog_density=0.008,
        combat_distance="all_ranges",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
