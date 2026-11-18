import React from 'react';
import { ClassId } from '../game/types';
import { CLASS_REGISTRY, WEAPON_REGISTRY } from '../game/weapons/weaponConfig';
import { sound } from '../game/audio/soundSystem';

interface ClassSelectModalProps {
  currentClass: ClassId;
  onSelectClass: (id: ClassId) => void;
  onClose: () => void;
}

export const ClassSelectModal: React.FC<ClassSelectModalProps> = ({
  currentClass,
  onSelectClass,
  onClose,
}) => {
  const classes = Object.values(CLASS_REGISTRY);

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-rajdhani">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl max-w-5xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/40 flex items-center justify-center text-amber-400 font-teko text-2xl font-bold">
              ★
            </div>
            <div>
              <h2 className="text-3xl font-bold font-teko uppercase tracking-wider text-white leading-none">
                SELECT COMBAT OPERATIVE CLASS
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Choose your specialist loadout: calibrated movement physics, base health pools, and dedicated primary weaponry
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playUiClick();
              onClose();
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            Close [Esc]
          </button>
        </div>

        {/* Classes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 overflow-y-auto pr-2 flex-1">
          {classes.map((c) => {
            const isSelected = c.id === currentClass;
            const primary = WEAPON_REGISTRY[c.primaryWeapon];
            const secondary = c.secondaryWeapon ? WEAPON_REGISTRY[c.secondaryWeapon] : null;

            // Normalized stats for visual meters
            const dmgScore = Math.min(100, Math.round((primary.damage / 100) * 100));
            const fireScore = Math.min(100, Math.round((primary.fireRateRps / 14) * 100));
            const mobilityScore = Math.min(100, Math.round(((c.speedMultiplier - 0.8) / 0.5) * 100));
            const healthScore = Math.min(100, Math.round((c.maxHealth / 140) * 100));

            return (
              <div
                key={c.id}
                onClick={() => {
                  sound.playUiClick();
                  onSelectClass(c.id);
                  onClose();
                }}
                onMouseEnter={() => sound.playUiHover()}
                className={`relative flex flex-col justify-between p-4 rounded-xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.25)] scale-[1.02]'
                    : 'bg-slate-950/70 border-slate-800/80 hover:border-slate-600 hover:bg-slate-900/80'
                }`}
              >
                {/* Active Indicator (Clean unboxed text, no pill) */}
                {isSelected && (
                  <div className="absolute top-3 right-3 text-[10px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                    <span>ACTIVE</span>
                    <span>✓</span>
                  </div>
                )}

                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c.color }}
                    />
                    <h3 className="text-xl font-bold font-teko tracking-wider uppercase text-white">
                      {c.name}
                    </h3>
                  </div>
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 font-rajdhani">
                    {c.role}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                    {c.description}
                  </p>

                  {/* Tactical Progress Bars */}
                  <div className="space-y-1.5 mb-4 text-[11px] font-mono-numbers">
                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>FIREPOWER</span>
                        <span className="text-white font-bold">{primary.damage} DMG</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-red-400" style={{ width: `${dmgScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>CADENCE</span>
                        <span className="text-white font-bold">{primary.fireRateRps.toFixed(1)} RPS</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-400" style={{ width: `${fireScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>MOBILITY</span>
                        <span className="text-white font-bold">{(c.speedMultiplier * 100).toFixed(0)}%</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${mobilityScore}%` }} />
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-slate-400 mb-0.5">
                        <span>RESILIENCE</span>
                        <span className="text-white font-bold">{c.maxHealth} HP</span>
                      </div>
                      <div className="w-full h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-400" style={{ width: `${healthScore}%` }} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Loadout Hardware readouts */}
                <div className="border-t border-slate-800/80 pt-3 space-y-1 text-xs font-mono-numbers">
                  <div className="flex justify-between text-slate-400">
                    <span>PRIMARY:</span>
                    <span className="text-white font-semibold truncate max-w-[120px]">{primary.name}</span>
                  </div>
                  {secondary && (
                    <div className="flex justify-between text-slate-400">
                      <span>SECONDARY:</span>
                      <span className="text-slate-300 font-semibold truncate max-w-[120px]">{secondary.name}</span>
                    </div>
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
