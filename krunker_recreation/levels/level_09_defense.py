"""LEVEL 9: DEFENSE PROTOCOL (Hard) - Military base defense."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-10.0, 0.0, -10.0, 10.0, 2.5, -6.0),
        AABB(-10.0, 0.0, 6.0, 10.0, 2.5, 10.0),
        AABB(-10.0, 0.0, -6.0, -6.0, 2.5, 6.0),
        AABB(6.0, 0.0, -6.0, 10.0, 2.5, 6.0),
    ]
    spawns = [(0.0, 0.5, -36.0), (-34.0, 0.5, -10.0), (34.0, 0.5, -10.0), (0.0, 0.5, -26.0)]
    objs = [
        {"id": "defense_core", "type": "defense_zone", "pos": (0.0, 0.2, 0.0), "radius": 8.0, "label": "Command Uplink Core"}
    ]
    return create_level_environment(
        level_number=9,
        layout_style="fortified_military_base",
        sky_color=(0.35, 0.42, 0.50),
        ambient_color=(0.68, 0.72, 0.78),
        fog_density=0.006,
        combat_distance="medium",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
