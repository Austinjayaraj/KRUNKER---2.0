"""LEVEL 3: DESERT STRIKE (Easy) - Desert military outpost with capture zone."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-14.0, 0.0, -10.0, -6.0, 4.0, -2.0),
        AABB(6.0, 0.0, -10.0, 14.0, 4.0, -2.0),
        AABB(-8.0, 0.0, -26.0, 8.0, 5.5, -20.0),
    ]
    spawns = [(0.0, 0.5, -32.0), (26.0, 0.5, -12.0), (-26.0, 0.5, -12.0), (18.0, 5.5, -23.0)]
    objs = [
        {"id": "capture_outpost", "type": "capture_zone", "pos": (0.0, 0.1, 0.0), "radius": 7.5, "label": "Outpost Command Zone"}
    ]
    return create_level_environment(
        level_number=3,
        layout_style="desert_military_outpost",
        sky_color=(0.82, 0.65, 0.42),
        ambient_color=(0.85, 0.72, 0.55),
        fog_density=0.008,
        combat_distance="medium_to_long",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
