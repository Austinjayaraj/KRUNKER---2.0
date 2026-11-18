import React from 'react';
import { GameModeType, BotDifficulty, ClassId } from '../game/types';
import { CLASS_REGISTRY, WEAPON_REGISTRY } from '../game/weapons/weaponConfig';
import { MAPS } from '../game/maps/mapData';
import { CampaignProgressState } from '../game/campaign/campaignData';
import { sound } from '../game/audio/soundSystem';

interface MainMenuProps {
  currentClass: ClassId;
  selectedMap: string;
  selectedMode: GameModeType;
  botDifficulty: BotDifficulty;
  botCount: number;
  campaignProgress: CampaignProgressState;
  cameraTourPreset: 'orbit' | 'portals' | 'turrets' | 'spire';
  onSelectCameraTourPreset: (preset: 'orbit' | 'portals' | 'turrets' | 'spire') => void;
  onSelectMap: (mapId: string) => void;
  onSelectMode: (mode: GameModeType) => void;
  onSelectBotDifficulty: (diff: BotDifficulty) => void;
  onSelectBotCount: (count: number) => void;
  onStartGame: () => void;
  onOpenCampaign: () => void;
  onOpenClassSelect: () => void;
  onOpenSettings: () => void;
  onOpenStats: () => void;
  onOpenPythonStudio: () => void;
}

export const MainMenu: React.FC<MainMenuProps> = ({
  currentClass,
  selectedMap,
  selectedMode,
  botDifficulty,
  botCount,
  campaignProgress,
  cameraTourPreset,
  onSelectCameraTourPreset,
  onSelectMap,
  onSelectMode,
  onSelectBotDifficulty,
  onSelectBotCount,
  onStartGame,
  onOpenCampaign,
  onOpenClassSelect,
  onOpenSettings,
  onOpenStats,
  onOpenPythonStudio,
}) => {
  const currentClassData = CLASS_REGISTRY[currentClass] || CLASS_REGISTRY.triggerman;
  const primaryWeapon = WEAPON_REGISTRY[currentClassData.primaryWeapon];

  const completedLevelsCount = Object.keys(campaignProgress.completed_levels || {}).length;
  const totalStars = Object.values(campaignProgress.completed_levels || {}).reduce(
    (acc, item) => acc + (item.stars || 0),
    0
  );

  const mapsList = Object.values(MAPS);
  const modesList: { id: GameModeType; name: string; target: string }[] = [
    { id: 'ffa', name: 'Free For All', target: '15 Kills' },
    { id: 'tdm', name: 'Team Deathmatch', target: '25 Kills' },
    { id: 'hardpoint', name: 'Hardpoint', target: '150 Pts' },
    { id: 'parkour', name: 'Slide-Hop Range', target: 'Freestyle' },
  ];

  return (
    <div
      className="fixed inset-0 z-30 flex flex-col justify-between p-6 md:p-9 pointer-events-none select-none font-rajdhani"
      style={{
        background:
          'linear-gradient(90deg, rgba(6,10,22,0.92) 0%, rgba(6,10,22,0.72) 42%, rgba(6,10,22,0.12) 72%, rgba(6,10,22,0.0) 100%)',
      }}
    >
      {/* Main Asymmetric Split: Left Tactical Command Dock + Right 60% Open Negative-Space 3D Arena Stage */}
      <div className="flex-1 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 my-auto">
        {/* Left Third: Bespoke SVG Title Lockup & Tactical Deployment Console */}
        <section
          aria-label="Game Title and Deployment Setup"
          className="w-full max-w-[480px] pointer-events-auto flex flex-col gap-4"
        >
          {/* Bespoke Inline SVG Title Emblem Lockup */}
          <div className="pt-1 pb-2">
            <svg
              viewBox="0 0 460 88"
              className="w-full h-auto max-w-[440px] overflow-visible"
              role="img"
              aria-label="Krunker Arena 3D"
            >
              {/* Outer Tactical Crest Shield */}
              <g transform="translate(4, 6)">
                <polygon
                  points="36,0 72,14 72,54 36,74 0,54 0,14"
                  fill="#0b1329"
                  stroke="#f59e0b"
                  strokeWidth="2.5"
                />
                <polygon
                  points="36,8 64,19 64,49 36,65 8,49 8,19"
                  fill="#111c38"
                  stroke="#38bdf8"
                  strokeWidth="1.2"
                />
                {/* Precision Crosshair Reticle Inside Crest */}
                <circle cx="36" cy="36" r="11" fill="none" stroke="#f8fafc" strokeWidth="2.2" />
                <circle cx="36" cy="36" r="3" fill="#f59e0b" />
                <line x1="36" y1="16" x2="36" y2="23" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="36" y1="49" x2="36" y2="56" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="16" y1="36" x2="23" y2="36" stroke="#f59e0b" strokeWidth="2.5" />
                <line x1="49" y1="36" x2="56" y2="36" stroke="#f59e0b" strokeWidth="2.5" />
              </g>

              {/* Display Lockup Lettering (single text node with tspan for exact kerning) */}
              <text
                x="90"
                y="48"
                fontFamily="Teko, Impact, sans-serif"
                fontWeight="700"
                fontSize="44"
                letterSpacing="2"
              >
                <tspan fill="#f8fafc">KRUNKER </tspan>
                <tspan fill="#f59e0b">ARENA 3D</tspan>
              </text>

              {/* Structural Accent Rule & World Subtitle */}
              <line x1="90" y1="58" x2="450" y2="58" stroke="#1e293b" strokeWidth="2" />
              <rect x="90" y="57" width="84" height="3" fill="#38bdf8" />
              <text
                x="90"
                y="76"
                fill="#94a3b8"
                fontFamily="Rajdhani, sans-serif"
                fontWeight="600"
                fontSize="11.5"
                letterSpacing="2.1"
              >
                VOXEL SLIDE-HOP COMBAT · GRAPPLE · AUTO-TURRETS · 15 MISSIONS
              </text>
            </svg>
          </div>

          {/* Primary Start CTA & 15-Level Campaign CTA */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
            <button
              type="button"
              data-start="true"
              data-testid="quick-deploy-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onStartGame();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className="sm:col-span-6 py-3.5 px-4 bg-amber-400 hover:bg-amber-300 text-slate-950 font-bold uppercase tracking-wider text-lg font-teko rounded-xl transition-transform active:scale-98 cursor-pointer shadow-[0_10px_28px_rgba(245,158,11,0.32)] flex items-center justify-between gap-2 whitespace-nowrap"
            >
              <span>DEPLOY TO ARENA</span>
              <span className="text-[11px] font-rajdhani font-bold px-2 py-0.5 rounded bg-slate-950/20 text-slate-950">
                ENTER
              </span>
            </button>

            <button
              type="button"
              data-testid="open-campaign-card-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenCampaign();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className="sm:col-span-6 py-3.5 px-4 bg-[#0d162c] hover:bg-[#152242] border border-amber-400/70 text-amber-300 font-bold uppercase tracking-wider text-base font-teko rounded-xl transition-colors cursor-pointer flex items-center justify-between gap-2 whitespace-nowrap"
            >
              <span>15-LEVEL CAMPAIGN</span>
              <span className="text-xs font-mono-numbers text-amber-400 px-1.5 py-0.5 rounded bg-amber-400/10">
                ★{totalStars}/45
              </span>
            </button>
          </div>

          {/* Operative Loadout & Campaign Progress Strip */}
          <div
             className="p-4 rounded-xl bg-[#0b1326]/95 border border-slate-800 flex items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className="w-11 h-11 rounded-lg flex items-center justify-center font-teko text-2xl font-bold text-slate-950 shrink-0"
                style={{ backgroundColor: currentClassData.color }}
              >
                {currentClassData.name.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-slate-400 font-semibold truncate">
                  Operative · {currentClassData.role}
                </div>
                <div className="text-xl font-bold font-teko text-white tracking-wide leading-none mt-0.5 truncate">
                  {currentClassData.name} — {primaryWeapon.name}
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400 mt-1 font-mono-numbers">
                  <span className="text-emerald-400 font-bold">{currentClassData.maxHealth} HP</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-sky-400 font-bold">
                    {Math.round(currentClassData.speedMultiplier * 100)}% SPD
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>
                    Campaign {completedLevelsCount}/15
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenClassSelect();
              }}
              onMouseEnter={() => sound.playUiHover()}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shrink-0 whitespace-nowrap"
            >
              Switch Class
            </button>
          </div>

          {/* Match Arena & Mode Configuration Dock */}
          <div className="p-4 rounded-xl bg-[#0b1326]/95 border border-slate-800 space-y-3.5">
            {/* Arena Map Selector */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1.5">
                <span>Arena Sector</span>
                <span className="text-sky-400 font-mono-numbers">
                  {MAPS[selectedMap]?.name || 'Neo-Tokyo Plaza'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {mapsList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      sound.playUiClick();
                      onSelectMap(m.id);
                    }}
                    onMouseEnter={() => sound.playUiHover()}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer truncate whitespace-nowrap ${
                      selectedMap === m.id
                        ? 'bg-amber-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Game Mode Selector */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-1.5">
                <span>Combat Mode</span>
                <span className="text-amber-400 font-mono-numbers">
                  {modesList.find((m) => m.id === selectedMode)?.target || '15 Kills'}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {modesList.map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={(e) => {
                      e.currentTarget.blur();
                      sound.playUiClick();
                      onSelectMode(m.id);
                    }}
                    onMouseEnter={() => sound.playUiHover()}
                    className={`py-2 px-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer truncate whitespace-nowrap ${
                      selectedMode === m.id
                        ? 'bg-sky-400 text-slate-950 font-bold'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {m.name.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>

            {/* Bot Squad Count & Difficulty */}
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <div>
                <div className="text-xs text-slate-400 font-semibold mb-1">
                  Bot Squad ({botCount})
                </div>
                <div className="grid grid-cols-4 gap-1 font-mono-numbers">
                  {[2, 4, 6, 8].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        sound.playUiClick();
                        onSelectBotCount(cnt);
                      }}
                      className={`py-1.5 rounded text-xs font-semibold cursor-pointer ${
                        botCount === cnt
                          ? 'bg-slate-200 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {cnt}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-xs text-slate-400 font-semibold mb-1">
                  AI Skill ({botDifficulty})
                </div>
                <div className="grid grid-cols-4 gap-1">
                  {(['easy', 'normal', 'hard', 'pro'] as BotDifficulty[]).map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={(e) => {
                        e.currentTarget.blur();
                        sound.playUiClick();
                        onSelectBotDifficulty(diff);
                      }}
                      className={`py-1.5 rounded text-[11px] font-semibold capitalize cursor-pointer ${
                        botDifficulty === diff
                          ? 'bg-amber-400/90 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Secondary Utility Actions Row */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              data-testid="open-campaign-nav-btn"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenCampaign();
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0b1326]/95 border border-slate-800 hover:border-amber-400 text-xs font-semibold text-amber-300 transition-colors cursor-pointer whitespace-nowrap"
            >
              Campaign Missions ({completedLevelsCount}/15)
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenClassSelect();
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0b1326]/95 border border-slate-800 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Operative Classes
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenStats();
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0b1326]/95 border border-slate-800 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Career Stats
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenSettings();
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0b1326]/95 border border-slate-800 hover:border-slate-600 text-xs font-semibold text-slate-300 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
            >
              Settings & Reticle
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.currentTarget.blur();
                sound.playUiClick();
                onOpenPythonStudio();
              }}
              className="px-3.5 py-2 rounded-lg bg-[#0b1326]/95 border border-emerald-500/40 hover:border-emerald-400 text-xs font-semibold text-emerald-400 transition-colors cursor-pointer whitespace-nowrap"
            >
              Python Engine (86 .py)
            </button>
          </div>
        </section>

        {/* Right Side Interactive 3D Stage Camera Switcher (Bottom-Right Aligned, Unobstructed Center) */}
        <aside
          aria-label="Live 3D Arena Camera Tour"
          className="pointer-events-auto self-end mt-auto flex flex-col items-end gap-2"
        >
          <div className="px-3.5 py-2 rounded-xl bg-[#0b1326]/90 border border-slate-800 text-right">
            <div className="text-[11px] font-semibold text-slate-400">
              Interactive 3D Arena Preview · {MAPS[selectedMap]?.name}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              {(
                [
                  { id: 'orbit', label: 'Aerial Orbit' },
                  { id: 'spire', label: 'Holo Spire' },
                  { id: 'portals', label: 'Stargate Portals' },
                  { id: 'turrets', label: 'Auto-Turrets' },
                ] as const
              ).map((cam) => (
                <button
                  key={cam.id}
                  type="button"
                  onClick={(e) => {
                    e.currentTarget.blur();
                    sound.playUiClick();
                    onSelectCameraTourPreset(cam.id);
                  }}
                  className={`px-2.5 py-1 rounded text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    cameraTourPreset === cam.id
                      ? 'bg-sky-400 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Bottom Safe Margin: Single Flat Borderless Inline Control-Hint Line */}
      <div className="pt-2 text-xs text-slate-300/90 font-semibold tracking-wide">
        WASD Move · Space Jump · Shift Slide-Hop · Left-Click Shoot · Right-Click Scope · Q Impulse Dash · E Grapple / Hack Turret · G Plasma Grenade · V Blade Melee · Esc Pause
      </div>
    </div>
  );
};
