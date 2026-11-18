import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyAccelerate,
  applyFriction,
  checkAABBIntersection,
  resolveMovementCollisions,
  Box3Like,
} from './movementMath';

test('applyAccelerate accelerates in wish direction', () => {
  const currentVel = { x: 0, y: 0, z: 0 };
  const wishDir = { x: 1, y: 0, z: 0 };
  const wishSpeed = 10;
  const accel = 5;
  const dt = 0.1;

  const nextVel = applyAccelerate(currentVel, wishDir, wishSpeed, accel, dt);
  assert.ok(nextVel.x > 0);
  assert.equal(nextVel.y, 0);
  assert.equal(nextVel.z, 0);
});

test('applyFriction reduces horizontal velocity', () => {
  const currentVel = { x: 10, y: 0, z: 5 };
  const friction = 2;
  const dt = 0.1;

  const slowVel = applyFriction(currentVel, friction, dt);
  const origSpeed = Math.hypot(currentVel.x, currentVel.z);
  const newSpeed = Math.hypot(slowVel.x, slowVel.z);

  assert.ok(newSpeed < origSpeed);
  assert.ok(newSpeed > 0);
});

test('checkAABBIntersection identifies intersecting and separated boxes', () => {
  const boxA: Box3Like = {
    min: { x: 0, y: 0, z: 0 },
    max: { x: 2, y: 2, z: 2 },
  };

  const boxB: Box3Like = {
    min: { x: 1, y: 1, z: 1 },
    max: { x: 3, y: 3, z: 3 },
  };

  const boxC: Box3Like = {
    min: { x: 5, y: 5, z: 5 },
    max: { x: 7, y: 7, z: 7 },
  };

  assert.equal(checkAABBIntersection(boxA, boxB), true);
  assert.equal(checkAABBIntersection(boxA, boxC), false);
});

test('resolveMovementCollisions lands player on floor obstacle', () => {
  const startPos = { x: 0, y: 5, z: 0 };
  const vel = { x: 0, y: -20, z: 0 };
  const obstacles: Box3Like[] = [
    {
      min: { x: -5, y: 0, z: -5 },
      max: { x: 5, y: 2, z: 5 },
    },
  ];

  const res = resolveMovementCollisions(startPos, vel, 0.2, 0.5, 2.0, obstacles);
  assert.ok(res.finalPos.y >= 2.0);
  assert.equal(res.onGround, true);
  assert.equal(res.finalVel.y, 0);
});
