import { UserStats, GameSettings, ClassId, GameModeType, BotDifficulty } from '../types';

export const DEFAULT_USER_STATS: UserStats = {
  level: 1,
  xp: 0,
  xpToNextLevel: 1000,
  totalKills: 0,
  totalDeaths: 0,
  headshots: 0,
  shotsFired: 0,
  shotsHit: 0,
  matchesPlayed: 0,
  matchesWon: 0,
  unlockedSkins: ['tactical', 'cyber', 'gold', 'camo', 'hyperbeast'],
};

export interface PlayerPreferencesState {
  currentClass: ClassId;
  selectedMap: string;
  selectedMode: GameModeType;
  botDifficulty: BotDifficulty;
  botCount: number;
  settings?: Partial<GameSettings>;
}

export interface MatchRecordPayload {
  mode: string;
  mapId: string;
  kills: number;
  deaths: number;
  headshots: number;
  score: number;
  isVictory: boolean;
}

export function getXpRequiredForLevel(level: number): number {
  return Math.floor(1000 * Math.pow(1.18, Math.max(1, level) - 1));
}

export function awardMatchXp(
  currentStats: UserStats,
  matchKills: number,
  matchHeadshots: number,
  isVictory: boolean,
  matchDeaths: number = 0,
  matchShotsFired: number = 0,
  matchShotsHit: number = 0
): { updatedStats: UserStats; xpGained: number; didLevelUp: boolean } {
  const xpGained = matchKills * 100 + matchHeadshots * 50 + (isVictory ? 500 : 200);
  let newXp = currentStats.xp + xpGained;
  let newLevel = currentStats.level;
  let req = getXpRequiredForLevel(newLevel);
  let didLevelUp = false;

  while (newXp >= req) {
    newXp -= req;
    newLevel += 1;
    req = getXpRequiredForLevel(newLevel);
    didLevelUp = true;
  }

  const updatedStats: UserStats = {
    ...currentStats,
    level: newLevel,
    xp: newXp,
    xpToNextLevel: req,
    totalKills: currentStats.totalKills + matchKills,
    totalDeaths: currentStats.totalDeaths + matchDeaths,
    headshots: currentStats.headshots + matchHeadshots,
    shotsFired: currentStats.shotsFired + matchShotsFired,
    shotsHit: currentStats.shotsHit + matchShotsHit,
    matchesPlayed: currentStats.matchesPlayed + 1,
    matchesWon: currentStats.matchesWon + (isVictory ? 1 : 0),
  };

  return { updatedStats, xpGained, didLevelUp };
}

export function calculateKdRatio(kills: number, deaths: number): number {
  if (deaths <= 0) return kills;
  return Number((kills / deaths).toFixed(2));
}

export function calculateAccuracy(hits: number, fired: number): number {
  if (fired <= 0) return 0;
  return Number(((hits / fired) * 100).toFixed(1));
}

const STATS_STORAGE_KEY = 'krunker_fps_stats_v1';

export function loadUserStats(): UserStats {
  try {
    const raw = localStorage.getItem(STATS_STORAGE_KEY);
    if (!raw) return DEFAULT_USER_STATS;
    return { ...DEFAULT_USER_STATS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_USER_STATS;
  }
}

export function saveUserStats(stats: UserStats): void {
  try {
    localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(stats));
  } catch {
    // ignore
  }
}

export async function fetchPersistedGameState(): Promise<{
  userStats?: UserStats;
  preferences?: PlayerPreferencesState;
} | null> {
  try {
    const res = await fetch('/api/storage/state');
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function syncPersistedGameState(payload: {
  userStats?: UserStats;
  preferences?: PlayerPreferencesState;
  matchRecord?: MatchRecordPayload;
}): Promise<void> {
  try {
    if (payload.userStats) {
      saveUserStats(payload.userStats);
    }
    await fetch('/api/storage/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    // Ignore network errors and rely on localStorage cache
  }
}
