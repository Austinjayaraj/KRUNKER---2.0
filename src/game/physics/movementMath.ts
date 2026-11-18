export interface Vector3Like {
  x: number;
  y: number;
  z: number;
}

export interface Box3Like {
  min: Vector3Like;
  max: Vector3Like;
}

export interface MovementConfig {
  maxGroundSpeed: number;
  groundAcceleration: number;
  airAcceleration: number;
  groundFriction: number;
  slideFriction: number;
  slideSpeedBoost: number;
  jumpVelocity: number;
  gravity: number;
  crouchHeight: number;
  standHeight: number;
  playerRadius: number;
}

export const DEFAULT_MOVEMENT_CONFIG: MovementConfig = {
  maxGroundSpeed: 17.0, // fast krunker pace
  groundAcceleration: 110.0,
  airAcceleration: 35.0,
  groundFriction: 8.5,
  slideFriction: 1.2, // very low friction during slide = huge glide!
  slideSpeedBoost: 1.25, // initial boost when initiating slide
  jumpVelocity: 14.5,
  gravity: 34.0,
  crouchHeight: 1.1,
  standHeight: 2.0,
  playerRadius: 0.55,
};

/**
 * Applies Quake/Source/Krunker-style acceleration to horizontal velocity.
 */
export function applyAccelerate(
  currentVel: Vector3Like,
  wishDir: Vector3Like,
  wishSpeed: number,
  accel: number,
  deltaTime: number
): Vector3Like {
  // Projection of current horizontal velocity onto wish direction
  const currentSpeedInWishDir = currentVel.x * wishDir.x + currentVel.z * wishDir.z;
  const addSpeed = wishSpeed - currentSpeedInWishDir;
  
  if (addSpeed <= 0) {
    return { ...currentVel };
  }

  const accelSpeed = Math.min(accel * wishSpeed * deltaTime, addSpeed);

  return {
    x: currentVel.x + wishDir.x * accelSpeed,
    y: currentVel.y,
    z: currentVel.z + wishDir.z * accelSpeed,
  };
}

/**
 * Applies friction to horizontal velocity.
 */
export function applyFriction(
  currentVel: Vector3Like,
  friction: number,
  deltaTime: number
): Vector3Like {
  const horizontalSpeed = Math.sqrt(currentVel.x * currentVel.x + currentVel.z * currentVel.z);
  if (horizontalSpeed < 0.001) {
    return { x: 0, y: currentVel.y, z: 0 };
  }

  const drop = horizontalSpeed * friction * deltaTime;
  const newSpeed = Math.max(0, horizontalSpeed - drop);
  const factor = newSpeed / horizontalSpeed;

  return {
    x: currentVel.x * factor,
    y: currentVel.y,
    z: currentVel.z * factor,
  };
}

/**
 * Checks whether two AABBs intersect.
 */
export function checkAABBIntersection(boxA: Box3Like, boxB: Box3Like): boolean {
  return (
    boxA.min.x <= boxB.max.x &&
    boxA.max.x >= boxB.min.x &&
    boxA.min.y <= boxB.max.y &&
    boxA.max.y >= boxB.min.y &&
    boxA.min.z <= boxB.max.z &&
    boxA.max.z >= boxB.min.z
  );
}

/**
 * Resolves player capsule/box movement against solid map obstacles.
 */
export function resolveMovementCollisions(
  startPos: Vector3Like,
  velocity: Vector3Like,
  deltaTime: number,
  playerRadius: number,
  playerHeight: number,
  obstacles: Box3Like[]
): { finalPos: Vector3Like; finalVel: Vector3Like; onGround: boolean } {
  let posX = startPos.x;
  let posY = startPos.y;
  let posZ = startPos.z;

  let velX = velocity.x;
  let velY = velocity.y;
  let velZ = velocity.z;

  let onGround = false;

  // 1. Move X axis
  const stepX = velX * deltaTime;
  posX += stepX;
  let playerBoxX: Box3Like = {
    min: { x: posX - playerRadius, y: posY, z: posZ - playerRadius },
    max: { x: posX + playerRadius, y: posY + playerHeight, z: posZ + playerRadius },
  };

  for (const obs of obstacles) {
    if (checkAABBIntersection(playerBoxX, obs)) {
      if (stepX > 0) {
        posX = obs.min.x - playerRadius - 0.001;
      } else if (stepX < 0) {
        posX = obs.max.x + playerRadius + 0.001;
      }
      velX = 0;
      break;
    }
  }

  // 2. Move Z axis
  const stepZ = velZ * deltaTime;
  posZ += stepZ;
  let playerBoxZ: Box3Like = {
    min: { x: posX - playerRadius, y: posY, z: posZ - playerRadius },
    max: { x: posX + playerRadius, y: posY + playerHeight, z: posZ + playerRadius },
  };

  for (const obs of obstacles) {
    if (checkAABBIntersection(playerBoxZ, obs)) {
      if (stepZ > 0) {
        posZ = obs.min.z - playerRadius - 0.001;
      } else if (stepZ < 0) {
        posZ = obs.max.z + playerRadius + 0.001;
      }
      velZ = 0;
      break;
    }
  }

  // 3. Move Y axis
  const stepY = velY * deltaTime;
  posY += stepY;
  let playerBoxY: Box3Like = {
    min: { x: posX - playerRadius, y: posY, z: posZ - playerRadius },
    max: { x: posX + playerRadius, y: posY + playerHeight, z: posZ + playerRadius },
  };

  for (const obs of obstacles) {
    if (checkAABBIntersection(playerBoxY, obs)) {
      if (stepY > 0) {
        // Hit ceiling
        posY = obs.min.y - playerHeight - 0.001;
        velY = 0;
      } else if (stepY < 0) {
        // Landed on floor/obstacle
        posY = obs.max.y + 0.001;
        velY = 0;
        onGround = true;
      }
      break;
    }
  }

  // Ground plane check (y = 0 default floor)
  if (posY <= 0) {
    posY = 0;
    velY = 0;
    onGround = true;
  }

  return {
    finalPos: { x: posX, y: posY, z: posZ },
    finalVel: { x: velX, y: velY, z: velZ },
    onGround,
  };
}
