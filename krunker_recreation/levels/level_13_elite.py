"""LEVEL 13: ELITE ASSAULT (Very Hard) - Advanced military complex with 5 Elite bots."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-16.0, 0.0, -22.0, 16.0, 5.5, -14.0),
        AABB(-24.0, 0.0, -4.0, -14.0, 4.5, 10.0),
        AABB(14.0, 0.0, -4.0, 24.0, 4.5, 10.0),
    ]
    spawns = [(0.0, 5.5, -18.0), (-19.0, 4.5, 3.0), (19.0, 4.5, 3.0), (-26.0, 0.5, -28.0), (26.0, 0.5, -28.0)]
    objs = [{"id": "citadel_med", "type": "health_pack", "pos": (0.0, 0.5, 8.0)}]
    return create_level_environment(
        level_number=13,
        layout_style="citadel_military_complex",
        sky_color=(0.10, 0.12, 0.22),
        ambient_color=(0.50, 0.55, 0.72),
        fog_density=0.006,
        combat_distance="medium_to_long",
        elevation_tiers=3,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
