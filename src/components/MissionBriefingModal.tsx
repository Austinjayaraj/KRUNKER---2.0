import React from 'react';
import { CampaignLevelDefinition, ENEMY_ARCHETYPE_REGISTRY, EnemyArchetypeId } from '../game/campaign/campaignData';
import { WEAPON_REGISTRY, CLASS_REGISTRY } from '../game/weapons/weaponConfig';
import { sound } from '../game/audio/soundSystem';

interface MissionBriefingModalProps {
  level: CampaignLevelDefinition;
  onStartMission: (level: CampaignLevelDefinition) => void;
  onBackToCampaign: () => void;
}

export const MissionBriefingModal: React.FC<MissionBriefingModalProps> = ({
  level,
  onStartMission,
  onBackToCampaign,
}) => {
  // Count enemy archetypes for intelligence breakdown
  const archetypeCounts = level.enemyComposition.reduce((acc, arch) => {
    acc[arch] = (acc[arch] || 0) + 1;
    return acc;
  }, {} as Record<EnemyArchetypeId, number>);

  const recWeapon = WEAPON_REGISTRY[level.recommendedWeapon];
  const recClass = CLASS_REGISTRY[level.recommendedClass];

  return (
    <div
      data-testid="mission-briefing-modal"
      className="fixed inset-0 bg-slate-950/92 backdrop-blur-md flex items-center justify-center p-4 z-50 pointer-events-auto font-rajdhani"
    >
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto">
        {/* Briefing Top Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded bg-amber-400/20 border border-amber-400/50 text-amber-300 text-xs font-bold uppercase tracking-wider">
                MISSION {level.levelNumber < 10 ? `0${level.levelNumber}` : level.levelNumber} BRIEFING
              </span>
              <span className="px-2.5 py-0.5 rounded bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-wider">
                DIFFICULTY: {level.difficulty}
              </span>
            </div>
            <h2 className="text-4xl font-bold font-teko uppercase tracking-wider text-white leading-none mt-2">
              {level.name} — {level.mapPreviewTitle}
            </h2>
          </div>

          <button
            onClick={() => {
              sound.playUiClick();
              onBackToCampaign();
            }}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer"
          >
            ← All Missions
          </button>
        </div>

        {/* Narrative Description */}
        <p className="text-sm text-slate-300 leading-relaxed my-4 bg-slate-950/70 border border-slate-800/80 p-3.5 rounded-xl">
          {level.description}
        </p>

        {/* Objectives & Intelligence Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
          {/* Primary & Secondary Objectives */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
            <div className="text-xs uppercase font-bold tracking-widest text-amber-400 mb-2.5">
              ★ Primary Mission Objectives (1 Star)
            </div>
            <ul className="space-y-2 text-sm text-slate-200 mb-4">
              {level.primaryObjectives.map((obj, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">✓</span>
                  <span>{obj}</span>
                </li>
              ))}
            </ul>

            <div className="border-t border-slate-800 pt-3 space-y-2">
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-sky-400">
                  ★★ Secondary Objective (2 Stars)
                </div>
                <div className="text-xs text-slate-300 mt-0.5">{level.secondaryObjectiveText}</div>
              </div>
              <div>
                <div className="text-[11px] uppercase font-bold tracking-wider text-yellow-400">
                  ★★★ Mastery Score Target (3 Stars)
                </div>
                <div className="text-xs text-slate-300 mt-0.5 font-mono-numbers">
                  Achieve {level.scoreTarget3Star.toLocaleString()} or more Combat Score
                </div>
              </div>
            </div>
          </div>

          {/* Enemy Intelligence & Recommended Gear */}
          <div className="space-y-4">
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs uppercase font-bold tracking-widest text-red-400 mb-2">
                Hostile Intelligence ({level.enemyCount} Total · {level.waves} {level.waves === 1 ? 'Wave' : 'Waves'})
              </div>
              <p className="text-xs text-slate-300 mb-3">{level.enemyIntelligence}</p>
              <div className="flex flex-wrap gap-1.5">
                {(Object.keys(archetypeCounts) as EnemyArchetypeId[]).map((archId) => {
                  const arch = ENEMY_ARCHETYPE_REGISTRY[archId];
                  const count = archetypeCounts[archId];
                  return (
                    <span
                      key={archId}
                      className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs font-semibold text-slate-200"
                    >
                      {count}× {arch.name} ({arch.health} HP)
                    </span>
                  );
                })}
              </div>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4">
              <div className="text-xs uppercase font-bold tracking-widest text-emerald-400 mb-2">
                Tactical Loadout & Mission Parameters
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-slate-300">
                <div>
                  Recommended Weapon:{' '}
                  <strong className="text-white block">{recWeapon?.name || 'Assault Rifle'}</strong>
                </div>
                <div>
                  Recommended Operative:{' '}
                  <strong className="text-amber-300 block">{recClass?.name || 'Triggerman'}</strong>
                </div>
                <div>
                  Time Limit:{' '}
                  <strong className="text-white font-mono-numbers">{level.timeLimitSec} Seconds</strong>
                </div>
                <div>
                  Lives Allowed:{' '}
                  <strong className="text-white font-mono-numbers">
                    {level.maxLives >= 50 ? 'Unlimited (Tutorial)' : `${level.maxLives} Lives`}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Action CTA */}
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-slate-800">
          <div className="text-xs text-slate-400">
            Completion Rewards:{' '}
            <strong className="text-sky-400">+{level.rewards.xp} XP</strong> ·{' '}
            <strong className="text-amber-400">+{level.rewards.coins} Coins</strong> ·{' '}
            <strong className="text-emerald-400">
              {level.rewards.weaponUnlock || level.rewards.cosmeticReward}
            </strong>
          </div>

          <button
            data-testid="start-mission-btn"
            onClick={() => {
              sound.playUiClick();
              onStartMission(level);
            }}
            onMouseEnter={() => sound.playUiHover()}
            className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-teko text-2xl font-bold uppercase tracking-wider rounded-xl shadow-[0_0_25px_rgba(251,191,36,0.35)] transition-all cursor-pointer"
          >
            START MISSION {level.levelNumber} →
          </button>
        </div>
      </div>
    </div>
  );
};
