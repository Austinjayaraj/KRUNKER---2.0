"""
Live Match Scoreboard & K/D Leaderboard Sorter
"""

from typing import List, Dict, Any


class ScoreboardUI:
    @staticmethod
    def build_standings(entries: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        sorted_rows = sorted(
            entries,
            key=lambda r: (r.get("score", 0), r.get("kills", 0), -r.get("deaths", 0)),
            reverse=True,
        )
        result = []
        for rank, row in enumerate(sorted_rows, start=1):
            kills = row.get("kills", 0)
            deaths = row.get("deaths", 0)
            kd = round(kills / max(1, deaths), 2)
            result.append({
                "rank": rank,
                "name": row.get("name", "Operative"),
                "team": row.get("team", "alpha"),
                "kills": kills,
                "deaths": deaths,
                "kd": kd,
                "score": row.get("score", 0),
            })
        return result
