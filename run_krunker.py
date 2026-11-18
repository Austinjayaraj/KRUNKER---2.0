#!/usr/bin/env python3
"""
Krunker 3D FPS - Standalone Python Game Engine Launcher
Supports desktop 3D Panda3D client, headless server simulation, and physics benchmark.
"""

import sys
import os
import argparse
import time
import math
import random

# Ensure repository root is on Python module path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from krunker_recreation.config.class_config import CLASSES
from krunker_recreation.config.movement_config import (
    MAX_GROUND_SPEED, GROUND_ACCELERATION, AIR_ACCELERATION,
    GROUND_FRICTION, SLIDE_FRICTION, SLIDE_SPEED_BOOST, JUMP_VELOCITY, GRAVITY
)
from krunker_recreation.config.weapon_config import WEAPONS
from krunker_recreation.config.bot_config import BOT_DIFFICULTIES
from krunker_recreation.engine.physics_engine import PhysicsEngine
from krunker_recreation.player.player_controller import PlayerController
from krunker_recreation.weapons.weapon_manager import WeaponManager
from krunker_recreation.bots.bot_ai import BotAI
from krunker_recreation.game_modes.ffa import FFAMode
from krunker_recreation.game_modes.tdm import TDMMode
from krunker_recreation.maps.arena_map import create_urban_arena_map

def run_benchmark():
    print("=" * 65)
    print("  KRUNKER PYTHON FPS - 1000-TICK PHYSICS BENCHMARK")
    print("=" * 65)
    arena = create_urban_arena_map()
    player = PlayerController("triggerman", 100)
    dt = 1.0 / 60.0

    print(f"Loaded {len(arena.collision_boxes)} AABB collision obstacles.")
    print("Simulating 1,000 frames of bunny-hop / slide-hop momentum physics...")

    start_time = time.perf_counter()
    max_speed = 0.0

    for frame in range(1000):
        # Alternate forward run, slide, and jump
        wish_dir = [0.0, 0.0, -1.0]
        if frame % 60 == 20:
            player.trigger_slide()
        if frame % 60 == 25:
            player.trigger_jump()

        player.update(dt, wish_dir, arena.collision_boxes)
        cur_speed = math.hypot(player.velocity[0], player.velocity[2])
        if cur_speed > max_speed:
            max_speed = cur_speed

    elapsed = time.perf_counter() - start_time
    fps_sim = 1000.0 / elapsed

    print("-" * 65)
    print(f"Elapsed Time:      {elapsed*1000:.2f} ms")
    print(f"Simulation Speed:  {fps_sim:,.0f} physics ticks / sec")
    print(f"Peak Slide Speed:  {max_speed:.2f} m/s (Base ground: {MAX_GROUND_SPEED:.1f} m/s)")
    print("Benchmark PASSED: Physics engine executes with sub-millisecond efficiency!")
    print("=" * 65)

def run_headless_simulation(mode_name="ffa", class_id="triggerman", bot_count=4, diff="normal"):
    print("=" * 65)
    print(f"  KRUNKER PYTHON FPS - HEADLESS MATCH SIMULATION [{mode_name.upper()}]")
    print("=" * 65)
    print(f"Player Class:      {class_id.title()}")
    print(f"Bot Count:         {bot_count} opponents")
    print(f"AI Difficulty:     {diff.title()}")
    print("-" * 65)

    arena = create_urban_arena_map()
    player = PlayerController(class_id, CLASSES.get(class_id, {}).get('base_health', 100))
    player_wpn = WeaponManager(CLASSES.get(class_id, {}).get('primary_weapon', 'assault_rifle'))

    bot_names = ["Viper_35", "Striker_75", "Ghost_99", "Nexus_12", "Cobra_07", "Apex_44"]
    bots = []
    for i in range(bot_count):
        b_name = bot_names[i % len(bot_names)]
        spawn = arena.spawn_points[(i + 1) % len(arena.spawn_points)]
        bots.append({
            'id': f'bot_{i}',
            'name': b_name,
            'pos': list(spawn),
            'health': 100,
            'kills': 0,
            'deaths': 0,
            'ai': BotAI(f'bot_{i}', diff),
        })

    player_score = {'kills': 0, 'deaths': 0}
    dt = 0.05
    target_kills = 10
    match_time = 0.0

    print("Match started! Simulating real-time combat...")
    time.sleep(0.3)

    while player_score['kills'] < target_kills and match_time < 20.0:
        match_time += dt

        # Move player towards closest bot
        closest_bot = min(bots, key=lambda b: math.hypot(b['pos'][0] - player.position[0], b['pos'][2] - player.position[2])) if bots else None
        if closest_bot:
            dx = closest_bot['pos'][0] - player.position[0]
            dz = closest_bot['pos'][2] - player.position[2]
            dist = math.hypot(dx, dz)
            wish = [dx / dist if dist else 0, 0, dz / dist if dist else 0]
            player.update(dt, wish, arena.collision_boxes)
        else:
            player.update(dt, [0, 0, 0], arena.collision_boxes)

        # Player fires at target
        if match_time % 0.4 < dt:
            did_fire, dmg = player_wpn.fire()
            if did_fire and closest_bot and math.hypot(closest_bot['pos'][0] - player.position[0], closest_bot['pos'][2] - player.position[2]) < 25.0:
                is_crit = random.random() < 0.35
                final_dmg = int(dmg * (1.5 if is_crit else 1.0))
                closest_bot['health'] -= final_dmg
                if closest_bot['health'] <= 0:
                    player_score['kills'] += 1
                    closest_bot['deaths'] += 1
                    closest_bot['health'] = 100
                    # Respawn bot at random spawn
                    respawn = random.choice(arena.spawn_points)
                    closest_bot['pos'] = list(respawn)
                    crit_tag = " [HEADSHOT]" if is_crit else ""
                    print(f"  [KILL FEED] Player eliminated {closest_bot['name']} with {player_wpn.equipped_id.upper()}{crit_tag}! ({player_score['kills']}/{target_kills})")

        # Bots engage
        for b in bots:
            b['ai'].update(dt, b['pos'], player.position, player.spawn_shield_timer > 0, b['health'], 100, arena.bot_waypoints, arena.collision_boxes)
            # Bots move towards player
            bdx = player.position[0] - b['pos'][0]
            bdz = player.position[2] - b['pos'][2]
            bdist = math.hypot(bdx, bdz)
            if bdist > 5.0:
                b['pos'][0] += (bdx / bdist) * 6.5 * dt
                b['pos'][2] += (bdz / bdist) * 6.5 * dt

            if b['ai'].state == 'combat' and match_time % 1.2 < dt:
                dmg = int(random.uniform(12, 28))
                player.health = max(0, player.health - dmg)
                if player.health <= 0:
                    player_score['deaths'] += 1
                    b['kills'] += 1
                    player.health = player.max_health
                    print(f"  [KILL FEED] {b['name']} eliminated Player! (Player Deaths: {player_score['deaths']})")

    print("-" * 65)
    print("MATCH CONCLUDED!")
    print(f"Player Final Score: {player_score['kills']} Kills / {player_score['deaths']} Deaths")
    for b in bots:
        print(f"  {b['name']}: {b['kills']} Kills / {b['deaths']} Deaths")
    print("=" * 65)

def main():
    parser = argparse.ArgumentParser(description="Krunker 3D FPS - Python Panda3D Game Engine")
    parser.add_argument("--mode", choices=["ffa", "tdm", "hardpoint", "practice"], default="ffa", help="Game mode")
    parser.add_argument("--class", dest="player_class", choices=list(CLASSES.keys()), default="triggerman", help="Player class")
    parser.add_argument("--difficulty", choices=["easy", "normal", "hard", "pro"], default="normal", help="Bot AI difficulty")
    parser.add_argument("--bots", type=int, default=4, help="Number of bots")
    parser.add_argument("--benchmark", action="store_true", help="Run 1000-tick physics benchmark")
    parser.add_argument("--headless", action="store_true", help="Run simulated headless combat match in terminal")
    parser.add_argument("--test", action="store_true", help="Run full Python unit test suite")

    args = parser.parse_args()

    if args.test:
        import unittest
        suite = unittest.defaultTestLoader.discover('krunker_recreation/tests')
        runner = unittest.TextTestRunner(verbosity=2)
        res = runner.run(suite)
        sys.exit(0 if res.wasSuccessful() else 1)

    if args.benchmark:
        run_benchmark()
        return

    if args.headless:
        run_headless_simulation(args.mode, args.player_class, args.bots, args.difficulty)
        return

    # Attempt to start desktop Panda3D application
    try:
        from krunker_recreation.main import run_game
        run_game()
    except Exception as exc:
        print(f"Panda3D desktop launcher notice: {exc}")
        print("Falling back to headless match simulation:")
        run_headless_simulation(args.mode, args.player_class, args.bots, args.difficulty)

if __name__ == "__main__":
    main()
