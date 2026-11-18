"""LEVEL 1: TRAINING GROUNDS (Beginner) - Basic training arena & shooting tutorial."""

from krunker_recreation.engine.physics_engine import AABB
from krunker_recreation.levels import create_level_environment


def build_level() -> dict:
    boxes = [
        AABB(-10.0, 0.0, -4.0, -4.0, 2.5, 2.0),
        AABB(4.0, 0.0, -4.0, 10.0, 2.5, 2.0),
        AABB(-3.0, 0.0, -18.0, 3.0, 3.0, -14.0),
    ]
    spawns = [(-12.0, 0.5, -16.0), (0.0, 0.5, -20.0), (12.0, 0.5, -16.0), (-8.0, 0.5, -26.0), (8.0, 0.5, -26.0)]
    objs = [
        {"id": "checkpoint_slide", "type": "checkpoint", "pos": (0.0, 0.5, 10.0), "label": "Slide-Hop Gate"},
        {"id": "range_rack", "type": "ammo_station", "pos": (0.0, 0.5, 22.0), "label": "Live-Fire Munitions"},
    ]
    return create_level_environment(
        level_number=1,
        layout_style="symmetric_training_lanes",
        sky_color=(0.12, 0.18, 0.28),
        ambient_color=(0.65, 0.70, 0.80),
        fog_density=0.004,
        combat_distance="short_to_medium",
        elevation_tiers=1,
        custom_boxes=boxes,
        enemy_spawns=spawns,
        interactive_objects=objs,
    )
