/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GameScene } from './game/renderer/gameScene';
import {
  GameModeType,
  BotDifficulty,
  ClassId,
  GameSettings,
  KillFeedEntry,
  PlayerScoreEntry,
  UserStats,
  DamageNumber,
  DamageIndicator,
  KillstreakBanner,
  PlayerTacticalState,
} from './game/types';
import { MAPS } from './game/maps/mapData';
import {
  createInitialModeState,
  updateGameModeTick,
  handleKillScore,
  GameModeState,
} from './game/modes/gameModeManager';
import {
  loadUserStats,
  saveUserStats,
  awardMatchXp,
  DEFAULT_USER_STATS,
  fetchPersistedGameState,
  syncPersistedGameState,
} from './game/progression/progressionSystem';
import {
  CAMPAIGN_LEVELS_LIST,
  CampaignLevelDefinition,
  CampaignProgressState,
  DEFAULT_CAMPAIGN_PROGRESS,
  EnemyArchetypeId,
  fetchCampaignProgress,
  recordCampaignLevelComplete,
} from './game/campaign/campaignData';
import {
  createInitialTacticalState,
  registerComboKill,
} from './game/mechanics/interactiveWorld';
import { sound } from './game/audio/soundSystem';
import { HUD } from './components/HUD';
import { MainMenu } from './components/MainMenu';
import { ClassSelectModal } from './components/ClassSelectModal';
import { SettingsModal } from './components/SettingsModal';
import { StatsModal } from './components/StatsModal';
import { PauseModal } from './components/PauseModal';
import { ResultsModal } from './components/ResultsModal';
import { PythonStudioModal } from './components/PythonStudioModal';
import { CampaignModal } from './components/CampaignModal';
import { MissionBriefingModal } from './components/MissionBriefingModal';
import {
  MissionCompleteModal,
  MissionCompletionSummary,
} from './components/MissionCompleteModal';

const DEFAULT_SETTINGS: GameSettings = {
  mouseSensitivity: 1.0,
  fov: 85,
  invertY: false,
  masterVolume: 0.8,
  sfxVolume: 0.85,
  musicVolume: 0.5,
  crosshairColor: '#38bdf8',
  crosshairSize: 12,
  crosshairGap: 6,
  crosshairDot: true,
  crosshairStyle: 'cross',
  showDamageNumbers: true,
  showFps: true,
  showMinimap: true,
  weaponSkin: 'tactical',
  mapTheme: 'cyberpunk',
  graphicsQuality: 'high',
};

export default function App() {
  const mountRef = useRef<HTMLDivElement>(null);
  const gameSceneRef = useRef<GameScene | null>(null);

  // App & Game State
  const [gameState, setGameState] = useState<'menu' | 'playing' | 'paused' | 'results'>('menu');
  const [selectedMap, setSelectedMap] = useState<string>('urban');
  const [selectedMode, setSelectedMode] = useState<GameModeType>('ffa');
  const [currentClass, setCurrentClass] = useState<ClassId>('triggerman');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('normal');
  const [botCount, setBotCount] = useState<number>(4);
  const [cameraTourPreset, setCameraTourPreset] = useState<'orbit' | 'portals' | 'turrets' | 'spire'>('orbit');
  const cameraTourPresetRef = useRef(cameraTourPreset);
  cameraTourPresetRef.current = cameraTourPreset;

  // Modals
  const [isClassSelectOpen, setIsClassSelectOpen] = useState<boolean>(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isStatsOpen, setIsStatsOpen] = useState<boolean>(false);
  const [isPythonStudioOpen, setIsPythonStudioOpen] = useState<boolean>(false);
  const [isCampaignOpen, setIsCampaignOpen] = useState<boolean>(false);
  const [briefingLevel, setBriefingLevel] = useState<CampaignLevelDefinition | null>(null);

  const anyModalOpenRef = useRef<boolean>(false);
  anyModalOpenRef.current =
    isClassSelectOpen ||
    isSettingsOpen ||
    isStatsOpen ||
    isPythonStudioOpen ||
    isCampaignOpen ||
    Boolean(briefingLevel);

  // Campaign State & Runtime Refs
  const [campaignProgress, setCampaignProgress] = useState<CampaignProgressState>(
    DEFAULT_CAMPAIGN_PROGRESS
  );
  const [activeCampaignLevel, setActiveCampaignLevel] = useState<CampaignLevelDefinition | null>(
    null
  );
  const activeCampaignLevelRef = useRef<CampaignLevelDefinition | null>(null);
  activeCampaignLevelRef.current = activeCampaignLevel;

  const [campaignCompletionSummary, setCampaignCompletionSummary] =
    useState<MissionCompletionSummary | null>(null);

  const campaignSpawnQueueRef = useRef<EnemyArchetypeId[]>([]);
  const campaignWaveRef = useRef<number>(1);
  const campaignElitesKilledRef = useRef<number>(0);
  const campaignBossKilledRef = useRef<boolean>(false);
  const campaignTerminalsActivatedRef = useRef<Set<string>>(new Set());
  const campaignCaptureSecRef = useRef<number>(0);
  const campaignDefenseIntegrityRef = useRef<number>(100);
  const campaignExtractionReachedRef = useRef<boolean>(false);
  const campaignMaxStreakRef = useRef<number>(0);
  const campaignScoreRef = useRef<number>(0);
  const campaignElapsedSecRef = useRef<number>(0);
  const campaignFinishedRef = useRef<boolean>(false);
  const campaignObjectMeshesRef = useRef<THREE.Object3D[]>([]);

  const [campaignHudState, setCampaignHudState] = useState<{
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
  } | null>(null);

  // In-Game UI States
  const [health, setHealth] = useState<number>(100);
  const [maxHealth, setMaxHealth] = useState<number>(100);
  const [equippedWeaponId, setEquippedWeaponId] = useState<string>('assault_rifle');
  const [currentMag, setCurrentMag] = useState<number>(30);
  const [reserveAmmo, setReserveAmmo] = useState<number>(90);
  const [isReloading, setIsReloading] = useState<boolean>(false);
  const [reloadProgress, setReloadProgress] = useState<number>(0);
  const [isAimingDownSights, setIsAimingDownSights] = useState<boolean>(false);
  const [isInspecting, setIsInspecting] = useState<boolean>(false);
  const [spawnShieldTimer, setSpawnShieldTimer] = useState<number>(3.5);
  const [pickupNotification, setPickupNotification] = useState<string | null>(null);
  const [speed, setSpeed] = useState<number>(0);
  const [hitmarkerActive, setHitmarkerActive] = useState<boolean>(false);
  const [isHeadshotHit, setIsHeadshotHit] = useState<boolean>(false);
  const [damageVignetteActive, setDamageVignetteActive] = useState<boolean>(false);
  const [showScoreboard, setShowScoreboard] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(60);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [tacticalState, setTacticalState] = useState<PlayerTacticalState>(
    createInitialTacticalState()
  );

  // Floating Damage Numbers, Directional Threat Arcs & Killstreaks
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const [damageIndicators, setDamageIndicators] = useState<DamageIndicator[]>([]);
  const [killstreakBanner, setKillstreakBanner] = useState<KillstreakBanner | null>(null);
  const currentStreakRef = useRef<number>(0);
  const lastKillTimeRef = useRef<number>(0);
  const rapidKillCountRef = useRef<number>(0);

  // Minimap Live Positions
  const [playerPos, setPlayerPos] = useState<{ x: number; z: number }>({ x: 0, z: 0 });
  const [playerYaw, setPlayerYaw] = useState<number>(0);
  const [botPositions, setBotPositions] = useState<
    { x: number; z: number; isDead: boolean; team: string; y?: number }[]
  >([]);

  // Match & Mode Tracker
  const modeStateRef = useRef<GameModeState>(createInitialModeState('ffa'));
  const [timeRemainingSec, setTimeRemainingSec] = useState<number>(180);
  const [blueScore, setBlueScore] = useState<number>(0);
  const [redScore, setRedScore] = useState<number>(0);
  const [killFeed, setKillFeed] = useState<KillFeedEntry[]>([]);
  const [playerScores, setPlayerScores] = useState<PlayerScoreEntry[]>([]);

  // Match Performance
  const [matchKills, setMatchKills] = useState<number>(0);
  const [matchDeaths, setMatchDeaths] = useState<number>(0);
  const [matchHeadshots, setMatchHeadshots] = useState<number>(0);
  const [shotsFired, setShotsFired] = useState<number>(0);
  const [shotsHit, setShotsHit] = useState<number>(0);

  // Settings & Progression
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [userStats, setUserStats] = useState<UserStats>(DEFAULT_USER_STATS);
  const [matchRewards, setMatchRewards] = useState<{
    xpGained: number;
    didLevelUp: boolean;
    newLevel: number;
  }>({
    xpGained: 0,
    didLevelUp: false,
    newLevel: 1,
  });

  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const settingsRef = useRef(settings);
  settingsRef.current = settings;
  const matchKillsRef = useRef(matchKills);
  matchKillsRef.current = matchKills;
  const matchHeadshotsRef = useRef(matchHeadshots);
  matchHeadshotsRef.current = matchHeadshots;
  const matchDeathsRef = useRef(matchDeaths);
  matchDeathsRef.current = matchDeaths;
  const shotsFiredRef = useRef(shotsFired);
  shotsFiredRef.current = shotsFired;
  const shotsHitRef = useRef(shotsHit);
  shotsHitRef.current = shotsHit;

  // Sync document.body.dataset.state for automated harness & state inspection
  useEffect(() => {
    const mappedState =
      gameState === 'menu'
        ? 'title'
        : gameState === 'playing'
        ? 'playing'
        : gameState === 'paused'
        ? 'paused'
        : 'gameover';
    document.body.dataset.state = mappedState;
  }, [gameState]);

  useEffect(() => {
    const loadedStats = loadUserStats();
    setUserStats(loadedStats);

    fetchCampaignProgress().then((prog) => {
      setCampaignProgress(prog);
    });

    try {
      const savedSettings = localStorage.getItem('krunker_fps_settings_v1');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setSettings({ ...DEFAULT_SETTINGS, ...parsed });
        sound.setVolumes(parsed.masterVolume ?? 0.8, parsed.sfxVolume ?? 0.85);
      }
    } catch {
      // ignore
    }

    fetchPersistedGameState().then((persisted) => {
      if (!persisted) return;
      if (persisted.userStats && persisted.userStats.matchesPlayed > 0) {
        setUserStats((prev) =>
          persisted.userStats!.matchesPlayed >= prev.matchesPlayed
            ? persisted.userStats!
            : prev
        );
        saveUserStats(persisted.userStats);
      }
      if (persisted.preferences) {
        const p = persisted.preferences;
        if (p.currentClass) setCurrentClass(p.currentClass);
        if (p.selectedMap && MAPS[p.selectedMap]) setSelectedMap(p.selectedMap);
        if (p.selectedMode && p.selectedMode !== 'campaign') setSelectedMode(p.selectedMode);
        if (p.botDifficulty) setBotDifficulty(p.botDifficulty);
        if (typeof p.botCount === 'number' && p.botCount >= 1) setBotCount(p.botCount);
        if (p.settings && Object.keys(p.settings).length > 0) {
          setSettings((prev) => ({ ...prev, ...p.settings }));
        }
      }
    });
  }, []);

  const showToast = (msg: string, durationMs: number = 2400) => {
    setPickupNotification(msg);
    setTimeout(() => {
      setPickupNotification((prev) => (prev === msg ? null : prev));
    }, durationMs);
  };

  const handleToggleMute = () => {
    const nextMuted = sound.toggleMute();
    setIsMuted(nextMuted);
  };

  const handleUpdateSettings = (newSettings: GameSettings) => {
    setSettings(newSettings);
    if (gameSceneRef.current) {
      gameSceneRef.current.playerController.setSkin(newSettings.weaponSkin);
    }
    try {
      localStorage.setItem('krunker_fps_settings_v1', JSON.stringify(newSettings));
    } catch {
      // ignore
    }
    syncPersistedGameState({
      preferences: {
        currentClass,
        selectedMap,
        selectedMode,
        botDifficulty,
        botCount,
        settings: newSettings,
      },
    });
  };

  // Clear 3D campaign objective meshes
  const clearCampaignObjectMeshes = () => {
    if (!gameSceneRef.current) return;
    for (const obj of campaignObjectMeshesRef.current) {
      gameSceneRef.current.scene.remove(obj);
    }
    campaignObjectMeshesRef.current = [];
  };

  // Build 3D interactive objective beacons/terminals for active campaign level
  const buildCampaignObjectMeshes = (level: CampaignLevelDefinition) => {
    clearCampaignObjectMeshes();
    if (!gameSceneRef.current) return;
    const scene = gameSceneRef.current.scene;

    for (const item of level.interactiveObjects) {
      const group = new THREE.Group();
      group.position.set(item.position.x, item.position.y, item.position.z);

      if (item.type === 'terminal') {
        const pillarGeo = new THREE.BoxGeometry(1.1, 2.2, 0.8);
        const pillarMat = new THREE.MeshStandardMaterial({
          color: 0x06b6d4,
          emissive: 0x0891b2,
          emissiveIntensity: 0.45,
          roughness: 0.3,
        });
        const pillar = new THREE.Mesh(pillarGeo, pillarMat);
        pillar.position.y = 1.1;
        group.add(pillar);
      } else {
        const ringGeo = new THREE.CylinderGeometry(item.radius, item.radius, 0.18, 28, 1, true);
        const ringColor =
          item.type === 'extraction_zone'
            ? 0x10b981
            : item.type === 'defense_zone'
            ? 0x3b82f6
            : 0xf59e0b;
        const ringMat = new THREE.MeshBasicMaterial({
          color: ringColor,
          transparent: true,
          opacity: 0.45,
          side: THREE.DoubleSide,
        });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.y = 0.2;
        group.add(ring);
      }

      scene.add(group);
      campaignObjectMeshesRef.current.push(group);
    }
  };

  // Initialize 3D Game Scene once
  useEffect(() => {
    if (!mountRef.current) return;

    const gameScene = new GameScene(
      mountRef.current,
      selectedMap,
      currentClass,
      settings.weaponSkin
    );
    gameSceneRef.current = gameScene;

    const urlParams = new URLSearchParams(window.location.search);
    const campaignParam = urlParams.get('campaign');
    if (campaignParam) {
      const lvlNum = Number(campaignParam);
      const found = CAMPAIGN_LEVELS_LIST.find((l) => l.levelNumber === lvlNum);
      if (found) {
        setTimeout(() => {
          handleStartCampaignMission(found);
        }, 200);
      }
    } else if (urlParams.get('autostart') === '1') {
      setTimeout(() => {
        handleStartGame();
      }, 200);
    }

    let menuOrbitAngle = 0;
    let fpsFrames = 0;
    let fpsTimer = 0;

    gameScene.startAnimationLoop((simDt, rawDt) => {
      fpsFrames++;
      fpsTimer += rawDt;
      if (fpsTimer >= 0.5) {
        setFps(fpsFrames / fpsTimer);
        fpsFrames = 0;
        fpsTimer = 0;
      }

      const state = gameStateRef.current;
      const ctrl = gameScene.playerController;
      const bots = gameScene.botManager;

      if (state === 'menu') {
        menuOrbitAngle += rawDt * 0.25;
        gameScene.updateInteractiveElements(rawDt);

        const preset = cameraTourPresetRef.current;
        if (preset === 'spire') {
          gameScene.camera.position.set(
            Math.sin(menuOrbitAngle * 0.9) * 14,
            10.5 + Math.sin(menuOrbitAngle) * 1.5,
            Math.cos(menuOrbitAngle * 0.9) * 14
          );
          gameScene.camera.lookAt(0, 6.2, 0);
        } else if (preset === 'portals') {
          const tp = gameScene.currentMap.teleporters[0]?.position || { x: -12, y: 0, z: 24 };
          gameScene.camera.position.set(
            tp.x + Math.sin(menuOrbitAngle * 0.8) * 10,
            tp.y + 4.5,
            tp.z + Math.cos(menuOrbitAngle * 0.8) * 10
          );
          gameScene.camera.lookAt(tp.x, tp.y + 1.5, tp.z);
        } else if (preset === 'turrets') {
          const tur = gameScene.currentMap.turrets[0]?.position || { x: 8, y: 0, z: 16 };
          gameScene.camera.position.set(
            tur.x + Math.sin(menuOrbitAngle * 0.8) * 9,
            tur.y + 4.2,
            tur.z + Math.cos(menuOrbitAngle * 0.8) * 9
          );
          gameScene.camera.lookAt(tur.x, tur.y + 1.2, tur.z);
        } else {
          const radius = 31;
          gameScene.camera.position.set(
            Math.sin(menuOrbitAngle) * radius,
            13 + Math.sin(menuOrbitAngle * 0.5) * 3,
            Math.cos(menuOrbitAngle) * radius
          );
          gameScene.camera.lookAt(0, 3.5, 0);
        }
        return;
      }

      if (state === 'playing') {
        ctrl.viewmodelGroup.visible = true;
        ctrl.update(
          simDt,
          settingsRef.current,
          gameScene.currentMap.collisionBoxes,
          gameScene.currentMap.jumpPads,
          gameScene.currentMap.pickups,
          gameScene.currentMap.explosiveBarrels,
          gameScene.currentMap.teleporters,
          gameScene.currentMap.turrets,
          gameScene.currentMap.supplyCrates,
          gameScene.currentMap.destructibleCrates,
          bots,
          gameScene.scene,
          (dmg, isHead, isKill, victim, hitPos) => {
            handleHit(dmg, isHead, isKill, victim, hitPos);
          },
          () => {
            shotsFiredRef.current += 1;
            setShotsFired(shotsFiredRef.current);
          },
          (pickupType) => {
            const toast =
              pickupType === 'health'
                ? 'MEDKIT SECURED (+50 HP)'
                : pickupType === 'ammo'
                ? 'AMMO SUPPLY REPLENISHED'
                : String(pickupType);
            showToast(toast);
          },
          (expPos, colorHex) => {
            gameScene.spawnParticleBurst(expPos, 26, colorHex, 14.0, 1.35);
            gameScene.addTrauma(0.55);
          }
        );

        // Update 3D grapple tether line
        if (ctrl.tactical.isGrappling && ctrl.tactical.grappleTarget) {
          const handPos = ctrl.position.clone().add(new THREE.Vector3(0.25, 1.2, 0));
          const targetVec = new THREE.Vector3(
            ctrl.tactical.grappleTarget.x,
            ctrl.tactical.grappleTarget.y,
            ctrl.tactical.grappleTarget.z
          );
          gameScene.setGrappleBeam(handPos, targetVec);
        } else {
          gameScene.setGrappleBeam(null, null);
        }

        // Update interactive world props & allied Sentry Turret overwatch
        gameScene.updateInteractiveElements(
          simDt,
          (dmg, isKill, victimName, hitPos) => {
            handleHit(dmg, false, isKill, victimName, hitPos);
          }
        );

        bots.update(
          simDt,
          ctrl.position,
          ctrl.health,
          ctrl.spawnShieldTimer > 0,
          gameScene.currentMap.botWaypoints,
          gameScene.currentMap.collisionBoxes,
          (bot, damage) => {
            handleBotDamagedPlayer(bot, damage);
          }
        );

        const activeLvl = activeCampaignLevelRef.current;
        if (activeLvl) {
          updateCampaignRuntimeTick(simDt, activeLvl, ctrl.position, bots.bots);
        } else {
          const modeState = updateGameModeTick(modeStateRef.current, simDt, playerScores);
          modeStateRef.current = modeState;
          setTimeRemainingSec(modeState.timeRemainingSec);
          setBlueScore(modeState.blueScore);
          setRedScore(modeState.redScore);

          if (modeState.isMatchOver) {
            concludeMatch(modeState.winner);
          }
        }

        // Sync local HUD readouts
        setHealth(ctrl.health);
        setMaxHealth(ctrl.maxHealth);
        setEquippedWeaponId(ctrl.equippedWeaponId);
        setCurrentMag(ctrl.currentMag);
        setReserveAmmo(ctrl.reserveAmmo);
        setIsReloading(ctrl.isReloading);
        setReloadProgress(1 - ctrl.reloadTimer / ctrl.reloadDuration);
        setIsAimingDownSights(ctrl.isAimingDownSights);
        setIsInspecting(ctrl.isInspecting);
        setSpawnShieldTimer(ctrl.spawnShieldTimer);
        setSpeed(Math.hypot(ctrl.velocity.x, ctrl.velocity.z));
        setTacticalState({ ...ctrl.tactical });

        // Sync radar positions
        setPlayerPos({ x: ctrl.position.x, z: ctrl.position.z });
        setPlayerYaw(ctrl.yaw);
        setBotPositions(
          bots.bots.map((b) => ({
            x: b.position.x,
            z: b.position.z,
            isDead: b.isDead,
            team: b.team,
            y: b.position.y,
          }))
        );

        // Project 3D Floating Damage Numbers to 2D Screen Coordinates
        setDamageNumbers((prev) => {
          if (prev.length === 0) return prev;
          const next: DamageNumber[] = [];
          const width = window.innerWidth;
          const height = window.innerHeight;
          for (const dn of prev) {
            const nextLife = dn.lifetime - rawDt;
            if (nextLife <= 0) continue;
            const nextY = dn.worldPos.y + rawDt * 1.4;
            const vec = new THREE.Vector3(dn.worldPos.x, nextY, dn.worldPos.z);
            vec.project(gameScene.camera);
            let screenPos: { x: number; y: number } | undefined = undefined;
            if (vec.z < 1.0) {
              screenPos = {
                x: (vec.x * 0.5 + 0.5) * width,
                y: (-(vec.y * 0.5) + 0.5) * height,
              };
            }
            next.push({
              ...dn,
              worldPos: { ...dn.worldPos, y: nextY },
              screenPos,
              lifetime: nextLife,
            });
          }
          return next;
        });
      }
    });

    return () => {
      gameScene.destroy();
      gameSceneRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (gameSceneRef.current) {
      gameSceneRef.current.playerController.setClass(currentClass);
      setHealth(gameSceneRef.current.playerController.health);
      setMaxHealth(gameSceneRef.current.playerController.maxHealth);
    }
  }, [currentClass]);

  useEffect(() => {
    if (
      !activeCampaignLevelRef.current &&
      gameSceneRef.current &&
      MAPS[selectedMap] &&
      gameSceneRef.current.currentMap.id !== selectedMap
    ) {
      gameSceneRef.current.loadMap(MAPS[selectedMap]);
    }
  }, [selectedMap]);

  // Campaign Tick Handler
  const updateCampaignRuntimeTick = (
    dt: number,
    level: CampaignLevelDefinition,
    playerPosition: THREE.Vector3,
    botsList: GameScene['botManager']['bots']
  ) => {
    if (campaignFinishedRef.current) return;

    campaignElapsedSecRef.current += dt;
    const remTime = Math.max(0, level.timeLimitSec - campaignElapsedSecRef.current);
    setTimeRemainingSec(remTime);

    let nearbyPrompt: string | null = null;

    // Check interactive objects (capture zones, defense zones, terminals, extraction)
    for (const obj of level.interactiveObjects) {
      const dist = Math.hypot(
        playerPosition.x - obj.position.x,
        playerPosition.z - obj.position.z
      );
      if (obj.type === 'capture_zone' && level.captureSecondsRequired) {
        if (dist <= obj.radius) {
          campaignCaptureSecRef.current = Math.min(
            level.captureSecondsRequired,
            campaignCaptureSecRef.current + dt
          );
          const pct = Math.round(
            (campaignCaptureSecRef.current / level.captureSecondsRequired) * 100
          );
          if (pct < 100) {
            nearbyPrompt = `CAPTURING ${obj.label.toUpperCase()} (${pct}%)`;
          }
        }
      } else if (obj.type === 'terminal') {
        const alreadyActive = campaignTerminalsActivatedRef.current.has(obj.id);
        if (!alreadyActive && dist <= obj.radius) {
          nearbyPrompt = `PRESS [E] OR HOLD POSITION TO ACTIVATE ${obj.label.toUpperCase()}`;
          if (dist <= 3.8) {
            campaignTerminalsActivatedRef.current.add(obj.id);
            campaignScoreRef.current += 200;
            sound.playUiClick();
            showToast(`${obj.label.toUpperCase()} ACTIVATED (+200 PTS)`);
          }
        }
      } else if (obj.type === 'extraction_zone' && level.requiresExtraction) {
        if (matchKillsRef.current >= level.enemyCount && dist <= obj.radius) {
          campaignExtractionReachedRef.current = true;
          campaignScoreRef.current += 250;
        } else if (matchKillsRef.current >= level.enemyCount) {
          nearbyPrompt = `PROCEED TO EXTRACTION BEACON (${Math.round(dist)}M)`;
        }
      } else if (obj.type === 'defense_zone' && level.isDefenseMission) {
        const enemiesInside = botsList.filter(
          (b) =>
            !b.isDead &&
            Math.hypot(b.position.x - obj.position.x, b.position.z - obj.position.z) <=
              obj.radius + 3
        ).length;
        if (enemiesInside > 0) {
          campaignDefenseIntegrityRef.current = Math.max(
            0,
            campaignDefenseIntegrityRef.current - enemiesInside * 2.2 * dt
          );
          nearbyPrompt = `WARNING: HOSTILES CAPTURING UPLINK (${Math.round(
            campaignDefenseIntegrityRef.current
          )}%)`;
        }
      }
    }

    // Check if current wave is cleared and spawn next wave
    const aliveEnemies = botsList.filter((b) => !b.isDead);
    if (aliveEnemies.length === 0 && campaignSpawnQueueRef.current.length > 0 && gameSceneRef.current) {
      campaignWaveRef.current = Math.min(level.waves, campaignWaveRef.current + 1);
      const batchSize = Math.max(
        1,
        Math.ceil(level.enemyCount / Math.max(1, level.waves))
      );
      const nextBatch = campaignSpawnQueueRef.current.slice(0, batchSize);
      campaignSpawnQueueRef.current = campaignSpawnQueueRef.current.slice(batchSize);

      gameSceneRef.current.botManager.spawnCampaignEnemies(
        nextBatch,
        level.botDifficultyKey,
        gameSceneRef.current.currentMap.spawnPoints,
        gameSceneRef.current.currentMap.botWaypoints,
        false
      );

      const waveBanner: KillstreakBanner = {
        id: `wave_${Date.now()}`,
        title: `WAVE ${campaignWaveRef.current} / ${level.waves}`,
        subtitle: `${nextBatch.length} HOSTILE REINFORCEMENTS DEPLOYED`,
        tier: 'streak3',
        timestamp: Date.now(),
      };
      setKillstreakBanner(waveBanner);
      setTimeout(() => {
        setKillstreakBanner((prev) => (prev?.id === waveBanner.id ? null : prev));
      }, 2400);
    }

    // Build live checklist
    const checklist: { label: string; completed: boolean }[] = [
      {
        label: `Eliminate Hostiles (${Math.min(
          matchKillsRef.current,
          level.enemyCount
        )}/${level.enemyCount})`,
        completed: matchKillsRef.current >= level.enemyCount,
      },
    ];

    if (level.requiredHeadshots) {
      checklist.push({
        label: `Headshots (${Math.min(
          matchHeadshotsRef.current,
          level.requiredHeadshots
        )}/${level.requiredHeadshots})`,
        completed: matchHeadshotsRef.current >= level.requiredHeadshots,
      });
    }
    if (level.requiredElites) {
      checklist.push({
        label: `Defeat Elite Bots (${Math.min(
          campaignElitesKilledRef.current,
          level.requiredElites
        )}/${level.requiredElites})`,
        completed: campaignElitesKilledRef.current >= level.requiredElites,
      });
    }
    if (level.requiredTerminals) {
      const termCount = campaignTerminalsActivatedRef.current.size;
      checklist.push({
        label: `Activate Terminals (${termCount}/${level.requiredTerminals})`,
        completed: termCount >= level.requiredTerminals,
      });
    }
    if (level.captureSecondsRequired) {
      const pct = Math.min(
        100,
        Math.round((campaignCaptureSecRef.current / level.captureSecondsRequired) * 100)
      );
      checklist.push({
        label: `Capture Outpost (${pct}%)`,
        completed: campaignCaptureSecRef.current >= level.captureSecondsRequired,
      });
    }
    if (level.isDefenseMission) {
      checklist.push({
        label: `Defense Integrity (${Math.round(campaignDefenseIntegrityRef.current)}%)`,
        completed:
          matchKillsRef.current >= level.enemyCount &&
          campaignDefenseIntegrityRef.current > 0,
      });
    }
    if (level.requiresExtraction) {
      checklist.push({
        label: 'Reach Extraction Beacon',
        completed: campaignExtractionReachedRef.current,
      });
    }
    if (level.requiresBossKill) {
      checklist.push({
        label: 'Eliminate Warlord Commander',
        completed: campaignBossKilledRef.current,
      });
    }

    const activeBoss = botsList.find(
      (b) => b.archetypeId === 'boss_enemy' && !b.isDead
    );

    setCampaignHudState({
      levelNumber: level.levelNumber,
      levelName: level.name,
      difficulty: level.difficulty,
      currentWave: campaignWaveRef.current,
      totalWaves: level.waves,
      livesRemaining: Math.max(0, level.maxLives - matchDeathsRef.current),
      checklist,
      secondaryLabel: level.secondaryObjectiveText,
      nearbyPrompt,
      bossHealth: activeBoss
        ? {
            name: activeBoss.name,
            current: activeBoss.health,
            max: activeBoss.maxHealth,
          }
        : null,
    });

    // Check failure conditions
    if (matchDeathsRef.current >= level.maxLives) {
      concludeCampaignMission(false, 'Out of Lives');
      return;
    }
    if (level.isDefenseMission && campaignDefenseIntegrityRef.current <= 0) {
      concludeCampaignMission(false, 'Command Point Captured by Hostiles');
      return;
    }
    if (remTime <= 0) {
      concludeCampaignMission(false, 'Mission Time Expired');
      return;
    }

    // Check primary completion
    const allComplete = checklist.every((c) => c.completed);
    if (allComplete) {
      concludeCampaignMission(true);
    }
  };

  const concludeCampaignMission = async (
    completed: boolean,
    failedReason?: string
  ) => {
    const level = activeCampaignLevelRef.current;
    if (!level || campaignFinishedRef.current) return;
    campaignFinishedRef.current = true;

    setGameState('results');
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }

    const elapsed = Math.max(1, campaignElapsedSecRef.current);
    const accPct = (shotsHitRef.current / Math.max(1, shotsFiredRef.current)) * 100;

    let secondaryOk = false;
    const crit = level.secondaryCriteria;
    if (crit.type === 'headshots') secondaryOk = matchHeadshotsRef.current >= crit.targetValue;
    else if (crit.type === 'max_deaths') secondaryOk = matchDeathsRef.current <= crit.targetValue;
    else if (crit.type === 'time_limit') secondaryOk = elapsed <= crit.targetValue;
    else if (crit.type === 'time_remaining')
      secondaryOk = level.timeLimitSec - elapsed >= crit.targetValue;
    else if (crit.type === 'accuracy') secondaryOk = accPct >= crit.targetValue;
    else if (crit.type === 'defense_integrity')
      secondaryOk = campaignDefenseIntegrityRef.current >= crit.targetValue;
    else if (crit.type === 'streak')
      secondaryOk = campaignMaxStreakRef.current >= crit.targetValue;

    const scoreOk = campaignScoreRef.current >= level.scoreTarget3Star;

    let stars = 0;
    if (completed) {
      stars = 1;
      if (secondaryOk) {
        stars = 2;
        if (scoreOk) {
          stars = 3;
        }
      }
    }

    const starBonusMult = completed ? 1 + (stars - 1) * 0.25 : 0.15;
    const xpEarned = Math.round(level.rewards.xp * starBonusMult);
    const coinsEarned = Math.round(level.rewards.coins * starBonusMult);

    const summary: MissionCompletionSummary = {
      completed,
      failedReason,
      level,
      starsEarned: stars,
      secondaryAchieved: secondaryOk,
      scoreTargetAchieved: scoreOk,
      completionTimeSec: elapsed,
      enemiesEliminated: matchKillsRef.current,
      headshots: matchHeadshotsRef.current,
      accuracyPct: accPct,
      deaths: matchDeathsRef.current,
      score: campaignScoreRef.current,
      xpEarned,
      coinsEarned,
      weaponUnlock: completed ? level.rewards.weaponUnlock : undefined,
      cosmeticReward: completed ? level.rewards.cosmeticReward : undefined,
      nextLevelNumber: completed && level.levelNumber < 15 ? level.levelNumber + 1 : undefined,
    };

    setCampaignCompletionSummary(summary);

    // Award global career XP too
    const xpRes = awardMatchXp(
      userStats,
      matchKillsRef.current,
      matchHeadshotsRef.current,
      completed
    );
    setUserStats(xpRes.updatedStats);
    saveUserStats(xpRes.updatedStats);

    if (completed) {
      const updatedProg = await recordCampaignLevelComplete({
        levelNumber: level.levelNumber,
        stars,
        score: campaignScoreRef.current,
        timeSec: elapsed,
        xpEarned,
        coinsEarned,
        weaponUnlock: level.rewards.weaponUnlock,
        cosmeticReward: level.rewards.cosmeticReward,
      });
      setCampaignProgress(updatedProg);
    }
  };

  // Start a Campaign Level Mission
  const handleStartCampaignMission = (level: CampaignLevelDefinition) => {
    if (!gameSceneRef.current) return;
    const scene = gameSceneRef.current;

    setIsCampaignOpen(false);
    setBriefingLevel(null);
    setCampaignCompletionSummary(null);
    setActiveCampaignLevel(level);
    activeCampaignLevelRef.current = level;
    setSelectedMode('campaign');
    setSelectedMap(level.mapId);

    if (MAPS[level.mapId]) {
      scene.loadMap(MAPS[level.mapId]);
    }
    scene.scene.background = new THREE.Color(level.fogColorHex);
    scene.scene.fog = new THREE.FogExp2(level.fogColorHex, 0.008);

    buildCampaignObjectMeshes(level);

    // Reset counters
    setMatchKills(0);
    matchKillsRef.current = 0;
    setMatchDeaths(0);
    matchDeathsRef.current = 0;
    setMatchHeadshots(0);
    matchHeadshotsRef.current = 0;
    setShotsFired(0);
    shotsFiredRef.current = 0;
    setShotsHit(0);
    shotsHitRef.current = 0;
    setKillFeed([]);
    setDamageNumbers([]);
    setDamageIndicators([]);
    setKillstreakBanner(null);

    currentStreakRef.current = 0;
    rapidKillCountRef.current = 0;
    campaignWaveRef.current = 1;
    campaignElitesKilledRef.current = 0;
    campaignBossKilledRef.current = false;
    campaignTerminalsActivatedRef.current = new Set();
    campaignCaptureSecRef.current = 0;
    campaignDefenseIntegrityRef.current = 100;
    campaignExtractionReachedRef.current = false;
    campaignMaxStreakRef.current = 0;
    campaignScoreRef.current = 0;
    campaignElapsedSecRef.current = 0;
    campaignFinishedRef.current = false;
    setTimeRemainingSec(level.timeLimitSec);

    // Split enemy composition into wave batches
    const comp = [...level.enemyComposition];
    const perWave = Math.max(1, Math.ceil(comp.length / Math.max(1, level.waves)));
    const firstBatch = comp.slice(0, perWave);
    campaignSpawnQueueRef.current = comp.slice(perWave);

    scene.botManager.spawnCampaignEnemies(
      firstBatch,
      level.botDifficultyKey,
      scene.currentMap.spawnPoints,
      scene.currentMap.botWaypoints,
      true
    );

    setPlayerScores([
      {
        id: 'player',
        name: 'Player',
        team: 'blue',
        isBot: false,
        kills: 0,
        deaths: 0,
        score: 0,
        ping: 10,
      },
    ]);

    if (scene.currentMap.spawnPoints.length > 0) {
      scene.playerController.respawn(scene.currentMap.spawnPoints[0]);
    }

    updateCampaignRuntimeTick(0, level, scene.playerController.position, scene.botManager.bots);

    setGameState('playing');
    requestPointerLock();
  };

  // Start a Quickplay Match
  const handleStartGame = () => {
    if (!gameSceneRef.current) return;
    const scene = gameSceneRef.current;

    clearCampaignObjectMeshes();
    setActiveCampaignLevel(null);
    activeCampaignLevelRef.current = null;
    setCampaignHudState(null);
    setCampaignCompletionSummary(null);

    const quickMode = selectedMode === 'campaign' ? 'ffa' : selectedMode;
    if (selectedMode === 'campaign') {
      setSelectedMode('ffa');
    }

    modeStateRef.current = createInitialModeState(quickMode);
    setMatchKills(0);
    matchKillsRef.current = 0;
    setMatchDeaths(0);
    matchDeathsRef.current = 0;
    setMatchHeadshots(0);
    matchHeadshotsRef.current = 0;
    setShotsFired(0);
    shotsFiredRef.current = 0;
    setShotsHit(0);
    shotsHitRef.current = 0;
    setKillFeed([]);
    setDamageNumbers([]);
    setDamageIndicators([]);
    setKillstreakBanner(null);
    currentStreakRef.current = 0;
    rapidKillCountRef.current = 0;

    scene.botManager.spawnBots(
      botCount,
      botDifficulty,
      quickMode,
      scene.currentMap.spawnPoints,
      scene.currentMap.botWaypoints
    );

    const initialScores: PlayerScoreEntry[] = [
      {
        id: 'player',
        name: 'Player',
        team: quickMode === 'tdm' || quickMode === 'hardpoint' ? 'blue' : 'ffa',
        isBot: false,
        kills: 0,
        deaths: 0,
        score: 0,
        ping: 12,
      },
      ...scene.botManager.bots.map((b) => ({
        id: b.id,
        name: b.name,
        team: b.team,
        isBot: true,
        kills: 0,
        deaths: 0,
        score: 0,
        ping: Math.floor(25 + Math.random() * 20),
      })),
    ];
    setPlayerScores(initialScores);

    if (scene.currentMap.spawnPoints.length > 0) {
      scene.playerController.respawn(scene.currentMap.spawnPoints[0]);
    }

    setGameState('playing');
    requestPointerLock();
  };

  const requestPointerLock = () => {
    const canvas = gameSceneRef.current?.renderer.domElement;
    if (canvas && document.pointerLockElement !== canvas) {
      canvas.requestPointerLock?.();
    }
  };

  const handleHit = (
    damage: number,
    isHeadshot: boolean,
    isKill: boolean,
    victimName: string,
    hitPos?: THREE.Vector3
  ) => {
    shotsHitRef.current += 1;
    setShotsHit(shotsHitRef.current);
    setHitmarkerActive(true);
    setIsHeadshotHit(isHeadshot);
    setTimeout(() => setHitmarkerActive(false), 90);

    if (hitPos && gameSceneRef.current) {
      // Spawn pooled 3D impact sparks
      gameSceneRef.current.spawnParticleBurst(
        hitPos,
        isKill ? 18 : isHeadshot ? 12 : 7,
        isHeadshot ? 0xef4444 : 0xf59e0b,
        isKill ? 11.0 : 8.0,
        isKill ? 1.15 : 0.85
      );

      if (isKill || isHeadshot) {
        gameSceneRef.current.triggerHitstop(0.042);
      }

      const vec = hitPos.clone();
      vec.project(gameSceneRef.current.camera);
      const screenPos =
        vec.z < 1.0
          ? {
              x: (vec.x * 0.5 + 0.5) * window.innerWidth,
              y: (-(vec.y * 0.5) + 0.5) * window.innerHeight,
            }
          : undefined;
      const newDn: DamageNumber = {
        id: `dn_${Date.now()}_${Math.random()}`,
        damage,
        isHeadshot,
        worldPos: {
          x: hitPos.x + (Math.random() - 0.5) * 0.35,
          y: hitPos.y + 0.3,
          z: hitPos.z + (Math.random() - 0.5) * 0.35,
        },
        screenPos,
        lifetime: 0.85,
        maxLifetime: 0.85,
      };
      setDamageNumbers((prev) => [...prev.slice(-12), newDn]);
    }

    if (isKill && gameSceneRef.current) {
      const ctrl = gameSceneRef.current.playerController;
      const comboRes = registerComboKill(ctrl.tactical);
      ctrl.tactical = comboRes.nextState;

      const now = Date.now();
      currentStreakRef.current += 1;
      campaignMaxStreakRef.current = Math.max(
        campaignMaxStreakRef.current,
        currentStreakRef.current
      );
      if (now - lastKillTimeRef.current < 4500) {
        rapidKillCountRef.current += 1;
      } else {
        rapidKillCountRef.current = 1;
      }
      lastKillTimeRef.current = now;

      const streak = currentStreakRef.current;
      const rapid = rapidKillCountRef.current;

      // Check killed bot archetype for campaign objectives
      if (activeCampaignLevelRef.current && gameSceneRef.current) {
        const killedBot = gameSceneRef.current.botManager.bots.find(
          (b) => b.name === victimName && b.isDead
        );
        const basePts = Math.round((killedBot?.scoreValue || 100) * comboRes.scoreMultiplier);
        campaignScoreRef.current += basePts + (isHeadshot ? 50 : 0);
        if (killedBot?.archetypeId === 'elite_soldier') {
          campaignElitesKilledRef.current += 1;
        } else if (killedBot?.archetypeId === 'boss_enemy') {
          campaignBossKilledRef.current = true;
        }
      }

      let banner: KillstreakBanner | null = null;
      if (rapid >= 3) {
        banner = {
          id: `ks_${now}`,
          title: 'TRIPLE ELIMINATION',
          subtitle: '+250 RAPID COMBAT BONUS',
          tier: 'triple',
          timestamp: now,
        };
        sound.playMultiKill('triple');
      } else if (rapid === 2) {
        banner = {
          id: `ks_${now}`,
          title: 'DOUBLE ELIMINATION',
          subtitle: '+150 MULTI-KILL BONUS',
          tier: 'double',
          timestamp: now,
        };
        sound.playMultiKill('double');
      } else if (streak >= 5) {
        banner = {
          id: `ks_${now}`,
          title: `${streak}X UNSTOPPABLE SPREE`,
          subtitle: 'DOMINATING THE ARENA',
          tier: 'spree',
          timestamp: now,
        };
        sound.playMultiKill('spree');
      } else if (streak === 3) {
        banner = {
          id: `ks_${now}`,
          title: '3X KILLSTREAK',
          subtitle: 'ON A ROLL',
          tier: 'streak3',
          timestamp: now,
        };
        sound.playMultiKill('streak3');
      } else {
        sound.playKillFanfare();
      }

      if (banner) {
        setKillstreakBanner(banner);
        setTimeout(() => {
          setKillstreakBanner((prev) => (prev?.id === banner?.id ? null : prev));
        }, 2600);
      }

      const nextKills = matchKillsRef.current + 1;
      matchKillsRef.current = nextKills;
      setMatchKills(nextKills);

      if (!activeCampaignLevelRef.current) {
        const res = handleKillScore(
          modeStateRef.current,
          selectedMode === 'tdm' || selectedMode === 'hardpoint' ? 'blue' : 'ffa',
          'Player',
          nextKills
        );
        modeStateRef.current = res.nextState;
        if (res.isVictory) {
          concludeMatch(res.nextState.winner);
        }
      }

      if (isHeadshot) {
        matchHeadshotsRef.current += 1;
        setMatchHeadshots(matchHeadshotsRef.current);
      }

      const entry: KillFeedEntry = {
        id: `kf_${Date.now()}_${Math.random()}`,
        killerName: 'Player',
        killerTeam: selectedMode === 'tdm' || selectedMode === 'hardpoint' ? 'blue' : 'ffa',
        victimName,
        victimTeam: selectedMode === 'tdm' || selectedMode === 'hardpoint' ? 'red' : 'ffa',
        weaponName: gameSceneRef.current?.playerController.equippedWeaponId || 'Rifle',
        isHeadshot,
        timestamp: Date.now(),
      };
      setKillFeed((prev) => [...prev, entry]);

      const bonusScore = Math.round((isHeadshot ? 150 : 100) * comboRes.scoreMultiplier);
      setPlayerScores((prev) =>
        prev.map((p) =>
          p.id === 'player'
            ? { ...p, kills: p.kills + 1, score: p.score + bonusScore }
            : p
        )
      );
    }
  };

  const handleBotDamagedPlayer = (
    botOrName: { name: string; position?: THREE.Vector3 } | string,
    damage: number
  ) => {
    if (!gameSceneRef.current || gameStateRef.current !== 'playing') return;
    const ctrl = gameSceneRef.current.playerController;

    if (ctrl.spawnShieldTimer > 0) return;

    const botName = typeof botOrName === 'string' ? botOrName : botOrName.name;
    const botPos = typeof botOrName === 'string' ? undefined : botOrName.position;

    // Overshield absorbs incoming damage first
    let remainingDamage = damage;
    if (ctrl.tactical.overshield > 0) {
      const absorbed = Math.min(ctrl.tactical.overshield, remainingDamage);
      ctrl.tactical.overshield -= absorbed;
      remainingDamage -= absorbed;
    }

    if (remainingDamage > 0) {
      ctrl.health = Math.max(0, ctrl.health - remainingDamage);
      ctrl.healthRegenDelay = 4.0;
      setHealth(ctrl.health);
    }

    gameSceneRef.current.addTrauma(0.28);
    sound.playDamageTick();
    if (ctrl.health > 0 && ctrl.health < 30) {
      sound.playHeartbeat();
    }

    if (botPos) {
      const dx = botPos.x - ctrl.position.x;
      const dz = botPos.z - ctrl.position.z;
      const worldAngle = Math.atan2(dx, -dz);
      const relAngle = worldAngle + ctrl.yaw;
      const indicatorId = `di_${Date.now()}_${Math.random()}`;
      setDamageIndicators((prev) => [
        ...prev.slice(-4),
        { id: indicatorId, angle: relAngle, timestamp: Date.now() },
      ]);
      setTimeout(() => {
        setDamageIndicators((prev) => prev.filter((item) => item.id !== indicatorId));
      }, 1200);
    }

    setDamageVignetteActive(true);
    setTimeout(() => setDamageVignetteActive(false), 180);

    if (ctrl.health <= 0) {
      currentStreakRef.current = 0;
      rapidKillCountRef.current = 0;
      matchDeathsRef.current += 1;
      setMatchDeaths(matchDeathsRef.current);

      const entry: KillFeedEntry = {
        id: `kf_${Date.now()}_${Math.random()}`,
        killerName: botName,
        killerTeam: selectedMode === 'tdm' || selectedMode === 'hardpoint' ? 'red' : 'ffa',
        victimName: 'Player',
        victimTeam: selectedMode === 'tdm' || selectedMode === 'hardpoint' ? 'blue' : 'ffa',
        weaponName: 'Rifle',
        isHeadshot: false,
        timestamp: Date.now(),
      };
      setKillFeed((prev) => [...prev, entry]);

      setPlayerScores((prev) =>
        prev.map((p) => {
          if (p.name === botName) return { ...p, kills: p.kills + 1, score: p.score + 100 };
          if (p.id === 'player') return { ...p, deaths: p.deaths + 1 };
          return p;
        })
      );

      setTimeout(() => {
        if (gameSceneRef.current && gameStateRef.current === 'playing') {
          const spawns = gameSceneRef.current.currentMap.spawnPoints;
          const randomSpawn =
            spawns[Math.floor(Math.random() * spawns.length)] || new THREE.Vector3(0, 0.5, 0);
          gameSceneRef.current.playerController.respawn(randomSpawn);
          setHealth(gameSceneRef.current.playerController.maxHealth);
          setSpawnShieldTimer(3.5);
        }
      }, 2200);
    }
  };

  const concludeMatch = (winner: string | null) => {
    setGameState('results');
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }

    const isVictory = winner === 'Player' || winner === 'Blue Team';
    const xpRes = awardMatchXp(
      userStats,
      matchKillsRef.current,
      matchHeadshotsRef.current,
      isVictory,
      matchDeathsRef.current,
      shotsFiredRef.current,
      shotsHitRef.current
    );
    setUserStats(xpRes.updatedStats);
    saveUserStats(xpRes.updatedStats);
    syncPersistedGameState({
      userStats: xpRes.updatedStats,
      preferences: {
        currentClass,
        selectedMap,
        selectedMode,
        botDifficulty,
        botCount,
        settings,
      },
      matchRecord: {
        mode: selectedMode,
        mapId: selectedMap,
        kills: matchKillsRef.current,
        deaths: matchDeathsRef.current,
        headshots: matchHeadshotsRef.current,
        score: matchKillsRef.current * 100 + matchHeadshotsRef.current * 50,
        isVictory,
      },
    });
    setMatchRewards({
      xpGained: xpRes.xpGained,
      didLevelUp: xpRes.didLevelUp,
      newLevel: xpRes.updatedStats.level,
    });
  };

  useEffect(() => {
    const handlePointerLockChange = () => {
      const isLocked = document.pointerLockElement === gameSceneRef.current?.renderer.domElement;
      if (gameSceneRef.current) {
        gameSceneRef.current.playerController.isPointerLocked = isLocked;
      }
      if (!isLocked && gameStateRef.current === 'playing') {
        setGameState('paused');
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (gameStateRef.current === 'playing' && gameSceneRef.current) {
        gameSceneRef.current.playerController.handleMouseMove(
          e.movementX,
          e.movementY,
          settingsRef.current
        );
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (gameStateRef.current === 'playing' && gameSceneRef.current) {
        const gs = gameSceneRef.current;
        if (e.button === 0) {
          gs.playerController.fireWeapon(
            gs.scene,
            gs.botManager,
            gs.currentMap.explosiveBarrels,
            gs.currentMap.destructibleCrates,
            gs.currentMap.targetDrones,
            (dmg, isHead, isKill, victim, hitPos) =>
              handleHit(dmg, isHead, isKill, victim, hitPos),
            () => {
              shotsFiredRef.current += 1;
              setShotsFired(shotsFiredRef.current);
              gs.addTrauma(0.08);
            },
            (type, pos) => {
              gs.spawnParticleBurst(
                pos,
                22,
                type === 'drone' ? 0x38bdf8 : 0xf59e0b,
                12.0,
                1.15
              );
              gs.triggerHitstop(0.042);
              gs.addTrauma(0.25);
              showToast(
                type === 'drone'
                  ? 'SKY DRONE SHATTERED · COOLDOWNS RESET (+150 PTS)'
                  : 'SUPPLY CRATE SHATTERED (+20 HP & AMMO)'
              );
            }
          );
        } else if (e.button === 2) {
          gs.playerController.isAimingDownSights = true;
        }
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (gameSceneRef.current && e.button === 2) {
        gameSceneRef.current.playerController.isAimingDownSights = false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Title Screen Start via Enter / Space when no sub-modal is open
      if (
        gameStateRef.current === 'menu' &&
        !anyModalOpenRef.current &&
        (e.code === 'Enter' || e.code === 'Space')
      ) {
        e.preventDefault();
        handleStartGame();
        return;
      }

      if (e.code === 'KeyM') {
        handleToggleMute();
      }

      if (e.code === 'KeyP' || e.code === 'Escape') {
        if (gameStateRef.current === 'playing') {
          setGameState('paused');
          if (document.pointerLockElement) document.exitPointerLock?.();
        } else if (gameStateRef.current === 'paused') {
          setGameState('playing');
          requestPointerLock();
        }
        return;
      }

      if (e.code === 'Tab') {
        e.preventDefault();
        setShowScoreboard((prev) => !prev);
        return;
      }

      if (gameStateRef.current === 'playing' && gameSceneRef.current) {
        const gs = gameSceneRef.current;
        const ctrl = gs.playerController;

        // [E]: Campaign terminal OR Turret Hack / Supply Crate Unlock / Grapple Hook
        if (e.code === 'KeyE') {
          let activatedTerminal = false;
          if (activeCampaignLevelRef.current) {
            const pos = ctrl.position;
            for (const obj of activeCampaignLevelRef.current.interactiveObjects) {
              if (obj.type === 'terminal' && !campaignTerminalsActivatedRef.current.has(obj.id)) {
                const d = Math.hypot(pos.x - obj.position.x, pos.z - obj.position.z);
                if (d <= obj.radius + 1.5) {
                  campaignTerminalsActivatedRef.current.add(obj.id);
                  campaignScoreRef.current += 200;
                  sound.playUiClick();
                  showToast(`${obj.label.toUpperCase()} ACTIVATED (+200 PTS)`);
                  activatedTerminal = true;
                }
              }
            }
          }

          if (!activatedTerminal) {
            ctrl.triggerInteractOrGrapple(
              gs.currentMap.turrets,
              gs.currentMap.supplyCrates,
              gs.currentMap.collisionBoxes,
              (msg) => showToast(msg)
            );
          }
        }

        // [G]: Plasma Frag Grenade
        if (e.code === 'KeyG') {
          ctrl.triggerPlasmaGrenade(gs.scene);
        }

        // [V]: Cyber Blade Melee
        if (e.code === 'KeyV') {
          ctrl.triggerCyberMelee(
            gs.botManager,
            gs.currentMap.destructibleCrates,
            (dmg, isHead, isKill, victim, hitPos) =>
              handleHit(dmg, isHead, isKill, victim, hitPos),
            (pos) => {
              gs.spawnParticleBurst(pos, 18, 0xf59e0b, 10.0, 1.1);
              showToast('CRATE SHATTERED (+25 HP)');
            }
          );
        }

        ctrl.handleKeyDown(e.code);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (gameSceneRef.current) {
        gameSceneRef.current.playerController.handleKeyUp(e.code);
      }
    };

    const handleBlur = () => {
      if (gameSceneRef.current) {
        gameSceneRef.current.playerController.clearKeys();
      }
    };

    document.addEventListener('pointerlockchange', handlePointerLockChange);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    window.addEventListener('blur', handleBlur);

    return () => {
      document.removeEventListener('pointerlockchange', handlePointerLockChange);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      window.removeEventListener('blur', handleBlur);
    };
  }, []);

  return (
    <div
      data-testid="krunker-fps-root"
      data-state={gameState}
      className="relative w-screen h-screen overflow-hidden bg-slate-950 font-rajdhani select-none"
    >
      {/* 3D Scene Viewport Canvas Mount Container */}
      <div
        ref={mountRef}
        onClick={() => {
          if (gameState === 'playing' && !document.pointerLockElement) {
            requestPointerLock();
          }
        }}
        className="absolute inset-0 w-full h-full cursor-crosshair z-0"
      />

      {/* Main Menu Screen */}
      {gameState === 'menu' && (
        <MainMenu
          currentClass={currentClass}
          selectedMap={selectedMap}
          selectedMode={selectedMode}
          botDifficulty={botDifficulty}
          botCount={botCount}
          campaignProgress={campaignProgress}
          cameraTourPreset={cameraTourPreset}
          onSelectCameraTourPreset={setCameraTourPreset}
          onSelectMap={setSelectedMap}
          onSelectMode={setSelectedMode}
          onSelectBotDifficulty={setBotDifficulty}
          onSelectBotCount={setBotCount}
          onStartGame={handleStartGame}
          onOpenCampaign={() => setIsCampaignOpen(true)}
          onOpenClassSelect={() => setIsClassSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenPythonStudio={() => setIsPythonStudioOpen(true)}
        />
      )}

      {/* In-Game Active HUD */}
      {gameState === 'playing' && (
        <HUD
          health={health}
          maxHealth={maxHealth}
          classId={currentClass}
          equippedWeaponId={equippedWeaponId}
          currentMag={currentMag}
          reserveAmmo={reserveAmmo}
          isReloading={isReloading}
          reloadProgress={reloadProgress}
          isAimingDownSights={isAimingDownSights}
          isInspecting={isInspecting}
          spawnShieldTimer={spawnShieldTimer}
          pickupNotification={pickupNotification}
          speed={speed}
          hitmarkerActive={hitmarkerActive}
          isHeadshotHit={isHeadshotHit}
          damageVignetteActive={damageVignetteActive}
          damageNumbers={damageNumbers}
          damageIndicators={damageIndicators}
          killstreakBanner={killstreakBanner}
          mode={selectedMode}
          timeRemainingSec={timeRemainingSec}
          blueScore={blueScore}
          redScore={redScore}
          targetScore={
            activeCampaignLevel
              ? activeCampaignLevel.enemyCount
              : selectedMode === 'ffa'
              ? 15
              : 25
          }
          killFeed={killFeed}
          showScoreboard={showScoreboard}
          playerScores={playerScores}
          settings={settings}
          fps={fps}
          playerPos={playerPos}
          playerYaw={playerYaw}
          botPositions={botPositions}
          jumpPadPositions={
            gameSceneRef.current?.currentMap.jumpPads.map((jp) => jp.position) || []
          }
          pickupPositions={
            gameSceneRef.current?.currentMap.pickups.map((pk) => ({
              x: pk.position.x,
              z: pk.position.z,
              type: pk.type,
              isAvailable: pk.isAvailable,
            })) || []
          }
          teleporterPositions={
            gameSceneRef.current?.currentMap.teleporters.map((tp) => ({
              x: tp.position.x,
              z: tp.position.z,
              colorHex: tp.colorHex,
            })) || []
          }
          turretPositions={
            gameSceneRef.current?.currentMap.turrets.map((tur) => ({
              x: tur.position.x,
              z: tur.position.z,
              owner: tur.owner,
            })) || []
          }
          supplyCratePositions={
            gameSceneRef.current?.currentMap.supplyCrates.map((sc) => ({
              x: sc.position.x,
              z: sc.position.z,
              isAvailable: sc.isAvailable,
            })) || []
          }
          tactical={tacticalState}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onTriggerPause={() => {
            setGameState('paused');
            if (document.pointerLockElement) document.exitPointerLock?.();
          }}
          onTriggerRestart={() => {
            if (activeCampaignLevel) {
              handleStartCampaignMission(activeCampaignLevel);
            } else {
              handleStartGame();
            }
          }}
          campaignHud={activeCampaignLevel ? campaignHudState : null}
        />
      )}

      {/* Pause Menu Modal */}
      {gameState === 'paused' && (
        <PauseModal
          isCampaignMode={Boolean(activeCampaignLevel)}
          campaignLevelName={
            activeCampaignLevel
              ? `Level ${activeCampaignLevel.levelNumber}: ${activeCampaignLevel.name}`
              : undefined
          }
          onResume={() => {
            setGameState('playing');
            requestPointerLock();
          }}
          onRestartLevel={() => {
            if (activeCampaignLevel) {
              handleStartCampaignMission(activeCampaignLevel);
            } else {
              handleStartGame();
            }
          }}
          onOpenLevelSelection={() => {
            setGameState('menu');
            setIsCampaignOpen(true);
          }}
          onOpenClassSelect={() => setIsClassSelectOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenPythonStudio={() => setIsPythonStudioOpen(true)}
          onReturnToMenu={() => {
            clearCampaignObjectMeshes();
            setActiveCampaignLevel(null);
            setCampaignHudState(null);
            setGameState('menu');
          }}
        />
      )}

      {/* Campaign Mission Complete Modal */}
      {gameState === 'results' && activeCampaignLevel && campaignCompletionSummary && (
        <MissionCompleteModal
          summary={campaignCompletionSummary}
          onNextLevel={(nextLvlNum) => {
            const nextLvl = CAMPAIGN_LEVELS_LIST.find((l) => l.levelNumber === nextLvlNum);
            if (nextLvl) {
              setBriefingLevel(nextLvl);
              setGameState('menu');
            }
          }}
          onReplayLevel={() => {
            handleStartCampaignMission(activeCampaignLevel);
          }}
          onOpenLevelSelection={() => {
            setGameState('menu');
            setIsCampaignOpen(true);
          }}
          onReturnToMainMenu={() => {
            clearCampaignObjectMeshes();
            setActiveCampaignLevel(null);
            setCampaignHudState(null);
            setGameState('menu');
          }}
        />
      )}

      {/* Quickplay Match Results Modal */}
      {gameState === 'results' && !activeCampaignLevel && (
        <ResultsModal
          winner={modeStateRef.current.winner}
          mode={selectedMode}
          matchKills={matchKills}
          matchDeaths={matchDeaths}
          matchHeadshots={matchHeadshots}
          xpGained={matchRewards.xpGained}
          didLevelUp={matchRewards.didLevelUp}
          newLevel={matchRewards.newLevel}
          onPlayAgain={handleStartGame}
          onReturnToMenu={() => setGameState('menu')}
        />
      )}

      {/* Campaign 15-Level Selection Modal */}
      {isCampaignOpen && !briefingLevel && (
        <CampaignModal
          progress={campaignProgress}
          onSelectLevelForBriefing={(lvl) => {
            setBriefingLevel(lvl);
          }}
          onClose={() => setIsCampaignOpen(false)}
        />
      )}

      {/* Pre-Mission Briefing Modal */}
      {briefingLevel && (
        <MissionBriefingModal
          level={briefingLevel}
          onStartMission={(lvl) => {
            handleStartCampaignMission(lvl);
          }}
          onBackToCampaign={() => {
            setBriefingLevel(null);
            setIsCampaignOpen(true);
          }}
        />
      )}

      {/* Other Modals */}
      {isClassSelectOpen && (
        <ClassSelectModal
          currentClass={currentClass}
          onSelectClass={(id) => setCurrentClass(id)}
          onClose={() => setIsClassSelectOpen(false)}
        />
      )}

      {isSettingsOpen && (
        <SettingsModal
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {isStatsOpen && (
        <StatsModal stats={userStats} onClose={() => setIsStatsOpen(false)} />
      )}

      {isPythonStudioOpen && (
        <PythonStudioModal onClose={() => setIsPythonStudioOpen(false)} />
      )}
    </div>
  );
}
