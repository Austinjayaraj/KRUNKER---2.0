"""LEVEL 14: FINAL OPERATION (Very Hard) - Multi-level complex & Enemy Commander."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-10.0, 0.0, -28.0, 10.0, 8.0, -16.0),
        AABB(-22.0, 0.0, -8.0, -10.0, 4.5, 6.0),
        AABB(10.0, 0.0, -8.0, 22.0, 4.5, 6.0),
    ]
    spawns = [(0.0, 8.0, -22.0), (-16.0, 4.5, -1.0), (16.0, 4.5, -1.0), (-24.0, 0.5, -26.0), (24.0, 0.5, -26.0)]
    objs = [
        {"id": "sec_node_1", "type": "terminal", "pos": (-16.0, 0.5, 10.0), "label": "Security Node West"},
        {"id": "sec_node_2", "type": "terminal", "pos": (16.0, 0.5, 10.0), "label": "Security Node East"},
    ]
    return create_level_environment(
        level_number=14,
        layout_style="multi_tier_omega_spire",
        sky_color=(0.18, 0.08, 0.25),
        ambient_color=(0.60, 0.45, 0.72),
        fog_density=0.007,
        combat_distance="all_ranges",
        elevation_tiers=3,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
