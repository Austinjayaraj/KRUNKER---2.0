"""Hitscan raycasting and projectile simulation."""
import math

def trace_hitscan(origin, direction, max_dist, target_boxes):
    """Traces a ray through candidate target bounding boxes."""
    closest_hit = None
    closest_dist = max_dist

    for target in target_boxes:
        dist = ray_intersects_box(origin, direction, target['box'])
        if dist is not None and dist < closest_dist:
            closest_dist = dist
            closest_hit = {
                'target': target,
                'distance': dist,
                'is_headshot': target.get('is_head', False)
            }
    return closest_hit

def ray_intersects_box(origin, direction, box):
    t_min = 0.0
    t_max = 9999.0

    for i in range(3):
        box_min = [box.min_x, box.min_y, box.min_z][i]
        box_max = [box.max_x, box.max_y, box.max_z][i]
        o = origin[i]
        d = direction[i]

        if abs(d) < 1e-6:
            if o < box_min or o > box_max:
                return None
        else:
            t1 = (box_min - o) / d
            t2 = (box_max - o) / d
            if t1 > t2:
                t1, t2 = t2, t1
            t_min = max(t_min, t1)
            t_max = min(t_max, t2)
            if t_min > t_max:
                return None
    return t_min
