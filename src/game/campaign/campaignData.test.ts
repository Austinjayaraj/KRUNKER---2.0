import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_LEVELS_LIST, ENEMY_ARCHETYPE_REGISTRY } from './campaignData';

test('CAMPAIGN_LEVELS_LIST defines all 15 playable levels sequentially', () => {
  assert.equal(CAMPAIGN_LEVELS_LIST.length, 15);
  for (let i = 0; i < 15; i++) {
    const lvl = CAMPAIGN_LEVELS_LIST[i];
    assert.equal(lvl.levelNumber, i + 1);
    assert.ok(lvl.name.length > 0);
    assert.ok(lvl.enemyCount >= 5);
    assert.equal(lvl.enemyComposition.length, lvl.enemyCount);
    assert.ok(lvl.rewards.xp > 0);
    assert.ok(lvl.rewards.coins > 0);
  }
});

test('ENEMY_ARCHETYPE_REGISTRY contains all 6 special enemy types', () => {
  const keys = Object.keys(ENEMY_ARCHETYPE_REGISTRY);
  assert.deepEqual(keys.sort(), [
    'boss_enemy',
    'elite_soldier',
    'fast_runner',
    'heavy_soldier',
    'sniper_bot',
    'standard_soldier',
  ]);
  assert.ok(ENEMY_ARCHETYPE_REGISTRY.boss_enemy.health > ENEMY_ARCHETYPE_REGISTRY.heavy_soldier.health);
  assert.ok(ENEMY_ARCHETYPE_REGISTRY.fast_runner.speedMultiplier > 1.2);
});
