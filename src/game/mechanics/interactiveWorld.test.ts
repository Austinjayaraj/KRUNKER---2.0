import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialTacticalState,
  stepTacticalTimers,
  registerComboKill,
  tryActivateDash,
  tryThrowGrenade,
  trySwingMelee,
  openSupplyCrate,
  hackSentryTurret,
  checkTeleporterTrigger,
} from './interactiveWorld';
import {
  InteractiveSupplyCrate,
  InteractiveTurret,
  InteractiveTeleporter,
} from '../types';

test('tactical dash, grenade, and melee enforce cooldowns and tick down cleanly', () => {
  let state = createInitialTacticalState();

  const dashRes = tryActivateDash(state);
  assert.equal(dashRes.activated, true);
  assert.equal(dashRes.nextState.dashCooldown, 3.5);

  const dashBlocked = tryActivateDash(dashRes.nextState);
  assert.equal(dashBlocked.activated, false);

  const grenRes = tryThrowGrenade(dashRes.nextState);
  assert.equal(grenRes.activated, true);
  assert.equal(grenRes.nextState.grenadeCooldown, 5.5);

  const meleeRes = trySwingMelee(grenRes.nextState);
  assert.equal(meleeRes.activated, true);
  assert.equal(meleeRes.nextState.meleeCooldown, 0.75);

  // Tick timers by 1.0s (clamped per call to 0.1s so 10 steps = 1.0s)
  state = meleeRes.nextState;
  for (let i = 0; i < 10; i++) {
    state = stepTacticalTimers(state, 0.1);
  }
  assert.equal(state.meleeCooldown, 0);
  assert.ok(state.dashCooldown < 2.6);
});

test('registerComboKill increments combo multiplier and shaves ability cooldowns', () => {
  let state = createInitialTacticalState();
  state.dashCooldown = 2.0;

  const first = registerComboKill(state);
  assert.equal(first.nextState.comboCount, 1);
  assert.equal(first.scoreMultiplier, 1.0);
  assert.equal(first.nextState.dashCooldown, 1.25);

  const second = registerComboKill(first.nextState);
  assert.equal(second.nextState.comboCount, 2);
  assert.equal(second.scoreMultiplier, 1.25);
});

test('openSupplyCrate grants overdrive, 50 overshield, and resets ability cooldowns', () => {
  const crate: InteractiveSupplyCrate = {
    id: 'crate_1',
    label: 'Omega Supply Cache',
    position: { x: 0, y: 0, z: 0 },
    isAvailable: true,
    respawnTimer: 0,
  };
  const state = createInitialTacticalState();
  state.dashCooldown = 3.0;

  const res = openSupplyCrate(crate, state);
  assert.equal(res.opened, true);
  assert.equal(res.updatedCrate.isAvailable, false);
  assert.equal(res.updatedTactical.overshield, 50);
  assert.equal(res.updatedTactical.overdriveTimer, 12.0);
  assert.equal(res.updatedTactical.dashCooldown, 0);
});

test('hackSentryTurret switches turret ownership to player and sets active timer', () => {
  const turret: InteractiveTurret = {
    id: 'turret_1',
    label: 'North Plaza Auto-Turret',
    position: { x: 10, y: 0, z: -10 },
    owner: 'neutral',
    activeTimer: 0,
    fireCooldown: 0,
    yaw: 0,
  };
  const res = hackSentryTurret(turret);
  assert.equal(res.hacked, true);
  assert.equal(res.updatedTurret.owner, 'player');
  assert.equal(res.updatedTurret.activeTimer, 35.0);
});

test('checkTeleporterTrigger warps player to linked portal and sets pair cooldown', () => {
  const portals: InteractiveTeleporter[] = [
    {
      id: 'tp_a',
      pairId: 'tp_b',
      label: 'Cyan North Stargate',
      position: { x: -20, y: 0, z: -20 },
      targetPosition: { x: 20, y: 6, z: 20 },
      colorHex: 0x06b6d4,
      cooldown: 0,
    },
    {
      id: 'tp_b',
      pairId: 'tp_a',
      label: 'Magenta South Stargate',
      position: { x: 20, y: 6, z: 20 },
      targetPosition: { x: -20, y: 0, z: -20 },
      colorHex: 0xec4899,
      cooldown: 0,
    },
  ];

  const warp = checkTeleporterTrigger({ x: -19.5, y: 0.5, z: -20.2 }, portals);
  assert.equal(warp.triggered, true);
  assert.deepEqual(warp.destination, { x: 20, y: 6.5, z: 20 });
  assert.equal(warp.updatedTeleporters[0].cooldown, 3.0);
  assert.equal(warp.updatedTeleporters[1].cooldown, 3.0);
});
