import {
  InteractiveTeleporter,
  InteractiveTurret,
  InteractiveSupplyCrate,
  PlayerTacticalState,
} from '../types';

export const DEFAULT_TACTICAL_STATE: PlayerTacticalState = {
  dashCooldown: 0,
  dashMaxCooldown: 3.5,
  isDashing: false,
  grenadeCooldown: 0,
  grenadeMaxCooldown: 5.5,
  grappleCooldown: 0,
  grappleMaxCooldown: 4.0,
  isGrappling: false,
  grappleTarget: null,
  meleeCooldown: 0,
  meleeMaxCooldown: 0.75,
  isMeleeSwinging: false,
  overdriveTimer: 0,
  overshield: 0,
  comboCount: 0,
  comboTimer: 0,
  nearbyInteractableLabel: null,
  grappleAimReady: false,
};

export function createInitialTacticalState(): PlayerTacticalState {
  return { ...DEFAULT_TACTICAL_STATE };
}

export function stepTacticalTimers(
  state: PlayerTacticalState,
  dt: number
): PlayerTacticalState {
  const clampedDt = Math.max(0, Math.min(dt, 0.1));
  const nextComboTimer = Math.max(0, state.comboTimer - clampedDt);
  return {
    ...state,
    dashCooldown: Math.max(0, state.dashCooldown - clampedDt),
    grenadeCooldown: Math.max(0, state.grenadeCooldown - clampedDt),
    grappleCooldown: Math.max(0, state.grappleCooldown - clampedDt),
    meleeCooldown: Math.max(0, state.meleeCooldown - clampedDt),
    overdriveTimer: Math.max(0, state.overdriveTimer - clampedDt),
    comboTimer: nextComboTimer,
    comboCount: nextComboTimer <= 0 ? 0 : state.comboCount,
  };
}

export function registerComboKill(state: PlayerTacticalState): {
  nextState: PlayerTacticalState;
  scoreMultiplier: number;
} {
  const nextCombo = state.comboTimer > 0 ? state.comboCount + 1 : 1;
  const scoreMultiplier = Math.min(3.0, 1.0 + (nextCombo - 1) * 0.25);
  return {
    nextState: {
      ...state,
      comboCount: nextCombo,
      comboTimer: 5.0,
      // Kills shave 0.75s off active ability cooldowns for fast kinetic flow
      dashCooldown: Math.max(0, state.dashCooldown - 0.75),
      grappleCooldown: Math.max(0, state.grappleCooldown - 0.75),
    },
    scoreMultiplier,
  };
}

export function tryActivateDash(state: PlayerTacticalState): {
  activated: boolean;
  nextState: PlayerTacticalState;
} {
  if (state.dashCooldown > 0) {
    return { activated: false, nextState: state };
  }
  return {
    activated: true,
    nextState: {
      ...state,
      dashCooldown: state.dashMaxCooldown,
      isDashing: true,
    },
  };
}

export function tryThrowGrenade(state: PlayerTacticalState): {
  activated: boolean;
  nextState: PlayerTacticalState;
} {
  if (state.grenadeCooldown > 0) {
    return { activated: false, nextState: state };
  }
  return {
    activated: true,
    nextState: {
      ...state,
      grenadeCooldown: state.grenadeMaxCooldown,
    },
  };
}

export function trySwingMelee(state: PlayerTacticalState): {
  activated: boolean;
  nextState: PlayerTacticalState;
} {
  if (state.meleeCooldown > 0) {
    return { activated: false, nextState: state };
  }
  return {
    activated: true,
    nextState: {
      ...state,
      meleeCooldown: state.meleeMaxCooldown,
      isMeleeSwinging: true,
    },
  };
}

export function openSupplyCrate(
  crate: InteractiveSupplyCrate,
  tactical: PlayerTacticalState
): {
  opened: boolean;
  updatedCrate: InteractiveSupplyCrate;
  updatedTactical: PlayerTacticalState;
  rewardText: string;
} {
  if (!crate.isAvailable) {
    return {
      opened: false,
      updatedCrate: crate,
      updatedTactical: tactical,
      rewardText: '',
    };
  }
  return {
    opened: true,
    updatedCrate: {
      ...crate,
      isAvailable: false,
      respawnTimer: 22,
    },
    updatedTactical: {
      ...tactical,
      overdriveTimer: 12.0,
      overshield: 50,
      dashCooldown: 0,
      grenadeCooldown: 0,
    },
    rewardText: 'SUPPLY CACHE UNLOCKED · 2X OVERDRIVE + 50 ARMOR SHIELD',
  };
}

export function hackSentryTurret(turret: InteractiveTurret): {
  hacked: boolean;
  updatedTurret: InteractiveTurret;
  statusText: string;
} {
  if (turret.owner === 'player' && turret.activeTimer > 20) {
    return {
      hacked: false,
      updatedTurret: turret,
      statusText: '',
    };
  }
  return {
    hacked: true,
    updatedTurret: {
      ...turret,
      owner: 'player',
      activeTimer: 35.0,
      fireCooldown: 0.25,
    },
    statusText: `${turret.label.toUpperCase()} HACKED · ALLIED OVERWATCH ONLINE (35S)`,
  };
}

export function checkTeleporterTrigger(
  playerPos: { x: number; y: number; z: number },
  teleporters: InteractiveTeleporter[]
): {
  triggered: boolean;
  destination: { x: number; y: number; z: number } | null;
  portalLabel: string;
  updatedTeleporters: InteractiveTeleporter[];
} {
  for (let i = 0; i < teleporters.length; i++) {
    const tp = teleporters[i];
    if (tp.cooldown > 0) continue;
    const dist = Math.hypot(playerPos.x - tp.position.x, playerPos.z - tp.position.z);
    if (dist <= 2.1 && Math.abs(playerPos.y - tp.position.y) <= 2.5) {
      const updated = teleporters.map((item) =>
        item.id === tp.id || item.id === tp.pairId
          ? { ...item, cooldown: 3.0 }
          : item
      );
      return {
        triggered: true,
        destination: {
          x: tp.targetPosition.x,
          y: tp.targetPosition.y + 0.5,
          z: tp.targetPosition.z,
        },
        portalLabel: tp.label,
        updatedTeleporters: updated,
      };
    }
  }
  return {
    triggered: false,
    destination: null,
    portalLabel: '',
    updatedTeleporters: teleporters,
  };
}
