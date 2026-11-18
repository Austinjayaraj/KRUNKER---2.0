import { WeaponData, WeaponId, PlayerClassData, ClassId } from '../types';

export const WEAPON_REGISTRY: Record<WeaponId, WeaponData> = {
  assault_rifle: {
    id: 'assault_rifle',
    name: 'Assault Rifle',
    category: 'primary',
    damage: 23,
    headshotMultiplier: 1.5,
    fireRateRps: 9.5, // ~105ms interval
    magazineSize: 30,
    maxReserveAmmo: 90,
    reloadTimeSec: 1.2,
    recoilPitch: 0.045,
    spreadAngle: 0.018,
    isAutomatic: true,
    isScoped: false,
    scopeZoomFov: 55,
    modelColor: '#2b2d42',
  },
  sniper_rifle: {
    id: 'sniper_rifle',
    name: 'Sniper Rifle',
    category: 'primary',
    damage: 100,
    headshotMultiplier: 1.75, // 175 headshot = instant kill on standard 100hp
    fireRateRps: 1.1, // bolt action
    magazineSize: 3,
    maxReserveAmmo: 18,
    reloadTimeSec: 1.8,
    recoilPitch: 0.16,
    spreadAngle: 0.002, // razor sharp when scoped
    isAutomatic: false,
    isScoped: true,
    scopeZoomFov: 24, // strong zoom
    modelColor: '#1d3557',
  },
  smg: {
    id: 'smg',
    name: 'Submachine Gun',
    category: 'primary',
    damage: 18,
    headshotMultiplier: 1.4,
    fireRateRps: 13.5, // fast fire rate
    magazineSize: 34,
    maxReserveAmmo: 102,
    reloadTimeSec: 1.1,
    recoilPitch: 0.035,
    spreadAngle: 0.03,
    isAutomatic: true,
    isScoped: false,
    scopeZoomFov: 58,
    modelColor: '#457b9d',
  },
  shotgun: {
    id: 'shotgun',
    name: 'Shotgun',
    category: 'primary',
    damage: 16, // per pellet
    headshotMultiplier: 1.4,
    fireRateRps: 1.6,
    magazineSize: 4,
    maxReserveAmmo: 20,
    reloadTimeSec: 1.6,
    recoilPitch: 0.14,
    spreadAngle: 0.08,
    pelletsCount: 7, // 7 * 16 = 112 dmg point blank
    isAutomatic: false,
    isScoped: false,
    scopeZoomFov: 62,
    modelColor: '#a8dadc',
  },
  revolver: {
    id: 'revolver',
    name: 'Revolver',
    category: 'secondary',
    damage: 66,
    headshotMultiplier: 1.5, // 99 dmg headshot
    fireRateRps: 2.4,
    magazineSize: 6,
    maxReserveAmmo: 36,
    reloadTimeSec: 1.4,
    recoilPitch: 0.1,
    spreadAngle: 0.008,
    isAutomatic: false,
    isScoped: false,
    scopeZoomFov: 60,
    modelColor: '#d62828',
  },
  semi_auto: {
    id: 'semi_auto',
    name: 'Semi-Auto Rifle',
    category: 'primary',
    damage: 34,
    headshotMultiplier: 1.6,
    fireRateRps: 4.5,
    magazineSize: 10,
    maxReserveAmmo: 40,
    reloadTimeSec: 1.3,
    recoilPitch: 0.065,
    spreadAngle: 0.012,
    isAutomatic: false,
    isScoped: false,
    scopeZoomFov: 48,
    modelColor: '#f77f00',
  },
  rocket_launcher: {
    id: 'rocket_launcher',
    name: 'Rocket Launcher',
    category: 'primary',
    damage: 90,
    headshotMultiplier: 1.0,
    fireRateRps: 0.9,
    magazineSize: 2,
    maxReserveAmmo: 10,
    reloadTimeSec: 2.0,
    recoilPitch: 0.18,
    spreadAngle: 0.005,
    isAutomatic: false,
    isScoped: false,
    scopeZoomFov: 60,
    isProjectile: true,
    projectileSpeed: 38.0,
    explosionRadius: 5.5,
    modelColor: '#003049',
  },
  knife: {
    id: 'knife',
    name: 'Combat Knife',
    category: 'melee',
    damage: 60,
    headshotMultiplier: 1.5,
    fireRateRps: 2.2,
    magazineSize: 1,
    maxReserveAmmo: 0,
    reloadTimeSec: 0.1,
    recoilPitch: 0.02,
    spreadAngle: 0,
    isAutomatic: false,
    isScoped: false,
    scopeZoomFov: 70,
    modelColor: '#9e2a2b',
  },
};

export const CLASS_REGISTRY: Record<ClassId, PlayerClassData> = {
  triggerman: {
    id: 'triggerman',
    name: 'Triggerman',
    role: 'Assault Specialist',
    primaryWeapon: 'assault_rifle',
    secondaryWeapon: 'revolver',
    maxHealth: 100,
    speedMultiplier: 1.0,
    jumpMultiplier: 1.0,
    description: 'Balanced frontline combatant with dependable automatic firepower.',
    icon: 'Crosshair',
    color: '#3b82f6',
  },
  hunter: {
    id: 'hunter',
    name: 'Hunter',
    role: 'Sniper Assassin',
    primaryWeapon: 'sniper_rifle',
    secondaryWeapon: 'revolver',
    maxHealth: 60,
    speedMultiplier: 1.05,
    jumpMultiplier: 1.05,
    description: 'High-risk glass cannon capable of 1-shot headshot eliminations.',
    icon: 'Target',
    color: '#ef4444',
  },
  run_n_gun: {
    id: 'run_n_gun',
    name: 'Run N Gun',
    role: 'Agile Flanker',
    primaryWeapon: 'smg',
    secondaryWeapon: 'revolver',
    maxHealth: 100,
    speedMultiplier: 1.2,
    jumpMultiplier: 1.1,
    description: 'Extreme speed and high rate of fire designed for slide-hop masters.',
    icon: 'Zap',
    color: '#eab308',
  },
  vince: {
    id: 'vince',
    name: 'Vince',
    role: 'Shotgun Breacher',
    primaryWeapon: 'shotgun',
    secondaryWeapon: 'revolver',
    maxHealth: 90,
    speedMultiplier: 1.1,
    jumpMultiplier: 1.15,
    description: 'Devastating close-range scatter gun with airborne shotgun boost jumps.',
    icon: 'Flame',
    color: '#f97316',
  },
  detective: {
    id: 'detective',
    name: 'Detective',
    role: 'Handgun Gunslinger',
    primaryWeapon: 'revolver',
    maxHealth: 100,
    speedMultiplier: 1.05,
    jumpMultiplier: 1.05,
    description: 'High-damage precision hand cannon rewarded by accurate headshots.',
    icon: 'Shield',
    color: '#a855f7',
  },
  marksman: {
    id: 'marksman',
    name: 'Marksman',
    role: 'Tactical Marksman',
    primaryWeapon: 'semi_auto',
    secondaryWeapon: 'revolver',
    maxHealth: 90,
    speedMultiplier: 1.0,
    jumpMultiplier: 1.0,
    description: 'Rhythmic semi-automatic tapping for medium and long range duels.',
    icon: 'Compass',
    color: '#10b981',
  },
  rocketeer: {
    id: 'rocketeer',
    name: 'Rocketeer',
    role: 'Demolition Heavy',
    primaryWeapon: 'rocket_launcher',
    secondaryWeapon: 'revolver',
    maxHealth: 130,
    speedMultiplier: 0.9,
    jumpMultiplier: 1.0,
    description: 'Heavy armor with splash-damage rockets and explosive rocket jumps.',
    icon: 'Bomb',
    color: '#06b6d4',
  },
  runner: {
    id: 'runner',
    name: 'Runner',
    role: 'Speed Blade',
    primaryWeapon: 'knife',
    secondaryWeapon: 'revolver',
    maxHealth: 120,
    speedMultiplier: 1.3,
    jumpMultiplier: 1.2,
    description: 'Maximum velocity knife fighter that slices through enemy backlines.',
    icon: 'Wind',
    color: '#ec4899',
  },
};

/**
 * Calculates damage dealt given base weapon and headshot status.
 */
export function calculateHitDamage(weapon: WeaponData, isHeadshot: boolean): number {
  if (isHeadshot) {
    return Math.round(weapon.damage * weapon.headshotMultiplier);
  }
  return weapon.damage;
}

/**
 * Consumes ammo from current magazine and returns updated counts.
 */
export function consumeWeaponAmmo(
  currentMag: number,
  reserveAmmo: number
): { canShoot: boolean; newMag: number; newReserve: number } {
  if (currentMag <= 0) {
    return { canShoot: false, newMag: currentMag, newReserve: reserveAmmo };
  }
  return {
    canShoot: true,
    newMag: currentMag - 1,
    newReserve: reserveAmmo,
  };
}

/**
 * Calculates reloaded magazine and remaining reserve.
 */
export function calculateReload(
  currentMag: number,
  reserveAmmo: number,
  maxMagSize: number
): { newMag: number; newReserve: number } {
  const needed = maxMagSize - currentMag;
  if (needed <= 0 || reserveAmmo <= 0) {
    return { newMag: currentMag, newReserve: reserveAmmo };
  }
  const toLoad = Math.min(needed, reserveAmmo);
  return {
    newMag: currentMag + toLoad,
    newReserve: reserveAmmo - toLoad,
  };
}
