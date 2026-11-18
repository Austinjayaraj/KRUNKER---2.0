"""LEVEL 11: DEEP STRIKE (Expert) - Underground facility with 3 mission terminals."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-20.0, 0.0, -20.0, -10.0, 6.0, -10.0),
        AABB(10.0, 0.0, -20.0, 20.0, 6.0, -10.0),
        AABB(-6.0, 0.0, -4.0, 6.0, 4.5, 6.0),
    ]
    spawns = [(-26.0, 0.5, -24.0), (26.0, 0.5, -24.0), (0.0, 0.5, -34.0), (-22.0, 0.5, 12.0), (22.0, 0.5, 12.0)]
    objs = [
        {"id": "terminal_alpha", "type": "terminal", "pos": (-18.0, 0.5, -6.0), "label": "Terminal Alpha"},
        {"id": "terminal_bravo", "type": "terminal", "pos": (18.0, 0.5, -6.0), "label": "Terminal Bravo"},
        {"id": "terminal_omega", "type": "terminal", "pos": (0.0, 0.5, -26.0), "label": "Terminal Omega"},
    ]
    return create_level_environment(
        level_number=11,
        layout_style="subterranean_reactor_grid",
        sky_color=(0.04, 0.14, 0.18),
        ambient_color=(0.35, 0.62, 0.68),
        fog_density=0.012,
        combat_distance="medium",
        elevation_tiers=2,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
