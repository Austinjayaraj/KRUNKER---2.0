import React from 'react';
import { UserStats } from '../game/types';
import { calculateKdRatio, calculateAccuracy } from '../game/progression/progressionSystem';

interface StatsModalProps {
  stats: UserStats;
  onClose: () => void;
}

export const StatsModal: React.FC<StatsModalProps> = ({ stats, onClose }) => {
  const kd = calculateKdRatio(stats.totalKills, stats.totalDeaths);
  const accuracy = calculateAccuracy(stats.shotsHit, stats.shotsFired);
  const winRate = stats.matchesPlayed > 0 ? ((stats.matchesWon / stats.matchesPlayed) * 100).toFixed(1) : '0';
  const xpPercent = Math.min(100, Math.round((stats.xp / stats.xpToNextLevel) * 100));

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <h2 className="text-3xl font-bold font-teko uppercase tracking-wider text-amber-400">
            CAREER COMBAT RECORD
          </h2>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>

        {/* Level & XP Banner */}
        <div className="bg-slate-950/80 border border-slate-800/80 p-5 rounded-xl mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center font-teko text-3xl font-bold text-amber-400">
                {stats.level}
              </div>
              <div>
                <div className="text-xs uppercase text-slate-400 tracking-wider font-semibold">
                  PLAYER LEVEL
                </div>
                <div className="text-sm font-bold text-white">ELITE OPERATIVE</div>
              </div>
            </div>
            <div className="text-right font-mono-numbers text-xs text-slate-400">
              {stats.xp} / {stats.xpToNextLevel} XP ({xpPercent}%)
            </div>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-amber-400 rounded-full transition-all duration-300"
              style={{ width: `${xpPercent}%` }}
            />
          </div>
        </div>

        {/* Combat Stats Grid */}
        <div className="grid grid-cols-2 gap-3 font-mono-numbers mb-6">
          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-rajdhani mb-1">
              TOTAL ELIMINATIONS
            </div>
            <div className="text-3xl font-bold font-teko text-emerald-400 leading-none">
              {stats.totalKills}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-rajdhani mb-1">
              TOTAL DEATHS
            </div>
            <div className="text-3xl font-bold font-teko text-red-400 leading-none">
              {stats.totalDeaths}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-rajdhani mb-1">
              K/D RATIO
            </div>
            <div className="text-3xl font-bold font-teko text-amber-400 leading-none">
              {kd}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-rajdhani mb-1">
              HEADSHOTS
            </div>
            <div className="text-3xl font-bold font-teko text-blue-400 leading-none">
              {stats.headshots}
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-rajdhani mb-1">
              WEAPON ACCURACY
            </div>
            <div className="text-3xl font-bold font-teko text-purple-400 leading-none">
              {accuracy}%
            </div>
          </div>

          <div className="bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[11px] text-slate-400 uppercase tracking-wider font-rajdhani mb-1">
              MATCH WINS / PLAYED
            </div>
            <div className="text-3xl font-bold font-teko text-white leading-none">
              {stats.matchesWon} <span className="text-lg text-slate-500">/ {stats.matchesPlayed}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
