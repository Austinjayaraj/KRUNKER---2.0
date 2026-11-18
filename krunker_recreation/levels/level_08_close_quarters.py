"""LEVEL 8: CLOSE QUARTERS (Hard) - Tight indoor CQB combat facility."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-16.0, 0.0, -16.0, -2.0, 5.0, -12.0),
        AABB(2.0, 0.0, -16.0, 16.0, 5.0, -12.0),
        AABB(-16.0, 0.0, 4.0, -2.0, 5.0, 8.0),
        AABB(2.0, 0.0, 4.0, 16.0, 5.0, 8.0),
    ]
    spawns = [(-10.0, 0.5, -22.0), (10.0, 0.5, -22.0), (-10.0, 0.5, -4.0), (10.0, 0.5, -4.0)]
    objs = [{"id": "cqb_breach", "type": "checkpoint", "pos": (0.0, 0.5, -14.0), "label": "Killhouse Breach Door"}]
    return create_level_environment(
        level_number=8,
        layout_style="tight_indoor_killhouse",
        sky_color=(0.06, 0.08, 0.12),
        ambient_color=(0.45, 0.52, 0.60),
        fog_density=0.011,
        combat_distance="close_quarters",
        elevation_tiers=1,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
