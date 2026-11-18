import { UserStats } from '../types';

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

export function getXpRequiredForLevel(level: number): number {
  return Math.floor(1000 * Math.pow(1.18, Math.max(1, level) - 1));
}

export function awardMatchXp(
  currentStats: UserStats,
  matchKills: number,
  matchHeadshots: number,
  isVictory: boolean
): { updatedStats: UserStats; xpGained: number; didLevelUp: boolean } {
  let xpGained = matchKills * 100 + matchHeadshots * 50 + (isVictory ? 500 : 200);
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
    headshots: currentStats.headshots + matchHeadshots,
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
