import React, { useEffect, useState } from 'react';
import {
  GameModeType,
  GameSettings,
  KillFeedEntry,
  PlayerScoreEntry,
  ClassId,
  DamageNumber,
  DamageIndicator,
  KillstreakBanner,
  PlayerTacticalState,
} from '../game/types';
import { CLASS_REGISTRY, WEAPON_REGISTRY } from '../game/weapons/weaponConfig';

interface HUDProps {
  health: number;
  maxHealth: number;
  classId: ClassId;
  equippedWeaponId: string;
  currentMag: number;
  reserveAmmo: number;
  isReloading: boolean;
  reloadProgress: number;
  isAimingDownSights: boolean;
  isInspecting: boolean;
  spawnShieldTimer: number;
  pickupNotification: string | null;
  speed: number;
  hitmarkerActive: boolean;
  isHeadshotHit: boolean;
  damageVignetteActive: boolean;
  damageNumbers: DamageNumber[];
  damageIndicators: DamageIndicator[];
  killstreakBanner: KillstreakBanner | null;
  mode: GameModeType;
  timeRemainingSec: number;
  blueScore: number;
  redScore: number;
  targetScore: number;
  killFeed: KillFeedEntry[];
  showScoreboard: boolean;
  playerScores: PlayerScoreEntry[];
  settings: GameSettings;
  fps: number;
  playerPos: { x: number; z: number };
  playerYaw: number;
  botPositions: { x: number; z: number; isDead: boolean; team: string; y?: number }[];
  jumpPadPositions: { x: number; z: number }[];
  pickupPositions: { x: number; z: number; type: string; isAvailable: boolean }[];
  teleporterPositions?: { x: number; z: number; colorHex: number }[];
  turretPositions?: { x: number; z: number; owner: 'neutral' | 'player' | 'enemy' }[];
  supplyCratePositions?: { x: number; z: number; isAvailable: boolean }[];
  tactical: PlayerTacticalState;
  isMuted: boolean;
  onToggleMute: () => void;
  onTriggerPause: () => void;
  onTriggerRestart: () => void;
  campaignHud?: {
    levelNumber: number;
    levelName: string;
    difficulty: string;
    currentWave: number;
    totalWaves: number;
    livesRemaining: number;
    checklist: { label: string; completed: boolean }[];
    secondaryLabel: string;
    nearbyPrompt?: string | null;
    bossHealth?: { name: string; current: number; max: number } | null;
  } | null;
}

export const HUD: React.FC<HUDProps> = ({
  health,
  maxHealth,
  classId,
  equippedWeaponId,
  currentMag,
  reserveAmmo,
  isReloading,
  reloadProgress,
  isAimingDownSights,
  spawnShieldTimer,
  pickupNotification,
  speed,
  hitmarkerActive,
  isHeadshotHit,
  damageVignetteActive,
  damageNumbers = [],
  damageIndicators = [],
  killstreakBanner = null,
  mode,
  timeRemainingSec,
  blueScore,
  redScore,
  targetScore,
  killFeed,
  showScoreboard,
  playerScores,
  settings,
  fps,
  playerPos,
  playerYaw,
  botPositions,
  jumpPadPositions,
  pickupPositions,
  teleporterPositions = [],
  turretPositions = [],
  supplyCratePositions = [],
  tactical,
  isMuted,
  onToggleMute,
  onTriggerPause,
  onTriggerRestart,
  campaignHud = null,
}) => {
  // Delayed trailing damage ghost bar
  const [ghostHealth, setGhostHealth] = useState<number>(health);

  useEffect(() => {
    if (health >= ghostHealth) {
      setGhostHealth(health);
      return;
    }
    const timer = setTimeout(() => {
      setGhostHealth(health);
    }, 320);
    return () => clearTimeout(timer);
  }, [health, ghostHealth]);

  const cData = CLASS_REGISTRY[classId] || CLASS_REGISTRY.triggerman;
  const wData =
    WEAPON_REGISTRY[equippedWeaponId as keyof typeof WEAPON_REGISTRY] ||
    WEAPON_REGISTRY.assault_rifle;

  const healthPercent = Math.max(0, Math.min(100, (health / maxHealth) * 100));
  const ghostPercent = Math.max(healthPercent, Math.min(100, (ghostHealth / maxHealth) * 100));
  const overshieldPercent = Math.max(0, Math.min(100, (tactical.overshield / 50) * 100));

  const kmhSpeed = Math.round(speed * 3.6);
  const isHighSpeedSlide = speed > 17.5;

  const minutes = Math.floor(timeRemainingSec / 60);
  const seconds = Math.floor(timeRemainingSec % 60);
  const formattedTime = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

  const isSniperScoped = wData.isScoped && isAimingDownSights;
  const spreadOffset = Math.min(
    26,
    Math.max(settings.crosshairGap || 6, speed * 0.42 + (settings.crosshairGap || 6))
  );

  // Minimap radar parameters
  const radarRadius = 52;
  const radarRange = 46;

  const activeInteractPrompt =
    tactical.nearbyInteractableLabel || campaignHud?.nearbyPrompt || null;

  const comboMultiplier =
    tactical.comboCount > 1
      ? Math.min(3.0, 1.0 + (tactical.comboCount - 1) * 0.25).toFixed(2)
      : null;

  return (
    <div className="fixed inset-0 pointer-events-none select-none overflow-hidden z-20 font-rajdhani">
      {/* 1. Low-Health Critical Perimeter Vignette */}
      {health < 30 && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'radial-gradient(circle, rgba(0,0,0,0) 58%, rgba(220,38,38,0.38) 100%)',
          }}
        />
      )}

      {/* 2. Damage Taken Impact Vignette */}
      {damageVignetteActive && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-100"
          style={{
            background:
              'radial-gradient(circle, rgba(0,0,0,0) 50%, rgba(239,68,68,0.52) 100%)',
          }}
        />
      )}

      {/* 3. Overdrive / Spawn Shield Rim */}
      {(spawnShieldTimer > 0 || tactical.overdriveTimer > 0) && (
        <div
          className={`absolute inset-0 border-2 pointer-events-none ${
            tactical.overdriveTimer > 0 ? 'border-sky-400/55' : 'border-amber-400/45'
          }`}
        />
      )}

      {/* 4. Directional Incoming Threat Arcs around Center Gaze */}
      {damageIndicators.map((di) => (
        <div
          key={di.id}
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
          <div
            className="w-60 h-60 flex items-center justify-center"
            style={{ transform: `rotate(${di.angle}rad)` }}
          >
            <div className="w-11 h-2 bg-red-500 rounded-full -translate-y-28" />
          </div>
        </div>
      ))}

      {/* 5. World-Projected Floating Damage Numbers */}
      {settings.showDamageNumbers &&
        damageNumbers.map((dn) => {
          if (!dn.screenPos) return null;
          const opacity = Math.max(0, dn.lifetime / dn.maxLifetime);
          return (
            <div
              key={dn.id}
              className="absolute font-teko font-bold pointer-events-none z-30 tabular-nums"
              style={{
                left: `${dn.screenPos.x}px`,
                top: `${dn.screenPos.y}px`,
                opacity,
                transform: `translate(-50%, -50%) scale(${dn.isHeadshot ? 1.28 : 1.0})`,
              }}
            >
              <div
                className={`flex items-center gap-1 leading-none ${
                  dn.isHeadshot ? 'text-red-400 text-3xl' : 'text-amber-300 text-2xl'
                }`}
              >
                <span>-{dn.damage}</span>
                {dn.isHeadshot && (
                  <span className="text-[11px] font-rajdhani font-bold text-red-300 tracking-wider">
                    CRIT
                  </span>
                )}
              </div>
            </div>
          );
        })}

      {/* 6. Multi-Kill / Wave Callout Banner */}
      {killstreakBanner && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
          <div className="px-5 py-1.5 rounded-lg bg-[#0b1326] border border-amber-400 text-amber-300 flex items-center gap-3 shadow-lg">
            <svg className="w-5 h-5 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" />
            </svg>
            <div>
              <div className="text-xl font-bold font-teko tracking-wider leading-none text-white">
                {killstreakBanner.title}
              </div>
              <div className="text-[10px] font-semibold text-amber-300 tracking-wider">
                {killstreakBanner.subtitle}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. Scoped Ballistic Optic */}
      {isSniperScoped && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/90 pointer-events-none">
          <div className="relative w-[500px] h-[500px] rounded-full border-2 border-emerald-400/80 overflow-hidden">
            <div className="absolute w-full h-[1px] bg-emerald-400/70 top-1/2" />
            <div className="absolute h-full w-[1px] bg-emerald-400/70 left-1/2" />
            <div className="absolute w-32 h-32 rounded-full border border-emerald-400/40 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="absolute bottom-10 left-1/2 -translate-x-1/2 text-xs font-mono-numbers text-emerald-400 font-semibold tracking-wider">
              10.0X BALLISTIC OPTIC
            </div>
          </div>
        </div>
      )}

      {/* 8. Center (0, 0) Reticle, Hitmarker & Contextual [E] Prompt */}
      {!isSniperScoped && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
          {settings.crosshairStyle === 'dot' ? (
            <div
              className="rounded-full"
              style={{
                backgroundColor: settings.crosshairColor || '#38bdf8',
                width: `${Math.max(4, settings.crosshairSize * 0.45)}px`,
                height: `${Math.max(4, settings.crosshairSize * 0.45)}px`,
              }}
            />
          ) : settings.crosshairStyle === 'circle_dot' ? (
            <div className="relative flex items-center justify-center">
              <div
                className="rounded-full border-2 transition-all duration-75"
                style={{
                  borderColor: settings.crosshairColor || '#38bdf8',
                  width: `${(settings.crosshairSize + spreadOffset) * 1.45}px`,
                  height: `${(settings.crosshairSize + spreadOffset) * 1.45}px`,
                }}
              />
              {settings.crosshairDot && (
                <div
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: settings.crosshairColor || '#38bdf8' }}
                />
              )}
            </div>
          ) : settings.crosshairStyle === 'chevron' ? (
            <div className="relative flex flex-col items-center">
              <div
                className="w-3.5 h-3.5 border-t-2 border-l-2 rotate-45"
                style={{
                  borderColor: settings.crosshairColor || '#38bdf8',
                  transform: `translateY(-${spreadOffset * 0.5}px) rotate(45deg)`,
                }}
              />
              {settings.crosshairDot && (
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5"
                  style={{ backgroundColor: settings.crosshairColor || '#38bdf8' }}
                />
              )}
            </div>
          ) : settings.crosshairStyle === 't_post' ? (
            <div className="relative flex items-center justify-center">
              <div
                className="absolute h-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  width: `${settings.crosshairSize}px`,
                  transform: `translateX(-${spreadOffset + settings.crosshairSize / 2}px)`,
                }}
              />
              <div
                className="absolute h-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  width: `${settings.crosshairSize}px`,
                  transform: `translateX(${spreadOffset + settings.crosshairSize / 2}px)`,
                }}
              />
              <div
                className="absolute w-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  height: `${settings.crosshairSize}px`,
                  transform: `translateY(${spreadOffset + settings.crosshairSize / 2}px)`,
                }}
              />
              {settings.crosshairDot && (
                <div
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: settings.crosshairColor || '#38bdf8' }}
                />
              )}
            </div>
          ) : (
            <div className="relative flex items-center justify-center">
              {settings.crosshairDot && (
                <div
                  className="absolute w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: settings.crosshairColor || '#38bdf8' }}
                />
              )}
              <div
                className="absolute h-3 w-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  transform: `translateY(-${spreadOffset}px)`,
                }}
              />
              <div
                className="absolute h-3 w-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  transform: `translateY(${spreadOffset}px)`,
                }}
              />
              <div
                className="absolute w-3 h-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  transform: `translateX(-${spreadOffset}px)`,
                }}
              />
              <div
                className="absolute w-3 h-0.5 rounded-full"
                style={{
                  backgroundColor: settings.crosshairColor || '#38bdf8',
                  transform: `translateX(${spreadOffset}px)`,
                }}
              />
            </div>
          )}

          {/* Crisp SVG Hitmarker & Headshot Crit Insignia */}
          {hitmarkerActive && (
            <div className="absolute flex items-center justify-center pointer-events-none">
              <svg
                className="w-7 h-7"
                viewBox="0 0 28 28"
                fill="none"
                stroke={isHeadshotHit ? '#ef4444' : '#f8fafc'}
                strokeWidth="2.4"
                strokeLinecap="round"
              >
                <line x1="5" y1="5" x2="10" y2="10" />
                <line x1="23" y1="5" x2="18" y2="10" />
                <line x1="5" y1="23" x2="10" y2="18" />
                <line x1="23" y1="23" x2="18" y2="18" />
              </svg>
              {isHeadshotHit && (
                <div className="absolute -top-6 text-[11px] font-bold text-red-400 tracking-wider font-teko whitespace-nowrap">
                  HEADSHOT CRIT
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Contextual Interactive World Prompt near Center Gaze */}
      {activeInteractPrompt && (
        <div
          data-testid="interactive-world-prompt"
          className="absolute top-[57%] left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-[#080d1a]/95 border border-amber-400 text-amber-300 text-xs font-bold tracking-wider whitespace-nowrap shadow-lg"
        >
          {activeInteractPrompt}
        </div>
      )}

      {/* Pickup / Action Toast */}
      {pickupNotification && (
        <div
          data-testid="hud-toast-notification"
          className="absolute bottom-24 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-lg bg-[#080d1a]/95 border border-emerald-400 text-emerald-300 text-xs font-bold tracking-wider whitespace-nowrap shadow-lg"
        >
          {pickupNotification}
        </div>
      )}

      {/* 9. TOP-LEFT: Compact Tactical Radar + Campaign Tracker */}
      <div className="absolute top-4 left-4 flex flex-col gap-2.5">
        {settings.showMinimap && (
          <div className="bg-[#080d1a]/92 border border-[#1e293b] rounded-xl p-2 shadow-lg w-[124px]">
            <div className="flex items-center justify-between mb-1 px-0.5 text-[10px] font-mono-numbers text-slate-400">
              <span className="font-bold text-amber-400">RADAR</span>
              <span>46M</span>
            </div>

            <div className="relative w-[108px] h-[108px] rounded-lg bg-[#050914] border border-slate-800 overflow-hidden flex items-center justify-center">
              <div className="absolute w-[74px] h-[74px] rounded-full border border-slate-800" />
              <div className="absolute w-[38px] h-[38px] rounded-full border border-slate-800" />
              <div className="absolute w-full h-[1px] bg-slate-800/80" />
              <div className="absolute h-full w-[1px] bg-slate-800/80" />

              {/* Teleporters on Radar */}
              {teleporterPositions.map((tp, idx) => {
                const relX = (tp.x - playerPos.x) / radarRange;
                const relZ = (tp.z - playerPos.z) / radarRange;
                if (Math.hypot(relX, relZ) > 1.0) return null;
                return (
                  <div
                    key={`tp_${idx}`}
                    className="absolute w-2.5 h-2.5 rounded-full border-2 border-fuchsia-400"
                    style={{
                      transform: `translate(${relX * radarRadius}px, ${relZ * radarRadius}px)`,
                    }}
                  />
                );
              })}

              {/* Sentry Turrets on Radar */}
              {turretPositions.map((tur, idx) => {
                const relX = (tur.x - playerPos.x) / radarRange;
                const relZ = (tur.z - playerPos.z) / radarRange;
                if (Math.hypot(relX, relZ) > 1.0) return null;
                return (
                  <div
                    key={`tur_${idx}`}
                    className={`absolute w-2 h-2 rotate-45 ${
                      tur.owner === 'player' ? 'bg-emerald-400' : 'bg-amber-400'
                    }`}
                    style={{
                      transform: `translate(${relX * radarRadius}px, ${relZ * radarRadius}px) rotate(45deg)`,
                    }}
                  />
                );
              })}

              {/* Supply Crates on Radar */}
              {supplyCratePositions.map((sc, idx) => {
                if (!sc.isAvailable) return null;
                const relX = (sc.x - playerPos.x) / radarRange;
                const relZ = (sc.z - playerPos.z) / radarRange;
                if (Math.hypot(relX, relZ) > 1.0) return null;
                return (
                  <div
                    key={`sc_${idx}`}
                    className="absolute w-2 h-2 bg-sky-400 rounded-xs"
                    style={{
                      transform: `translate(${relX * radarRadius}px, ${relZ * radarRadius}px)`,
                    }}
                  />
                );
              })}

              {/* Jump Pads on Radar */}
              {jumpPadPositions.map((jp, idx) => {
                const relX = (jp.x - playerPos.x) / radarRange;
                const relZ = (jp.z - playerPos.z) / radarRange;
                if (Math.hypot(relX, relZ) > 1.0) return null;
                return (
                  <div
                    key={`jp_${idx}`}
                    className="absolute w-1.5 h-1.5 rounded-full bg-cyan-300"
                    style={{
                      transform: `translate(${relX * radarRadius}px, ${relZ * radarRadius}px)`,
                    }}
                  />
                );
              })}

              {/* Pickups on Radar */}
              {pickupPositions.map((pk, idx) => {
                if (!pk.isAvailable) return null;
                const relX = (pk.x - playerPos.x) / radarRange;
                const relZ = (pk.z - playerPos.z) / radarRange;
                if (Math.hypot(relX, relZ) > 1.0) return null;
                return (
                  <div
                    key={`pk_${idx}`}
                    className={`absolute w-1.5 h-1.5 rounded-full ${
                      pk.type === 'health' ? 'bg-emerald-400' : 'bg-amber-300'
                    }`}
                    style={{
                      transform: `translate(${relX * radarRadius}px, ${relZ * radarRadius}px)`,
                    }}
                  />
                );
              })}

              {/* Bots on Radar */}
              {botPositions.map((b, idx) => {
                if (b.isDead) return null;
                const relX = (b.x - playerPos.x) / radarRange;
                const relZ = (b.z - playerPos.z) / radarRange;
                if (Math.hypot(relX, relZ) > 1.0) return null;
                const isFriendly = mode === 'tdm' && b.team === 'blue';
                return (
                  <div
                    key={`bot_${idx}`}
                    className={`absolute w-2 h-2 rounded-full ${
                      isFriendly ? 'bg-blue-400' : 'bg-red-500'
                    }`}
                    style={{
                      transform: `translate(${relX * radarRadius}px, ${relZ * radarRadius}px)`,
                    }}
                  />
                );
              })}

              {/* Player Center Compass Arrow */}
              <div
                className="absolute w-3 h-3 flex items-center justify-center"
                style={{ transform: `rotate(${-playerYaw}rad)` }}
              >
                <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-b-[8px] border-b-amber-400" />
              </div>
            </div>
          </div>
        )}

        {/* Campaign Mission Checklist Panel */}
        {campaignHud && (
          <div
            data-testid="campaign-hud-tracker"
            className="bg-[#080d1a]/92 border border-amber-500/40 rounded-xl p-3 shadow-lg max-w-[250px]"
          >
            <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-amber-400 mb-0.5">
              <span className="truncate">
                LVL {campaignHud.levelNumber}: {campaignHud.levelName}
              </span>
              <span className="text-red-400 font-mono-numbers shrink-0">
                ♥ {campaignHud.livesRemaining > 50 ? '∞' : campaignHud.livesRemaining}
              </span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono-numbers mb-1.5">
              WAVE {campaignHud.currentWave}/{campaignHud.totalWaves} ·{' '}
              {campaignHud.difficulty.toUpperCase()}
            </div>
            <div className="space-y-1 mb-1.5">
              {campaignHud.checklist.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-1.5 text-xs font-semibold ${
                    item.completed ? 'text-emerald-400 line-through opacity-75' : 'text-slate-100'
                  }`}
                >
                  <span className={item.completed ? 'text-emerald-400' : 'text-amber-400'}>
                    {item.completed ? '✓' : '▸'}
                  </span>
                  <span className="truncate">{item.label}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-slate-800 pt-1 text-[10px] text-sky-300 truncate">
              ★★ {campaignHud.secondaryLabel}
            </div>
          </div>
        )}
      </div>

      {/* 10. TOP-CENTER: Match Score, Combo Multiplier & Timer Strip */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2">
        <div className="flex items-center gap-4 bg-[#080d1a]/92 border border-[#1e293b] px-5 py-1.5 rounded-xl shadow-lg tabular-nums">
          {mode === 'tdm' || mode === 'hardpoint' ? (
            <div className="flex items-center gap-4 font-bold font-teko tracking-wider">
              <div className="flex items-center gap-1.5 text-blue-400">
                <span className="text-xs font-rajdhani text-blue-400/80">BLUE</span>
                <span className="text-2xl font-mono-numbers">{blueScore}</span>
              </div>
              <span className="text-slate-500 text-lg">VS</span>
              <div className="flex items-center gap-1.5 text-red-400">
                <span className="text-2xl font-mono-numbers">{redScore}</span>
                <span className="text-xs font-rajdhani text-red-400/80">RED</span>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-400 font-semibold">
                {mode === 'parkour'
                  ? 'FREESTYLE'
                  : mode === 'campaign' && campaignHud
                  ? `MISSION ${campaignHud.levelNumber}`
                  : 'FFA TARGET'}
              </span>
              <span className="text-base font-bold font-mono-numbers text-amber-400">
                {mode === 'parkour' ? formattedTime : `${targetScore} KILLS`}
              </span>
            </div>
          )}

          <div className="h-5 w-[1px] bg-slate-800" />

          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-400 font-semibold">TIME</span>
            <span className="text-xl font-bold font-mono-numbers text-white">{formattedTime}</span>
          </div>

          {comboMultiplier && (
            <>
              <div className="h-5 w-[1px] bg-slate-800" />
              <div className="px-2 py-0.5 rounded bg-amber-400/15 border border-amber-400/50 text-amber-300 text-xs font-bold font-mono-numbers">
                {tactical.comboCount}X COMBO ({comboMultiplier}x)
              </div>
            </>
          )}

          {settings.showFps && (
            <>
              <div className="h-5 w-[1px] bg-slate-800" />
              <span className="text-xs font-mono-numbers text-emerald-400 font-semibold">
                {Math.round(fps)} FPS
              </span>
            </>
          )}
        </div>

        {/* Boss Health Bar */}
        {campaignHud?.bossHealth && campaignHud.bossHealth.current > 0 && (
          <div className="w-[340px] bg-[#080d1a]/95 border border-red-500/60 rounded-lg px-3.5 py-1.5 shadow-lg">
            <div className="flex items-center justify-between text-xs font-bold text-red-400 mb-1">
              <span>BOSS: {campaignHud.bossHealth.name}</span>
              <span className="font-mono-numbers">
                {Math.round(campaignHud.bossHealth.current)} / {campaignHud.bossHealth.max}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
              <div
                className="h-full bg-red-500 transition-all duration-150"
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, (campaignHud.bossHealth.current / campaignHud.bossHealth.max) * 100)
                  )}%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* 11. TOP-RIGHT: Clickable Utility Buttons (Mute, Pause, Restart) + Compact Kill Feed */}
      <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            type="button"
            tabIndex={-1}
            title="Mute / Unmute Audio [M]"
            onClick={(e) => {
              e.currentTarget.blur();
              onToggleMute();
            }}
            className="w-9 h-9 rounded-lg bg-[#080d1a]/92 border border-[#1e293b] hover:border-amber-400 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
          >
            {isMuted ? (
              <svg className="w-4 h-4 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <line x1="23" y1="9" x2="17" y2="15" />
                <line x1="17" y1="9" x2="23" y2="15" />
              </svg>
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
              </svg>
            )}
          </button>

          <button
            type="button"
            tabIndex={-1}
            title="Restart Match [R]"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerRestart();
            }}
            className="w-9 h-9 rounded-lg bg-[#080d1a]/92 border border-[#1e293b] hover:border-amber-400 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="23 4 23 10 17 10" />
              <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
            </svg>
          </button>

          <button
            type="button"
            tabIndex={-1}
            title="Pause Game [P / Esc]"
            onClick={(e) => {
              e.currentTarget.blur();
              onTriggerPause();
            }}
            className="w-9 h-9 rounded-lg bg-[#080d1a]/92 border border-[#1e293b] hover:border-amber-400 flex items-center justify-center text-slate-300 hover:text-amber-400 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="6" y="4" width="4" height="16" />
              <rect x="14" y="4" width="4" height="16" />
            </svg>
          </button>
        </div>

        {/* Kill Feed */}
        <div className="flex flex-col items-end gap-1 max-w-xs pointer-events-none">
          {killFeed.slice(-4).map((entry) => (
            <div
              key={entry.id}
              className="flex items-center gap-2 bg-[#080d1a]/90 border border-[#1e293b] px-2.5 py-1 rounded text-xs"
            >
              <span
                className={`font-semibold ${
                  entry.killerTeam === 'blue'
                    ? 'text-blue-400'
                    : entry.killerTeam === 'red'
                    ? 'text-red-400'
                    : 'text-amber-400'
                }`}
              >
                {entry.killerName}
              </span>
              <span className="text-slate-400 text-[10px] px-1.5 py-0.5 bg-slate-900 rounded font-mono-numbers">
                {entry.weaponName}
              </span>
              {entry.isHeadshot && <span className="text-red-400 font-bold">CRIT</span>}
              <span
                className={`font-semibold ${
                  entry.victimTeam === 'blue'
                    ? 'text-blue-400'
                    : entry.victimTeam === 'red'
                    ? 'text-red-400'
                    : 'text-slate-200'
                }`}
              >
                {entry.victimName}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* 12. BOTTOM-LEFT: Armored Vitality Cluster (SVG Shield Icon + Integer Readout + Trailing Damage Ghost Bar + Overshield + Velocity) */}
      <div className="absolute bottom-5 left-5 flex flex-col gap-2">
        {tactical.overdriveTimer > 0 && (
          <div className="px-3 py-1 rounded-lg bg-sky-500/20 border border-sky-400 text-sky-300 text-xs font-bold tracking-wider flex items-center justify-between">
            <span>2X OVERDRIVE ACTIVE</span>
            <span className="font-mono-numbers">{tactical.overdriveTimer.toFixed(1)}S</span>
          </div>
        )}

        <div className="bg-[#080d1a]/92 border border-[#1e293b] p-3.5 rounded-xl shadow-lg min-w-[256px]">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span className="font-bold flex items-center gap-1.5" style={{ color: cData.color }}>
              {/* Custom SVG Shield Vitality Emblem */}
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3zm-1 14H9v-3H6v-2h3V8h2v3h3v2h-3v3z" />
              </svg>
              <span>{cData.name}</span>
            </span>
            <span
              className={`font-mono-numbers text-xs font-bold tabular-nums ${
                isHighSpeedSlide ? 'text-amber-400' : 'text-slate-300'
              }`}
            >
              {isHighSpeedSlide ? 'SLIDE BOOST · ' : ''}
              {kmhSpeed} KM/H
            </span>
          </div>

          <div className="flex items-baseline gap-2 mb-2 tabular-nums">
            <span
              className={`text-4xl font-bold font-teko leading-none ${
                health < 30 ? 'text-red-500' : health < 60 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {Math.round(health)}
            </span>
            <span className="text-xs text-slate-400 font-mono-numbers">/ {maxHealth} HP</span>

            {tactical.overshield > 0 && (
              <span className="ml-auto text-xs font-bold font-mono-numbers text-sky-400">
                +{Math.round(tactical.overshield)} SHIELD
              </span>
            )}
            {spawnShieldTimer > 0 && tactical.overshield <= 0 && (
              <span className="ml-auto text-[11px] font-bold font-mono-numbers text-amber-400">
                SPAWN ARMOR {spawnShieldTimer.toFixed(1)}S
              </span>
            )}
          </div>

          {/* Primary Health Bar with Delayed Trailing Damage Ghost Bar */}
          <div className="relative w-full h-2.5 bg-slate-900 rounded overflow-hidden">
            {/* Delayed Ghost Bar */}
            <div
              className="absolute top-0 left-0 h-full bg-red-500/75 transition-all duration-300"
              style={{ width: `${ghostPercent}%` }}
            />
            {/* Current Live Health Fill */}
            <div
              className={`relative h-full transition-all duration-100 ${
                health < 30 ? 'bg-red-500' : health < 60 ? 'bg-amber-400' : 'bg-emerald-400'
              }`}
              style={{ width: `${healthPercent}%` }}
            />
          </div>

          {/* Overshield Bar */}
          {tactical.overshield > 0 && (
            <div className="w-full h-1.5 bg-slate-900 rounded overflow-hidden mt-1">
              <div
                className="h-full bg-sky-400 transition-all duration-150"
                style={{ width: `${overshieldPercent}%` }}
              />
            </div>
          )}
        </div>
      </div>

      {/* 13. BOTTOM-RIGHT: Tactical Ability Deck + Weapon & Ammo Readout */}
      <div className="absolute bottom-5 right-5 flex flex-col items-end gap-2">
        {/* 4-Slot Interactive Tactical Ability Bar */}
        <div
          data-testid="tactical-abilities-bar"
          className="grid grid-cols-4 gap-1.5 bg-[#080d1a]/92 border border-[#1e293b] p-2 rounded-xl shadow-lg"
        >
          {/* [Q] Impulse Dash */}
          <div className="relative w-16 px-2 py-1.5 rounded-lg bg-[#0d162c] border border-slate-800 flex flex-col items-center overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-amber-400/20 transition-all duration-100"
              style={{
                height: `${
                  tactical.dashCooldown <= 0
                    ? 100
                    : Math.max(
                        0,
                        100 - (tactical.dashCooldown / tactical.dashMaxCooldown) * 100
                      )
                }%`,
              }}
            />
            <div className="relative flex items-center justify-between w-full text-[10px] font-mono-numbers">
              <span className="font-bold text-amber-400">[Q]</span>
              <span className="text-slate-300">
                {tactical.dashCooldown > 0 ? `${tactical.dashCooldown.toFixed(1)}s` : 'RDY'}
              </span>
            </div>
            <span className="relative text-[11px] font-bold text-white mt-0.5">DASH</span>
          </div>

          {/* [E] Grapple / Hack */}
          <div className="relative w-16 px-2 py-1.5 rounded-lg bg-[#0d162c] border border-slate-800 flex flex-col items-center overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-sky-400/20 transition-all duration-100"
              style={{
                height: `${
                  tactical.grappleCooldown <= 0
                    ? 100
                    : Math.max(
                        0,
                        100 - (tactical.grappleCooldown / tactical.grappleMaxCooldown) * 100
                      )
                }%`,
              }}
            />
            <div className="relative flex items-center justify-between w-full text-[10px] font-mono-numbers">
              <span className="font-bold text-sky-400">[E]</span>
              <span className="text-slate-300">
                {tactical.grappleCooldown > 0 ? `${tactical.grappleCooldown.toFixed(1)}s` : 'RDY'}
              </span>
            </div>
            <span className="relative text-[11px] font-bold text-white mt-0.5">
              {tactical.nearbyInteractableLabel ? 'HACK' : 'GRAPPLE'}
            </span>
          </div>

          {/* [G] Plasma Grenade */}
          <div className="relative w-16 px-2 py-1.5 rounded-lg bg-[#0d162c] border border-slate-800 flex flex-col items-center overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-emerald-400/20 transition-all duration-100"
              style={{
                height: `${
                  tactical.grenadeCooldown <= 0
                    ? 100
                    : Math.max(
                        0,
                        100 - (tactical.grenadeCooldown / tactical.grenadeMaxCooldown) * 100
                      )
                }%`,
              }}
            />
            <div className="relative flex items-center justify-between w-full text-[10px] font-mono-numbers">
              <span className="font-bold text-emerald-400">[G]</span>
              <span className="text-slate-300">
                {tactical.grenadeCooldown > 0 ? `${tactical.grenadeCooldown.toFixed(1)}s` : 'RDY'}
              </span>
            </div>
            <span className="relative text-[11px] font-bold text-white mt-0.5">PLASMA</span>
          </div>

          {/* [V] Cyber Blade Melee */}
          <div className="relative w-16 px-2 py-1.5 rounded-lg bg-[#0d162c] border border-slate-800 flex flex-col items-center overflow-hidden">
            <div
              className="absolute bottom-0 left-0 right-0 bg-fuchsia-400/20 transition-all duration-100"
              style={{
                height: `${
                  tactical.meleeCooldown <= 0
                    ? 100
                    : Math.max(
                        0,
                        100 - (tactical.meleeCooldown / tactical.meleeMaxCooldown) * 100
                      )
                }%`,
              }}
            />
            <div className="relative flex items-center justify-between w-full text-[10px] font-mono-numbers">
              <span className="font-bold text-fuchsia-400">[V]</span>
              <span className="text-slate-300">
                {tactical.meleeCooldown > 0 ? `${tactical.meleeCooldown.toFixed(1)}s` : 'RDY'}
              </span>
            </div>
            <span className="relative text-[11px] font-bold text-white mt-0.5">BLADE</span>
          </div>
        </div>

        {/* Weapon & Ammo Cluster */}
        <div className="bg-[#080d1a]/92 border border-[#1e293b] p-3.5 rounded-xl shadow-lg min-w-[268px] text-right">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span className="text-[10px] text-amber-400 font-mono-numbers uppercase">
              {settings.weaponSkin}
            </span>
            <span className="font-bold text-white flex items-center gap-1.5">
              <svg className="w-4 h-4 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 11h14l3-3v5l-3 2H9l-2 4H4l1.5-4H3v-4z" />
              </svg>
              <span>{wData.name}</span>
            </span>
          </div>

          <div className="flex items-baseline justify-end gap-2 mb-2 tabular-nums">
            <span
              className={`text-4xl font-bold font-teko leading-none ${
                currentMag <= 3 && wData.magazineSize > 1 ? 'text-red-400' : 'text-white'
              }`}
            >
              {currentMag}
            </span>
            <span className="text-base text-slate-400 font-mono-numbers">/ {reserveAmmo}</span>
          </div>

          {/* Discrete Bullet Pips */}
          <div className="flex items-center justify-end gap-1 mb-2">
            {Array.from({ length: Math.min(15, wData.magazineSize) }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-2.5 rounded-xs ${
                  i < (currentMag / wData.magazineSize) * Math.min(15, wData.magazineSize)
                    ? 'bg-amber-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          {isReloading ? (
            <div>
              <div className="text-[11px] text-amber-400 font-semibold uppercase mb-1">
                RELOADING...
              </div>
              <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-400 transition-all duration-75"
                  style={{ width: `${reloadProgress * 100}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 font-semibold">
              [R] Reload · [1/2] Switch · [F] Inspect
            </div>
          )}
        </div>
      </div>

      {/* 14. SCOREBOARD MODAL */}
      {showScoreboard && (
        <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-6 pointer-events-auto">
          <div className="bg-[#0b1326] border border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-2xl font-bold font-teko tracking-wider uppercase text-amber-400">
                MATCH SCOREBOARD
              </h2>
              <div className="text-xs text-slate-400 font-mono-numbers">
                MODE: {mode.toUpperCase()} · TIME: {formattedTime}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="text-xs uppercase text-slate-400 border-b border-slate-800">
                    <th className="py-2">Player</th>
                    <th className="py-2">Team</th>
                    <th className="py-2 text-right">Kills</th>
                    <th className="py-2 text-right">Deaths</th>
                    <th className="py-2 text-right">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono-numbers tabular-nums">
                  {playerScores.map((p) => (
                    <tr key={p.id} className={p.id === 'player' ? 'bg-amber-500/10 font-bold' : ''}>
                      <td className="py-2.5 flex items-center gap-2">
                        {p.name}
                        {p.id === 'player' && (
                          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded font-bold">
                            YOU
                          </span>
                        )}
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs uppercase px-2 py-0.5 rounded ${
                            p.team === 'blue'
                              ? 'bg-blue-500/20 text-blue-400'
                              : p.team === 'red'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {p.team}
                        </span>
                      </td>
                      <td className="py-2.5 text-right text-emerald-400">{p.kills}</td>
                      <td className="py-2.5 text-right text-red-400">{p.deaths}</td>
                      <td className="py-2.5 text-right text-amber-400">{p.score}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
