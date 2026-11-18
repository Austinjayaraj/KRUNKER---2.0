"""LEVEL 10: THE HUNT (Expert) - Large urban map with 3 Elite enemies."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-8.0, 0.0, -8.0, 8.0, 7.0, 8.0),
        AABB(-26.0, 0.0, -18.0, -16.0, 5.0, -8.0),
        AABB(16.0, 0.0, 8.0, 26.0, 5.0, 18.0),
    ]
    spawns = [(0.0, 7.0, 0.0), (-21.0, 5.0, -13.0), (21.0, 5.0, 13.0), (0.0, 0.5, -32.0), (-28.0, 0.5, 18.0)]
    objs = [{"id": "intel_uplink", "type": "radar_beacon", "pos": (0.0, 7.2, 0.0), "label": "Elite Tracker Uplink"}]
    return create_level_environment(
        level_number=10,
        layout_style="large_urban_rooftops",
        sky_color=(0.16, 0.06, 0.24),
        ambient_color=(0.55, 0.42, 0.68),
        fog_density=0.005,
        combat_distance="medium_to_long",
        elevation_tiers=3,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
