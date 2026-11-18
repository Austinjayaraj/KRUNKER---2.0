"""
Fixed-Timestep Game Loop Manager for Krunker 3D FPS
Handles delta-time clamping, tick accumulation, and subsystem orchestration.
"""

import time
from typing import Callable, List


class GameLoop:
    def __init__(self, target_fps: int = 60, max_dt: float = 0.05):
        self.target_fps = target_fps
        self.target_frame_time = 1.0 / float(target_fps)
        self.max_dt = max_dt
        self.is_running = False
        self.tick_count = 0
        self.elapsed_time = 0.0
        self.fps = float(target_fps)
        self._callbacks: List[Callable[[float], None]] = []

    def register_subsystem(self, callback: Callable[[float], None]) -> None:
        self._callbacks.append(callback)

    def step(self, raw_dt: float) -> float:
        """Executes a single clamped simulation tick and returns clamped dt."""
        dt = max(0.0001, min(raw_dt, self.max_dt))
        self.tick_count += 1
        self.elapsed_time += dt
        self.fps = round(1.0 / dt, 1)
        for cb in self._callbacks:
            cb(dt)
        return dt

    def run_headless(self, ticks: int, fixed_dt: float = 1.0 / 60.0) -> dict:
        """Runs a deterministic number of simulation ticks for testing or server mode."""
        self.is_running = True
        start = time.perf_counter()
        for _ in range(ticks):
            if not self.is_running:
                break
            self.step(fixed_dt)
        wall_ms = (time.perf_counter() - start) * 1000.0
        self.is_running = False
        return {
            "ticks": self.tick_count,
            "simulated_seconds": round(self.elapsed_time, 3),
            "wall_time_ms": round(wall_ms, 2),
        }
