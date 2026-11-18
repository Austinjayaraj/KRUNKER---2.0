import { ClassId, WeaponId } from '../types';

export type EnemyArchetypeId =
  | 'standard_soldier'
  | 'fast_runner'
  | 'heavy_soldier'
  | 'sniper_bot'
  | 'elite_soldier'
  | 'boss_enemy';

export interface EnemyArchetypeConfig {
  id: EnemyArchetypeId;
  name: string;
  health: number;
  damageMultiplier: number;
  speedMultiplier: number;
  accuracyBonus: number;
  weaponId: WeaponId;
  colorHex: number;
  visorHex: number;
  scale: number;
  scoreValue: number;
}

export const ENEMY_ARCHETYPE_REGISTRY: Record<EnemyArchetypeId, EnemyArchetypeConfig> = {
  standard_soldier: {
    id: 'standard_soldier',
    name: 'Standard Soldier',
    health: 100,
    damageMultiplier: 1.0,
    speedMultiplier: 1.0,
    accuracyBonus: 0.0,
    weaponId: 'assault_rifle',
    colorHex: 0xef4444,
    visorHex: 0xfbbf24,
    scale: 1.0,
    scoreValue: 100,
  },
  fast_runner: {
    id: 'fast_runner',
    name: 'Fast Runner',
    health: 75,
    damageMultiplier: 0.85,
    speedMultiplier: 1.4,
    accuracyBonus: -0.04,
    weaponId: 'smg',
    colorHex: 0xf59e0b,
    visorHex: 0x38bdf8,
    scale: 0.92,
    scoreValue: 125,
  },
  heavy_soldier: {
    id: 'heavy_soldier',
    name: 'Heavy Soldier',
    health: 220,
    damageMultiplier: 1.35,
    speedMultiplier: 0.76,
    accuracyBonus: 0.05,
    weaponId: 'shotgun',
    colorHex: 0x7c3aed,
    visorHex: 0xf43f5e,
    scale: 1.24,
    scoreValue: 200,
  },
  sniper_bot: {
    id: 'sniper_bot',
    name: 'Sniper Bot',
    health: 80,
    damageMultiplier: 1.65,
    speedMultiplier: 0.88,
    accuracyBonus: 0.22,
    weaponId: 'sniper_rifle',
    colorHex: 0x06b6d4,
    visorHex: 0x22d3ee,
    scale: 0.96,
    scoreValue: 175,
  },
  elite_soldier: {
    id: 'elite_soldier',
    name: 'Elite Soldier',
    health: 185,
    damageMultiplier: 1.4,
    speedMultiplier: 1.2,
    accuracyBonus: 0.18,
    weaponId: 'assault_rifle',
    colorHex: 0xec4899,
    visorHex: 0xfef08a,
    scale: 1.14,
    scoreValue: 300,
  },
  boss_enemy: {
    id: 'boss_enemy',
    name: 'Apex Warlord Boss',
    health: 900,
    damageMultiplier: 1.85,
    speedMultiplier: 1.08,
    accuracyBonus: 0.25,
    weaponId: 'rocket_launcher',
    colorHex: 0xdc2626,
    visorHex: 0xfacc15,
    scale: 1.55,
    scoreValue: 1500,
  },
};

export interface InteractiveObjectivePoint {
  id: string;
  type: 'capture_zone' | 'defense_zone' | 'extraction_zone' | 'terminal';
  label: string;
  position: { x: number; y: number; z: number };
  radius: number;
  activated?: boolean;
}

export interface CampaignLevelDefinition {
  levelNumber: number;
  id: string;
  name: string;
  difficulty: 'Beginner' | 'Easy' | 'Normal' | 'Hard' | 'Expert' | 'Very Hard' | 'Extreme';
  botDifficultyKey: 'easy' | 'normal' | 'hard' | 'pro';
  mapId: 'training' | 'urban' | 'desert' | 'industrial';
  mapPreviewTitle: string;
  environmentTintHex: number;
  fogColorHex: number;
  enemyCount: number;
  waves: number;
  timeLimitSec: number;
  maxLives: number;
  recommendedWeapon: WeaponId;
  recommendedClass: ClassId;
  description: string;
  primaryObjectives: string[];
  secondaryObjectiveText: string;
  enemyIntelligence: string;
  enemyComposition: EnemyArchetypeId[];
  requiredHeadshots?: number;
  requiredElites?: number;
  requiredTerminals?: number;
  captureSecondsRequired?: number;
  isDefenseMission?: boolean;
  requiresExtraction?: boolean;
  requiresBossKill?: boolean;
  secondaryCriteria: {
    type: 'headshots' | 'max_deaths' | 'time_limit' | 'time_remaining' | 'accuracy' | 'defense_integrity' | 'streak';
    targetValue: number;
  };
  scoreTarget3Star: number;
  interactiveObjects: InteractiveObjectivePoint[];
  rewards: {
    xp: number;
    coins: number;
    weaponUnlock?: string;
    cosmeticReward: string;
  };
  unlockRequirementText: string;
}

export const CAMPAIGN_LEVELS_LIST: CampaignLevelDefinition[] = [
  {
    levelNumber: 1,
    id: 'level_01_training',
    name: 'TRAINING GROUNDS',
    difficulty: 'Beginner',
    botDifficultyKey: 'easy',
    mapId: 'training',
    mapPreviewTitle: 'Basic Training Arena',
    environmentTintHex: 0x38bdf8,
    fogColorHex: 0x0f172a,
    enemyCount: 5,
    waves: 1,
    timeLimitSec: 240,
    maxLives: 99,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Calibrate your movement, slide-hopping momentum, and precision aiming in the live-fire training compound.',
    primaryObjectives: [
      'Learn movement & slide-hop mechanics',
      'Learn aiming & recoil control',
      'Eliminate 5 training targets',
      'Complete the shooting tutorial',
    ],
    secondaryObjectiveText: 'Finish with at least 2 headshots',
    enemyIntelligence: '5 Automated Training Drones & Recruit Soldiers with low reaction speed.',
    enemyComposition: ['standard_soldier', 'standard_soldier', 'standard_soldier', 'standard_soldier', 'standard_soldier'],
    secondaryCriteria: { type: 'headshots', targetValue: 2 },
    scoreTarget3Star: 550,
    interactiveObjects: [],
    rewards: {
      xp: 250,
      coins: 100,
      weaponUnlock: 'Shotgun',
      cosmeticReward: 'Recruit Emblem',
    },
    unlockRequirementText: 'Unlocked at start of campaign',
  },
  {
    levelNumber: 2,
    id: 'level_02_urban',
    name: 'URBAN ASSAULT',
    difficulty: 'Easy',
    botDifficultyKey: 'easy',
    mapId: 'urban',
    mapPreviewTitle: 'Neo-Tokyo City Plaza',
    environmentTintHex: 0x60a5fa,
    fogColorHex: 0x090d16,
    enemyCount: 8,
    waves: 1,
    timeLimitSec: 210,
    maxLives: 5,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Hostile patrols have occupied the Neo-Tokyo transit sector. Clear the plaza and survive the engagement.',
    primaryObjectives: [
      'Eliminate 8 enemy bots',
      'Survive the encounter',
      'Learn basic urban cover combat',
    ],
    secondaryObjectiveText: 'Complete with 1 or fewer deaths',
    enemyIntelligence: '6 Standard Soldiers backed by 2 Fast Runners flanking along street lanes.',
    enemyComposition: [
      'standard_soldier', 'standard_soldier', 'standard_soldier', 'standard_soldier',
      'standard_soldier', 'standard_soldier', 'fast_runner', 'fast_runner',
    ],
    secondaryCriteria: { type: 'max_deaths', targetValue: 1 },
    scoreTarget3Star: 900,
    interactiveObjects: [],
    rewards: {
      xp: 350,
      coins: 150,
      weaponUnlock: 'Revolver',
      cosmeticReward: 'Cyber Neon Camo',
    },
    unlockRequirementText: 'Complete Level 1: Training Grounds',
  },
  {
    levelNumber: 3,
    id: 'level_03_desert',
    name: 'DESERT STRIKE',
    difficulty: 'Easy',
    botDifficultyKey: 'easy',
    mapId: 'desert',
    mapPreviewTitle: 'Sandstorm Military Outpost',
    environmentTintHex: 0xf59e0b,
    fogColorHex: 0x2a1f14,
    enemyCount: 10,
    waves: 2,
    timeLimitSec: 240,
    maxLives: 5,
    recommendedWeapon: 'semi_auto',
    recommendedClass: 'marksman',
    description: 'Push into the fortified desert outpost, neutralize the garrison, and secure the central radar zone.',
    primaryObjectives: [
      'Eliminate 10 enemy bots',
      'Capture the designated central outpost area',
    ],
    secondaryObjectiveText: 'Complete within 140 seconds',
    enemyIntelligence: 'Outpost garrison with 2 long-range Sniper Bots stationed on dune ridges.',
    enemyComposition: [
      'standard_soldier', 'standard_soldier', 'standard_soldier', 'standard_soldier', 'standard_soldier',
      'standard_soldier', 'standard_soldier', 'sniper_bot', 'sniper_bot', 'fast_runner',
    ],
    captureSecondsRequired: 6,
    secondaryCriteria: { type: 'time_limit', targetValue: 140 },
    scoreTarget3Star: 1200,
    interactiveObjects: [
      {
        id: 'desert_capture_zone',
        type: 'capture_zone',
        label: 'Outpost Radar Zone',
        position: { x: 0, y: 0.2, z: 0 },
        radius: 9.0,
      },
    ],
    rewards: {
      xp: 450,
      coins: 200,
      weaponUnlock: 'Semi-Auto Rifle',
      cosmeticReward: 'Desert Spec-Ops Camo',
    },
    unlockRequirementText: 'Complete Level 2: Urban Assault',
  },
  {
    levelNumber: 4,
    id: 'level_04_industrial',
    name: 'INDUSTRIAL WARZONE',
    difficulty: 'Normal',
    botDifficultyKey: 'normal',
    mapId: 'industrial',
    mapPreviewTitle: 'Cyber Foundry Warehouse',
    environmentTintHex: 0xf97316,
    fogColorHex: 0x18181b,
    enemyCount: 12,
    waves: 2,
    timeLimitSec: 240,
    maxLives: 4,
    recommendedWeapon: 'smg',
    recommendedClass: 'run_n_gun',
    description: 'Fight through the heavy industrial foundry catwalks, clear 12 hostiles, and reach the extraction beacon.',
    primaryObjectives: [
      'Eliminate 12 enemies',
      'Navigate through the warehouse',
      'Reach the extraction point',
    ],
    secondaryObjectiveText: 'Achieve at least 4 headshots',
    enemyIntelligence: 'Heavy Soldiers guarding warehouse choke points with Fast Runner patrols.',
    enemyComposition: [
      'standard_soldier', 'standard_soldier', 'standard_soldier', 'standard_soldier',
      'standard_soldier', 'standard_soldier', 'standard_soldier',
      'heavy_soldier', 'heavy_soldier', 'fast_runner', 'fast_runner', 'fast_runner',
    ],
    requiresExtraction: true,
    secondaryCriteria: { type: 'headshots', targetValue: 4 },
    scoreTarget3Star: 1500,
    interactiveObjects: [
      {
        id: 'warehouse_extraction',
        type: 'extraction_zone',
        label: 'Extraction Beacon',
        position: { x: 0, y: 0.2, z: -26 },
        radius: 8.5,
      },
    ],
    rewards: {
      xp: 550,
      coins: 250,
      cosmeticReward: 'Foundry Steel Badge',
    },
    unlockRequirementText: 'Complete Level 3: Desert Strike',
  },
  {
    levelNumber: 5,
    id: 'level_05_sniper',
    name: 'SNIPER CHALLENGE',
    difficulty: 'Normal',
    botDifficultyKey: 'normal',
    mapId: 'desert',
    mapPreviewTitle: 'Long-Range Canyon Overwatch',
    environmentTintHex: 0x38bdf8,
    fogColorHex: 0x0c1928,
    enemyCount: 8,
    waves: 1,
    timeLimitSec: 200,
    maxLives: 3,
    recommendedWeapon: 'sniper_rifle',
    recommendedClass: 'hunter',
    description: 'High-altitude counter-sniper operation. Eliminate 8 marksmen across the canyon with surgical headshot precision.',
    primaryObjectives: [
      'Eliminate 8 enemies',
      'Achieve at least 5 headshots',
    ],
    secondaryObjectiveText: 'Maintain at least 40% weapon accuracy',
    enemyIntelligence: '6 enemy Sniper Bots with high-powered optics occupying elevated sightlines.',
    enemyComposition: [
      'sniper_bot', 'sniper_bot', 'sniper_bot', 'sniper_bot',
      'sniper_bot', 'sniper_bot', 'standard_soldier', 'standard_soldier',
    ],
    requiredHeadshots: 5,
    secondaryCriteria: { type: 'accuracy', targetValue: 40 },
    scoreTarget3Star: 1350,
    interactiveObjects: [],
    rewards: {
      xp: 650,
      coins: 300,
      weaponUnlock: 'Hunter Sniper Mastery',
      cosmeticReward: 'Deadeye Reticle Pack',
    },
    unlockRequirementText: 'Complete Level 4: Industrial Warzone',
  },
  {
    levelNumber: 6,
    id: 'level_06_night',
    name: 'NIGHT RAID',
    difficulty: 'Normal',
    botDifficultyKey: 'normal',
    mapId: 'urban',
    mapPreviewTitle: 'Blackout Sector 09',
    environmentTintHex: 0x1e293b,
    fogColorHex: 0x020617,
    enemyCount: 15,
    waves: 2,
    timeLimitSec: 150,
    maxLives: 3,
    recommendedWeapon: 'smg',
    recommendedClass: 'run_n_gun',
    description: 'Execute a lightning raid under cover of darkness. Eliminate 15 targets before enemy reinforcements lock down the grid.',
    primaryObjectives: [
      'Eliminate 15 enemies',
      'Complete the mission within the 150s time limit',
    ],
    secondaryObjectiveText: 'Finish with at least 45 seconds remaining',
    enemyIntelligence: 'Night-vision patrols with rapid SMG Fast Runners.',
    enemyComposition: [
      ...Array(8).fill('standard_soldier'),
      ...Array(5).fill('fast_runner'),
      ...Array(2).fill('sniper_bot'),
    ],
    secondaryCriteria: { type: 'time_remaining', targetValue: 45 },
    scoreTarget3Star: 1850,
    interactiveObjects: [],
    rewards: {
      xp: 750,
      coins: 350,
      cosmeticReward: 'Nightstalker Visor',
    },
    unlockRequirementText: 'Complete Level 5: Sniper Challenge',
  },
  {
    levelNumber: 7,
    id: 'level_07_survival',
    name: 'SURVIVAL',
    difficulty: 'Hard',
    botDifficultyKey: 'hard',
    mapId: 'urban',
    mapPreviewTitle: 'Containment Arena',
    environmentTintHex: 0xf43f5e,
    fogColorHex: 0x1f0910,
    enemyCount: 15,
    waves: 5,
    timeLimitSec: 300,
    maxLives: 3,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Hold the central containment arena against 5 relentless enemy assault waves.',
    primaryObjectives: [
      'Survive 5 enemy waves',
      'Eliminate all enemies in each wave (15 total)',
    ],
    secondaryObjectiveText: 'Complete without losing more than 1 life',
    enemyIntelligence: '5 escalating waves mixing Fast Runners and armored Heavy Soldiers.',
    enemyComposition: [
      ...Array(6).fill('standard_soldier'),
      ...Array(5).fill('fast_runner'),
      ...Array(4).fill('heavy_soldier'),
    ],
    secondaryCriteria: { type: 'max_deaths', targetValue: 1 },
    scoreTarget3Star: 2000,
    interactiveObjects: [],
    rewards: {
      xp: 900,
      coins: 400,
      weaponUnlock: 'Rocket Launcher',
      cosmeticReward: '24K Damascus Gold Skin',
    },
    unlockRequirementText: 'Complete Level 6: Night Raid',
  },
  {
    levelNumber: 8,
    id: 'level_08_close_quarters',
    name: 'CLOSE QUARTERS',
    difficulty: 'Hard',
    botDifficultyKey: 'hard',
    mapId: 'training',
    mapPreviewTitle: 'Killhouse CQB Facility',
    environmentTintHex: 0x10b981,
    fogColorHex: 0x061914,
    enemyCount: 18,
    waves: 3,
    timeLimitSec: 210,
    maxLives: 2,
    recommendedWeapon: 'shotgun',
    recommendedClass: 'vince',
    description: 'Breach the tight indoor CQB facility. High-speed corner clearing with strict 2-life tactical rules.',
    primaryObjectives: [
      'Eliminate 18 enemies',
      'Complete the mission without running out of lives (Max 2 lives)',
    ],
    secondaryObjectiveText: 'Complete with 0 deaths (Flawless Breach)',
    enemyIntelligence: 'Close-range Shotgun Heavy Soldiers and aggressive SMG Rushers.',
    enemyComposition: [
      ...Array(8).fill('fast_runner'),
      ...Array(5).fill('heavy_soldier'),
      ...Array(5).fill('standard_soldier'),
    ],
    secondaryCriteria: { type: 'max_deaths', targetValue: 0 },
    scoreTarget3Star: 2300,
    interactiveObjects: [],
    rewards: {
      xp: 1050,
      coins: 450,
      cosmeticReward: 'Breacher Title',
    },
    unlockRequirementText: 'Complete Level 7: Survival',
  },
  {
    levelNumber: 9,
    id: 'level_09_defense',
    name: 'DEFENSE PROTOCOL',
    difficulty: 'Hard',
    botDifficultyKey: 'hard',
    mapId: 'desert',
    mapPreviewTitle: 'Forward Operating Base Alpha',
    environmentTintHex: 0x3b82f6,
    fogColorHex: 0x0f172a,
    enemyCount: 16,
    waves: 3,
    timeLimitSec: 240,
    maxLives: 3,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Enemy strike teams are converging on the command uplink. Defend the control point and repel all attackers.',
    primaryObjectives: [
      'Defend the objective command zone',
      'Stop enemies from capturing the control point (16 attackers)',
    ],
    secondaryObjectiveText: 'Keep defense integrity above 75%',
    enemyIntelligence: 'Coordinated base assault with Heavy breachers and Sniper support.',
    enemyComposition: [
      ...Array(7).fill('standard_soldier'),
      ...Array(5).fill('heavy_soldier'),
      ...Array(4).fill('sniper_bot'),
    ],
    isDefenseMission: true,
    secondaryCriteria: { type: 'defense_integrity', targetValue: 75 },
    scoreTarget3Star: 2200,
    interactiveObjects: [
      {
        id: 'base_defense_core',
        type: 'defense_zone',
        label: 'Command Uplink Point',
        position: { x: 0, y: 0.2, z: 0 },
        radius: 9.0,
      },
    ],
    rewards: {
      xp: 1200,
      coins: 500,
      cosmeticReward: 'Aegis Defender Badge',
    },
    unlockRequirementText: 'Complete Level 8: Close Quarters',
  },
  {
    levelNumber: 10,
    id: 'level_10_hunt',
    name: 'THE HUNT',
    difficulty: 'Expert',
    botDifficultyKey: 'hard',
    mapId: 'urban',
    mapPreviewTitle: 'Metropolis High-Rise District',
    environmentTintHex: 0xa855f7,
    fogColorHex: 0x160926,
    enemyCount: 20,
    waves: 3,
    timeLimitSec: 260,
    maxLives: 3,
    recommendedWeapon: 'revolver',
    recommendedClass: 'detective',
    description: 'Track down and neutralize 3 high-value Elite Mercenaries embedded within a 20-man security battalion.',
    primaryObjectives: [
      'Eliminate 20 enemies',
      'Defeat 3 Elite Enemies',
    ],
    secondaryObjectiveText: 'Land at least 7 headshots',
    enemyIntelligence: '3 heavily shielded Elite Soldiers with evasive strafe AI and high-velocity rifles.',
    enemyComposition: [
      ...Array(3).fill('elite_soldier'),
      ...Array(10).fill('standard_soldier'),
      ...Array(4).fill('fast_runner'),
      ...Array(3).fill('sniper_bot'),
    ],
    requiredElites: 3,
    secondaryCriteria: { type: 'headshots', targetValue: 7 },
    scoreTarget3Star: 2800,
    interactiveObjects: [],
    rewards: {
      xp: 1400,
      coins: 600,
      cosmeticReward: 'Hyperbeast Crimson Skin',
    },
    unlockRequirementText: 'Complete Level 9: Defense Protocol',
  },
  {
    levelNumber: 11,
    id: 'level_11_deep_strike',
    name: 'DEEP STRIKE',
    difficulty: 'Expert',
    botDifficultyKey: 'hard',
    mapId: 'industrial',
    mapPreviewTitle: 'Subterranean Reactor Core',
    environmentTintHex: 0x06b6d4,
    fogColorHex: 0x041820,
    enemyCount: 25,
    waves: 3,
    timeLimitSec: 280,
    maxLives: 3,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Infiltrate the underground industrial facility, activate 3 override terminals, and eliminate 25 defenders.',
    primaryObjectives: [
      'Eliminate 25 enemies',
      'Find and activate 3 mission terminals',
    ],
    secondaryObjectiveText: 'Complete within 200 seconds',
    enemyIntelligence: 'Underground garrison with 4 Elite Soldiers guarding the 3 cryptographic terminals.',
    enemyComposition: [
      ...Array(10).fill('standard_soldier'),
      ...Array(6).fill('heavy_soldier'),
      ...Array(5).fill('fast_runner'),
      ...Array(4).fill('elite_soldier'),
    ],
    requiredTerminals: 3,
    secondaryCriteria: { type: 'time_limit', targetValue: 200 },
    scoreTarget3Star: 3300,
    interactiveObjects: [
      {
        id: 'term_1',
        type: 'terminal',
        label: 'Terminal Alpha',
        position: { x: -16, y: 0.5, z: -8 },
        radius: 6.5,
      },
      {
        id: 'term_2',
        type: 'terminal',
        label: 'Terminal Bravo',
        position: { x: 16, y: 0.5, z: -8 },
        radius: 6.5,
      },
      {
        id: 'term_3',
        type: 'terminal',
        label: 'Terminal Omega',
        position: { x: 0, y: 0.5, z: -24 },
        radius: 6.5,
      },
    ],
    rewards: {
      xp: 1600,
      coins: 700,
      cosmeticReward: 'Deep Strike Cyber Reticle',
    },
    unlockRequirementText: 'Complete Level 10: The Hunt',
  },
  {
    levelNumber: 12,
    id: 'level_12_last_stand',
    name: 'LAST STAND',
    difficulty: 'Expert',
    botDifficultyKey: 'pro',
    mapId: 'desert',
    mapPreviewTitle: 'Scorched Basin Battlefield',
    environmentTintHex: 0xea580c,
    fogColorHex: 0x241006,
    enemyCount: 28,
    waves: 7,
    timeLimitSec: 360,
    maxLives: 3,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Outnumbered on an open battlefield. Survive 7 waves of increasingly lethal enemy squads.',
    primaryObjectives: [
      'Survive 7 waves',
      'Defeat increasingly difficult enemies (28 total)',
    ],
    secondaryObjectiveText: 'Achieve a 5x or higher killstreak',
    enemyIntelligence: '7 escalating waves culminating in combined Heavy, Sniper, and Elite shock troops.',
    enemyComposition: [
      ...Array(8).fill('standard_soldier'),
      ...Array(7).fill('fast_runner'),
      ...Array(6).fill('heavy_soldier'),
      ...Array(4).fill('sniper_bot'),
      ...Array(3).fill('elite_soldier'),
    ],
    secondaryCriteria: { type: 'streak', targetValue: 5 },
    scoreTarget3Star: 3700,
    interactiveObjects: [],
    rewards: {
      xp: 1850,
      coins: 850,
      cosmeticReward: 'Immortal Vanguard Emblem',
    },
    unlockRequirementText: 'Complete Level 11: Deep Strike',
  },
  {
    levelNumber: 13,
    id: 'level_13_elite',
    name: 'ELITE ASSAULT',
    difficulty: 'Very Hard',
    botDifficultyKey: 'pro',
    mapId: 'industrial',
    mapPreviewTitle: 'Citadel Military Complex',
    environmentTintHex: 0xec4899,
    fogColorHex: 0x1c0817,
    enemyCount: 30,
    waves: 4,
    timeLimitSec: 320,
    maxLives: 3,
    recommendedWeapon: 'sniper_rifle',
    recommendedClass: 'hunter',
    description: 'Storm the Citadel military complex and dismantle the Pretorian guard: 30 hostiles including 5 Elite Bots.',
    primaryObjectives: [
      'Eliminate 30 enemies',
      'Defeat 5 Elite Bots',
    ],
    secondaryObjectiveText: 'Achieve at least 10 headshots',
    enemyIntelligence: '5 Pretorian Elite Bots supported by Heavy armor and Overwatch Snipers.',
    enemyComposition: [
      ...Array(5).fill('elite_soldier'),
      ...Array(7).fill('heavy_soldier'),
      ...Array(6).fill('sniper_bot'),
      ...Array(6).fill('fast_runner'),
      ...Array(6).fill('standard_soldier'),
    ],
    requiredElites: 5,
    secondaryCriteria: { type: 'headshots', targetValue: 10 },
    scoreTarget3Star: 4200,
    interactiveObjects: [],
    rewards: {
      xp: 2200,
      coins: 1000,
      cosmeticReward: 'Pretorian Slayer Skin',
    },
    unlockRequirementText: 'Complete Level 12: Last Stand',
  },
  {
    levelNumber: 14,
    id: 'level_14_final_operation',
    name: 'FINAL OPERATION',
    difficulty: 'Very Hard',
    botDifficultyKey: 'pro',
    mapId: 'urban',
    mapPreviewTitle: 'Omega Spire Multi-Tier Complex',
    environmentTintHex: 0x8b5cf6,
    fogColorHex: 0x140a24,
    enemyCount: 25,
    waves: 3,
    timeLimitSec: 300,
    maxLives: 3,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Breach the multi-level Omega Spire, override 2 security nodes, and eliminate the Enemy Field Commander.',
    primaryObjectives: [
      'Activate 2 security nodes & clear 25 guards',
      'Eliminate the Enemy Commander',
    ],
    secondaryObjectiveText: 'Complete with 1 or fewer deaths',
    enemyIntelligence: 'Enemy Field Commander (Boss Class) protected by 4 Elite Guards and security nodes.',
    enemyComposition: [
      'boss_enemy',
      ...Array(4).fill('elite_soldier'),
      ...Array(6).fill('heavy_soldier'),
      ...Array(5).fill('sniper_bot'),
      ...Array(9).fill('fast_runner'),
    ],
    requiredTerminals: 2,
    requiresBossKill: true,
    secondaryCriteria: { type: 'max_deaths', targetValue: 1 },
    scoreTarget3Star: 4500,
    interactiveObjects: [
      {
        id: 'omega_node_1',
        type: 'terminal',
        label: 'Security Node West',
        position: { x: -16, y: 0.5, z: 10 },
        radius: 6.5,
      },
      {
        id: 'omega_node_2',
        type: 'terminal',
        label: 'Security Node East',
        position: { x: 16, y: 0.5, z: 10 },
        radius: 6.5,
      },
    ],
    rewards: {
      xp: 2600,
      coins: 1250,
      cosmeticReward: 'Omega Commander Crest',
    },
    unlockRequirementText: 'Complete Level 13: Elite Assault',
  },
  {
    levelNumber: 15,
    id: 'level_15_boss',
    name: 'FINAL BOSS',
    difficulty: 'Extreme',
    botDifficultyKey: 'pro',
    mapId: 'industrial',
    mapPreviewTitle: 'Apex Core Boss Arena',
    environmentTintHex: 0xdc2626,
    fogColorHex: 0x260404,
    enemyCount: 20,
    waves: 3,
    timeLimitSec: 360,
    maxLives: 3,
    recommendedWeapon: 'assault_rifle',
    recommendedClass: 'triggerman',
    description: 'Enter the Apex Core sanctum. Defeat the heavily armored Apex Warlord Boss and survive his elite reinforcement waves.',
    primaryObjectives: [
      'Defeat the Apex Warlord Boss',
      'Survive enemy reinforcements (20 total enemies)',
      'Complete the final campaign mission',
    ],
    secondaryObjectiveText: 'Complete within 210 seconds',
    enemyIntelligence: 'Apex Warlord Boss (900 HP, multi-phase rocket & suppression barrage) + Elite reinforcement waves.',
    enemyComposition: [
      'boss_enemy',
      ...Array(5).fill('elite_soldier'),
      ...Array(5).fill('heavy_soldier'),
      ...Array(6).fill('fast_runner'),
      ...Array(3).fill('sniper_bot'),
    ],
    requiresBossKill: true,
    secondaryCriteria: { type: 'time_limit', targetValue: 210 },
    scoreTarget3Star: 5000,
    interactiveObjects: [],
    rewards: {
      xp: 4000,
      coins: 2500,
      weaponUnlock: 'Apex Warlord Arsenal',
      cosmeticReward: 'Apex Legend Crown',
    },
    unlockRequirementText: 'Complete Level 14: Final Operation',
  },
];

export interface CompletedLevelRecord {
  level_number: number;
  stars: number;
  best_score: number;
  best_time_sec: number;
  times_completed: number;
}

export interface CampaignProgressState {
  unlocked_level: number;
  total_xp: number;
  total_coins: number;
  unlocked_weapons: string[];
  unlocked_cosmetics: string[];
  completed_levels: Record<string, CompletedLevelRecord>;
}

const LOCAL_STORAGE_CAMPAIGN_KEY = 'krunker_campaign_progress_v1';

export const DEFAULT_CAMPAIGN_PROGRESS: CampaignProgressState = {
  unlocked_level: 1,
  total_xp: 0,
  total_coins: 0,
  unlocked_weapons: ['assault_rifle', 'sniper_rifle', 'smg'],
  unlocked_cosmetics: ['tactical'],
  completed_levels: {},
};

export async function fetchCampaignProgress(): Promise<CampaignProgressState> {
  let localState: CampaignProgressState | null = null;
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_CAMPAIGN_KEY);
    if (raw) {
      localState = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  try {
    const res = await fetch('/api/campaign/progress');
    if (res.ok) {
      const serverState: CampaignProgressState = await res.json();
      const merged: CampaignProgressState = {
        unlocked_level: Math.max(serverState.unlocked_level || 1, localState?.unlocked_level || 1),
        total_xp: Math.max(serverState.total_xp || 0, localState?.total_xp || 0),
        total_coins: Math.max(serverState.total_coins || 0, localState?.total_coins || 0),
        unlocked_weapons: Array.from(
          new Set([...(serverState.unlocked_weapons || []), ...(localState?.unlocked_weapons || [])])
        ),
        unlocked_cosmetics: Array.from(
          new Set([...(serverState.unlocked_cosmetics || []), ...(localState?.unlocked_cosmetics || [])])
        ),
        completed_levels: {
          ...(localState?.completed_levels || {}),
          ...(serverState.completed_levels || {}),
        },
      };
      localStorage.setItem(LOCAL_STORAGE_CAMPAIGN_KEY, JSON.stringify(merged));
      return merged;
    }
  } catch {
    // fallback to localState
  }

  return localState || DEFAULT_CAMPAIGN_PROGRESS;
}

export async function recordCampaignLevelComplete(params: {
  levelNumber: number;
  stars: number;
  score: number;
  timeSec: number;
  xpEarned: number;
  coinsEarned: number;
  weaponUnlock?: string;
  cosmeticReward?: string;
}): Promise<CampaignProgressState> {
  // Update local immediately
  const current = await fetchCampaignProgress();
  const key = String(params.levelNumber);
  const prev = current.completed_levels[key];

  const updated: CampaignProgressState = {
    ...current,
    unlocked_level:
      params.levelNumber >= current.unlocked_level && params.levelNumber < 15
        ? params.levelNumber + 1
        : current.unlocked_level,
    total_xp: current.total_xp + params.xpEarned,
    total_coins: current.total_coins + params.coinsEarned,
    unlocked_weapons:
      params.weaponUnlock && !current.unlocked_weapons.includes(params.weaponUnlock)
        ? [...current.unlocked_weapons, params.weaponUnlock]
        : current.unlocked_weapons,
    unlocked_cosmetics:
      params.cosmeticReward && !current.unlocked_cosmetics.includes(params.cosmeticReward)
        ? [...current.unlocked_cosmetics, params.cosmeticReward]
        : current.unlocked_cosmetics,
    completed_levels: {
      ...current.completed_levels,
      [key]: {
        level_number: params.levelNumber,
        stars: Math.max(prev?.stars || 0, params.stars),
        best_score: Math.max(prev?.best_score || 0, params.score),
        best_time_sec: prev?.best_time_sec ? Math.min(prev.best_time_sec, params.timeSec) : params.timeSec,
        times_completed: (prev?.times_completed || 0) + 1,
      },
    },
  };

  try {
    localStorage.setItem(LOCAL_STORAGE_CAMPAIGN_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }

  try {
    const res = await fetch('/api/campaign/complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    if (res.ok) {
      const serverUpdated = await res.json();
      localStorage.setItem(LOCAL_STORAGE_CAMPAIGN_KEY, JSON.stringify(serverUpdated));
      return serverUpdated;
    }
  } catch {
    // ignore
  }

  return updated;
}
