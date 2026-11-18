import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MAPS, MapDefinition, BuiltMapVisuals } from '../maps/mapData';
import { BotManager } from '../bots/botManager';
import { FPSController } from '../player/fpsController';
import { ClassId, WeaponSkinId } from '../types';
import { sound } from '../audio/soundSystem';

interface PooledParticle {
  active: boolean;
  age: number;
  maxAge: number;
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  scale: number;
}

const PARTICLE_POOL_CAPACITY = 140;
const _dummyObj = new THREE.Object3D();
const _dummyColor = new THREE.Color();
const _turretOrigin = new THREE.Vector3();

export class GameScene {
  public scene: THREE.Scene;
  public camera: THREE.PerspectiveCamera;
  public renderer: THREE.WebGLRenderer;
  public isSoftwareGl: boolean = false;
  public botManager: BotManager;
  public playerController: FPSController;
  public currentMap: MapDefinition;

  private frameId: number = 0;
  private isDestroyed: boolean = false;
  private activeTracers: { line: THREE.Line; age: number }[] = [];

  // Hitstop & Camera Trauma Shake
  public hitstopTimer: number = 0;
  public cameraTrauma: number = 0;

  // Zero-GC Pooled Particle Ring Buffer
  private particleMesh!: THREE.InstancedMesh;
  private particlePool: PooledParticle[] = [];
  private particleCursor: number = 0;

  // 3D Grapple Tether Line
  private grappleLine!: THREE.Line;

  // Interactive Meshes from Map
  public activePickupMeshes: NonNullable<BuiltMapVisuals['pickupMeshes']> = [];
  public activeBarrelMeshes: NonNullable<BuiltMapVisuals['barrelMeshes']> = [];
  public activeTeleporterMeshes: NonNullable<BuiltMapVisuals['teleporterMeshes']> = [];
  public activeTurretMeshes: NonNullable<BuiltMapVisuals['turretMeshes']> = [];
  public activeSupplyCrateMeshes: NonNullable<BuiltMapVisuals['supplyCrateMeshes']> = [];
  public activeDestructibleCrateMeshes: NonNullable<BuiltMapVisuals['destructibleCrateMeshes']> = [];
  public activeDroneMeshes: NonNullable<BuiltMapVisuals['droneMeshes']> = [];
  public activeHoloSpire?: THREE.Object3D;

  constructor(
    container: HTMLElement,
    mapId: string = 'urban',
    initialClass: ClassId = 'triggerman',
    initialSkin: WeaponSkinId = 'tactical'
  ) {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x0a1128);
    this.scene.fog = new THREE.FogExp2(0x0a1128, 0.012);

    // Camera
    this.camera = new THREE.PerspectiveCamera(85, window.innerWidth / window.innerHeight, 0.1, 300);
    this.scene.add(this.camera);

    // Software WebGL Detection
    this.isSoftwareGl = (() => {
      try {
        const gl = document.createElement('canvas').getContext('webgl2');
        if (!gl) return true;
        const ext = gl.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
        const gpu = String(gl.getParameter(param));
        gl.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    // Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.22;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.setSize(
      container.clientWidth || window.innerWidth,
      container.clientHeight || window.innerHeight
    );

    container.appendChild(this.renderer.domElement);

    // Studio Environment Lighting
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Balanced 3-Point Lighting Rig (1 Shadow Caster)
    const keyLight = new THREE.DirectionalLight(0xffedd5, 1.9);
    keyLight.position.set(30, 50, 25);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 130;
    const d = 45;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.bias = -0.0005;
    this.scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x1e293b, 0.78);
    this.scene.add(hemiLight);

    // Initialize Pooled Particle System & Grapple Line
    this.initParticlePool();
    this.initGrappleLine();

    // Player Controller
    this.playerController = new FPSController(this.camera, initialClass, initialSkin);

    // Bot Manager
    this.botManager = new BotManager(this.scene);

    // Load Map
    this.currentMap = MAPS[mapId] || MAPS.urban;
    this.loadMap(this.currentMap);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.onWindowResize = this.onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);
  }

  private initParticlePool() {
    const geo = new THREE.BoxGeometry(0.16, 0.16, 0.16);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    this.particleMesh = new THREE.InstancedMesh(geo, mat, PARTICLE_POOL_CAPACITY);
    this.particleMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.particleMesh.frustumCulled = false;
    this.particleMesh.name = 'persistent_particle_pool';

    for (let i = 0; i < PARTICLE_POOL_CAPACITY; i++) {
      this.particlePool.push({
        active: false,
        age: 0,
        maxAge: 0.5,
        x: 0,
        y: -100,
        z: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        scale: 0,
      });
      _dummyObj.position.set(0, -100, 0);
      _dummyObj.scale.set(0, 0, 0);
      _dummyObj.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
      this.particleMesh.setColorAt(i, _dummyColor.setHex(0xf59e0b));
    }
    this.particleMesh.instanceMatrix.needsUpdate = true;
    if (this.particleMesh.instanceColor) this.particleMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.particleMesh);
  }

  private initGrappleLine() {
    const pts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, -1)];
    const geo = new THREE.BufferGeometry().setFromPoints(pts);
    const mat = new THREE.LineBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.9,
    });
    this.grappleLine = new THREE.Line(geo, mat);
    this.grappleLine.visible = false;
    this.grappleLine.frustumCulled = false;
    this.grappleLine.name = 'persistent_grapple_line';
    this.scene.add(this.grappleLine);
  }

  public setGrappleBeam(start: THREE.Vector3 | null, end: THREE.Vector3 | null) {
    if (!start || !end) {
      this.grappleLine.visible = false;
      return;
    }
    const posAttr = this.grappleLine.geometry.getAttribute('position') as THREE.BufferAttribute;
    posAttr.setXYZ(0, start.x, start.y, start.z);
    posAttr.setXYZ(1, end.x, end.y, end.z);
    posAttr.needsUpdate = true;
    this.grappleLine.visible = true;
  }

  public spawnParticleBurst(
    origin: { x: number; y: number; z: number },
    count: number,
    colorHex: number,
    speed: number = 9.0,
    scale: number = 1.0
  ) {
    _dummyColor.setHex(colorHex);
    const n = Math.min(count, 28);
    for (let i = 0; i < n; i++) {
      const idx = this.particleCursor;
      this.particleCursor = (this.particleCursor + 1) % PARTICLE_POOL_CAPACITY;
      const p = this.particlePool[idx];
      p.active = true;
      p.age = 0;
      p.maxAge = 0.28 + Math.random() * 0.32;
      p.x = origin.x + (Math.random() - 0.5) * 0.25;
      p.y = origin.y + (Math.random() - 0.5) * 0.25;
      p.z = origin.z + (Math.random() - 0.5) * 0.25;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const spd = speed * (0.45 + Math.random() * 0.75);
      p.vx = Math.sin(phi) * Math.cos(theta) * spd;
      p.vy = Math.abs(Math.cos(phi)) * spd + 2.2;
      p.vz = Math.sin(phi) * Math.sin(theta) * spd;
      p.scale = scale * (0.7 + Math.random() * 0.6);

      this.particleMesh.setColorAt(idx, _dummyColor);
    }
    if (this.particleMesh.instanceColor) {
      this.particleMesh.instanceColor.needsUpdate = true;
    }
  }

  private updateParticles(dt: number) {
    let anyUpdated = false;
    for (let i = 0; i < PARTICLE_POOL_CAPACITY; i++) {
      const p = this.particlePool[i];
      if (!p.active) continue;
      anyUpdated = true;
      p.age += dt;
      if (p.age >= p.maxAge) {
        p.active = false;
        _dummyObj.position.set(0, -100, 0);
        _dummyObj.scale.set(0, 0, 0);
        _dummyObj.updateMatrix();
        this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
        continue;
      }
      p.vy -= 18.0 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      if (p.y < 0.05) {
        p.y = 0.05;
        p.vy *= -0.45;
      }
      const lifeRatio = 1 - p.age / p.maxAge;
      const s = p.scale * lifeRatio;
      _dummyObj.position.set(p.x, p.y, p.z);
      _dummyObj.rotation.set(p.age * 8, p.age * 11, 0);
      _dummyObj.scale.set(s, s, s);
      _dummyObj.updateMatrix();
      this.particleMesh.setMatrixAt(i, _dummyObj.matrix);
    }
    if (anyUpdated) {
      this.particleMesh.instanceMatrix.needsUpdate = true;
    }
  }

  public triggerHitstop(durationSec: number = 0.042) {
    this.hitstopTimer = Math.max(this.hitstopTimer, Math.min(0.08, durationSec));
  }

  public addTrauma(amount: number) {
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + amount);
  }

  public loadMap(mapDef: MapDefinition) {
    this.currentMap = mapDef;
    const toRemove: THREE.Object3D[] = [];
    this.scene.traverse((obj) => {
      if (
        obj !== this.scene &&
        obj !== this.camera &&
        !obj.name.startsWith('tactical_rig') &&
        !obj.name.startsWith('persistent_') &&
        !(obj instanceof THREE.Light) &&
        !this.botManager.bots.some((b) => b.group === obj)
      ) {
        toRemove.push(obj);
      }
    });

    for (const obj of toRemove) {
      if (obj.parent === this.scene) {
        this.scene.remove(obj);
      }
    }

    const res = mapDef.buildVisuals(this.scene, this.renderer);
    this.activePickupMeshes = res.pickupMeshes || [];
    this.activeBarrelMeshes = res.barrelMeshes || [];
    this.activeTeleporterMeshes = res.teleporterMeshes || [];
    this.activeTurretMeshes = res.turretMeshes || [];
    this.activeSupplyCrateMeshes = res.supplyCrateMeshes || [];
    this.activeDestructibleCrateMeshes = res.destructibleCrateMeshes || [];
    this.activeDroneMeshes = res.droneMeshes || [];
    this.activeHoloSpire = res.holoSpire;

    if (mapDef.spawnPoints.length > 0) {
      this.playerController.respawn(mapDef.spawnPoints[0]);
    }
  }

  public addTracer(start: THREE.Vector3, end: THREE.Vector3, colorHex: number = 0xffd166) {
    const geo = new THREE.BufferGeometry().setFromPoints([start, end]);
    const mat = new THREE.LineBasicMaterial({
      color: colorHex,
      transparent: true,
      opacity: 0.85,
    });
    const line = new THREE.Line(geo, mat);
    this.scene.add(line);
    this.activeTracers.push({ line, age: 0 });
  }

  public updateTracers(dt: number) {
    for (let i = this.activeTracers.length - 1; i >= 0; i--) {
      const tracer = this.activeTracers[i];
      tracer.age += dt;
      if (tracer.age > 0.085) {
        this.scene.remove(tracer.line);
        tracer.line.geometry.dispose();
        (tracer.line.material as THREE.Material).dispose();
        this.activeTracers.splice(i, 1);
      }
    }
  }

  public updateInteractiveElements(
    dt: number,
    onTurretHitBot?: (dmg: number, isKill: boolean, victimName: string, hitPos: THREE.Vector3) => void
  ) {
    const nowSec = performance.now() * 0.001;

    // 1. Rotate Central Holographic Spire
    if (this.activeHoloSpire) {
      this.activeHoloSpire.rotation.y += dt * 0.95;
      this.activeHoloSpire.position.y = 8.8 + Math.sin(nowSec * 2.2) * 0.35;
    }

    // 2. Animate Pickups
    for (const item of this.activePickupMeshes) {
      if (item.pickup.isAvailable) {
        item.group.visible = true;
        item.group.rotation.y += dt * 1.8;
        item.group.position.y = item.pickup.position.y + Math.sin(nowSec * 3.0) * 0.12;
      } else {
        item.group.visible = false;
      }
    }

    // 3. Hide Exploded Barrels
    for (const item of this.activeBarrelMeshes) {
      if (item.barrel.isExploded) {
        item.group.visible = false;
      }
    }

    // 4. Animate Stargate Teleporters
    for (const item of this.activeTeleporterMeshes) {
      if (item.teleporter.cooldown > 0) {
        item.teleporter.cooldown = Math.max(0, item.teleporter.cooldown - dt);
      }
      item.ring.rotation.z += dt * 2.4;
    }

    // 5. Animate Mystery Supply Crates
    for (const item of this.activeSupplyCrateMeshes) {
      if (!item.crate.isAvailable) {
        item.crate.respawnTimer -= dt;
        if (item.crate.respawnTimer <= 0) {
          item.crate.isAvailable = true;
        }
      }
      item.holoCore.visible = item.crate.isAvailable;
      if (item.crate.isAvailable) {
        item.holoCore.rotation.y += dt * 2.6;
        item.holoCore.rotation.x += dt * 1.2;
        item.holoCore.position.y = 1.35 + Math.sin(nowSec * 3.5) * 0.15;
      }
    }

    // 6. Update Destructible Cover Crates
    for (const item of this.activeDestructibleCrateMeshes) {
      if (item.crate.isDestroyed) {
        item.group.visible = false;
        item.crate.respawnTimer -= dt;
        if (item.crate.respawnTimer <= 0) {
          item.crate.isDestroyed = false;
          item.crate.health = item.crate.maxHealth;
          item.group.visible = true;
        }
      } else {
        item.group.visible = true;
      }
    }

    // 7. Animate Autonomous Hovering Target Drones
    for (const item of this.activeDroneMeshes) {
      const d = item.drone;
      if (d.isDestroyed) {
        item.group.visible = false;
        d.respawnTimer -= dt;
        if (d.respawnTimer <= 0) {
          d.isDestroyed = false;
          d.health = d.maxHealth;
          item.group.visible = true;
        }
        continue;
      }
      item.group.visible = true;
      d.phase += dt * 1.35;
      d.position.x = d.basePosition.x + Math.sin(d.phase) * 5.5;
      d.position.y = d.basePosition.y + Math.sin(d.phase * 2.1) * 0.65;
      d.position.z = d.basePosition.z + Math.cos(d.phase * 0.85) * 3.5;
      item.group.position.set(d.position.x, d.position.y, d.position.z);
      item.rotorRing.rotation.z += dt * 8.0;
    }

    // 8. Update Automated Sentry Turrets (Hacked Allied Overwatch)
    for (const item of this.activeTurretMeshes) {
      const t = item.turret;
      if (t.owner === 'player') {
        t.activeTimer -= dt;
        if (t.activeTimer <= 0) {
          t.owner = 'neutral';
          item.beaconMat.color.setHex(0xf59e0b);
          (item.laserLine.material as THREE.LineBasicMaterial).color.setHex(0xf59e0b);
          continue;
        }
        item.beaconMat.color.setHex(0x10b981);
        (item.laserLine.material as THREE.LineBasicMaterial).color.setHex(0x10b981);

        // Find nearest enemy bot within 34m
        let nearestBot = null;
        let minDist = 34;
        for (const bot of this.botManager.bots) {
          if (bot.isDead || bot.team === 'blue') continue;
          const dist = Math.hypot(
            bot.position.x - t.position.x,
            bot.position.z - t.position.z
          );
          if (dist < minDist) {
            minDist = dist;
            nearestBot = bot;
          }
        }

        if (nearestBot) {
          const dx = nearestBot.position.x - t.position.x;
          const dz = nearestBot.position.z - t.position.z;
          const desiredYaw = Math.atan2(dx, dz) + Math.PI;
          t.yaw = THREE.MathUtils.lerp(t.yaw, desiredYaw, dt * 10);
          item.headGroup.rotation.y = t.yaw;

          t.fireCooldown -= dt;
          if (t.fireCooldown <= 0) {
            t.fireCooldown = 0.45;
            _turretOrigin.set(t.position.x, t.position.y + 1.35, t.position.z);
            const hitPos = nearestBot.bodyMesh.getWorldPosition(new THREE.Vector3());
            this.addTracer(_turretOrigin.clone(), hitPos, 0x10b981);
            this.spawnParticleBurst(hitPos, 6, 0x10b981, 6.0, 0.7);
            sound.playShoot('smg');
            const dmg = 18;
            const res = this.botManager.damageBot(nearestBot.id, dmg, false);
            if (onTurretHitBot) {
              onTurretHitBot(dmg, res.isKilled, nearestBot.name, hitPos);
            }
          }
        } else {
          t.yaw += dt * 0.8;
          item.headGroup.rotation.y = t.yaw;
        }
      } else {
        t.yaw += dt * 0.45;
        item.headGroup.rotation.y = t.yaw;
      }
    }
  }

  public onWindowResize() {
    if (!this.renderer.domElement.parentElement) return;
    const parent = this.renderer.domElement.parentElement;
    const width = parent.clientWidth || window.innerWidth;
    const height = parent.clientHeight || window.innerHeight;

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  public startAnimationLoop(onTick: (simDt: number, rawDt: number) => void) {
    let lastTime = performance.now();

    const afterDraw = (cb: () => void) => {
      const gl = this.renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (this.isDestroyed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          this.frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          this.frameId = window.setTimeout(cb, 60);
        }
      };
      this.frameId = window.setTimeout(poll, 5);
    };

    const tick = () => {
      if (this.isDestroyed) return;
      const now = performance.now();
      const rawElapsed = (now - lastTime) / 1000;
      lastTime = now;
      const dt = Math.min(rawElapsed, 0.05);

      // Sim-level hitstop freeze on heavy hits/kills
      let simDt = dt;
      if (this.hitstopTimer > 0) {
        this.hitstopTimer = Math.max(0, this.hitstopTimer - dt);
        simDt = dt * 0.08;
      }

      onTick(simDt, dt);

      // Apply decaying trauma * trauma rotational camera shake
      if (this.cameraTrauma > 0) {
        const shake = this.cameraTrauma * this.cameraTrauma;
        this.camera.rotation.z += (Math.random() - 0.5) * 0.065 * shake;
        this.camera.rotation.x += (Math.random() - 0.5) * 0.04 * shake;
        this.cameraTrauma = Math.max(0, this.cameraTrauma - dt * 2.8);
      }

      this.updateTracers(dt);
      this.updateParticles(dt);

      this.renderer.render(this.scene, this.camera);

      if (this.isSoftwareGl) {
        afterDraw(tick);
      } else {
        this.frameId = requestAnimationFrame(tick);
      }
    };

    tick();
  }

  public destroy() {
    this.isDestroyed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onWindowResize);
    this.botManager.cleanup();
    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(this.renderer.domElement);
    }
  }
}
