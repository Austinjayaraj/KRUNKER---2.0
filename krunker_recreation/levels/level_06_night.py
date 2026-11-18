"""LEVEL 6: NIGHT RAID (Normal) - Low-visibility nighttime urban blackout."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-12.0, 0.0, -12.0, -2.0, 5.0, -2.0),
        AABB(2.0, 0.0, 2.0, 12.0, 5.0, 12.0),
    ]
    spawns = [(-22.0, 0.5, -22.0), (22.0, 0.5, -22.0), (-22.0, 0.5, 16.0), (22.0, 0.5, 16.0)]
    objs = [{"id": "flare_beacon", "type": "light_beacon", "pos": (0.0, 0.5, 0.0)}]
    return create_level_environment(
        level_number=6,
        layout_style="night_urban_grid",
        sky_color=(0.02, 0.03, 0.07),
        ambient_color=(0.22, 0.26, 0.38),
        fog_density=0.016,
        combat_distance="short_to_medium",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
