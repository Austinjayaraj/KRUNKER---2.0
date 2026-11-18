import * as THREE from 'three';
import {
  WeaponId,
  ClassId,
  WeaponSkinId,
  GameSettings,
  InteractiveJumpPad,
  InteractivePickup,
  ExplosiveBarrel,
  InteractiveTeleporter,
  InteractiveTurret,
  InteractiveSupplyCrate,
  DestructibleCrate,
  TargetDrone,
  PlayerTacticalState,
} from '../types';
import {
  WEAPON_REGISTRY,
  CLASS_REGISTRY,
  calculateHitDamage,
  consumeWeaponAmmo,
  calculateReload,
} from '../weapons/weaponConfig';
import {
  DEFAULT_MOVEMENT_CONFIG,
  applyAccelerate,
  applyFriction,
  resolveMovementCollisions,
  Box3Like,
} from '../physics/movementMath';
import { createTacticalArmsAndWeapon, EjectedShell } from '../weapons/tacticalRig';
import {
  createInitialTacticalState,
  stepTacticalTimers,
  tryActivateDash,
  tryThrowGrenade,
  trySwingMelee,
  openSupplyCrate,
  hackSentryTurret,
  checkTeleporterTrigger,
} from '../mechanics/interactiveWorld';
import { sound } from '../audio/soundSystem';
import { BotManager } from '../bots/botManager';

export interface RocketProjectile {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Mesh;
  aliveTime: number;
}

export interface GrenadeProjectile {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  mesh: THREE.Group;
  fuseTimer: number;
}

// Reusable scratch vectors
const _wishDir = new THREE.Vector3();
const _fwd = new THREE.Vector3();
const _right = new THREE.Vector3();
const _rayDir = new THREE.Vector3();

export class FPSController {
  public camera: THREE.PerspectiveCamera;
  public classId: ClassId;
  public equippedWeaponId: WeaponId;
  public secondaryWeaponId: WeaponId;
  public currentSkin: WeaponSkinId = 'tactical';
  public health: number;
  public maxHealth: number;

  // Tactical Abilities & World Buffs
  public tactical: PlayerTacticalState = createInitialTacticalState();
  private dashTimer: number = 0;
  private dashDir: THREE.Vector3 = new THREE.Vector3();
  private grappleTimer: number = 0;
  private meleeAnimTimer: number = 0;

  // Position & Velocity
  public position: THREE.Vector3;
  public velocity: THREE.Vector3;
  public onGround: boolean = true;
  public coyoteTimer: number = 0;
  public jumpBufferTimer: number = 0;
  public isCrouching: boolean = false;
  public isSliding: boolean = false;
  public slideTimer: number = 0;

  // Invulnerability & Health Regen
  public spawnShieldTimer: number = 3.5;
  public healthRegenDelay: number = 0;

  // Camera angles
  public yaw: number = 0;
  public pitch: number = 0;

  // Viewmodel & Tactical Arms Rig
  public viewmodelGroup: THREE.Group;
  public muzzleFlashLight: THREE.PointLight;
  public muzzleFlashMesh: THREE.Mesh;
  private flashTimer: number = 0;
  private currentRigGroup: THREE.Group | null = null;
  private shellEjectionPoint: THREE.Vector3 = new THREE.Vector3(0.12, 0.05, -0.15);

  // Weapon State
  public currentMag: number = 30;
  public reserveAmmo: number = 90;
  public isReloading: boolean = false;
  public reloadTimer: number = 0;
  public reloadDuration: number = 1.2;
  public isAimingDownSights: boolean = false;
  private fireTimer: number = 0;
  private recoilPitchOffset: number = 0;

  // Inspect Weapon Mode ([F] key)
  public isInspecting: boolean = false;
  private inspectTimer: number = 0;

  // Sway & Distance-Synced Bob
  private mouseDeltaX: number = 0;
  private mouseDeltaY: number = 0;
  private walkBobTimer: number = 0;

  // Input states
  private keys: Record<string, boolean> = {};
  public isPointerLocked: boolean = false;

  // Ejected Shells, Rockets & Plasma Grenades
  public ejectedShells: EjectedShell[] = [];
  public rockets: RocketProjectile[] = [];
  public grenades: GrenadeProjectile[] = [];

  constructor(
    camera: THREE.PerspectiveCamera,
    initialClass: ClassId = 'triggerman',
    initialSkin: WeaponSkinId = 'tactical'
  ) {
    this.camera = camera;
    this.classId = initialClass;
    this.currentSkin = initialSkin;
    const cData = CLASS_REGISTRY[initialClass];
    this.equippedWeaponId = cData.primaryWeapon;
    this.secondaryWeaponId = cData.secondaryWeapon || 'revolver';
    this.health = cData.maxHealth;
    this.maxHealth = cData.maxHealth;

    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    this.currentMag = wpn.magazineSize;
    this.reserveAmmo = wpn.maxReserveAmmo;

    this.position = new THREE.Vector3(0, 1.8, 30);
    this.velocity = new THREE.Vector3(0, 0, 0);

    // Setup viewmodel container attached to camera
    this.viewmodelGroup = new THREE.Group();
    this.camera.add(this.viewmodelGroup);

    // Dynamic Muzzle Flash Light
    this.muzzleFlashLight = new THREE.PointLight(0xffa200, 0, 14);
    this.muzzleFlashLight.position.set(0.22, -0.14, -0.95);
    this.viewmodelGroup.add(this.muzzleFlashLight);

    const flashGeo = new THREE.DodecahedronGeometry(0.08);
    const flashMat = new THREE.MeshBasicMaterial({ color: 0xffea79 });
    this.muzzleFlashMesh = new THREE.Mesh(flashGeo, flashMat);
    this.muzzleFlashMesh.position.set(0.22, -0.14, -0.95);
    this.muzzleFlashMesh.visible = false;
    this.viewmodelGroup.add(this.muzzleFlashMesh);

    this.rebuildTacticalRig();
  }

  public rebuildTacticalRig() {
    if (this.currentRigGroup) {
      this.viewmodelGroup.remove(this.currentRigGroup);
    }
    const { rigGroup, shellEjectionPoint } = createTacticalArmsAndWeapon(
      this.equippedWeaponId,
      this.currentSkin
    );
    this.currentRigGroup = rigGroup;
    this.shellEjectionPoint = shellEjectionPoint;
    this.viewmodelGroup.add(this.currentRigGroup);
  }

  public setSkin(skinId: WeaponSkinId) {
    this.currentSkin = skinId;
    this.rebuildTacticalRig();
  }

  public switchWeapon() {
    if (this.isReloading) return;
    const current = this.equippedWeaponId;
    const cData = CLASS_REGISTRY[this.classId];
    if (current === cData.primaryWeapon && cData.secondaryWeapon) {
      this.equippedWeaponId = cData.secondaryWeapon;
    } else {
      this.equippedWeaponId = cData.primaryWeapon;
    }
    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    this.currentMag = wpn.magazineSize;
    this.reserveAmmo = wpn.maxReserveAmmo;
    this.rebuildTacticalRig();
    sound.playReload();
  }

  public setClass(newClassId: ClassId) {
    this.classId = newClassId;
    const cData = CLASS_REGISTRY[newClassId];
    this.equippedWeaponId = cData.primaryWeapon;
    this.secondaryWeaponId = cData.secondaryWeapon || 'revolver';
    this.maxHealth = cData.maxHealth;
    this.health = cData.maxHealth;

    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    this.currentMag = wpn.magazineSize;
    this.reserveAmmo = wpn.maxReserveAmmo;
    this.rebuildTacticalRig();
  }

  public handleMouseMove(movementX: number, movementY: number, settings: GameSettings) {
    if (!this.isPointerLocked) return;
    const sens = (settings.mouseSensitivity || 1.0) * 0.0022;
    this.yaw -= movementX * sens;
    const invert = settings.invertY ? -1 : 1;
    this.pitch -= movementY * sens * invert;
    this.pitch = Math.max(-Math.PI / 2.05, Math.min(Math.PI / 2.05, this.pitch));

    this.mouseDeltaX = movementX;
    this.mouseDeltaY = movementY;
  }

  public handleKeyDown(code: string) {
    const wasHeld = !!this.keys[code];
    this.keys[code] = true;

    if (!wasHeld) {
      if (code === 'Space') {
        this.jumpBufferTimer = 0.13;
      }
      if (code === 'KeyR') {
        this.triggerReload();
      }
      if (code === 'Digit1' || code === 'Digit2') {
        this.switchWeapon();
      }
      if (code === 'KeyF') {
        this.isInspecting = true;
        this.inspectTimer = 2.0;
      }
      if (code === 'KeyQ') {
        this.triggerTacticalDash();
      }
    }
  }

  public handleKeyUp(code: string) {
    this.keys[code] = false;
    // Variable jump height cut when releasing Space early while ascending
    if (code === 'Space' && this.velocity.y > 4.0 && !this.tactical.isGrappling) {
      this.velocity.y *= 0.55;
    }
  }

  public clearKeys() {
    this.keys = {};
    this.isAimingDownSights = false;
  }

  public triggerTacticalDash(): boolean {
    const res = tryActivateDash(this.tactical);
    if (!res.activated) return false;
    this.tactical = res.nextState;
    this.dashTimer = 0.18;

    // Dash along movement wishDir or camera forward
    let moveForward = 0;
    let moveRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    this.dashDir.set(0, 0, 0);
    if (moveForward !== 0 || moveRight !== 0) {
      _fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      this.dashDir.addScaledVector(_fwd, moveForward).addScaledVector(_right, moveRight).normalize();
    } else {
      this.dashDir.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)).normalize();
    }

    this.velocity.x = this.dashDir.x * 29.0;
    this.velocity.z = this.dashDir.z * 29.0;
    if (!this.onGround) {
      this.velocity.y = Math.max(this.velocity.y, 4.5);
    }
    sound.playDash();
    return true;
  }

  public triggerPlasmaGrenade(scene: THREE.Scene): boolean {
    const res = tryThrowGrenade(this.tactical);
    if (!res.activated) return false;
    this.tactical = res.nextState;

    const gGroup = new THREE.Group();
    const core = new THREE.Mesh(
      new THREE.SphereGeometry(0.16, 12, 12),
      new THREE.MeshStandardMaterial({
        color: 0x10b981,
        emissive: 0x059669,
        emissiveIntensity: 0.9,
        roughness: 0.2,
      })
    );
    const band = new THREE.Mesh(
      new THREE.TorusGeometry(0.18, 0.03, 8, 16),
      new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
    );
    gGroup.add(core, band);

    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const spawnPos = this.camera.position.clone().addScaledVector(fwd, 0.85);
    gGroup.position.copy(spawnPos);
    scene.add(gGroup);

    const throwVel = fwd.clone().multiplyScalar(22.0);
    throwVel.y += 5.5;

    this.grenades.push({
      position: spawnPos,
      velocity: throwVel,
      mesh: gGroup,
      fuseTimer: 1.45,
    });

    sound.playGrenadeThrow();
    return true;
  }

  public triggerCyberMelee(
    botManager: BotManager,
    destructibleCrates: DestructibleCrate[],
    onHit: (
      dmg: number,
      isHeadshot: boolean,
      isKill: boolean,
      victimName: string,
      hitPos?: THREE.Vector3
    ) => void,
    onShatterCrate?: (pos: { x: number; y: number; z: number }) => void
  ): boolean {
    const res = trySwingMelee(this.tactical);
    if (!res.activated) return false;
    this.tactical = res.nextState;
    this.meleeAnimTimer = 0.28;
    sound.playMeleeSlash();

    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const mult = this.tactical.overdriveTimer > 0 ? 2.0 : 1.0;
    const meleeDmg = Math.round(85 * mult);

    // Check bots in melee cone within 3.8m
    for (const bot of botManager.bots) {
      if (bot.isDead) continue;
      const dist = this.position.distanceTo(bot.position);
      if (dist <= 3.8) {
        const toBot = new THREE.Vector3().subVectors(bot.position, this.position).normalize();
        if (toBot.dot(new THREE.Vector3(fwd.x, 0, fwd.z).normalize()) > 0.35) {
          const hitRes = botManager.damageBot(bot.id, meleeDmg, false);
          // Knockback impulse
          bot.position.addScaledVector(toBot, 2.2);
          sound.playHitmarker();
          onHit(meleeDmg, false, hitRes.isKilled, bot.name, bot.bodyMesh.position.clone());
        }
      }
    }

    // Check destructible crates within 3.6m
    for (const dc of destructibleCrates) {
      if (dc.isDestroyed) continue;
      const d = Math.hypot(this.position.x - dc.position.x, this.position.z - dc.position.z);
      if (d <= 3.6) {
        dc.health = 0;
        dc.isDestroyed = true;
        dc.respawnTimer = 18;
        this.health = Math.min(this.maxHealth, this.health + 25);
        onShatterCrate?.(dc.position);
      }
    }

    return true;
  }

  public triggerInteractOrGrapple(
    turrets: InteractiveTurret[],
    supplyCrates: InteractiveSupplyCrate[],
    collisionBoxes: Box3Like[],
    onToast: (msg: string) => void
  ): boolean {
    // 1. Check nearby Sentry Turret to hack (within 3.8m)
    for (const t of turrets) {
      const dist = Math.hypot(this.position.x - t.position.x, this.position.z - t.position.z);
      if (dist <= 3.8) {
        const res = hackSentryTurret(t);
        if (res.hacked) {
          t.owner = res.updatedTurret.owner;
          t.activeTimer = res.updatedTurret.activeTimer;
          t.fireCooldown = res.updatedTurret.fireCooldown;
          sound.playTurretHack();
          onToast(res.statusText);
          return true;
        }
      }
    }

    // 2. Check nearby Mystery Supply Crate to unlock (within 3.8m)
    for (const c of supplyCrates) {
      if (!c.isAvailable) continue;
      const dist = Math.hypot(this.position.x - c.position.x, this.position.z - c.position.z);
      if (dist <= 3.8) {
        const res = openSupplyCrate(c, this.tactical);
        if (res.opened) {
          c.isAvailable = false;
          c.respawnTimer = res.updatedCrate.respawnTimer;
          this.tactical = res.updatedTactical;
          const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
          this.currentMag = wpn.magazineSize;
          this.reserveAmmo = wpn.maxReserveAmmo;
          sound.playSupplyCrateOpen();
          onToast(res.rewardText);
          return true;
        }
      }
    }

    // 3. Otherwise fire Grapple Hook if off cooldown!
    if (this.tactical.grappleCooldown > 0) return false;

    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const ray = new THREE.Ray(this.camera.position, fwd);
    const box3 = new THREE.Box3();
    const hitPt = new THREE.Vector3();
    let bestDist = 44.0;
    let bestPoint: THREE.Vector3 | null = null;

    for (const b of collisionBoxes) {
      box3.min.set(b.min.x, b.min.y, b.min.z);
      box3.max.set(b.max.x, b.max.y, b.max.z);
      const intersect = ray.intersectBox(box3, hitPt);
      if (intersect) {
        const d = this.camera.position.distanceTo(intersect);
        if (d > 2.5 && d < bestDist) {
          bestDist = d;
          bestPoint = intersect.clone();
        }
      }
    }

    // Fallback: grapple forward boost if aiming toward horizon/ledge
    if (!bestPoint) {
      bestPoint = this.camera.position.clone().addScaledVector(fwd, 20.0);
      bestPoint.y = Math.max(2.5, bestPoint.y);
    }

    this.tactical.grappleCooldown = this.tactical.grappleMaxCooldown;
    this.tactical.isGrappling = true;
    this.tactical.grappleTarget = { x: bestPoint.x, y: bestPoint.y, z: bestPoint.z };
    this.grappleTimer = 0.42;

    const pullDir = new THREE.Vector3()
      .subVectors(bestPoint, this.position)
      .normalize();
    this.velocity.x = pullDir.x * 27.0;
    this.velocity.y = Math.max(11.5, pullDir.y * 24.0 + 6.5);
    this.velocity.z = pullDir.z * 27.0;
    this.onGround = false;

    sound.playGrapple();
    return true;
  }

  public triggerReload() {
    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    if (this.isReloading || this.currentMag === wpn.magazineSize || this.reserveAmmo <= 0) return;
    this.isReloading = true;
    this.isInspecting = false;
    this.reloadTimer = wpn.reloadTimeSec;
    this.reloadDuration = wpn.reloadTimeSec;
    sound.playReload();
  }

  public update(
    dt: number,
    settings: GameSettings,
    collisionBoxes: Box3Like[],
    jumpPads: InteractiveJumpPad[],
    pickups: InteractivePickup[],
    explosiveBarrels: ExplosiveBarrel[],
    teleporters: InteractiveTeleporter[],
    turrets: InteractiveTurret[],
    supplyCrates: InteractiveSupplyCrate[],
    destructibleCrates: DestructibleCrate[],
    botManager: BotManager,
    scene: THREE.Scene,
    onHit: (
      dmg: number,
      isHeadshot: boolean,
      isKill: boolean,
      victimName: string,
      hitPos?: THREE.Vector3
    ) => void,
    _onPlayerShot: () => void,
    onPickupCollected: (type: 'health' | 'ammo' | string) => void,
    onExplosionEffect?: (pos: THREE.Vector3, colorHex: number) => void
  ) {
    const cData = CLASS_REGISTRY[this.classId];
    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    const moveCfg = DEFAULT_MOVEMENT_CONFIG;

    // 0. Step tactical timers & check nearby interactive world objects
    this.tactical = stepTacticalTimers(this.tactical, dt);

    if (this.dashTimer > 0) {
      this.dashTimer -= dt;
      if (this.dashTimer <= 0) {
        this.tactical.isDashing = false;
      }
    }

    if (this.grappleTimer > 0) {
      this.grappleTimer -= dt;
      if (this.grappleTimer <= 0) {
        this.tactical.isGrappling = false;
        this.tactical.grappleTarget = null;
      }
    }

    if (this.meleeAnimTimer > 0) {
      this.meleeAnimTimer -= dt;
      if (this.meleeAnimTimer <= 0) {
        this.tactical.isMeleeSwinging = false;
      }
    }

    // Detect contextual [E] prompt for nearby Turrets / Supply Crates / Teleporters
    let interactPrompt: string | null = null;
    for (const t of turrets) {
      if (
        t.owner !== 'player' &&
        Math.hypot(this.position.x - t.position.x, this.position.z - t.position.z) <= 3.8
      ) {
        interactPrompt = `[E] HACK ${t.label.toUpperCase()} (ALLIED OVERWATCH)`;
        break;
      }
    }
    if (!interactPrompt) {
      for (const c of supplyCrates) {
        if (
          c.isAvailable &&
          Math.hypot(this.position.x - c.position.x, this.position.z - c.position.z) <= 3.8
        ) {
          interactPrompt = `[E] UNLOCK ${c.label.toUpperCase()} (2X OVERDRIVE + 50 SHIELD)`;
          break;
        }
      }
    }
    this.tactical.nearbyInteractableLabel = interactPrompt;
    this.tactical.grappleAimReady = this.tactical.grappleCooldown <= 0;

    // 1. Spawn shield countdown & health regen
    if (this.spawnShieldTimer > 0) {
      this.spawnShieldTimer -= dt;
    }

    if (this.healthRegenDelay > 0) {
      this.healthRegenDelay -= dt;
    } else if (this.health < this.maxHealth) {
      this.health = Math.min(this.maxHealth, this.health + dt * 15);
    }

    // 2. Recoil recovery
    if (this.recoilPitchOffset > 0) {
      this.recoilPitchOffset = Math.max(0, this.recoilPitchOffset - dt * 0.45);
    }

    // 3. Inspect timer
    if (this.isInspecting) {
      this.inspectTimer -= dt;
      if (this.inspectTimer <= 0) this.isInspecting = false;
    }

    // 4. Muzzle flash decay
    if (this.fireTimer > 0) this.fireTimer -= dt;
    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer <= 0) {
        this.muzzleFlashLight.intensity = 0;
        this.muzzleFlashMesh.visible = false;
      }
    }

    // 5. Reload timer
    if (this.isReloading) {
      this.reloadTimer -= dt;
      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        const reloaded = calculateReload(this.currentMag, this.reserveAmmo, wpn.magazineSize);
        this.currentMag = reloaded.newMag;
        this.reserveAmmo = reloaded.newReserve;
      }
    }

    // 6. Movement Wish Direction
    let moveForward = 0;
    let moveRight = 0;
    if (this.keys['KeyW'] || this.keys['ArrowUp']) moveForward += 1;
    if (this.keys['KeyS'] || this.keys['ArrowDown']) moveForward -= 1;
    if (this.keys['KeyD'] || this.keys['ArrowRight']) moveRight += 1;
    if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveRight -= 1;

    _wishDir.set(0, 0, 0);
    if (moveForward !== 0 || moveRight !== 0) {
      _fwd.set(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
      _right.set(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
      _wishDir.addScaledVector(_fwd, moveForward);
      _wishDir.addScaledVector(_right, moveRight);
      _wishDir.normalize();
    }

    // 7. Slide-hopping physics
    const crouchPressed = !!(
      this.keys['KeyC'] ||
      this.keys['ShiftLeft'] ||
      this.keys['ShiftRight']
    );
    const horizSpeed = Math.hypot(this.velocity.x, this.velocity.z);

    if (crouchPressed && !this.isCrouching) {
      this.isCrouching = true;
      if (this.onGround && horizSpeed > 8.0) {
        this.isSliding = true;
        this.slideTimer = 0.65;
        this.velocity.x *= moveCfg.slideSpeedBoost;
        this.velocity.z *= moveCfg.slideSpeedBoost;
        sound.playSlide();
      }
    } else if (!crouchPressed && this.isCrouching) {
      this.isCrouching = false;
      this.isSliding = false;
    }

    if (this.isSliding) {
      this.slideTimer -= dt;
      if (this.slideTimer <= 0) this.isSliding = false;
    }

    // 8. Coyote Time & Buffered Jump Logic + Slide-Hop boost
    if (this.onGround) {
      this.coyoteTimer = 0.1;
    } else if (this.coyoteTimer > 0) {
      this.coyoteTimer -= dt;
    }

    if (this.jumpBufferTimer > 0) {
      this.jumpBufferTimer -= dt;
    }

    const canJump = this.onGround || this.coyoteTimer > 0;
    if ((this.jumpBufferTimer > 0 || this.keys['Space']) && canJump) {
      this.velocity.y = moveCfg.jumpVelocity * cData.jumpMultiplier;
      this.onGround = false;
      this.coyoteTimer = 0;
      this.jumpBufferTimer = 0;
      sound.playJump();

      if (this.isSliding) {
        this.velocity.x *= 1.09;
        this.velocity.z *= 1.09;
      }
    }

    // 9. Interactive Jump Pads
    for (const pad of jumpPads) {
      const dx = this.position.x - pad.position.x;
      const dz = this.position.z - pad.position.z;
      if (Math.hypot(dx, dz) < 2.0 && Math.abs(this.position.y - pad.position.y) < 1.0) {
        this.velocity.y = pad.boostVelocity;
        this.onGround = false;
        sound.playJump();
        break;
      }
    }

    // 9B. Interactive Stargate Teleporters
    const warpRes = checkTeleporterTrigger(this.position, teleporters);
    if (warpRes.triggered && warpRes.destination) {
      for (let i = 0; i < teleporters.length; i++) {
        teleporters[i].cooldown = warpRes.updatedTeleporters[i].cooldown;
      }
      this.position.set(
        warpRes.destination.x,
        warpRes.destination.y,
        warpRes.destination.z
      );
      this.velocity.y = 4.0;
      sound.playPortalWarp();
      onPickupCollected(`WARPED VIA ${warpRes.portalLabel.toUpperCase()}`);
    }

    // 10. Interactive Pickups
    for (const pk of pickups) {
      if (pk.isAvailable) {
        const dist = Math.hypot(
          this.position.x - pk.position.x,
          this.position.z - pk.position.z
        );
        if (dist < 1.8 && Math.abs(this.position.y - pk.position.y) < 2.0) {
          if (pk.type === 'health' && this.health < this.maxHealth) {
            this.health = Math.min(this.maxHealth, this.health + 50);
            pk.isAvailable = false;
            pk.respawnTimer = 15;
            sound.playHitmarker();
            onPickupCollected('health');
          } else if (pk.type === 'ammo' && this.reserveAmmo < wpn.maxReserveAmmo) {
            this.reserveAmmo = wpn.maxReserveAmmo;
            pk.isAvailable = false;
            pk.respawnTimer = 15;
            sound.playReload();
            onPickupCollected('ammo');
          }
        }
      } else {
        pk.respawnTimer -= dt;
        if (pk.respawnTimer <= 0) {
          pk.isAvailable = true;
        }
      }
    }

    // 11. Acceleration & Friction
    const overdriveSpeedMult = this.tactical.overdriveTimer > 0 ? 1.15 : 1.0;
    const maxSpeed =
      moveCfg.maxGroundSpeed *
      cData.speedMultiplier *
      overdriveSpeedMult *
      (this.isAimingDownSights ? 0.6 : 1.0);

    if (this.dashTimer <= 0 && !this.tactical.isGrappling) {
      if (this.onGround) {
        const friction = this.isSliding ? moveCfg.slideFriction : moveCfg.groundFriction;
        const slowed = applyFriction(this.velocity, friction, dt);
        this.velocity.x = slowed.x;
        this.velocity.z = slowed.z;

        const accel = applyAccelerate(
          this.velocity,
          _wishDir,
          maxSpeed,
          moveCfg.groundAcceleration,
          dt
        );
        this.velocity.x = accel.x;
        this.velocity.z = accel.z;
      } else {
        const airAccel = applyAccelerate(
          this.velocity,
          _wishDir,
          maxSpeed * 1.1,
          moveCfg.airAcceleration,
          dt
        );
        this.velocity.x = airAccel.x;
        this.velocity.z = airAccel.z;
        this.velocity.y -= moveCfg.gravity * dt;
      }
    } else if (this.tactical.isGrappling && this.tactical.grappleTarget) {
      // Pull toward grapple target
      this.velocity.y -= moveCfg.gravity * 0.35 * dt;
    }

    // 12. Collision Resolution
    const playerHeight = this.isCrouching ? moveCfg.crouchHeight : moveCfg.standHeight;
    const colResult = resolveMovementCollisions(
      this.position,
      this.velocity,
      dt,
      moveCfg.playerRadius,
      playerHeight,
      collisionBoxes
    );

    this.position.x = colResult.finalPos.x;
    this.position.y = colResult.finalPos.y;
    this.position.z = colResult.finalPos.z;
    this.velocity.x = colResult.finalVel.x;
    this.velocity.y = colResult.finalVel.y;
    this.velocity.z = colResult.finalVel.z;
    this.onGround = colResult.onGround;

    // 13. Camera Position & Orientation
    const eyeHeight = this.isCrouching ? 1.05 : 1.75;
    this.camera.position.set(this.position.x, this.position.y + eyeHeight, this.position.z);

    const totalPitch = this.pitch + this.recoilPitchOffset;
    this.camera.rotation.set(0, 0, 0);
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = totalPitch;

    if (this.isSliding) {
      this.camera.rotation.z = 0.05;
    } else if (this.dashTimer > 0) {
      this.camera.rotation.z = -0.04;
    }

    // 14. Smooth FOV Zoom & Speed/Dash FOV Kick
    const baseFov = settings.fov || 85;
    const dashFovBonus = this.dashTimer > 0 || this.tactical.isGrappling ? 11 : horizSpeed > 16 ? 5 : 0;
    const targetFov = this.isAimingDownSights ? wpn.scopeZoomFov : baseFov + dashFovBonus;
    this.camera.fov = THREE.MathUtils.lerp(this.camera.fov, targetFov, dt * 16);
    this.camera.updateProjectionMatrix();

    // 15. Viewmodel Sway, Distance-Synced Bobbing, Melee Slash & Inspect Animations
    if (this.currentRigGroup) {
      if (horizSpeed > 1.0 && this.onGround) {
        this.walkBobTimer += dt * horizSpeed * 0.85;
      }
      const bobX = Math.cos(this.walkBobTimer) * 0.012;
      const bobY = Math.sin(this.walkBobTimer * 2) * 0.012;

      const swayX = -this.mouseDeltaX * 0.0003;
      const swayY = this.mouseDeltaY * 0.0003;
      this.mouseDeltaX = 0;
      this.mouseDeltaY = 0;

      let targetPos = new THREE.Vector3(0.22 + bobX + swayX, -0.22 + bobY + swayY, -0.42);
      let targetRot = new THREE.Euler(0, 0, 0);

      if (this.meleeAnimTimer > 0) {
        // Fast Cyber Blade slash arc
        const p = 1 - this.meleeAnimTimer / 0.28;
        targetPos = new THREE.Vector3(
          0.1 - Math.sin(p * Math.PI) * 0.35,
          -0.16,
          -0.52
        );
        targetRot = new THREE.Euler(-0.35, 0.75 * Math.sin(p * Math.PI), -0.85);
      } else if (this.isAimingDownSights) {
        targetPos = new THREE.Vector3(0, -0.14, -0.32);
      } else if (this.isInspecting) {
        targetPos = new THREE.Vector3(0.08, -0.16, -0.38);
        targetRot = new THREE.Euler(0.25, -0.65, 0.45);
      } else if (this.isReloading) {
        targetPos = new THREE.Vector3(0.18, -0.32, -0.4);
        targetRot = new THREE.Euler(0.4, 0.1, -0.15);
      }

      this.currentRigGroup.position.lerp(targetPos, dt * 15);
      this.currentRigGroup.rotation.x = THREE.MathUtils.lerp(
        this.currentRigGroup.rotation.x,
        targetRot.x,
        dt * 14
      );
      this.currentRigGroup.rotation.y = THREE.MathUtils.lerp(
        this.currentRigGroup.rotation.y,
        targetRot.y,
        dt * 14
      );
      this.currentRigGroup.rotation.z = THREE.MathUtils.lerp(
        this.currentRigGroup.rotation.z,
        targetRot.z,
        dt * 14
      );

      if (wpn.isScoped && this.isAimingDownSights) {
        this.currentRigGroup.visible = false;
      } else {
        this.currentRigGroup.visible = true;
      }
    }

    // 16. Ejected Shells Physics
    for (let i = this.ejectedShells.length - 1; i >= 0; i--) {
      const shell = this.ejectedShells[i];
      shell.aliveTime += dt;
      shell.velocity.y -= 18.0 * dt;
      shell.mesh.position.addScaledVector(shell.velocity, dt);
      shell.mesh.rotation.x += shell.angularVelocity.x * dt;
      shell.mesh.rotation.y += shell.angularVelocity.y * dt;

      if (shell.mesh.position.y <= 0.05) {
        shell.mesh.position.y = 0.05;
        shell.velocity.y *= -0.4;
        shell.velocity.x *= 0.6;
        shell.velocity.z *= 0.6;
      }

      if (shell.aliveTime > 2.0) {
        scene.remove(shell.mesh);
        shell.mesh.geometry.dispose();
        (shell.mesh.material as THREE.Material).dispose();
        this.ejectedShells.splice(i, 1);
      }
    }

    // 17. Active Rockets
    for (let i = this.rockets.length - 1; i >= 0; i--) {
      const rocket = this.rockets[i];
      rocket.aliveTime += dt;
      rocket.position.addScaledVector(rocket.velocity, dt);
      rocket.mesh.position.copy(rocket.position);

      let exploded = rocket.position.y <= 0.2 || rocket.aliveTime > 4.0;
      if (!exploded) {
        for (const bot of botManager.bots) {
          if (!bot.isDead && rocket.position.distanceTo(bot.position) < 2.5) {
            exploded = true;
            break;
          }
        }
      }

      if (exploded) {
        sound.playExplosion();
        onExplosionEffect?.(rocket.position.clone(), 0xf97316);
        for (const bot of botManager.bots) {
          if (!bot.isDead) {
            const dist = rocket.position.distanceTo(bot.position);
            if (dist < 7.5) {
              const splashDmg = Math.round(105 * (1 - dist / 7.5));
              const res = botManager.damageBot(bot.id, splashDmg, false);
              onHit(splashDmg, false, res.isKilled, bot.name, bot.position.clone());
            }
          }
        }
        scene.remove(rocket.mesh);
        this.rockets.splice(i, 1);
      }
    }

    // 18. Active Plasma Frag Grenades
    for (let i = this.grenades.length - 1; i >= 0; i--) {
      const g = this.grenades[i];
      g.fuseTimer -= dt;
      g.velocity.y -= 22.0 * dt;
      g.position.addScaledVector(g.velocity, dt);

      if (g.position.y <= 0.18) {
        g.position.y = 0.18;
        g.velocity.y *= -0.52;
        g.velocity.x *= 0.72;
        g.velocity.z *= 0.72;
      }

      g.mesh.position.copy(g.position);
      g.mesh.rotation.x += dt * 9;
      g.mesh.rotation.z += dt * 7;

      let detonate = g.fuseTimer <= 0;
      if (!detonate) {
        for (const bot of botManager.bots) {
          if (!bot.isDead && g.position.distanceTo(bot.position) < 1.8) {
            detonate = true;
            break;
          }
        }
      }

      if (detonate) {
        sound.playExplosion();
        onExplosionEffect?.(g.position.clone(), 0x10b981);

        // Damage nearby bots
        for (const bot of botManager.bots) {
          if (!bot.isDead) {
            const dist = g.position.distanceTo(bot.position);
            if (dist < 8.5) {
              const splashDmg = Math.round(130 * (1 - dist / 8.5));
              const res = botManager.damageBot(bot.id, splashDmg, false);
              onHit(splashDmg, false, res.isKilled, bot.name, bot.position.clone());
            }
          }
        }

        // Chain-detonate nearby explosive barrels
        for (const barrel of explosiveBarrels) {
          if (!barrel.isExploded) {
            const bPos = new THREE.Vector3(barrel.position.x, 0.65, barrel.position.z);
            if (g.position.distanceTo(bPos) < 6.5) {
              barrel.health = 0;
              barrel.isExploded = true;
              onExplosionEffect?.(bPos, 0xef4444);
            }
          }
        }

        scene.remove(g.mesh);
        this.grenades.splice(i, 1);
      }
    }
  }

  public fireWeapon(
    scene: THREE.Scene,
    botManager: BotManager,
    explosiveBarrels: ExplosiveBarrel[],
    destructibleCrates: DestructibleCrate[],
    targetDrones: TargetDrone[],
    onHit: (
      dmg: number,
      isHeadshot: boolean,
      isKill: boolean,
      victimName: string,
      hitPos?: THREE.Vector3
    ) => void,
    onPlayerShot: () => void,
    onSpecialTargetDestroyed?: (type: 'drone' | 'crate', pos: { x: number; y: number; z: number }) => void
  ) {
    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    if (this.fireTimer > 0 || this.isReloading) return;

    if (this.currentMag <= 0) {
      this.triggerReload();
      return;
    }

    const ammoRes = consumeWeaponAmmo(this.currentMag, this.reserveAmmo);
    this.currentMag = ammoRes.newMag;
    this.fireTimer = 1 / wpn.fireRateRps;
    this.isInspecting = false;

    // Recoil kick
    this.recoilPitchOffset += wpn.recoilPitch;
    if (this.recoilPitchOffset > 0.25) this.recoilPitchOffset = 0.25;

    // Dynamic Muzzle Flash
    this.muzzleFlashLight.intensity = 4.0;
    this.muzzleFlashMesh.visible = true;
    this.flashTimer = 0.05;

    sound.playShoot(this.equippedWeaponId);
    onPlayerShot();

    this.spawnEjectedShell(scene);

    const overdriveMult = this.tactical.overdriveTimer > 0 ? 2.0 : 1.0;

    // Projectile (Rocket Launcher)
    if (wpn.isProjectile) {
      const rocketGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.45, 8);
      rocketGeo.rotateX(Math.PI / 2);
      const rocketMat = new THREE.MeshBasicMaterial({ color: 0xff4400 });
      const rocketMesh = new THREE.Mesh(rocketGeo, rocketMat);

      const fwd = new THREE.Vector3();
      this.camera.getWorldDirection(fwd);
      const spawnPos = this.camera.position.clone().addScaledVector(fwd, 0.8);
      rocketMesh.position.copy(spawnPos);
      scene.add(rocketMesh);

      this.rockets.push({
        position: spawnPos,
        velocity: fwd.clone().multiplyScalar(wpn.projectileSpeed || 36),
        mesh: rocketMesh,
        aliveTime: 0,
      });
      return;
    }

    // Hitscan shooting
    const pellets = wpn.pelletsCount || 1;
    for (let p = 0; p < pellets; p++) {
      const spreadX = (Math.random() - 0.5) * wpn.spreadAngle;
      const spreadY = (Math.random() - 0.5) * wpn.spreadAngle;

      _rayDir.set(spreadX, spreadY, -1).normalize();
      _rayDir.applyQuaternion(this.camera.quaternion);

      const raycaster = new THREE.Raycaster(this.camera.position, _rayDir, 0.1, 150);

      // Check hit on bots
      let hitBot: { bot: any; isHead: boolean; distance: number } | null = null;
      let closestDist = Infinity;

      for (const bot of botManager.bots) {
        if (bot.isDead) continue;
        const headIntersects = raycaster.intersectObject(bot.headMesh);
        if (headIntersects.length > 0 && headIntersects[0].distance < closestDist) {
          closestDist = headIntersects[0].distance;
          hitBot = { bot, isHead: true, distance: closestDist };
        }

        const bodyIntersects = raycaster.intersectObject(bot.bodyMesh);
        if (bodyIntersects.length > 0 && bodyIntersects[0].distance < closestDist) {
          closestDist = bodyIntersects[0].distance;
          hitBot = { bot, isHead: false, distance: closestDist };
        }
      }

      // Check hit on Hovering Target Drones
      const ray = new THREE.Ray(this.camera.position, _rayDir);
      for (const drone of targetDrones) {
        if (drone.isDestroyed) continue;
        const dPos = new THREE.Vector3(drone.position.x, drone.position.y, drone.position.z);
        if (ray.distanceToPoint(dPos) < 0.85) {
          const dmg = Math.round(wpn.damage * overdriveMult);
          drone.health -= dmg;
          sound.playHitmarker();
          if (drone.health <= 0) {
            drone.isDestroyed = true;
            drone.respawnTimer = 14;
            this.tactical.dashCooldown = 0;
            this.tactical.grappleCooldown = 0;
            sound.playHeadshotDing();
            onSpecialTargetDestroyed?.('drone', drone.position);
          }
          onHit(dmg, true, drone.isDestroyed, 'SKY DRONE', dPos);
          return;
        }
      }

      // Check hit on Destructible Cover Crates
      for (const dc of destructibleCrates) {
        if (dc.isDestroyed) continue;
        const cPos = new THREE.Vector3(dc.position.x, dc.position.y + 0.7, dc.position.z);
        if (ray.distanceToPoint(cPos) < 0.9) {
          dc.health -= Math.round(wpn.damage * overdriveMult);
          sound.playHitmarker();
          if (dc.health <= 0) {
            dc.isDestroyed = true;
            dc.respawnTimer = 18;
            this.health = Math.min(this.maxHealth, this.health + 20);
            this.reserveAmmo = Math.min(wpn.maxReserveAmmo, this.reserveAmmo + 15);
            onSpecialTargetDestroyed?.('crate', dc.position);
          }
        }
      }

      // Check hit on Explosive Barrels
      for (const barrel of explosiveBarrels) {
        if (barrel.isExploded) continue;
        const bPos = new THREE.Vector3(barrel.position.x, 0.65, barrel.position.z);
        if (this.camera.position.distanceTo(bPos) < 55) {
          const distToBarrel = ray.distanceToPoint(bPos);
          if (distToBarrel < 0.68) {
            barrel.health -= wpn.damage * overdriveMult;
            if (barrel.health <= 0) {
              barrel.isExploded = true;
              sound.playExplosion();
              onSpecialTargetDestroyed?.('crate', barrel.position);
              for (const bot of botManager.bots) {
                if (!bot.isDead && bot.position.distanceTo(bPos) < 8.5) {
                  const splashDmg = Math.round(115 * (1 - bot.position.distanceTo(bPos) / 8.5));
                  const res = botManager.damageBot(bot.id, splashDmg, false);
                  onHit(splashDmg, false, res.isKilled, bot.name, bot.position.clone());
                }
              }
            }
          }
        }
      }

      if (hitBot) {
        const damage = Math.round(calculateHitDamage(wpn, hitBot.isHead) * overdriveMult);
        const res = botManager.damageBot(hitBot.bot.id, damage, hitBot.isHead);
        if (hitBot.isHead) sound.playHeadshotDing();
        else sound.playHitmarker();

        const hitTargetPos = hitBot.isHead
          ? hitBot.bot.headMesh.getWorldPosition(new THREE.Vector3())
          : hitBot.bot.bodyMesh.getWorldPosition(new THREE.Vector3());
        onHit(damage, hitBot.isHead, res.isKilled, hitBot.bot.name, hitTargetPos);
      }
    }
  }

  private spawnEjectedShell(scene: THREE.Scene) {
    const shellGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.035, 8);
    shellGeo.rotateZ(Math.PI / 2);
    const shellMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.95,
      roughness: 0.15,
    });
    const shellMesh = new THREE.Mesh(shellGeo, shellMat);

    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.camera.quaternion);
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(this.camera.quaternion);

    const spawnPos = this.camera.position
      .clone()
      .addScaledVector(right, 0.25)
      .addScaledVector(up, -0.15)
      .addScaledVector(fwd, 0.35);

    shellMesh.position.copy(spawnPos);
    scene.add(shellMesh);

    const ejectVel = right
      .clone()
      .multiplyScalar(2.8 + Math.random() * 0.8)
      .addScaledVector(up, 1.8 + Math.random() * 0.6)
      .addScaledVector(fwd, (Math.random() - 0.5) * 0.8);

    this.ejectedShells.push({
      mesh: shellMesh,
      velocity: ejectVel,
      angularVelocity: new THREE.Vector3(
        Math.random() * 20 - 10,
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
      ),
      aliveTime: 0,
    });
  }

  public respawn(spawnPoint: THREE.Vector3) {
    this.position.copy(spawnPoint);
    this.velocity.set(0, 0, 0);
    // Face toward the center of the arena (0, 0, 0) so the player never spawns facing a perimeter wall!
    this.yaw = Math.atan2(spawnPoint.x, spawnPoint.z);
    this.pitch = 0;
    this.health = this.maxHealth;
    this.spawnShieldTimer = 3.5;
    this.healthRegenDelay = 0;
    const wpn = WEAPON_REGISTRY[this.equippedWeaponId];
    this.currentMag = wpn.magazineSize;
    this.reserveAmmo = wpn.maxReserveAmmo;
    this.isReloading = false;
    this.tactical = createInitialTacticalState();
  }
}
