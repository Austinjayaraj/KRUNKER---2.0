"""LEVEL 15: FINAL BOSS (Extreme) - Special Boss Arena & Reinforcements."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-8.0, 0.0, -24.0, 8.0, 6.0, -12.0),
        AABB(-22.0, 0.0, -10.0, -14.0, 5.0, -2.0),
        AABB(14.0, 0.0, -10.0, 22.0, 5.0, -2.0),
        AABB(-22.0, 0.0, 8.0, -14.0, 5.0, 16.0),
        AABB(14.0, 0.0, 8.0, 22.0, 5.0, 16.0),
    ]
    spawns = [(0.0, 6.0, -18.0), (-26.0, 0.5, -24.0), (26.0, 0.5, -24.0), (-26.0, 0.5, 14.0), (26.0, 0.5, 14.0)]
    objs = [
        {"id": "boss_altar", "type": "boss_spawn", "pos": (0.0, 6.0, -18.0), "label": "Apex Warlord Sanctum"},
        {"id": "sanctum_med_1", "type": "health_pack", "pos": (-18.0, 0.5, 3.0)},
        {"id": "sanctum_med_2", "type": "health_pack", "pos": (18.0, 0.5, 3.0)},
    ]
    return create_level_environment(
        level_number=15,
        layout_style="apex_boss_sanctum",
        sky_color=(0.28, 0.02, 0.04),
        ambient_color=(0.75, 0.28, 0.32),
        fog_density=0.010,
        combat_distance="all_ranges",
        elevation_tiers=3,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
