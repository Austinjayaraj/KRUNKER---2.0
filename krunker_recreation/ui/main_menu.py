"""
Panda3D DirectGUI Main Menu & Operative Loadout Selector
Manages mode selection, map selection, operative class switching, and deployment.
"""

from typing import Dict, Any
from krunker_recreation.config.class_config import CLASSES


class MainMenuUI:
    def __init__(self):
        self.selected_class = "triggerman"
        self.selected_map = "urban"
        self.selected_mode = "ffa"
        self.bot_difficulty = "normal"
        self.bot_count = 4
        self.is_visible = True

    def select_class(self, class_id: str) -> Dict[str, Any]:
        if class_id in CLASSES:
            self.selected_class = class_id
        return CLASSES[self.selected_class]

    def get_state_snapshot(self) -> Dict[str, Any]:
        cls_cfg = CLASSES[self.selected_class]
        return {
            "visible": self.is_visible,
            "selected_class": self.selected_class,
            "class_name": cls_cfg["name"],
            "selected_map": self.selected_map,
            "selected_mode": self.selected_mode,
            "bot_difficulty": self.bot_difficulty,
            "bot_count": self.bot_count,
        }
