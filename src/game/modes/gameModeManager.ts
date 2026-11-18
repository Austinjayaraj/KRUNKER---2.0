import { GameModeType, PlayerScoreEntry } from '../types';

export interface HardpointZone {
  id: number;
  name: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  capturedBy: 'blue' | 'red' | 'neutral';
  captureProgress: number; // 0 to 100
}

export interface GameModeState {
  mode: GameModeType;
  matchDurationSec: number;
  timeRemainingSec: number;
  isMatchOver: boolean;
  winner: string | null;
  targetKills: number;
  blueScore: number;
  redScore: number;
  hardpointZones: HardpointZone[];
  activeZoneIndex: number;
  zoneRotationTimer: number;
  currentCheckpoint: number;
  totalCheckpoints: number;
  parkourTimeElapsed: number;
}

export function createInitialModeState(mode: GameModeType): GameModeState {
  const matchDuration = mode === 'parkour' ? 600 : 180;
  return {
    mode,
    matchDurationSec: matchDuration,
    timeRemainingSec: matchDuration,
    isMatchOver: false,
    winner: null,
    targetKills: mode === 'ffa' ? 15 : 25,
    blueScore: 0,
    redScore: 0,
    hardpointZones: [
      { id: 1, name: 'Courtyard Fountain', x: 0, y: 0.1, z: 0, radius: 4.5, capturedBy: 'neutral', captureProgress: 0 },
      { id: 2, name: 'North Rooftop', x: 0, y: 6.1, z: -25, radius: 4.5, capturedBy: 'neutral', captureProgress: 0 },
      { id: 3, name: 'South Depot', x: 0, y: 0.1, z: 25, radius: 4.5, capturedBy: 'neutral', captureProgress: 0 },
    ],
    activeZoneIndex: 0,
    zoneRotationTimer: 45,
    currentCheckpoint: 0,
    totalCheckpoints: 5,
    parkourTimeElapsed: 0,
  };
}

/**
 * Updates match timers and returns whether match should conclude.
 */
export function updateGameModeTick(
  state: GameModeState,
  deltaTime: number,
  playerScores: PlayerScoreEntry[]
): GameModeState {
  if (state.isMatchOver) return state;

  const next = { ...state };
  next.timeRemainingSec = Math.max(0, next.timeRemainingSec - deltaTime);

  if (next.mode === 'parkour') {
    next.parkourTimeElapsed += deltaTime;
  }

  // Hardpoint zone rotation timer
  if (next.mode === 'hardpoint') {
    next.zoneRotationTimer -= deltaTime;
    if (next.zoneRotationTimer <= 0) {
      next.activeZoneIndex = (next.activeZoneIndex + 1) % next.hardpointZones.length;
      next.zoneRotationTimer = 45;
    }
  }

  // Check end condition by time limit
  if (next.timeRemainingSec <= 0) {
    next.isMatchOver = true;
    if (next.mode === 'ffa') {
      const sorted = [...playerScores].sort((a, b) => b.kills - a.kills);
      next.winner = sorted[0]?.name || 'Match Complete';
    } else if (next.mode === 'tdm' || next.mode === 'hardpoint') {
      if (next.blueScore > next.redScore) next.winner = 'Blue Team';
      else if (next.redScore > next.blueScore) next.winner = 'Red Team';
      else next.winner = 'Draw';
    } else {
      next.winner = 'Course Complete';
    }
  }

  return next;
}

/**
 * Handles kill scoring for FFA or TDM
 */
export function handleKillScore(
  state: GameModeState,
  killerTeam: 'blue' | 'red' | 'ffa',
  killerName: string,
  killerKills: number
): { nextState: GameModeState; isVictory: boolean } {
  const next = { ...state };

  if (next.mode === 'ffa') {
    if (killerKills >= next.targetKills) {
      next.isMatchOver = true;
      next.winner = killerName;
      return { nextState: next, isVictory: true };
    }
  } else if (next.mode === 'tdm') {
    if (killerTeam === 'blue') {
      next.blueScore += 1;
      if (next.blueScore >= next.targetKills) {
        next.isMatchOver = true;
        next.winner = 'Blue Team';
        return { nextState: next, isVictory: true };
      }
    } else if (killerTeam === 'red') {
      next.redScore += 1;
      if (next.redScore >= next.targetKills) {
        next.isMatchOver = true;
        next.winner = 'Red Team';
        return { nextState: next, isVictory: true };
      }
    }
  }

  return { nextState: next, isVictory: false };
}

/**
 * Updates hardpoint territory holding
 */
export function updateHardpointCapture(
  state: GameModeState,
  blueInZoneCount: number,
  redInZoneCount: number,
  deltaTime: number
): GameModeState {
  if (state.mode !== 'hardpoint' || state.isMatchOver) return state;

  const next = { ...state };
  const targetScore = 150;

  if (blueInZoneCount > 0 && redInZoneCount === 0) {
    next.blueScore += Math.round(5 * deltaTime);
    if (next.blueScore >= targetScore) {
      next.isMatchOver = true;
      next.winner = 'Blue Team';
    }
  } else if (redInZoneCount > 0 && blueInZoneCount === 0) {
    next.redScore += Math.round(5 * deltaTime);
    if (next.redScore >= targetScore) {
      next.isMatchOver = true;
      next.winner = 'Red Team';
    }
  }

  return next;
}
