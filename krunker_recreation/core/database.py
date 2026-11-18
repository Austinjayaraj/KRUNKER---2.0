"""
Persistent SQLite3 Relational Storage Engine for Krunker 3D FPS
Uses Python's built-in sqlite3 library to persist:
- player_stats (career XP, level, kills, deaths, headshots, shots, wins)
- campaign_levels (per-level stars, best score, best time, completion count)
- player_preferences (selected class, map, mode, bot difficulty, bot count, settings JSON)
- match_history (completed quickplay & campaign match records)
"""

import os
import json
import sqlite3
import time
from typing import Dict, Any, List, Optional

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SAVES_DIR = os.path.join(BASE_DIR, "saves")
DEFAULT_DB_PATH = os.path.join(SAVES_DIR, "krunker_arena.db")


class GameDatabase:
    def __init__(self, db_path: str = DEFAULT_DB_PATH):
        self.db_path = db_path
        os.makedirs(os.path.dirname(self.db_path), exist_ok=True)
        self._init_schema()

    def _connect(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_schema(self) -> None:
        with self._connect() as conn:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS player_stats (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    level INTEGER NOT NULL DEFAULT 1,
                    xp INTEGER NOT NULL DEFAULT 0,
                    xp_to_next_level INTEGER NOT NULL DEFAULT 1000,
                    total_kills INTEGER NOT NULL DEFAULT 0,
                    total_deaths INTEGER NOT NULL DEFAULT 0,
                    headshots INTEGER NOT NULL DEFAULT 0,
                    shots_fired INTEGER NOT NULL DEFAULT 0,
                    shots_hit INTEGER NOT NULL DEFAULT 0,
                    matches_played INTEGER NOT NULL DEFAULT 0,
                    matches_won INTEGER NOT NULL DEFAULT 0,
                    unlocked_skins_json TEXT NOT NULL DEFAULT '["tactical","cyber","gold","camo","hyperbeast"]',
                    updated_at INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS campaign_meta (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    unlocked_level INTEGER NOT NULL DEFAULT 1,
                    total_xp INTEGER NOT NULL DEFAULT 0,
                    total_coins INTEGER NOT NULL DEFAULT 0,
                    unlocked_weapons_json TEXT NOT NULL DEFAULT '["assault_rifle","sniper_rifle","smg"]',
                    unlocked_cosmetics_json TEXT NOT NULL DEFAULT '["tactical"]',
                    updated_at INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS campaign_levels (
                    level_number INTEGER PRIMARY KEY,
                    stars INTEGER NOT NULL DEFAULT 1,
                    best_score INTEGER NOT NULL DEFAULT 0,
                    best_time_sec REAL NOT NULL DEFAULT 60.0,
                    times_completed INTEGER NOT NULL DEFAULT 1,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS player_preferences (
                    id INTEGER PRIMARY KEY CHECK (id = 1),
                    current_class TEXT NOT NULL DEFAULT 'triggerman',
                    selected_map TEXT NOT NULL DEFAULT 'urban',
                    selected_mode TEXT NOT NULL DEFAULT 'ffa',
                    bot_difficulty TEXT NOT NULL DEFAULT 'normal',
                    bot_count INTEGER NOT NULL DEFAULT 4,
                    settings_json TEXT NOT NULL DEFAULT '{}',
                    updated_at INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS match_history (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    mode TEXT NOT NULL,
                    map_id TEXT NOT NULL,
                    kills INTEGER NOT NULL DEFAULT 0,
                    deaths INTEGER NOT NULL DEFAULT 0,
                    headshots INTEGER NOT NULL DEFAULT 0,
                    score INTEGER NOT NULL DEFAULT 0,
                    is_victory INTEGER NOT NULL DEFAULT 0,
                    played_at INTEGER NOT NULL
                );
                """
            )
            now = int(time.time())
            conn.execute(
                "INSERT OR IGNORE INTO player_stats (id, updated_at) VALUES (1, ?)",
                (now,),
            )
            conn.execute(
                "INSERT OR IGNORE INTO campaign_meta (id, updated_at) VALUES (1, ?)",
                (now,),
            )
            conn.execute(
                "INSERT OR IGNORE INTO player_preferences (id, updated_at) VALUES (1, ?)",
                (now,),
            )
            conn.commit()

    def get_campaign_progress(self) -> Dict[str, Any]:
        with self._connect() as conn:
            meta = conn.execute(
                "SELECT * FROM campaign_meta WHERE id = 1"
            ).fetchone()
            levels = conn.execute(
                "SELECT * FROM campaign_levels ORDER BY level_number ASC"
            ).fetchall()

            completed_levels: Dict[str, Any] = {}
            for row in levels:
                lvl = int(row["level_number"])
                completed_levels[str(lvl)] = {
                    "level_number": lvl,
                    "stars": int(row["stars"]),
                    "best_score": int(row["best_score"]),
                    "best_time_sec": float(row["best_time_sec"]),
                    "times_completed": int(row["times_completed"]),
                }

            return {
                "unlocked_level": int(meta["unlocked_level"]),
                "total_xp": int(meta["total_xp"]),
                "total_coins": int(meta["total_coins"]),
                "unlocked_weapons": json.loads(meta["unlocked_weapons_json"]),
                "unlocked_cosmetics": json.loads(meta["unlocked_cosmetics_json"]),
                "completed_levels": completed_levels,
            }

    def record_campaign_completion(
        self,
        level_number: int,
        stars: int,
        score: int,
        time_sec: float,
        xp_earned: int,
        coins_earned: int,
        weapon_unlock: Optional[str] = None,
        cosmetic_reward: Optional[str] = None,
    ) -> Dict[str, Any]:
        lvl = max(1, min(15, int(level_number)))
        clamped_stars = max(1, min(3, int(stars)))
        now = int(time.time())

        with self._connect() as conn:
            existing = conn.execute(
                "SELECT * FROM campaign_levels WHERE level_number = ?", (lvl,)
            ).fetchone()
            if existing:
                new_stars = max(int(existing["stars"]), clamped_stars)
                new_score = max(int(existing["best_score"]), int(score))
                new_time = min(float(existing["best_time_sec"]), float(time_sec))
                new_count = int(existing["times_completed"]) + 1
                conn.execute(
                    """
                    UPDATE campaign_levels
                    SET stars = ?, best_score = ?, best_time_sec = ?, times_completed = ?, updated_at = ?
                    WHERE level_number = ?
                    """,
                    (new_stars, new_score, new_time, new_count, now, lvl),
                )
            else:
                conn.execute(
                    """
                    INSERT INTO campaign_levels (level_number, stars, best_score, best_time_sec, times_completed, updated_at)
                    VALUES (?, ?, ?, ?, 1, ?)
                    """,
                    (lvl, clamped_stars, int(score), float(time_sec), now),
                )

            meta = conn.execute(
                "SELECT * FROM campaign_meta WHERE id = 1"
            ).fetchone()
            unlocked_level = int(meta["unlocked_level"])
            if lvl >= unlocked_level and lvl < 15:
                unlocked_level = lvl + 1

            total_xp = int(meta["total_xp"]) + int(xp_earned)
            total_coins = int(meta["total_coins"]) + int(coins_earned)
            weapons: List[str] = json.loads(meta["unlocked_weapons_json"])
            cosmetics: List[str] = json.loads(meta["unlocked_cosmetics_json"])

            if weapon_unlock and weapon_unlock not in weapons:
                weapons.append(weapon_unlock)
            if cosmetic_reward and cosmetic_reward not in cosmetics:
                cosmetics.append(cosmetic_reward)

            conn.execute(
                """
                UPDATE campaign_meta
                SET unlocked_level = ?, total_xp = ?, total_coins = ?,
                    unlocked_weapons_json = ?, unlocked_cosmetics_json = ?, updated_at = ?
                WHERE id = 1
                """,
                (
                    unlocked_level,
                    total_xp,
                    total_coins,
                    json.dumps(weapons),
                    json.dumps(cosmetics),
                    now,
                ),
            )
            conn.commit()

        return self.get_campaign_progress()

    def save_full_state(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        now = int(time.time())
        with self._connect() as conn:
            stats = payload.get("userStats")
            if isinstance(stats, dict):
                conn.execute(
                    """
                    UPDATE player_stats
                    SET level = ?, xp = ?, xp_to_next_level = ?,
                        total_kills = ?, total_deaths = ?, headshots = ?,
                        shots_fired = ?, shots_hit = ?,
                        matches_played = ?, matches_won = ?,
                        unlocked_skins_json = ?, updated_at = ?
                    WHERE id = 1
                    """,
                    (
                        int(stats.get("level", 1)),
                        int(stats.get("xp", 0)),
                        int(stats.get("xpToNextLevel", 1000)),
                        int(stats.get("totalKills", 0)),
                        int(stats.get("totalDeaths", 0)),
                        int(stats.get("headshots", 0)),
                        int(stats.get("shotsFired", 0)),
                        int(stats.get("shotsHit", 0)),
                        int(stats.get("matchesPlayed", 0)),
                        int(stats.get("matchesWon", 0)),
                        json.dumps(
                            stats.get(
                                "unlockedSkins",
                                ["tactical", "cyber", "gold", "camo", "hyperbeast"],
                            )
                        ),
                        now,
                    ),
                )

            prefs = payload.get("preferences")
            if isinstance(prefs, dict):
                conn.execute(
                    """
                    UPDATE player_preferences
                    SET current_class = ?, selected_map = ?, selected_mode = ?,
                        bot_difficulty = ?, bot_count = ?, settings_json = ?, updated_at = ?
                    WHERE id = 1
                    """,
                    (
                        str(prefs.get("currentClass", "triggerman")),
                        str(prefs.get("selectedMap", "urban")),
                        str(prefs.get("selectedMode", "ffa")),
                        str(prefs.get("botDifficulty", "normal")),
                        int(prefs.get("botCount", 4)),
                        json.dumps(prefs.get("settings", {})),
                        now,
                    ),
                )

            match_entry = payload.get("matchRecord")
            if isinstance(match_entry, dict):
                conn.execute(
                    """
                    INSERT INTO match_history (mode, map_id, kills, deaths, headshots, score, is_victory, played_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    (
                        str(match_entry.get("mode", "ffa")),
                        str(match_entry.get("mapId", "urban")),
                        int(match_entry.get("kills", 0)),
                        int(match_entry.get("deaths", 0)),
                        int(match_entry.get("headshots", 0)),
                        int(match_entry.get("score", 0)),
                        1 if match_entry.get("isVictory") else 0,
                        now,
                    ),
                )

            conn.commit()
        return self.get_full_state()

    def get_full_state(self) -> Dict[str, Any]:
        with self._connect() as conn:
            s = conn.execute("SELECT * FROM player_stats WHERE id = 1").fetchone()
            p = conn.execute(
                "SELECT * FROM player_preferences WHERE id = 1"
            ).fetchone()
            history_rows = conn.execute(
                "SELECT * FROM match_history ORDER BY id DESC LIMIT 25"
            ).fetchall()

            user_stats = {
                "level": int(s["level"]),
                "xp": int(s["xp"]),
                "xpToNextLevel": int(s["xp_to_next_level"]),
                "totalKills": int(s["total_kills"]),
                "totalDeaths": int(s["total_deaths"]),
                "headshots": int(s["headshots"]),
                "shotsFired": int(s["shots_fired"]),
                "shotsHit": int(s["shots_hit"]),
                "matchesPlayed": int(s["matches_played"]),
                "matchesWon": int(s["matches_won"]),
                "unlockedSkins": json.loads(s["unlocked_skins_json"]),
            }

            preferences = {
                "currentClass": str(p["current_class"]),
                "selectedMap": str(p["selected_map"]),
                "selectedMode": str(p["selected_mode"]),
                "botDifficulty": str(p["bot_difficulty"]),
                "botCount": int(p["bot_count"]),
                "settings": json.loads(p["settings_json"] or "{}"),
            }

            match_history = [
                {
                    "id": int(r["id"]),
                    "mode": str(r["mode"]),
                    "mapId": str(r["map_id"]),
                    "kills": int(r["kills"]),
                    "deaths": int(r["deaths"]),
                    "headshots": int(r["headshots"]),
                    "score": int(r["score"]),
                    "isVictory": bool(r["is_victory"]),
                    "playedAt": int(r["played_at"]),
                }
                for r in history_rows
            ]

            return {
                "userStats": user_stats,
                "preferences": preferences,
                "campaignProgress": self.get_campaign_progress(),
                "matchHistory": match_history,
            }


if __name__ == "__main__":
    import sys

    db = GameDatabase()
    cmd = sys.argv[1] if len(sys.argv) > 1 else "get_state"

    if cmd == "get_state":
        print(json.dumps(db.get_full_state()))
    elif cmd == "save_state":
        raw_input = sys.stdin.read()
        data = json.loads(raw_input) if raw_input.strip() else {}
        print(json.dumps(db.save_full_state(data)))
    elif cmd == "get_campaign":
        print(json.dumps(db.get_campaign_progress()))
    elif cmd == "complete_campaign":
        raw_input = sys.stdin.read()
        d = json.loads(raw_input) if raw_input.strip() else {}
        res = db.record_campaign_completion(
            level_number=d.get("levelNumber", 1),
            stars=d.get("stars", 1),
            score=d.get("score", 0),
            time_sec=d.get("timeSec", 60.0),
            xp_earned=d.get("xpEarned", 0),
            coins_earned=d.get("coinsEarned", 0),
            weapon_unlock=d.get("weaponUnlock"),
            cosmetic_reward=d.get("cosmeticReward"),
        )
        print(json.dumps(res))
