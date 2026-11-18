"""LEVEL 12: LAST STAND (Expert) - Open battlefield with 7 escalating waves."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-12.0, 0.0, -4.0, -4.0, 2.8, 4.0),
        AABB(4.0, 0.0, -4.0, 12.0, 2.8, 4.0),
        AABB(-4.0, 0.0, -16.0, 4.0, 3.2, -10.0),
    ]
    spawns = [
        (0.0, 0.5, -38.0),
        (-34.0, 0.5, -24.0),
        (34.0, 0.5, -24.0),
        (-34.0, 0.5, 20.0),
        (34.0, 0.5, 20.0),
    ]
    objs = [
        {"id": "bunker_ammo", "type": "ammo_station", "pos": (0.0, 0.5, 0.0), "label": "Central Munitions Drop"}
    ]
    return create_level_environment(
        level_number=12,
        layout_style="open_scorched_battlefield",
        sky_color=(0.45, 0.22, 0.12),
        ambient_color=(0.75, 0.52, 0.40),
        fog_density=0.007,
        combat_distance="all_ranges",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
