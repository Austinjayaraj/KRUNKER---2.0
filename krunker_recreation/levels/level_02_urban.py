"""LEVEL 2: URBAN ASSAULT (Easy) - Urban city environment."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-6.0, 0.0, -6.0, 6.0, 4.5, 6.0),
        AABB(-20.0, 0.0, -14.0, -12.0, 3.5, -6.0),
        AABB(12.0, 0.0, 6.0, 20.0, 3.5, 14.0),
    ]
    spawns = [(0.0, 0.5, -28.0), (24.0, 0.5, 0.0), (-24.0, 0.5, 0.0), (18.0, 0.5, -18.0), (-18.0, 0.5, -18.0)]
    objs = [{"id": "med_plaza", "type": "health_pack", "pos": (0.0, 0.5, 14.0)}]
    return create_level_environment(
        level_number=2,
        layout_style="urban_city_plaza",
        sky_color=(0.08, 0.10, 0.22),
        ambient_color=(0.55, 0.58, 0.72),
        fog_density=0.006,
        combat_distance="medium",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
