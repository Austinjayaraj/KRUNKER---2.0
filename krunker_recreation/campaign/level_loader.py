"""
Dynamic Campaign Level Loader
Loads level-specific modules from krunker_recreation/levels/ and merges environment geometry, lighting, and objectives.
"""

import importlib
from typing import Dict, Any
from krunker_recreation.campaign.level_config import get_level_config

LEVEL_MODULE_NAMES = {
    1: "krunker_recreation.levels.level_01_training",
    2: "krunker_recreation.levels.level_02_urban",
    3: "krunker_recreation.levels.level_03_desert",
    4: "krunker_recreation.levels.level_04_industrial",
    5: "krunker_recreation.levels.level_05_sniper",
    6: "krunker_recreation.levels.level_06_night",
    7: "krunker_recreation.levels.level_07_survival",
    8: "krunker_recreation.levels.level_08_close_quarters",
    9: "krunker_recreation.levels.level_09_defense",
    10: "krunker_recreation.levels.level_10_hunt",
    11: "krunker_recreation.levels.level_11_deep_strike",
    12: "krunker_recreation.levels.level_12_last_stand",
    13: "krunker_recreation.levels.level_13_elite",
    14: "krunker_recreation.levels.level_14_final_operation",
    15: "krunker_recreation.levels.level_15_boss",
}


class LevelLoader:
    @staticmethod
    def load_level(level_number: int) -> Dict[str, Any]:
        cfg = get_level_config(level_number)
        mod_name = LEVEL_MODULE_NAMES.get(level_number)
        if not mod_name:
            raise ValueError(f"No level module mapped for level {level_number}")

        module = importlib.import_module(mod_name)
        level_instance = module.build_level()
        return {
            **cfg,
            "environment": level_instance,
        }
