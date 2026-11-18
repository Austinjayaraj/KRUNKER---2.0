import React from 'react';
import { CampaignLevelDefinition } from '../game/campaign/campaignData';
import { sound } from '../game/audio/soundSystem';

export interface MissionCompletionSummary {
  completed: boolean;
  failedReason?: string;
  level: CampaignLevelDefinition;
  starsEarned: number;
  secondaryAchieved: boolean;
  scoreTargetAchieved: boolean;
  completionTimeSec: number;
  enemiesEliminated: number;
  headshots: number;
  accuracyPct: number;
  deaths: number;
  score: number;
  xpEarned: number;
  coinsEarned: number;
  weaponUnlock?: string;
  cosmeticReward?: string;
  nextLevelNumber?: number;
}

interface MissionCompleteModalProps {
  summary: MissionCompletionSummary;
  onNextLevel: (nextLevelNum: number) => void;
  onReplayLevel: () => void;
  onOpenLevelSelection: () => void;
  onReturnToMainMenu: () => void;
}

export const MissionCompleteModal: React.FC<MissionCompleteModalProps> = ({
  summary,
  onNextLevel,
  onReplayLevel,
  onOpenLevelSelection,
  onReturnToMainMenu,
}) => {
  const {
    completed,
    failedReason,
    level,
    starsEarned,
    secondaryAchieved,
    scoreTargetAchieved,
    completionTimeSec,
    enemiesEliminated,
    headshots,
    accuracyPct,
    deaths,
    score,
    xpEarned,
    coinsEarned,
    weaponUnlock,
    cosmeticReward,
    nextLevelNumber,
  } = summary;

  return (
    <div
      data-testid="mission-complete-modal"
      className="fixed inset-0 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-rajdhani"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl text-center">
        {/* Header Status */}
        <div
          className={`inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-widest mb-2 ${
            completed
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'bg-red-500/20 text-red-300 border border-red-500/40'
          }`}
        >
          {completed ? `MISSION ${level.levelNumber} ACCOMPLISHED` : `MISSION ${level.levelNumber} FAILED`}
        </div>

        <h2 className="text-5xl font-bold font-teko uppercase tracking-wider text-white leading-none">
          {completed ? 'MISSION COMPLETE' : 'OPERATION ABORTED'}
        </h2>
        <div className="text-sm text-slate-400 font-semibold mt-1">
          Level {level.levelNumber}: {level.name} ({level.difficulty})
          {failedReason ? ` — ${failedReason}` : ''}
        </div>

        {/* 1-to-3 Star Rating Display */}
        <div className="flex items-center justify-center gap-6 my-5 py-4 bg-slate-950/80 border border-slate-800 rounded-xl">
          {[1, 2, 3].map((starIdx) => {
            const active = starsEarned >= starIdx;
            const label =
              starIdx === 1
                ? 'Primary Objective'
                : starIdx === 2
                ? level.secondaryObjectiveText
                : `Score ≥ ${level.scoreTarget3Star}`;
            return (
              <div key={starIdx} className="flex flex-col items-center max-w-[160px]">
                <div
                  className={`text-4xl transition-transform ${
                    active ? 'text-amber-400 scale-110 drop-shadow-[0_0_12px_rgba(251,191,36,0.6)]' : 'text-slate-700'
                  }`}
                >
                  ★
                </div>
                <div className={`text-[11px] font-bold mt-1 ${active ? 'text-slate-200' : 'text-slate-500'}`}>
                  {starIdx} {starIdx === 1 ? 'Star' : 'Stars'}
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-full">{label}</div>
              </div>
            );
          })}
        </div>

        {/* Telemetry Grid */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5 mb-5 text-left">
          <div className="bg-slate-950/75 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Time</div>
            <div className="text-xl font-bold font-teko text-white font-mono-numbers">
              {completionTimeSec.toFixed(1)}s
            </div>
          </div>
          <div className="bg-slate-950/75 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Eliminated</div>
            <div className="text-xl font-bold font-teko text-emerald-400 font-mono-numbers">
              {enemiesEliminated}
            </div>
          </div>
          <div className="bg-slate-950/75 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Headshots</div>
            <div className="text-xl font-bold font-teko text-amber-400 font-mono-numbers">
              {headshots}
            </div>
          </div>
          <div className="bg-slate-950/75 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Accuracy</div>
            <div className="text-xl font-bold font-teko text-sky-400 font-mono-numbers">
              {accuracyPct.toFixed(1)}%
            </div>
          </div>
          <div className="bg-slate-950/75 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Deaths</div>
            <div className="text-xl font-bold font-teko text-red-400 font-mono-numbers">
              {deaths}
            </div>
          </div>
          <div className="bg-slate-950/75 border border-slate-800 p-3 rounded-xl">
            <div className="text-[10px] uppercase text-slate-400 font-bold">Score</div>
            <div className="text-xl font-bold font-teko text-yellow-300 font-mono-numbers">
              {score.toLocaleString()}
            </div>
          </div>
        </div>

        {/* Rewards Panel */}
        <div className="bg-slate-950/90 border border-slate-800 rounded-xl p-4 mb-6 flex flex-wrap items-center justify-around gap-3">
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-bold">XP Earned</div>
            <div className="text-2xl font-bold font-teko text-sky-400 font-mono-numbers">
              +{xpEarned} XP
            </div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-slate-400 font-bold">Coins Earned</div>
            <div className="text-2xl font-bold font-teko text-amber-400 font-mono-numbers">
              +{coinsEarned} COINS
            </div>
          </div>
          {completed && (weaponUnlock || cosmeticReward) && (
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Unlocked Rewards</div>
              <div className="text-sm font-bold text-emerald-400">
                {weaponUnlock ? `${weaponUnlock} · ` : ''}
                {cosmeticReward}
              </div>
            </div>
          )}
          {completed && nextLevelNumber && nextLevelNumber <= 15 && (
            <div>
              <div className="text-[10px] uppercase text-slate-400 font-bold">Campaign Unlock</div>
              <div className="text-sm font-bold text-amber-300">
                Level {nextLevelNumber} Unlocked ✓
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {completed && nextLevelNumber && nextLevelNumber <= 15 && (
            <button
              onClick={() => {
                sound.playUiClick();
                onNextLevel(nextLevelNumber);
              }}
              className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase tracking-wider text-xs rounded-xl shadow-lg cursor-pointer"
            >
              Next Mission (Level {nextLevelNumber}) →
            </button>
          )}

          <button
            onClick={() => {
              sound.playUiClick();
              onReplayLevel();
            }}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer"
          >
            Replay Mission
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenLevelSelection();
            }}
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer"
          >
            Level Selection
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onReturnToMainMenu();
            }}
            className="px-5 py-3 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 font-bold uppercase tracking-wider text-xs rounded-xl cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
