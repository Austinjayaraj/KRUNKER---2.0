import test from 'node:test';
import assert from 'node:assert/strict';
import {
  WEAPON_REGISTRY,
  CLASS_REGISTRY,
  calculateHitDamage,
  consumeWeaponAmmo,
  calculateReload,
} from './weaponConfig';

test('all 8 classes exist and have valid primary weapons', () => {
  const classes = Object.values(CLASS_REGISTRY);
  assert.equal(classes.length, 8);
  for (const c of classes) {
    assert.ok(WEAPON_REGISTRY[c.primaryWeapon], `Primary weapon ${c.primaryWeapon} for ${c.name} must exist`);
    assert.ok(c.maxHealth > 0);
    assert.ok(c.speedMultiplier > 0);
  }
});

test('calculateHitDamage applies headshot multiplier accurately', () => {
  const sniper = WEAPON_REGISTRY.sniper_rifle;
  const bodyDmg = calculateHitDamage(sniper, false);
  const headDmg = calculateHitDamage(sniper, true);

  assert.equal(bodyDmg, 100);
  assert.equal(headDmg, 175);
});

test('consumeWeaponAmmo correctly decrements magazine', () => {
  const empty = consumeWeaponAmmo(0, 30);
  assert.equal(empty.canShoot, false);
  assert.equal(empty.newMag, 0);

  const shot = consumeWeaponAmmo(30, 90);
  assert.equal(shot.canShoot, true);
  assert.equal(shot.newMag, 29);
  assert.equal(shot.newReserve, 90);
});

test('calculateReload correctly fills magazine from reserve ammo', () => {
  // Partial reload with ample reserve
  const res1 = calculateReload(10, 90, 30);
  assert.equal(res1.newMag, 30);
  assert.equal(res1.newReserve, 70);

  // Reload with scarce reserve
  const res2 = calculateReload(10, 5, 30);
  assert.equal(res2.newMag, 15);
  assert.equal(res2.newReserve, 0);

  // Full mag reload does nothing
  const res3 = calculateReload(30, 50, 30);
  assert.equal(res3.newMag, 30);
  assert.equal(res3.newReserve, 50);
});
