import React from 'react';
import { sound } from '../game/audio/soundSystem';

interface PauseModalProps {
  isCampaignMode?: boolean;
  campaignLevelName?: string;
  onResume: () => void;
  onRestartLevel: () => void;
  onOpenLevelSelection: () => void;
  onOpenClassSelect: () => void;
  onOpenSettings: () => void;
  onOpenPythonStudio: () => void;
  onReturnToMenu: () => void;
}

export const PauseModal: React.FC<PauseModalProps> = ({
  isCampaignMode = false,
  campaignLevelName,
  onResume,
  onRestartLevel,
  onOpenLevelSelection,
  onOpenClassSelect,
  onOpenSettings,
  onOpenPythonStudio,
  onReturnToMenu,
}) => {
  return (
    <div
      data-testid="pause-modal"
      className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-40 pointer-events-auto font-rajdhani"
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl text-center">
        <h2 className="text-4xl font-bold font-teko uppercase tracking-wider text-amber-400 mb-1 leading-none">
          GAME PAUSED
        </h2>
        {isCampaignMode && campaignLevelName && (
          <div className="text-xs font-bold uppercase tracking-wider text-sky-400 mb-1">
            {campaignLevelName}
          </div>
        )}
        <p className="text-[11px] text-slate-400 font-semibold tracking-wider mb-5">
          SIMULATION & TIMERS SUSPENDED · CLICK RESUME TO CONTINUE
        </p>

        <div className="space-y-2.5">
          <button
            onClick={() => {
              sound.playUiClick();
              onResume();
            }}
            className="w-full py-3 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase tracking-wider text-sm rounded-xl transition-all shadow-md cursor-pointer"
          >
            Resume [Esc]
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onRestartLevel();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer"
          >
            Restart Level
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenSettings();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer"
          >
            Settings
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenLevelSelection();
            }}
            className="w-full py-2.5 bg-sky-950/60 hover:bg-sky-900/80 border border-sky-500/40 text-sky-300 font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer"
          >
            Return to Level Selection
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenClassSelect();
            }}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer"
          >
            Change Loadout Class
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onOpenPythonStudio();
            }}
            className="w-full py-2.5 bg-emerald-950/60 hover:bg-emerald-900/80 border border-emerald-500/50 text-emerald-300 font-bold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Python Studio & Tests</span>
          </button>

          <button
            onClick={() => {
              sound.playUiClick();
              onReturnToMenu();
            }}
            className="w-full py-2.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 text-red-300 font-semibold uppercase tracking-wider text-xs rounded-xl transition-colors cursor-pointer"
          >
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
};
