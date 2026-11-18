import * as THREE from 'three';
import { BotDifficulty, WeaponId, ClassId } from '../types';
import { WEAPON_REGISTRY, CLASS_REGISTRY } from '../weapons/weaponConfig';
import { Box3Like } from '../physics/movementMath';
import { createProceduralWeaponModel } from '../weapons/weaponModels';
import { sound } from '../audio/soundSystem';
import { ENEMY_ARCHETYPE_REGISTRY, EnemyArchetypeId } from '../campaign/campaignData';

export interface BotEntity {
  id: string;
  name: string;
  team: 'blue' | 'red' | 'ffa';
  difficulty: BotDifficulty;
  classId: ClassId;
  weaponId: WeaponId;
  archetypeId: EnemyArchetypeId;
  speedMultiplier: number;
  damageMultiplier: number;
  accuracyBonus: number;
  scoreValue: number;
  baseColorHex: number;
  allowAutoRespawn: boolean;
  health: number;
  maxHealth: number;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  yaw: number;
  pitch: number;
  group: THREE.Group;
  headMesh: THREE.Mesh;
  bodyMesh: THREE.Mesh;
  telegraphLine?: THREE.Line;
  state: 'patrol' | 'alerted' | 'combat' | 'retreat';
  alertTimer: number;
  windupTimer: number;
  isWindingUp: boolean;
  targetWaypoint: THREE.Vector3 | null;
  targetEntityId: string | null;
  currentMag: number;
  isReloading: boolean;
  reloadTimer: number;
  fireCooldown: number;
  burstCount: number;
  burstPauseTimer: number;
  strafeTimer: number;
  strafeDir: number;
  isDead: boolean;
  koTimer: number;
  respawnTimer: number;
  kills: number;
  deaths: number;
  hitFlashTimer: number;
}

const BOT_NAMES = [
  'Ghost', 'Viper', 'Striker', 'Apex', 'Shadow',
  'Havoc', 'Rogue', 'Titan', 'Specter', 'Cipher', 'Blaze', 'Frost',
];

// Reusable math objects to avoid per-frame GC allocations
const _strafeVec = new THREE.Vector3();
const _fwdVec = new THREE.Vector3();
const _dirVec = new THREE.Vector3();

export class BotManager {
  public bots: BotEntity[] = [];
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene) {
    this.scene = scene;
  }

  public spawnBots(
    count: number,
    difficulty: BotDifficulty,
    mode: 'ffa' | 'tdm' | 'hardpoint' | 'parkour' | 'campaign',
    spawnPoints: THREE.Vector3[],
    botWaypoints: THREE.Vector3[]
  ) {
    this.cleanup();

    const classKeys: ClassId[] = ['triggerman', 'hunter', 'run_n_gun', 'vince', 'detective', 'marksman'];
    const archetypesCycle: EnemyArchetypeId[] = [
      'standard_soldier',
      'fast_runner',
      'sniper_bot',
      'heavy_soldier',
      'elite_soldier',
    ];

    for (let i = 0; i < count; i++) {
      const name = BOT_NAMES[i % BOT_NAMES.length] + `_${Math.floor(Math.random() * 90 + 10)}`;
      const classId = classKeys[i % classKeys.length];
      const classData = CLASS_REGISTRY[classId];
      const archId = archetypesCycle[i % archetypesCycle.length];
      const arch = ENEMY_ARCHETYPE_REGISTRY[archId];
      const weaponId = classData.primaryWeapon;

      let team: 'blue' | 'red' | 'ffa' = 'ffa';
      if (mode === 'tdm' || mode === 'hardpoint') {
        team = i % 2 === 0 ? 'red' : 'blue';
      }

      let teamColor = arch.colorHex;
      if (team === 'blue') teamColor = 0x3b82f6;
      else if (team === 'ffa' && i === 0) teamColor = 0xf59e0b;

      this.createBotEntity({
        index: i,
        name,
        team,
        difficulty,
        classId,
        weaponId,
        archetypeId: archId,
        health: classData.maxHealth,
        speedMultiplier: arch.speedMultiplier,
        damageMultiplier: 1.0,
        accuracyBonus: 0.0,
        scoreValue: arch.scoreValue,
        colorHex: teamColor,
        visorHex: team === 'blue' ? 0x38bdf8 : arch.visorHex,
        scale: arch.scale,
        allowAutoRespawn: true,
        spawnPoints,
        botWaypoints,
      });
    }
  }

  public spawnCampaignEnemies(
    archetypes: EnemyArchetypeId[],
    difficulty: BotDifficulty,
    spawnPoints: THREE.Vector3[],
    botWaypoints: THREE.Vector3[],
    clearExisting: boolean = true
  ) {
    if (clearExisting) {
      this.cleanup();
    }

    const startIndex = this.bots.length;
    archetypes.forEach((archId, idx) => {
      const arch = ENEMY_ARCHETYPE_REGISTRY[archId] || ENEMY_ARCHETYPE_REGISTRY.standard_soldier;
      const index = startIndex + idx;
      const callsign =
        archId === 'boss_enemy'
          ? 'WARLORD COMMANDER'
          : archId === 'elite_soldier'
          ? `ELITE_${BOT_NAMES[index % BOT_NAMES.length].toUpperCase()}`
          : `${arch.name.split(' ')[0].toUpperCase()}_${index + 1}`;

      this.createBotEntity({
        index,
        name: callsign,
        team: 'red',
        difficulty,
        classId: 'triggerman',
        weaponId: arch.weaponId,
        archetypeId: archId,
        health: arch.health,
        speedMultiplier: arch.speedMultiplier,
        damageMultiplier: arch.damageMultiplier,
        accuracyBonus: arch.accuracyBonus,
        scoreValue: arch.scoreValue,
        colorHex: arch.colorHex,
        visorHex: arch.visorHex,
        scale: arch.scale,
        allowAutoRespawn: false,
        spawnPoints,
        botWaypoints,
      });
    });
  }

  private createBotEntity(params: {
    index: number;
    name: string;
    team: 'blue' | 'red' | 'ffa';
    difficulty: BotDifficulty;
    classId: ClassId;
    weaponId: WeaponId;
    archetypeId: EnemyArchetypeId;
    health: number;
    speedMultiplier: number;
    damageMultiplier: number;
    accuracyBonus: number;
    scoreValue: number;
    colorHex: number;
    visorHex: number;
    scale: number;
    allowAutoRespawn: boolean;
    spawnPoints: THREE.Vector3[];
    botWaypoints: THREE.Vector3[];
  }) {
    const {
      index,
      name,
      team,
      difficulty,
      classId,
      weaponId,
      archetypeId,
      health,
      speedMultiplier,
      damageMultiplier,
      accuracyBonus,
      scoreValue,
      colorHex,
      visorHex,
      scale,
      allowAutoRespawn,
      spawnPoints,
      botWaypoints,
    } = params;

    const weapon = WEAPON_REGISTRY[weaponId];
    const baseSpawn =
      spawnPoints.length > 0
        ? spawnPoints[(index + 1) % spawnPoints.length].clone()
        : new THREE.Vector3(0, 0.5, -20);
    baseSpawn.x += (Math.random() - 0.5) * 6;
    baseSpawn.z += (Math.random() - 0.5) * 6;

    const group = new THREE.Group();
    group.position.copy(baseSpawn);
    group.scale.set(scale, scale, scale);

    // 0. Contact Shadow Grounding Disc
    const shadowGeo = new THREE.CircleGeometry(0.62, 16);
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = new THREE.MeshBasicMaterial({
      color: 0x000000,
      transparent: true,
      opacity: 0.42,
      depthWrite: false,
    });
    const shadowDisc = new THREE.Mesh(shadowGeo, shadowMat);
    shadowDisc.position.y = 0.02;
    group.add(shadowDisc);

    // 1. Tactical Helmet & Head
    const headGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const headMat = new THREE.MeshStandardMaterial({
      color: archetypeId === 'boss_enemy' ? 0xfbbf24 : 0xf1c40f,
      roughness: 0.55,
    });
    const headMesh = new THREE.Mesh(headGeo, headMat);
    headMesh.position.set(0, 1.6, 0);
    headMesh.castShadow = true;
    group.add(headMesh);

    const helmetGeo = new THREE.BoxGeometry(0.56, 0.28, 0.56);
    const helmetMat = new THREE.MeshStandardMaterial({
      color: archetypeId === 'boss_enemy' ? 0x991b1b : 0x1e293b,
      roughness: 0.4,
      metalness: 0.5,
    });
    const helmet = new THREE.Mesh(helmetGeo, helmetMat);
    helmet.position.set(0, 1.76, 0);
    group.add(helmet);

    const visorGeo = new THREE.BoxGeometry(0.48, 0.14, 0.15);
    const visorMat = new THREE.MeshBasicMaterial({ color: visorHex });
    const visor = new THREE.Mesh(visorGeo, visorMat);
    visor.position.set(0, 1.62, -0.26);
    group.add(visor);

    // 2. Torso with Tactical Vest & Shoulder Pads
    const bodyGeo = new THREE.BoxGeometry(0.68, 0.78, 0.42);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: colorHex,
      roughness: 0.65,
      metalness: 0.2,
    });
    const bodyMesh = new THREE.Mesh(bodyGeo, bodyMat);
    bodyMesh.position.set(0, 1.0, 0);
    bodyMesh.castShadow = true;
    group.add(bodyMesh);

    const vestGeo = new THREE.BoxGeometry(0.72, 0.45, 0.48);
    const vestMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.4,
      metalness: 0.6,
    });
    const vest = new THREE.Mesh(vestGeo, vestMat);
    vest.position.set(0, 1.05, 0);
    group.add(vest);

    // 3. Legs
    const legGeo = new THREE.BoxGeometry(0.28, 0.65, 0.3);
    const legMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8 });
    const leftLeg = new THREE.Mesh(legGeo, legMat);
    leftLeg.position.set(-0.18, 0.32, 0);
    const rightLeg = new THREE.Mesh(legGeo, legMat);
    rightLeg.position.set(0.18, 0.32, 0);
    group.add(leftLeg, rightLeg);

    // 4. Arms & Weapon
    const armGeo = new THREE.BoxGeometry(0.2, 0.6, 0.24);
    const leftArm = new THREE.Mesh(armGeo, bodyMat);
    leftArm.position.set(-0.48, 1.0, 0);
    const rightArm = new THREE.Mesh(armGeo, bodyMat);
    rightArm.position.set(0.48, 1.0, 0);
    group.add(leftArm, rightArm);

    const botGun = createProceduralWeaponModel(weaponId);
    botGun.scale.set(0.65, 0.65, 0.65);
    botGun.position.set(0.25, 0.9, -0.32);
    group.add(botGun);

    // 5. Sniper / Boss Laser Windup Telegraph Line
    const telegraphPts = [new THREE.Vector3(0.25, 1.1, -0.5), new THREE.Vector3(0, 1.1, -28)];
    const telegraphGeo = new THREE.BufferGeometry().setFromPoints(telegraphPts);
    const telegraphMat = new THREE.LineBasicMaterial({
      color: archetypeId === 'sniper_bot' ? 0xef4444 : 0xf59e0b,
      transparent: true,
      opacity: 0.85,
    });
    const telegraphLine = new THREE.Line(telegraphGeo, telegraphMat);
    telegraphLine.visible = false;
    group.add(telegraphLine);

    this.scene.add(group);

    const bot: BotEntity = {
      id: `bot_${index}_${Date.now()}`,
      name,
      team,
      difficulty,
      classId,
      weaponId,
      archetypeId,
      speedMultiplier,
      damageMultiplier,
      accuracyBonus,
      scoreValue,
      baseColorHex: colorHex,
      allowAutoRespawn,
      health,
      maxHealth: health,
      position: baseSpawn,
      velocity: new THREE.Vector3(),
      yaw: Math.random() * Math.PI * 2,
      pitch: 0,
      group,
      headMesh,
      bodyMesh,
      telegraphLine,
      state: 'patrol',
      alertTimer: 0,
      windupTimer: 0,
      isWindingUp: false,
      targetWaypoint: botWaypoints.length > 0 ? botWaypoints[index % botWaypoints.length].clone() : null,
      targetEntityId: null,
      currentMag: weapon.magazineSize,
      isReloading: false,
      reloadTimer: 0,
      fireCooldown: 0.8,
      burstCount: 0,
      burstPauseTimer: 0,
      strafeTimer: 0,
      strafeDir: 1,
      isDead: false,
      koTimer: 0,
      respawnTimer: 0,
      kills: 0,
      deaths: 0,
      hitFlashTimer: 0,
    };

    this.bots.push(bot);
  }

  public update(
    dt: number,
    playerPos: THREE.Vector3,
    playerHealth: number,
    isPlayerShielded: boolean,
    botWaypoints: THREE.Vector3[],
    _collisionBoxes: Box3Like[],
    onBotShootPlayer: (bot: BotEntity, damage: number) => void
  ) {
    // Crowd attack token pool: cap simultaneous active attackers to 3 so large waves stay readable
    let activeAttackers = 0;

    for (const bot of this.bots) {
      if (bot.isDead) {
        if (bot.koTimer > 0) {
          bot.koTimer = Math.max(0, bot.koTimer - dt);
          const progress = 1 - bot.koTimer / 0.36;
          bot.group.rotation.x = -progress * (Math.PI / 2.1);
          bot.group.position.y = Math.sin(progress * Math.PI) * 0.35;
          if (bot.koTimer <= 0) {
            bot.group.visible = false;
            bot.group.rotation.x = 0;
          }
          continue;
        }
        if (!bot.allowAutoRespawn) {
          continue;
        }
        bot.respawnTimer -= dt;
        if (bot.respawnTimer <= 0) {
          bot.isDead = false;
          bot.health = bot.maxHealth;
          bot.group.visible = true;
          bot.group.rotation.set(0, bot.yaw, 0);
          const spawnPt =
            botWaypoints[Math.floor(Math.random() * botWaypoints.length)] || new THREE.Vector3(0, 0.5, 0);
          bot.position.copy(spawnPt);
          bot.group.position.copy(spawnPt);
          bot.fireCooldown = 1.2;
        }
        continue;
      }

      if (bot.hitFlashTimer > 0) {
        bot.hitFlashTimer -= dt;
        if (bot.hitFlashTimer <= 0) {
          const mat = bot.bodyMesh.material as THREE.MeshStandardMaterial;
          mat.color.setHex(bot.baseColorHex);
          mat.emissive.setHex(0x000000);
        }
      }

      if (bot.fireCooldown > 0) bot.fireCooldown -= dt;
      if (bot.burstPauseTimer > 0) bot.burstPauseTimer -= dt;

      if (bot.isReloading) {
        bot.reloadTimer -= dt;
        if (bot.reloadTimer <= 0) {
          bot.isReloading = false;
          bot.currentMag = WEAPON_REGISTRY[bot.weaponId].magazineSize;
        }
      }

      const distToPlayer = bot.position.distanceTo(playerPos);
      const isPlayerAlive = playerHealth > 0;
      const sightRange = bot.archetypeId === 'sniper_bot' || bot.archetypeId === 'boss_enemy' ? 65 : 44;
      const canSeePlayer = isPlayerAlive && distToPlayer < sightRange && !isPlayerShielded;
      const baseSpeed = bot.difficulty === 'pro' ? 8.5 : bot.difficulty === 'hard' ? 7.5 : 6.0;
      const speed = baseSpeed * bot.speedMultiplier;

      if (canSeePlayer) {
        if (bot.state !== 'combat' && bot.state !== 'alerted') {
          bot.state = 'alerted';
          bot.alertTimer = bot.difficulty === 'pro' ? 0.28 : bot.difficulty === 'hard' ? 0.5 : 0.85;
        }

        if (bot.state === 'alerted') {
          bot.alertTimer -= dt;
          if (bot.alertTimer <= 0) {
            bot.state = 'combat';
          }
        }

        const dx = playerPos.x - bot.position.x;
        const dz = playerPos.z - bot.position.z;
        const targetYaw = Math.atan2(dx, dz) + Math.PI;
        bot.yaw = THREE.MathUtils.lerp(bot.yaw, targetYaw, dt * 8);
        bot.group.rotation.y = bot.yaw;

        // Distinct Movement Policies by Archetype
        bot.strafeTimer -= dt;
        if (bot.strafeTimer <= 0) {
          bot.strafeDir = Math.random() > 0.5 ? 1 : -1;
          bot.strafeTimer = bot.archetypeId === 'fast_runner' ? 0.55 : 1.1 + Math.random() * 1.2;
        }

        _strafeVec.set(
          Math.cos(bot.yaw) * bot.strafeDir,
          0,
          -Math.sin(bot.yaw) * bot.strafeDir
        );

        if (bot.archetypeId === 'fast_runner') {
          // Policy 1: Aggressive weaving flanker/rusher
          bot.position.addScaledVector(_strafeVec, speed * 0.78 * dt);
          if (distToPlayer > 5.5) {
            _fwdVec.set(-Math.sin(bot.yaw), 0, -Math.cos(bot.yaw));
            bot.position.addScaledVector(_fwdVec, speed * 0.95 * dt);
          }
        } else if (bot.archetypeId === 'sniper_bot') {
          // Policy 2: Long-range overwatch kiter (backs away if player closes in)
          bot.position.addScaledVector(_strafeVec, speed * 0.35 * dt);
          if (distToPlayer < 22) {
            _fwdVec.set(Math.sin(bot.yaw), 0, Math.cos(bot.yaw));
            bot.position.addScaledVector(_fwdVec, speed * 0.75 * dt);
          }
        } else if (bot.archetypeId === 'heavy_soldier' || bot.archetypeId === 'boss_enemy') {
          // Policy 3: Heavy Juggernaut steady advance
          bot.position.addScaledVector(_strafeVec, speed * 0.25 * dt);
          if (distToPlayer > 11) {
            _fwdVec.set(-Math.sin(bot.yaw), 0, -Math.cos(bot.yaw));
            bot.position.addScaledVector(_fwdVec, speed * 0.65 * dt);
          }
        } else {
          // Policy 4: Tactical medium-range strafe soldier (retreats when low HP)
          bot.position.addScaledVector(_strafeVec, speed * 0.55 * dt);
          if (bot.health < bot.maxHealth * 0.3 && distToPlayer < 18) {
            _fwdVec.set(Math.sin(bot.yaw), 0, Math.cos(bot.yaw));
            bot.position.addScaledVector(_fwdVec, speed * 0.7 * dt);
          } else if (distToPlayer > 15) {
            _fwdVec.set(-Math.sin(bot.yaw), 0, -Math.cos(bot.yaw));
            bot.position.addScaledVector(_fwdVec, speed * 0.7 * dt);
          } else if (distToPlayer < 7) {
            _fwdVec.set(Math.sin(bot.yaw), 0, Math.cos(bot.yaw));
            bot.position.addScaledVector(_fwdVec, speed * 0.55 * dt);
          }
        }

        // Visible Windup Telegraph for Heavy / Sniper / Boss attacks
        const needsTelegraph =
          bot.archetypeId === 'sniper_bot' ||
          bot.archetypeId === 'heavy_soldier' ||
          bot.archetypeId === 'boss_enemy';

        if (bot.isWindingUp) {
          bot.windupTimer -= dt;
          if (bot.telegraphLine) bot.telegraphLine.visible = true;
          if (bot.windupTimer <= 0) {
            bot.isWindingUp = false;
            if (bot.telegraphLine) bot.telegraphLine.visible = false;
            this.executeBotShot(bot, distToPlayer, onBotShootPlayer);
          }
        } else if (
          bot.state === 'combat' &&
          bot.fireCooldown <= 0 &&
          bot.burstPauseTimer <= 0 &&
          !bot.isReloading &&
          activeAttackers < 3
        ) {
          activeAttackers++;
          if (bot.currentMag > 0) {
            if (needsTelegraph) {
              bot.isWindingUp = true;
              bot.windupTimer = 0.38;
              if (bot.telegraphLine) bot.telegraphLine.visible = true;
            } else {
              this.executeBotShot(bot, distToPlayer, onBotShootPlayer);
            }
          } else {
            bot.isReloading = true;
            bot.reloadTimer = WEAPON_REGISTRY[bot.weaponId].reloadTimeSec;
          }
        }
      } else {
        bot.state = 'patrol';
        bot.isWindingUp = false;
        if (bot.telegraphLine) bot.telegraphLine.visible = false;

        if (!bot.targetWaypoint || bot.position.distanceTo(bot.targetWaypoint) < 3.0) {
          if (botWaypoints.length > 0) {
            bot.targetWaypoint = botWaypoints[Math.floor(Math.random() * botWaypoints.length)].clone();
          }
        }

        if (bot.targetWaypoint) {
          _dirVec.subVectors(bot.targetWaypoint, bot.position);
          _dirVec.y = 0;
          if (_dirVec.lengthSq() > 0.01) {
            _dirVec.normalize();
            bot.position.addScaledVector(_dirVec, speed * 0.6 * dt);
            bot.yaw = THREE.MathUtils.lerp(bot.yaw, Math.atan2(_dirVec.x, _dirVec.z) + Math.PI, dt * 4);
            bot.group.rotation.y = bot.yaw;
          }
        }
      }

      // Distance-synced gait bob
      bot.position.y = 0;
      bot.group.position.copy(bot.position);
    }
  }

  private executeBotShot(
    bot: BotEntity,
    distToPlayer: number,
    onBotShootPlayer: (bot: BotEntity, damage: number) => void
  ) {
    bot.currentMag--;
    const wpn = WEAPON_REGISTRY[bot.weaponId];
    bot.fireCooldown = (1 / wpn.fireRateRps) * 1.18;
    bot.burstCount++;

    if (bot.burstCount >= 3) {
      bot.burstCount = 0;
      bot.burstPauseTimer = 0.65 + Math.random() * 0.45;
    }

    const baseAcc =
      bot.difficulty === 'pro'
        ? 0.56
        : bot.difficulty === 'hard'
        ? 0.42
        : bot.difficulty === 'normal'
        ? 0.28
        : 0.16;
    const distFactor = Math.max(0.35, 1.0 - distToPlayer / 58);
    const hitChance = Math.min(0.85, Math.max(0.1, (baseAcc + bot.accuracyBonus) * distFactor));

    if (Math.random() < hitChance) {
      const dmg = Math.max(4, Math.round(wpn.damage * 0.62 * bot.damageMultiplier));
      onBotShootPlayer(bot, dmg);
    }
    sound.playShoot(bot.weaponId);
  }

  public damageBot(
    botId: string,
    damage: number,
    _isHeadshot: boolean
  ): { isKilled: boolean; bot: BotEntity | null } {
    const bot = this.bots.find((b) => b.id === botId);
    if (!bot || bot.isDead) return { isKilled: false, bot: null };

    bot.health -= damage;
    bot.hitFlashTimer = 0.08;
    const mat = bot.bodyMesh.material as THREE.MeshStandardMaterial;
    mat.color.setHex(0xffffff);
    mat.emissive.setHex(0xf59e0b);

    if (bot.health <= 0) {
      bot.health = 0;
      bot.isDead = true;
      bot.isWindingUp = false;
      if (bot.telegraphLine) bot.telegraphLine.visible = false;
      bot.deaths += 1;
      bot.koTimer = 0.36; // 0.36s KO topple arc before hiding!
      bot.respawnTimer = bot.allowAutoRespawn ? 3.5 : 999999;
      return { isKilled: true, bot };
    }

    return { isKilled: false, bot };
  }

  public cleanup() {
    for (const bot of this.bots) {
      this.scene.remove(bot.group);
    }
    this.bots = [];
  }
}
