import React from 'react';
import {
  CAMPAIGN_LEVELS_LIST,
  CampaignLevelDefinition,
  CampaignProgressState,
} from '../game/campaign/campaignData';
import { sound } from '../game/audio/soundSystem';

interface CampaignModalProps {
  progress: CampaignProgressState;
  onSelectLevelForBriefing: (level: CampaignLevelDefinition) => void;
  onClose: () => void;
}

const DIFFICULTY_BADGE_STYLES: Record<CampaignLevelDefinition['difficulty'], string> = {
  Beginner: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
  Easy: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  Normal: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
  Hard: 'bg-orange-500/15 text-orange-300 border-orange-500/40',
  Expert: 'bg-purple-500/15 text-purple-300 border-purple-500/40',
  'Very Hard': 'bg-pink-500/15 text-pink-300 border-pink-500/40',
  Extreme: 'bg-red-500/20 text-red-300 border-red-500/50',
};

export const CampaignModal: React.FC<CampaignModalProps> = ({
  progress,
  onSelectLevelForBriefing,
  onClose,
}) => {
  const completedCount = Object.keys(progress.completed_levels || {}).length;
  const completionPct = Math.round((completedCount / 15) * 100);
  const totalStars = Object.values(progress.completed_levels || {}).reduce(
    (acc, item) => acc + (item.stars || 0),
    0
  );

  return (
    <div
      data-testid="campaign-level-select-modal"
      className="fixed inset-0 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-rajdhani"
    >
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-6xl w-full p-6 shadow-2xl flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="text-[11px] uppercase tracking-widest text-amber-400 font-bold">
              TACTICAL OPERATIONS CAMPAIGN · 15 MISSIONS
            </div>
            <h2 className="text-4xl font-bold font-teko uppercase tracking-wider text-white leading-none mt-0.5">
              CAMPAIGN LEVEL SELECTION & PROGRESSION
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                sound.playUiClick();
                onClose();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
            >
              ← Return to Main Menu
            </button>
          </div>
        </div>

        {/* Campaign Progression Summary Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 my-4 bg-slate-950/80 border border-slate-800/90 p-3.5 rounded-xl">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Campaign Completion
            </div>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span className="text-2xl font-bold font-teko text-amber-400 font-mono-numbers">
                {completionPct}%
              </span>
              <span className="text-xs text-slate-400 font-mono-numbers">
                ({completedCount} / 15 Levels)
              </span>
            </div>
            <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-1">
              <div
                className="h-full bg-amber-400 transition-all duration-300"
                style={{ width: `${completionPct}%` }}
              />
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Current Unlocked Tier
            </div>
            <div className="text-2xl font-bold font-teko text-emerald-400 font-mono-numbers mt-0.5">
              LEVEL {progress.unlocked_level} / 15
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Star Rating Mastery
            </div>
            <div className="text-2xl font-bold font-teko text-yellow-400 font-mono-numbers mt-0.5">
              ★ {totalStars} / 45
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Campaign XP Earned
            </div>
            <div className="text-2xl font-bold font-teko text-sky-400 font-mono-numbers mt-0.5">
              {progress.total_xp.toLocaleString()} XP
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">
              Combat Credits & Rewards
            </div>
            <div className="text-2xl font-bold font-teko text-amber-300 font-mono-numbers mt-0.5">
              {progress.total_coins.toLocaleString()} COINS · {progress.unlocked_cosmetics.length} REWARDS
            </div>
          </div>
        </div>

        {/* Visual 15-Level Progression Path Strip */}
        <div className="flex items-center justify-between gap-1 px-3 py-2 bg-slate-950/50 border border-slate-800/60 rounded-xl mb-4 overflow-x-auto">
          {CAMPAIGN_LEVELS_LIST.map((lvl) => {
            const comp = progress.completed_levels[String(lvl.levelNumber)];
            const isUnlocked = lvl.levelNumber <= progress.unlocked_level;
            const isPerfect = comp && comp.stars === 3;
            const isCurrent = lvl.levelNumber === progress.unlocked_level && !comp;

            return (
              <button
                key={lvl.id}
                disabled={!isUnlocked}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playUiClick();
                    onSelectLevelForBriefing(lvl);
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all shrink-0 ${
                  isPerfect
                    ? 'bg-amber-400/20 border border-amber-400 text-amber-300 cursor-pointer'
                    : comp
                    ? 'bg-emerald-500/20 border border-emerald-500/60 text-emerald-300 cursor-pointer'
                    : isCurrent
                    ? 'bg-sky-500/25 border border-sky-400 text-white animate-pulse cursor-pointer'
                    : 'bg-slate-900 border border-slate-800 text-slate-600 cursor-not-allowed'
                }`}
              >
                <span>L{lvl.levelNumber}</span>
                {comp ? (
                  <span className="text-[10px] text-amber-400">
                    {'★'.repeat(comp.stars)}
                  </span>
                ) : !isUnlocked ? (
                  <span className="text-[10px]">🔒</span>
                ) : (
                  <span className="text-[10px] text-sky-300">●</span>
                )}
              </button>
            );
          })}
        </div>

        {/* 15 Playable Levels Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 overflow-y-auto pr-1 flex-1">
          {CAMPAIGN_LEVELS_LIST.map((lvl) => {
            const comp = progress.completed_levels[String(lvl.levelNumber)];
            const isUnlocked = lvl.levelNumber <= progress.unlocked_level;
            const isCompleted = Boolean(comp);
            const stars = comp?.stars || 0;

            return (
              <div
                key={lvl.id}
                data-testid={`campaign-level-card-${lvl.levelNumber}`}
                onClick={() => {
                  if (isUnlocked) {
                    sound.playUiClick();
                    onSelectLevelForBriefing(lvl);
                  }
                }}
                onMouseEnter={() => {
                  if (isUnlocked) sound.playUiHover();
                }}
                className={`rounded-xl border p-4 flex flex-col justify-between transition-all relative ${
                  !isUnlocked
                    ? 'bg-slate-950/60 border-slate-800/70 opacity-65 cursor-not-allowed'
                    : isCompleted
                    ? 'bg-slate-900/95 border-emerald-500/50 hover:border-amber-400 cursor-pointer shadow-lg'
                    : 'bg-slate-900 border-sky-500/60 hover:border-amber-400 cursor-pointer shadow-lg'
                }`}
              >
                <div>
                  {/* Card Top Row: Level Number + Difficulty + Status */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-400 font-mono-numbers text-xs font-bold">
                        LVL {lvl.levelNumber < 10 ? `0${lvl.levelNumber}` : lvl.levelNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-bold uppercase tracking-wider ${
                          DIFFICULTY_BADGE_STYLES[lvl.difficulty]
                        }`}
                      >
                        {lvl.difficulty}
                      </span>
                    </div>

                    {isCompleted ? (
                      <div className="flex items-center gap-1 text-amber-400 text-sm font-bold">
                        <span>{'★'.repeat(stars)}</span>
                        <span className="text-slate-600">{'★'.repeat(3 - stars)}</span>
                      </div>
                    ) : isUnlocked ? (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-sky-400">
                        ● UNLOCKED
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1">
                        <span>🔒</span>
                        <span>LOCKED</span>
                      </span>
                    )}
                  </div>

                  {/* Level Title & Map Preview Bar */}
                  <h3 className="text-2xl font-bold font-teko uppercase tracking-wide text-white leading-none">
                    {lvl.name}
                  </h3>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 mb-2.5">
                    <span>Map: <strong className="text-slate-200">{lvl.mapPreviewTitle}</strong></span>
                    <span className="font-mono-numbers text-amber-300 font-bold">
                      {lvl.enemyCount} Enemies {lvl.waves > 1 ? `· ${lvl.waves} Waves` : ''}
                    </span>
                  </div>

                  {/* Primary Objective Preview */}
                  <div className="bg-slate-950/75 border border-slate-800/80 rounded-lg p-2.5 mb-3">
                    <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mb-1">
                      Mission Objectives
                    </div>
                    <ul className="space-y-0.5 text-xs text-slate-200">
                      {lvl.primaryObjectives.slice(0, 2).map((obj, i) => (
                        <li key={i} className="truncate flex items-center gap-1.5">
                          <span className="text-amber-400">▸</span>
                          <span className="truncate">{obj}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card Footer: Rewards & Action */}
                <div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2.5">
                    <span>
                      Rewards: <strong className="text-sky-300">+{lvl.rewards.xp} XP</strong> ·{' '}
                      <strong className="text-amber-300">+{lvl.rewards.coins} Coins</strong>
                    </span>
                    {lvl.rewards.weaponUnlock && (
                      <span className="text-emerald-400 font-bold truncate max-w-[120px]">
                        +{lvl.rewards.weaponUnlock}
                      </span>
                    )}
                  </div>

                  {!isUnlocked ? (
                    <div className="w-full py-2 px-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] text-slate-500 font-semibold text-center truncate">
                      🔒 {lvl.unlockRequirementText}
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        sound.playUiClick();
                        onSelectLevelForBriefing(lvl);
                      }}
                      className={`w-full py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                        isCompleted
                          ? 'bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-emerald-300'
                          : 'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md'
                      }`}
                    >
                      {isCompleted ? `Replay Mission (Best: ${comp?.best_score} pts)` : 'Open Mission Briefing →'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
