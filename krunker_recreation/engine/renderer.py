"""
Panda3D 3D Scene Renderer & Voxel Geometry Builder
Constructs 3D arena geometry, dynamic lighting, skybox, and first-person weapon viewmodels.
"""

from typing import Dict, Any, List


class ArenaRenderer:
    def __init__(self, fov: float = 90.0, enable_shadows: bool = True):
        self.fov = fov
        self.enable_shadows = enable_shadows
        self.scene_nodes: List[Dict[str, Any]] = []
        self.lights: List[Dict[str, Any]] = []
        self.active_map_id = "urban"

    def setup_lighting(self, map_theme: str = "urban") -> List[Dict[str, Any]]:
        """Configures ambient, directional sun, and neon point lights for Panda3D scene graph."""
        if map_theme == "desert":
            ambient = {"type": "ambient", "color": (0.55, 0.48, 0.38, 1.0)}
            sun = {"type": "directional", "color": (1.0, 0.92, 0.75, 1.0), "hpr": (35, -55, 0)}
        elif map_theme == "industrial":
            ambient = {"type": "ambient", "color": (0.30, 0.34, 0.40, 1.0)}
            sun = {"type": "directional", "color": (0.85, 0.88, 0.95, 1.0), "hpr": (60, -50, 0)}
        else:
            ambient = {"type": "ambient", "color": (0.35, 0.35, 0.48, 1.0)}
            sun = {"type": "directional", "color": (0.90, 0.85, 0.78, 1.0), "hpr": (45, -60, 0)}

        self.lights = [ambient, sun]
        return self.lights

    def build_map_geometry(self, map_data: Dict[str, Any]) -> int:
        """Builds 3D block nodes from map obstacle definitions."""
        self.scene_nodes.clear()
        self.active_map_id = map_data.get("id", "urban")
        for idx, box in enumerate(map_data.get("obstacles", [])):
            node = {
                "id": f"block_{idx}",
                "min": (box.min_x, box.min_y, box.min_z),
                "max": (box.max_x, box.max_y, box.max_z),
                "material": "tactical_concrete",
            }
            self.scene_nodes.append(node)
        return len(self.scene_nodes)
