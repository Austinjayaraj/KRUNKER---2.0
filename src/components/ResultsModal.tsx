import React from 'react';
import { GameModeType } from '../game/types';

interface ResultsModalProps {
  winner: string | null;
  mode: GameModeType;
  matchKills: number;
  matchDeaths: number;
  matchHeadshots: number;
  xpGained: number;
  didLevelUp: boolean;
  newLevel: number;
  onPlayAgain: () => void;
  onReturnToMenu: () => void;
}

export const ResultsModal: React.FC<ResultsModalProps> = ({
  winner,
  mode,
  matchKills,
  matchDeaths,
  matchHeadshots,
  xpGained,
  didLevelUp,
  newLevel,
  onPlayAgain,
  onReturnToMenu,
}) => {
  const isWinner = winner === 'Player' || winner === 'Blue Team';

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-8 shadow-2xl text-center">
        {/* Banner */}
        <div className="mb-6">
          <div
            className={`text-6xl font-bold font-teko uppercase tracking-wider leading-none mb-2 ${
              isWinner ? 'text-amber-400 drop-shadow-[0_0_20px_rgba(245,158,11,0.5)]' : 'text-slate-300'
            }`}
          >
            {isWinner ? 'VICTORY' : 'MATCH COMPLETE'}
          </div>
          <div className="text-sm font-semibold uppercase tracking-widest text-slate-400 font-rajdhani">
            WINNER: <span className="text-white">{winner || 'Match Ended'}</span>
          </div>
        </div>

        {/* Level Up Banner if applicable */}
        {didLevelUp && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/30 to-amber-500/20 border border-amber-400/50 p-3 rounded-xl mb-6 animate-pulse">
            <span className="text-xs uppercase font-bold tracking-widest text-amber-300">
              PROMOTED TO LEVEL {newLevel}!
            </span>
          </div>
        )}

        {/* Match Summary Grid */}
        <div className="grid grid-cols-3 gap-3 font-mono-numbers mb-8">
          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-rajdhani">
              KILLS
            </div>
            <div className="text-3xl font-bold font-teko text-emerald-400 leading-none">
              {matchKills}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-rajdhani">
              DEATHS
            </div>
            <div className="text-3xl font-bold font-teko text-red-400 leading-none">
              {matchDeaths}
            </div>
          </div>

          <div className="bg-slate-950/80 border border-slate-800/80 p-3.5 rounded-xl">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-rajdhani">
              HEADSHOTS
            </div>
            <div className="text-3xl font-bold font-teko text-blue-400 leading-none">
              {matchHeadshots}
            </div>
          </div>
        </div>

        <div className="bg-slate-950/60 border border-slate-800/80 py-3 px-6 rounded-xl mb-8 flex items-center justify-between font-mono-numbers">
          <span className="text-xs text-slate-400 uppercase tracking-wider font-rajdhani">
            COMBAT XP EARNED
          </span>
          <span className="text-xl font-bold text-amber-400">+{xpGained} XP</span>
        </div>

        {/* CTA Buttons */}
        <div className="flex gap-4">
          <button
            onClick={onPlayAgain}
            className="flex-1 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-lg hover:shadow-amber-400/25 cursor-pointer"
          >
            Play Again [Enter]
          </button>
          <button
            onClick={onReturnToMenu}
            className="py-3.5 px-6 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold uppercase tracking-wider text-sm rounded-xl transition-colors cursor-pointer"
          >
            Lobby Menu
          </button>
        </div>
      </div>
    </div>
  );
};
