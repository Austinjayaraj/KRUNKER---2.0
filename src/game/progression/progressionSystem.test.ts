import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_USER_STATS,
  awardMatchXp,
  calculateKdRatio,
  calculateAccuracy,
  getXpRequiredForLevel,
} from './progressionSystem';

test('getXpRequiredForLevel scales progressively', () => {
  const lvl1 = getXpRequiredForLevel(1);
  const lvl2 = getXpRequiredForLevel(2);
  const lvl3 = getXpRequiredForLevel(3);

  assert.equal(lvl1, 1000);
  assert.ok(lvl2 > lvl1);
  assert.ok(lvl3 > lvl2);
});

test('awardMatchXp adds XP and handles level-ups', () => {
  const initial = { ...DEFAULT_USER_STATS, level: 1, xp: 800 };
  const res = awardMatchXp(initial, 5, 2, true);

  // xp gained = 5*100 + 2*50 + 500 = 1100
  // total xp = 800 + 1100 = 1900
  // lvl 1 needs 1000 => level 2 with 900 xp remaining
  assert.equal(res.xpGained, 1100);
  assert.equal(res.didLevelUp, true);
  assert.equal(res.updatedStats.level, 2);
  assert.equal(res.updatedStats.totalKills, 5);
  assert.equal(res.updatedStats.headshots, 2);
  assert.equal(res.updatedStats.matchesWon, 1);
});

test('calculateKdRatio and calculateAccuracy handle edge cases', () => {
  assert.equal(calculateKdRatio(10, 0), 10);
  assert.equal(calculateKdRatio(15, 5), 3);
  assert.equal(calculateAccuracy(0, 0), 0);
  assert.equal(calculateAccuracy(25, 100), 25);
});
