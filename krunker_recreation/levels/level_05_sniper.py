"""LEVEL 5: SNIPER CHALLENGE (Normal) - Long-range canyon overwatch."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-24.0, 0.0, -34.0, 24.0, 7.0, -26.0),
        AABB(-20.0, 0.0, 22.0, 20.0, 4.0, 28.0),
    ]
    spawns = [(-18.0, 7.0, -30.0), (-6.0, 7.0, -30.0), (6.0, 7.0, -30.0), (18.0, 7.0, -30.0), (0.0, 0.5, -18.0)]
    objs = [{"id": "sniper_ammo", "type": "ammo_station", "pos": (0.0, 4.0, 25.0)}]
    return create_level_environment(
        level_number=5,
        layout_style="long_range_canyon",
        sky_color=(0.25, 0.18, 0.35),
        ambient_color=(0.62, 0.52, 0.68),
        fog_density=0.003,
        combat_distance="long_range",
        elevation_tiers=3,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
