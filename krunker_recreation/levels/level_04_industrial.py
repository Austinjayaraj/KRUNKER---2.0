"""LEVEL 4: INDUSTRIAL WARZONE (Normal) - Warehouse navigation & extraction."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-18.0, 0.0, -18.0, -8.0, 6.0, 12.0),
        AABB(8.0, 0.0, -18.0, 18.0, 6.0, 12.0),
        AABB(-5.0, 0.0, -6.0, 5.0, 3.5, 4.0),
    ]
    spawns = [(0.0, 0.5, -30.0), (-24.0, 0.5, -20.0), (24.0, 0.5, -20.0), (0.0, 3.5, -1.0)]
    objs = [
        {"id": "extraction_pad", "type": "extraction_zone", "pos": (0.0, 0.2, -32.0), "radius": 6.0, "label": "Warehouse Extraction Beacon"}
    ]
    return create_level_environment(
        level_number=4,
        layout_style="industrial_warehouse_lanes",
        sky_color=(0.14, 0.16, 0.20),
        ambient_color=(0.50, 0.52, 0.58),
        fog_density=0.009,
        combat_distance="medium",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
