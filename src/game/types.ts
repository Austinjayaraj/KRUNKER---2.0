export type GameModeType = 'ffa' | 'tdm' | 'hardpoint' | 'parkour' | 'campaign';

export type BotDifficulty = 'easy' | 'normal' | 'hard' | 'pro';

export type WeaponId = 
  | 'assault_rifle' 
  | 'sniper_rifle' 
  | 'smg' 
  | 'shotgun' 
  | 'revolver' 
  | 'semi_auto' 
  | 'rocket_launcher' 
  | 'knife';

export type ClassId = 
  | 'triggerman' 
  | 'hunter' 
  | 'run_n_gun' 
  | 'vince' 
  | 'detective' 
  | 'marksman' 
  | 'rocketeer' 
  | 'runner';

export interface WeaponData {
  id: WeaponId;
  name: string;
  category: 'primary' | 'secondary' | 'melee';
  damage: number;
  headshotMultiplier: number;
  fireRateRps: number; // rounds per second
  magazineSize: number;
  maxReserveAmmo: number;
  reloadTimeSec: number;
  recoilPitch: number;
  spreadAngle: number; // in radians
  pelletsCount?: number; // for shotgun
  isAutomatic: boolean;
  isScoped: boolean;
  scopeZoomFov: number; // e.g. 30
  isProjectile?: boolean;
  projectileSpeed?: number;
  explosionRadius?: number;
  modelColor: string;
}

export interface PlayerClassData {
  id: ClassId;
  name: string;
  role: string;
  primaryWeapon: WeaponId;
  secondaryWeapon?: WeaponId;
  maxHealth: number;
  speedMultiplier: number;
  jumpMultiplier: number;
  description: string;
  icon: string;
  color: string;
}

export interface KillFeedEntry {
  id: string;
  killerName: string;
  killerTeam?: 'blue' | 'red' | 'ffa';
  victimName: string;
  victimTeam?: 'blue' | 'red' | 'ffa';
  weaponName: string;
  isHeadshot: boolean;
  timestamp: number;
}

export interface PlayerScoreEntry {
  id: string;
  name: string;
  team: 'blue' | 'red' | 'ffa';
  isBot: boolean;
  kills: number;
  deaths: number;
  score: number;
  ping: number;
}

export type WeaponSkinId = 'tactical' | 'cyber' | 'gold' | 'camo' | 'hyperbeast';

export type MapThemeId = 'cyberpunk' | 'military' | 'sunset_dune' | 'high_tech';

export interface InteractivePickup {
  id: string;
  type: 'health' | 'ammo';
  position: { x: number; y: number; z: number };
  respawnTimer: number;
  isAvailable: boolean;
}

export interface InteractiveJumpPad {
  id: string;
  position: { x: number; y: number; z: number };
  boostVelocity: number;
}

export interface ExplosiveBarrel {
  id: string;
  position: { x: number; y: number; z: number };
  health: number;
  isExploded: boolean;
}

export interface InteractiveTeleporter {
  id: string;
  pairId: string;
  label: string;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  colorHex: number;
  cooldown: number;
}

export interface InteractiveTurret {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  owner: 'neutral' | 'player' | 'enemy';
  activeTimer: number;
  fireCooldown: number;
  yaw: number;
}

export interface InteractiveSupplyCrate {
  id: string;
  label: string;
  position: { x: number; y: number; z: number };
  isAvailable: boolean;
  respawnTimer: number;
}

export interface DestructibleCrate {
  id: string;
  position: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  respawnTimer: number;
}

export interface TargetDrone {
  id: string;
  basePosition: { x: number; y: number; z: number };
  position: { x: number; y: number; z: number };
  health: number;
  maxHealth: number;
  isDestroyed: boolean;
  respawnTimer: number;
  phase: number;
}

export interface PlayerTacticalState {
  dashCooldown: number;
  dashMaxCooldown: number;
  isDashing: boolean;
  grenadeCooldown: number;
  grenadeMaxCooldown: number;
  grappleCooldown: number;
  grappleMaxCooldown: number;
  isGrappling: boolean;
  grappleTarget: { x: number; y: number; z: number } | null;
  meleeCooldown: number;
  meleeMaxCooldown: number;
  isMeleeSwinging: boolean;
  overdriveTimer: number;
  overshield: number;
  comboCount: number;
  comboTimer: number;
  nearbyInteractableLabel: string | null;
  grappleAimReady: boolean;
}

export type CrosshairStyle = 'cross' | 'dot' | 'circle_dot' | 'chevron' | 't_post';

export interface DamageNumber {
  id: string;
  damage: number;
  isHeadshot: boolean;
  worldPos: { x: number; y: number; z: number };
  screenPos?: { x: number; y: number };
  lifetime: number;
  maxLifetime: number;
}

export interface DamageIndicator {
  id: string;
  angle: number; // in radians relative to player camera yaw
  timestamp: number;
}

export interface KillstreakBanner {
  id: string;
  title: string;
  subtitle: string;
  tier: 'double' | 'triple' | 'streak3' | 'streak5' | 'spree';
  timestamp: number;
}

export interface GameSettings {
  mouseSensitivity: number;
  fov: number;
  invertY: boolean;
  masterVolume: number;
  sfxVolume: number;
  musicVolume: number;
  crosshairColor: string;
  crosshairSize: number;
  crosshairGap: number;
  crosshairDot: boolean;
  crosshairStyle: CrosshairStyle;
  showDamageNumbers: boolean;
  showFps: boolean;
  showMinimap: boolean;
  weaponSkin: WeaponSkinId;
  mapTheme: MapThemeId;
  graphicsQuality: 'low' | 'medium' | 'high';
}

export interface UserStats {
  level: number;
  xp: number;
  xpToNextLevel: number;
  totalKills: number;
  totalDeaths: number;
  headshots: number;
  shotsFired: number;
  shotsHit: number;
  matchesPlayed: number;
  matchesWon: number;
  unlockedSkins: WeaponSkinId[];
}
