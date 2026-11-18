import * as THREE from 'three';
import { Box3Like } from '../physics/movementMath';
import { textures } from '../textures/proceduralTextures';
import {
  InteractiveJumpPad,
  InteractivePickup,
  ExplosiveBarrel,
  InteractiveTeleporter,
  InteractiveTurret,
  InteractiveSupplyCrate,
  DestructibleCrate,
  TargetDrone,
} from '../types';

export interface BuiltMapVisuals {
  targets?: { mesh: THREE.Mesh; health: number; resetTime: number }[];
  jumpPadMeshes?: { mesh: THREE.Mesh; pad: InteractiveJumpPad }[];
  pickupMeshes?: { group: THREE.Group; pickup: InteractivePickup }[];
  barrelMeshes?: { group: THREE.Group; barrel: ExplosiveBarrel }[];
  teleporterMeshes?: { group: THREE.Group; ring: THREE.Mesh; teleporter: InteractiveTeleporter }[];
  turretMeshes?: {
    group: THREE.Group;
    headGroup: THREE.Group;
    laserLine: THREE.Line;
    beaconMat: THREE.MeshBasicMaterial;
    turret: InteractiveTurret;
  }[];
  supplyCrateMeshes?: {
    group: THREE.Group;
    holoCore: THREE.Mesh;
    crate: InteractiveSupplyCrate;
  }[];
  destructibleCrateMeshes?: {
    group: THREE.Group;
    crate: DestructibleCrate;
  }[];
  droneMeshes?: {
    group: THREE.Group;
    rotorRing: THREE.Mesh;
    drone: TargetDrone;
  }[];
  holoSpire?: THREE.Object3D;
}

export interface MapDefinition {
  id: string;
  name: string;
  subtitle: string;
  spawnPoints: THREE.Vector3[];
  botWaypoints: THREE.Vector3[];
  collisionBoxes: Box3Like[];
  jumpPads: InteractiveJumpPad[];
  pickups: InteractivePickup[];
  explosiveBarrels: ExplosiveBarrel[];
  teleporters: InteractiveTeleporter[];
  turrets: InteractiveTurret[];
  supplyCrates: InteractiveSupplyCrate[];
  destructibleCrates: DestructibleCrate[];
  targetDrones: TargetDrone[];
  buildVisuals: (scene: THREE.Scene, renderer: THREE.WebGLRenderer) => BuiltMapVisuals;
}

/**
 * Shared builder for interactive 3D world props (Teleporters, Sentry Turrets,
 * Supply Crates, Destructible Crates, and Hovering Target Drones) with composite
 * 3-12 part THREE.Group geometry and contact shadow grounding.
 */
function buildInteractiveWorldProps(
  scene: THREE.Scene,
  mapDef: MapDefinition,
  collision: Box3Like[]
): Pick<
  BuiltMapVisuals,
  | 'teleporterMeshes'
  | 'turretMeshes'
  | 'supplyCrateMeshes'
  | 'destructibleCrateMeshes'
  | 'droneMeshes'
> {
  const shadowGeo = new THREE.CircleGeometry(1.15, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  // 1. Composite Stargate Teleporter Portals
  const teleporterMeshes: NonNullable<BuiltMapVisuals['teleporterMeshes']> = [];
  for (const tp of mapDef.teleporters) {
    tp.cooldown = 0;
    const group = new THREE.Group();
    group.position.set(tp.position.x, tp.position.y, tp.position.z);

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.position.y = 0.02;
    group.add(contact);

    // Base Pedestal (Primary)
    const baseGeo = new THREE.CylinderGeometry(1.45, 1.65, 0.24, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.35,
      metalness: 0.75,
    });
    const base = new THREE.Mesh(baseGeo, baseMat);
    base.position.y = 0.12;
    group.add(base);

    // Side Pylons (Secondary)
    const pylonGeo = new THREE.BoxGeometry(0.28, 2.8, 0.4);
    const pylonMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.65,
      metalness: 0.4,
    });
    const leftPylon = new THREE.Mesh(pylonGeo, pylonMat);
    leftPylon.position.set(-1.35, 1.5, 0);
    const rightPylon = new THREE.Mesh(pylonGeo, pylonMat);
    rightPylon.position.set(1.35, 1.5, 0);
    group.add(leftPylon, rightPylon);

    // Rotating Energy Torus (Accent)
    const ringGeo = new THREE.TorusGeometry(1.15, 0.09, 12, 32);
    const ringMat = new THREE.MeshStandardMaterial({
      color: tp.colorHex,
      emissive: tp.colorHex,
      emissiveIntensity: 0.85,
      roughness: 0.2,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 1.55;
    group.add(ring);

    // Inner Portal Shimmer Disc
    const coreGeo = new THREE.CircleGeometry(1.05, 24);
    const coreMat = new THREE.MeshBasicMaterial({
      color: tp.colorHex,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    core.position.y = 1.55;
    group.add(core);

    scene.add(group);
    teleporterMeshes.push({ group, ring, teleporter: tp });
  }

  // 2. Hackable Automated Sentry Turrets (Composite 7-part mesh)
  const turretMeshes: NonNullable<BuiltMapVisuals['turretMeshes']> = [];
  for (const turret of mapDef.turrets) {
    turret.owner = 'neutral';
    turret.activeTimer = 0;
    turret.fireCooldown = 0;

    const group = new THREE.Group();
    group.position.set(turret.position.x, turret.position.y, turret.position.z);

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.position.y = 0.02;
    group.add(contact);

    // Tripod Armored Base
    const baseGeo = new THREE.CylinderGeometry(0.65, 0.95, 0.55, 8);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.7,
      metalness: 0.35,
    });
    const baseMesh = new THREE.Mesh(baseGeo, baseMat);
    baseMesh.position.y = 0.28;
    group.add(baseMesh);

    const stemGeo = new THREE.CylinderGeometry(0.28, 0.35, 0.75, 12);
    const stemMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.4,
      metalness: 0.7,
    });
    const stemMesh = new THREE.Mesh(stemGeo, stemMat);
    stemMesh.position.y = 0.85;
    group.add(stemMesh);

    // Rotating Turret Head Assembly
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.32, 0);

    const housingGeo = new THREE.BoxGeometry(0.85, 0.52, 0.95);
    const housingMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.45,
      metalness: 0.65,
    });
    const housing = new THREE.Mesh(housingGeo, housingMat);
    headGroup.add(housing);

    // Dual Rotary Barrels
    const barrelGeo = new THREE.CylinderGeometry(0.07, 0.07, 0.95, 10);
    barrelGeo.rotateX(Math.PI / 2);
    const barrelMat = new THREE.MeshStandardMaterial({
      color: 0x94a3b8,
      roughness: 0.2,
      metalness: 0.9,
    });
    const leftBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    leftBarrel.position.set(-0.22, 0, -0.75);
    const rightBarrel = new THREE.Mesh(barrelGeo, barrelMat);
    rightBarrel.position.set(0.22, 0, -0.75);
    headGroup.add(leftBarrel, rightBarrel);

    // Status Beacon Dome
    const beaconGeo = new THREE.SphereGeometry(0.16, 12, 12);
    const beaconMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b });
    const beacon = new THREE.Mesh(beaconGeo, beaconMat);
    beacon.position.set(0, 0.34, 0);
    headGroup.add(beacon);

    // Laser Sight Line
    const laserPts = [new THREE.Vector3(0, 0, -0.45), new THREE.Vector3(0, 0, -14)];
    const laserGeo = new THREE.BufferGeometry().setFromPoints(laserPts);
    const laserMat = new THREE.LineBasicMaterial({
      color: 0xf59e0b,
      transparent: true,
      opacity: 0.65,
    });
    const laserLine = new THREE.Line(laserGeo, laserMat);
    headGroup.add(laserLine);

    group.add(headGroup);
    scene.add(group);

    collision.push({
      min: { x: turret.position.x - 0.85, y: turret.position.y, z: turret.position.z - 0.85 },
      max: { x: turret.position.x + 0.85, y: turret.position.y + 1.8, z: turret.position.z + 0.85 },
    });

    turretMeshes.push({ group, headGroup, laserLine, beaconMat, turret });
  }

  // 3. Mystery Weapon & Overdrive Supply Crates
  const supplyCrateMeshes: NonNullable<BuiltMapVisuals['supplyCrateMeshes']> = [];
  for (const crate of mapDef.supplyCrates) {
    crate.isAvailable = true;
    crate.respawnTimer = 0;

    const group = new THREE.Group();
    group.position.set(crate.position.x, crate.position.y, crate.position.z);

    const contact = new THREE.Mesh(shadowGeo, shadowMat);
    contact.position.y = 0.02;
    group.add(contact);

    // Military Chest Base
    const chestGeo = new THREE.BoxGeometry(1.35, 0.72, 0.92);
    const chestMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.55,
      metalness: 0.5,
    });
    const chest = new THREE.Mesh(chestGeo, chestMat);
    chest.position.y = 0.36;
    group.add(chest);

    // Gold Trim Straps
    const trimGeo = new THREE.BoxGeometry(1.4, 0.16, 0.96);
    const trimMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.85,
    });
    const trim = new THREE.Mesh(trimGeo, trimMat);
    trim.position.y = 0.65;
    group.add(trim);

    // Floating Holographic Octahedron Core
    const holoGeo = new THREE.OctahedronGeometry(0.36, 0);
    const holoMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.8,
      roughness: 0.15,
      metalness: 0.8,
    });
    const holoCore = new THREE.Mesh(holoGeo, holoMat);
    holoCore.position.y = 1.35;
    group.add(holoCore);

    scene.add(group);
    supplyCrateMeshes.push({ group, holoCore, crate });
  }

  // 4. Destructible Cover Crates
  const destructibleCrateMeshes: NonNullable<BuiltMapVisuals['destructibleCrateMeshes']> = [];
  for (const dc of mapDef.destructibleCrates) {
    dc.health = dc.maxHealth;
    dc.isDestroyed = false;
    dc.respawnTimer = 0;

    const group = new THREE.Group();
    group.position.set(dc.position.x, dc.position.y, dc.position.z);

    const boxGeo = new THREE.BoxGeometry(1.4, 1.4, 1.4);
    const boxMat = new THREE.MeshStandardMaterial({
      color: 0xb45309,
      roughness: 0.8,
      metalness: 0.1,
    });
    const box = new THREE.Mesh(boxGeo, boxMat);
    box.position.y = 0.7;
    group.add(box);

    const frameGeo = new THREE.BoxGeometry(1.46, 0.2, 1.46);
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0x78350f,
      roughness: 0.5,
      metalness: 0.3,
    });
    const topBand = new THREE.Mesh(frameGeo, frameMat);
    topBand.position.y = 1.25;
    const botBand = new THREE.Mesh(frameGeo, frameMat);
    botBand.position.y = 0.18;
    group.add(topBand, botBand);

    scene.add(group);
    destructibleCrateMeshes.push({ group, crate: dc });
  }

  // 5. Autonomous Hovering Target Drones
  const droneMeshes: NonNullable<BuiltMapVisuals['droneMeshes']> = [];
  for (const drone of mapDef.targetDrones) {
    drone.health = drone.maxHealth;
    drone.isDestroyed = false;
    drone.respawnTimer = 0;
    drone.position = { ...drone.basePosition };

    const group = new THREE.Group();
    group.position.set(drone.position.x, drone.position.y, drone.position.z);

    // Central Core Sphere
    const coreGeo = new THREE.SphereGeometry(0.45, 16, 16);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.55,
      roughness: 0.25,
      metalness: 0.6,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Outer Gyro Rotor Ring
    const rotorGeo = new THREE.TorusGeometry(0.75, 0.07, 10, 24);
    rotorGeo.rotateX(Math.PI / 2);
    const rotorMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 0.45,
      roughness: 0.3,
      metalness: 0.8,
    });
    const rotorRing = new THREE.Mesh(rotorGeo, rotorMat);
    group.add(rotorRing);

    // Bullseye Eye Sensor
    const eyeGeo = new THREE.SphereGeometry(0.2, 12, 12);
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const eye = new THREE.Mesh(eyeGeo, eyeMat);
    eye.position.set(0, 0, 0.38);
    group.add(eye);

    scene.add(group);
    droneMeshes.push({ group, rotorRing, drone });
  }

  return {
    teleporterMeshes,
    turretMeshes,
    supplyCrateMeshes,
    destructibleCrateMeshes,
    droneMeshes,
  };
}

export const MAPS: Record<string, MapDefinition> = {
  urban: {
    id: 'urban',
    name: 'Neo-Tokyo Plaza',
    subtitle: 'Cyberpunk metropolis plaza with stargate portals, auto-turrets & drone lanes',
    spawnPoints: [
      new THREE.Vector3(0, 0.5, 32),
      new THREE.Vector3(0, 0.5, -32),
      new THREE.Vector3(26, 0.5, 0),
      new THREE.Vector3(-26, 0.5, 0),
      new THREE.Vector3(18, 6.5, 18),
      new THREE.Vector3(-18, 6.5, -18),
    ],
    botWaypoints: [
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(14, 0.5, 14),
      new THREE.Vector3(-14, 0.5, 14),
      new THREE.Vector3(14, 0.5, -14),
      new THREE.Vector3(-14, 0.5, -14),
      new THREE.Vector3(22, 0.5, 0),
      new THREE.Vector3(-22, 0.5, 0),
      new THREE.Vector3(0, 0.5, 20),
      new THREE.Vector3(0, 0.5, -20),
      new THREE.Vector3(16, 6.2, 16),
      new THREE.Vector3(-16, 6.2, -16),
    ],
    collisionBoxes: [],
    jumpPads: [
      { id: 'jp_1', position: { x: 14, y: 0.1, z: 22 }, boostVelocity: 26 },
      { id: 'jp_2', position: { x: -14, y: 0.1, z: -22 }, boostVelocity: 26 },
      { id: 'jp_3', position: { x: 0, y: 0.1, z: -10 }, boostVelocity: 24 },
    ],
    pickups: [
      { id: 'pk_med_1', type: 'health', position: { x: 0, y: 0.8, z: 12 }, respawnTimer: 0, isAvailable: true },
      { id: 'pk_med_2', type: 'health', position: { x: 18, y: 6.8, z: -18 }, respawnTimer: 0, isAvailable: true },
      { id: 'pk_ammo_1', type: 'ammo', position: { x: -20, y: 0.8, z: 0 }, respawnTimer: 0, isAvailable: true },
      { id: 'pk_ammo_2', type: 'ammo', position: { x: 20, y: 0.8, z: 0 }, respawnTimer: 0, isAvailable: true },
    ],
    explosiveBarrels: [
      { id: 'bar_1', position: { x: 10, y: 0, z: 6 }, health: 50, isExploded: false },
      { id: 'bar_2', position: { x: -10, y: 0, z: -6 }, health: 50, isExploded: false },
      { id: 'bar_3', position: { x: 22, y: 0, z: -12 }, health: 50, isExploded: false },
      { id: 'bar_4', position: { x: -22, y: 0, z: 12 }, health: 50, isExploded: false },
    ],
    teleporters: [
      {
        id: 'tp_urban_a',
        pairId: 'tp_urban_b',
        label: 'South Plaza Cyan Gate',
        position: { x: -12, y: 0, z: 24 },
        targetPosition: { x: 10, y: 6.2, z: -26 },
        colorHex: 0x06b6d4,
        cooldown: 0,
      },
      {
        id: 'tp_urban_b',
        pairId: 'tp_urban_a',
        label: 'North Deck Magenta Gate',
        position: { x: 10, y: 6.0, z: -28 },
        targetPosition: { x: -12, y: 0.5, z: 21 },
        colorHex: 0xec4899,
        cooldown: 0,
      },
    ],
    turrets: [
      {
        id: 'tur_urban_1',
        label: 'East Plaza Auto-Turret',
        position: { x: 8, y: 0, z: 16 },
        owner: 'neutral',
        activeTimer: 0,
        fireCooldown: 0,
        yaw: 0,
      },
      {
        id: 'tur_urban_2',
        label: 'West Sector Auto-Turret',
        position: { x: -8, y: 0, z: -16 },
        owner: 'neutral',
        activeTimer: 0,
        fireCooldown: 0,
        yaw: Math.PI,
      },
    ],
    supplyCrates: [
      {
        id: 'sup_urban_1',
        label: 'Central Overdrive Cache',
        position: { x: 6, y: 0, z: 22 },
        isAvailable: true,
        respawnTimer: 0,
      },
      {
        id: 'sup_urban_2',
        label: 'North Armory Cache',
        position: { x: -6, y: 0, z: -18 },
        isAvailable: true,
        respawnTimer: 0,
      },
    ],
    destructibleCrates: [
      { id: 'dc_u1', position: { x: 4.5, y: 0, z: 15 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
      { id: 'dc_u2', position: { x: -4.5, y: 0, z: 15 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
      { id: 'dc_u3', position: { x: 13, y: 0, z: 0 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
      { id: 'dc_u4', position: { x: -13, y: 0, z: 0 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
    ],
    targetDrones: [
      {
        id: 'dr_u1',
        basePosition: { x: -10, y: 6.5, z: 6 },
        position: { x: -10, y: 6.5, z: 6 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 0,
      },
      {
        id: 'dr_u2',
        basePosition: { x: 10, y: 7.2, z: -6 },
        position: { x: 10, y: 7.2, z: -6 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 2.1,
      },
      {
        id: 'dr_u3',
        basePosition: { x: 0, y: 8.5, z: 14 },
        position: { x: 0, y: 8.5, z: 14 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 4.2,
      },
    ],
    buildVisuals: (scene, renderer) => {
      const collision: Box3Like[] = [];
      const asphaltTex = textures.getAsphaltStreet(renderer);
      const concreteTex = textures.getConcrete(renderer);
      const containerRed = textures.getMetalContainer(renderer, '#dc2626');
      const containerBlue = textures.getMetalContainer(renderer, '#2563eb');
      const crateTex = textures.getWoodCrate(renderer);
      const hazardTex = textures.getMilitaryHazard(renderer);
      const jumpPadTex = textures.getJumpPadTexture(renderer);

      // 1. Realistic Sky Horizon with Distant Metropolis Skyline
      const skyGeo = new THREE.SphereGeometry(160, 32, 16);
      const skyMat = new THREE.MeshBasicMaterial({
        color: 0x0a1128,
        side: THREE.BackSide,
      });
      scene.add(new THREE.Mesh(skyGeo, skyMat));

      const buildingColors = [0x0f172a, 0x1e1b4b, 0x172554, 0x090d16];
      for (let i = 0; i < 28; i++) {
        const angle = (i / 28) * Math.PI * 2;
        const dist = 75 + (i % 5) * 6;
        const bw = 12 + (i % 4) * 4;
        const bh = 38 + (i % 6) * 9;
        const bd = 12 + (i % 3) * 5;

        const bGeo = new THREE.BoxGeometry(bw, bh, bd);
        const bMat = new THREE.MeshStandardMaterial({
          color: buildingColors[i % buildingColors.length],
          roughness: 0.8,
          metalness: 0.3,
        });
        const bMesh = new THREE.Mesh(bGeo, bMat);
        bMesh.position.set(Math.cos(angle) * dist, bh / 2 - 5, Math.sin(angle) * dist);
        scene.add(bMesh);

        const beaconGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const beaconMat = new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0xef4444 : 0x38bdf8 });
        const beacon = new THREE.Mesh(beaconGeo, beaconMat);
        beacon.position.set(bMesh.position.x, bh - 4, bMesh.position.z);
        scene.add(beacon);
      }

      // 2. Ground Asphalt
      const groundGeo = new THREE.PlaneGeometry(92, 92);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: asphaltTex,
        roughness: 0.65,
        metalness: 0.2,
      });
      asphaltTex.repeat.set(12, 12);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const addObstacle = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        mat: THREE.Material
      ) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        collision.push({
          min: { x: x - w / 2, y: y, z: z - d / 2 },
          max: { x: x + w / 2, y: y + h, z: z + d / 2 },
        });
        return mesh;
      };

      const wallMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: concreteTex,
        roughness: 0.7,
        metalness: 0.2,
      });
      const crateMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: crateTex,
        roughness: 0.8,
      });
      const redContMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: containerRed,
        roughness: 0.45,
        metalness: 0.5,
      });
      const blueContMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: containerBlue,
        roughness: 0.45,
        metalness: 0.5,
      });
      const hazardMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: hazardTex,
        roughness: 0.4,
      });

      // Perimeter Fortress Walls
      addObstacle(0, 0, 45, 90, 8, 2, wallMat);
      addObstacle(0, 0, -45, 90, 8, 2, wallMat);
      addObstacle(45, 0, 0, 2, 8, 90, wallMat);
      addObstacle(-45, 0, 0, 2, 8, 90, wallMat);

      // Glowing Cyber Neon Billboards
      const neonTex1 = textures.getCyberNeonSign(renderer, 'CYBER KRUNK 2088', '#38bdf8');
      const neon1Geo = new THREE.PlaneGeometry(16, 4.5);
      const sign1 = new THREE.Mesh(neon1Geo, new THREE.MeshBasicMaterial({ map: neonTex1 }));
      sign1.position.set(0, 5.5, -43.8);
      scene.add(sign1);

      const neonTex2 = textures.getCyberNeonSign(renderer, 'NEO ARENA SECTOR-7', '#ec4899');
      const sign2 = new THREE.Mesh(neon1Geo, new THREE.MeshBasicMaterial({ map: neonTex2 }));
      sign2.position.set(0, 5.5, 43.8);
      sign2.rotation.y = Math.PI;
      scene.add(sign2);

      // Street Lamps (capped PointLights for lossless performance)
      const lampPositions = [
        { x: -16, z: -16 },
        { x: 16, z: -16 },
        { x: -16, z: 16 },
        { x: 16, z: 16 },
      ];
      lampPositions.forEach((pos) => {
        addObstacle(pos.x, 0, pos.z, 0.4, 7, 0.4, wallMat);
        const lampHead = new THREE.Mesh(
          new THREE.BoxGeometry(1.2, 0.3, 0.8),
          new THREE.MeshStandardMaterial({ color: 0x0f172a, emissive: 0xffedd5, emissiveIntensity: 0.6 })
        );
        lampHead.position.set(pos.x, 7.1, pos.z);
        scene.add(lampHead);
      });

      // Center High Plaza Monument with Rotating Holographic Spire
      addObstacle(0, 0, 0, 9, 1.2, 9, wallMat);
      addObstacle(0, 1.2, 0, 5, 3.2, 5, redContMat);
      addObstacle(0, 4.4, 0, 2, 2.5, 2, hazardMat);

      const holoGroup = new THREE.Group();
      holoGroup.position.set(0, 8.8, 0);
      const holoOct = new THREE.Mesh(
        new THREE.OctahedronGeometry(1.45, 0),
        new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          emissive: 0x0284c7,
          emissiveIntensity: 0.9,
          roughness: 0.15,
          metalness: 0.8,
          wireframe: false,
        })
      );
      const holoRing = new THREE.Mesh(
        new THREE.TorusGeometry(2.2, 0.08, 12, 32),
        new THREE.MeshBasicMaterial({ color: 0xf59e0b })
      );
      holoRing.rotation.x = Math.PI / 3;
      holoGroup.add(holoOct, holoRing);
      scene.add(holoGroup);

      // North Building with Sniper Deck & Access Ramps
      addObstacle(0, 0, -28, 28, 6, 14, wallMat);
      addObstacle(-13, 6, -28, 1.5, 1.2, 14, wallMat);
      addObstacle(13, 6, -28, 1.5, 1.2, 14, wallMat);
      addObstacle(17, 0, -20, 5, 2, 8, crateMat);
      addObstacle(17, 2, -26, 5, 2, 6, crateMat);
      addObstacle(17, 4, -30, 5, 2, 4, crateMat);

      // South Building (offset Z so spawn at (0, 0.5, 32) has clear view of the central plaza!)
      addObstacle(-22, 0, 28, 14, 6, 12, wallMat);
      addObstacle(22, 0, 28, 14, 6, 12, wallMat);

      // East & West Container Depots
      addObstacle(24, 0, 8, 4.5, 3.5, 9.5, redContMat);
      addObstacle(24, 0, -8, 4.5, 3.5, 9.5, blueContMat);
      addObstacle(24, 3.5, 0, 4.5, 3.5, 9.5, redContMat);

      addObstacle(-24, 0, 8, 4.5, 3.5, 9.5, blueContMat);
      addObstacle(-24, 0, -8, 4.5, 3.5, 9.5, redContMat);
      addObstacle(-24, 3.5, 0, 4.5, 3.5, 9.5, blueContMat);

      // Cover Crates
      addObstacle(9, 0, 9, 3, 2.5, 3, crateMat);
      addObstacle(-9, 0, 9, 3, 2.5, 3, crateMat);
      addObstacle(9, 0, -9, 3, 2.5, 3, crateMat);
      addObstacle(-9, 0, -9, 3, 2.5, 3, crateMat);

      // Jump Pads
      const jumpPadMeshes: { mesh: THREE.Mesh; pad: InteractiveJumpPad }[] = [];
      MAPS.urban.jumpPads.forEach((pad) => {
        const padGeo = new THREE.CylinderGeometry(2.0, 2.0, 0.15, 24);
        const padMat = new THREE.MeshStandardMaterial({
          color: 0xffffff,
          map: jumpPadTex,
          emissive: 0x0284c7,
          emissiveIntensity: 0.6,
          roughness: 0.3,
        });
        const mesh = new THREE.Mesh(padGeo, padMat);
        mesh.position.set(pad.position.x, pad.position.y + 0.08, pad.position.z);
        scene.add(mesh);
        jumpPadMeshes.push({ mesh, pad });
      });

      // Pickups
      const pickupMeshes: { group: THREE.Group; pickup: InteractivePickup }[] = [];
      MAPS.urban.pickups.forEach((pk) => {
        const pGroup = new THREE.Group();
        pGroup.position.set(pk.position.x, pk.position.y, pk.position.z);

        if (pk.type === 'health') {
          const medMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 0.5, 0.3),
            new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 })
          );
          const crossMat = new THREE.MeshBasicMaterial({ color: 0x10b981 });
          const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.35, 0.32), crossMat);
          const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.32), crossMat);
          pGroup.add(medMesh, c1, c2);
        } else {
          const ammoMesh = new THREE.Mesh(
            new THREE.BoxGeometry(0.65, 0.45, 0.4),
            new THREE.MeshStandardMaterial({
              color: 0xf59e0b,
              metalness: 0.8,
              roughness: 0.25,
            })
          );
          pGroup.add(ammoMesh);
        }

        scene.add(pGroup);
        pickupMeshes.push({ group: pGroup, pickup: pk });
      });

      // Explosive Barrels
      const barrelMeshes: { group: THREE.Group; barrel: ExplosiveBarrel }[] = [];
      MAPS.urban.explosiveBarrels.forEach((barrel) => {
        barrel.health = 50;
        barrel.isExploded = false;
        const bGroup = new THREE.Group();
        bGroup.position.set(barrel.position.x, barrel.position.y, barrel.position.z);

        const barrelMesh = new THREE.Mesh(
          new THREE.CylinderGeometry(0.45, 0.45, 1.3, 16),
          new THREE.MeshStandardMaterial({
            color: 0xdc2626,
            metalness: 0.7,
            roughness: 0.35,
          })
        );
        barrelMesh.position.y = 0.65;
        barrelMesh.castShadow = true;
        bGroup.add(barrelMesh);

        const stripe = new THREE.Mesh(
          new THREE.CylinderGeometry(0.46, 0.46, 0.22, 16),
          new THREE.MeshBasicMaterial({ color: 0xfbbf24 })
        );
        stripe.position.y = 0.65;
        bGroup.add(stripe);

        scene.add(bGroup);
        barrelMeshes.push({ group: bGroup, barrel });
      });

      const worldProps = buildInteractiveWorldProps(scene, MAPS.urban, collision);
      MAPS.urban.collisionBoxes = collision;

      return {
        jumpPadMeshes,
        pickupMeshes,
        barrelMeshes,
        holoSpire: holoGroup,
        ...worldProps,
      };
    },
  },

  desert: {
    id: 'desert',
    name: 'Desert Outpost',
    subtitle: 'Arid desert fortress with adobe ramparts, sentry turrets & stargate portals',
    spawnPoints: [
      new THREE.Vector3(0, 0.5, 30),
      new THREE.Vector3(0, 0.5, -30),
      new THREE.Vector3(25, 0.5, 0),
      new THREE.Vector3(-25, 0.5, 0),
    ],
    botWaypoints: [
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(15, 0.5, 15),
      new THREE.Vector3(-15, 0.5, 15),
      new THREE.Vector3(15, 0.5, -15),
      new THREE.Vector3(-15, 0.5, -15),
      new THREE.Vector3(0, 4.5, 0),
      new THREE.Vector3(0, 0.5, 20),
      new THREE.Vector3(0, 0.5, -20),
    ],
    collisionBoxes: [],
    jumpPads: [
      { id: 'jp_des_1', position: { x: 0, y: 0.1, z: 12 }, boostVelocity: 25 },
      { id: 'jp_des_2', position: { x: 0, y: 0.1, z: -12 }, boostVelocity: 25 },
    ],
    pickups: [
      { id: 'pk_des_med', type: 'health', position: { x: 0, y: 5.2, z: 0 }, respawnTimer: 0, isAvailable: true },
      { id: 'pk_des_ammo', type: 'ammo', position: { x: 18, y: 0.8, z: 0 }, respawnTimer: 0, isAvailable: true },
    ],
    explosiveBarrels: [
      { id: 'bar_des_1', position: { x: 12, y: 0, z: 10 }, health: 50, isExploded: false },
      { id: 'bar_des_2', position: { x: -12, y: 0, z: -10 }, health: 50, isExploded: false },
    ],
    teleporters: [
      {
        id: 'tp_des_a',
        pairId: 'tp_des_b',
        label: 'Dune South Portal',
        position: { x: -10, y: 0, z: 22 },
        targetPosition: { x: 0, y: 8.6, z: 0 },
        colorHex: 0x06b6d4,
        cooldown: 0,
      },
      {
        id: 'tp_des_b',
        pairId: 'tp_des_a',
        label: 'Citadel Roof Portal',
        position: { x: 0, y: 8.5, z: -2 },
        targetPosition: { x: -10, y: 0.5, z: 19 },
        colorHex: 0xf59e0b,
        cooldown: 0,
      },
    ],
    turrets: [
      {
        id: 'tur_des_1',
        label: 'Outpost Defense Turret',
        position: { x: 8, y: 0, z: 14 },
        owner: 'neutral',
        activeTimer: 0,
        fireCooldown: 0,
        yaw: 0,
      },
    ],
    supplyCrates: [
      {
        id: 'sup_des_1',
        label: 'Desert Armory Cache',
        position: { x: 6, y: 0, z: 20 },
        isAvailable: true,
        respawnTimer: 0,
      },
    ],
    destructibleCrates: [
      { id: 'dc_d1', position: { x: 8, y: 0, z: 8 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
      { id: 'dc_d2', position: { x: -8, y: 0, z: 8 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
    ],
    targetDrones: [
      {
        id: 'dr_d1',
        basePosition: { x: 0, y: 10.5, z: 10 },
        position: { x: 0, y: 10.5, z: 10 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 0,
      },
      {
        id: 'dr_d2',
        basePosition: { x: 12, y: 8.5, z: -8 },
        position: { x: 12, y: 8.5, z: -8 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 1.8,
      },
    ],
    buildVisuals: (scene, renderer) => {
      const collision: Box3Like[] = [];
      const sandTex = textures.getSandstone(renderer);
      const jumpPadTex = textures.getJumpPadTexture(renderer);

      const skyGeo = new THREE.SphereGeometry(160, 32, 16);
      const skyMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8, side: THREE.BackSide });
      scene.add(new THREE.Mesh(skyGeo, skyMat));

      const groundGeo = new THREE.PlaneGeometry(90, 90);
      const groundMat = new THREE.MeshStandardMaterial({
        color: 0xffffff,
        map: sandTex,
        roughness: 0.85,
        metalness: 0.05,
      });
      sandTex.repeat.set(12, 12);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const addObstacle = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        mat: THREE.Material
      ) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        collision.push({
          min: { x: x - w / 2, y: y, z: z - d / 2 },
          max: { x: x + w / 2, y: y + h, z: z + d / 2 },
        });
        return mesh;
      };

      const adobeMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: sandTex, roughness: 0.85 });

      addObstacle(0, 0, 42, 84, 7, 2, adobeMat);
      addObstacle(0, 0, -42, 84, 7, 2, adobeMat);
      addObstacle(42, 0, 0, 2, 7, 84, adobeMat);
      addObstacle(-42, 0, 0, 2, 7, 84, adobeMat);

      addObstacle(0, 0, 0, 10, 4.5, 10, adobeMat);
      addObstacle(0, 4.5, 0, 6, 4.0, 6, adobeMat);

      addObstacle(20, 0, 16, 16, 5, 12, adobeMat);
      addObstacle(20, 0, -16, 16, 5, 12, adobeMat);
      addObstacle(-20, 0, 16, 16, 5, 12, adobeMat);
      addObstacle(-20, 0, -16, 16, 5, 12, adobeMat);

      const jumpPadMeshes: { mesh: THREE.Mesh; pad: InteractiveJumpPad }[] = [];
      MAPS.desert.jumpPads.forEach((pad) => {
        const mesh = new THREE.Mesh(
          new THREE.CylinderGeometry(2.0, 2.0, 0.15, 24),
          new THREE.MeshStandardMaterial({ color: 0xffffff, map: jumpPadTex, emissive: 0x0284c7, emissiveIntensity: 0.5 })
        );
        mesh.position.set(pad.position.x, pad.position.y + 0.08, pad.position.z);
        scene.add(mesh);
        jumpPadMeshes.push({ mesh, pad });
      });

      const worldProps = buildInteractiveWorldProps(scene, MAPS.desert, collision);
      MAPS.desert.collisionBoxes = collision;
      return { jumpPadMeshes, ...worldProps };
    },
  },

  industrial: {
    id: 'industrial',
    name: 'Industrial Complex',
    subtitle: 'Multi-level warehouse hub with cargo containers, auto-turrets & catwalks',
    spawnPoints: [
      new THREE.Vector3(0, 0.5, 28),
      new THREE.Vector3(0, 0.5, -28),
      new THREE.Vector3(26, 0.5, 0),
      new THREE.Vector3(-26, 0.5, 0),
    ],
    botWaypoints: [
      new THREE.Vector3(0, 0.5, 0),
      new THREE.Vector3(14, 0.5, 14),
      new THREE.Vector3(-14, 0.5, 14),
      new THREE.Vector3(14, 0.5, -14),
      new THREE.Vector3(-14, 0.5, -14),
      new THREE.Vector3(0, 5.2, 0),
    ],
    collisionBoxes: [],
    jumpPads: [
      { id: 'jp_ind_1', position: { x: 0, y: 0.1, z: 14 }, boostVelocity: 26 },
    ],
    pickups: [
      { id: 'pk_ind_med', type: 'health', position: { x: 0, y: 5.8, z: 0 }, respawnTimer: 0, isAvailable: true },
    ],
    explosiveBarrels: [
      { id: 'bar_ind_1', position: { x: 9, y: 0, z: 10 }, health: 50, isExploded: false },
      { id: 'bar_ind_2', position: { x: -9, y: 0, z: -10 }, health: 50, isExploded: false },
    ],
    teleporters: [
      {
        id: 'tp_ind_a',
        pairId: 'tp_ind_b',
        label: 'Floor Dock Teleporter',
        position: { x: -12, y: 0, z: 18 },
        targetPosition: { x: 0, y: 5.6, z: -12 },
        colorHex: 0x06b6d4,
        cooldown: 0,
      },
      {
        id: 'tp_ind_b',
        pairId: 'tp_ind_a',
        label: 'Catwalk Overlook Teleporter',
        position: { x: 0, y: 5.5, z: -14 },
        targetPosition: { x: -12, y: 0.5, z: 15 },
        colorHex: 0xec4899,
        cooldown: 0,
      },
    ],
    turrets: [
      {
        id: 'tur_ind_1',
        label: 'Warehouse Sentry Turret',
        position: { x: 8, y: 0, z: 14 },
        owner: 'neutral',
        activeTimer: 0,
        fireCooldown: 0,
        yaw: 0,
      },
    ],
    supplyCrates: [
      {
        id: 'sup_ind_1',
        label: 'Foundry Overdrive Cache',
        position: { x: 6, y: 0, z: 20 },
        isAvailable: true,
        respawnTimer: 0,
      },
    ],
    destructibleCrates: [
      { id: 'dc_i1', position: { x: 6, y: 0, z: 8 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
      { id: 'dc_i2', position: { x: -6, y: 0, z: 8 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
    ],
    targetDrones: [
      {
        id: 'dr_i1',
        basePosition: { x: 0, y: 9.0, z: 6 },
        position: { x: 0, y: 9.0, z: 6 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 0,
      },
    ],
    buildVisuals: (scene, renderer) => {
      const collision: Box3Like[] = [];
      const concreteTex = textures.getConcrete(renderer);
      const redCont = textures.getMetalContainer(renderer, '#d90429');

      const groundGeo = new THREE.PlaneGeometry(90, 90);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTex, roughness: 0.75 });
      concreteTex.repeat.set(14, 14);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const addObstacle = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        mat: THREE.Material
      ) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        collision.push({
          min: { x: x - w / 2, y: y, z: z - d / 2 },
          max: { x: x + w / 2, y: y + h, z: z + d / 2 },
        });
        return mesh;
      };

      const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTex, roughness: 0.7 });
      const redMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: redCont, roughness: 0.5, metalness: 0.4 });

      addObstacle(0, 0, 40, 80, 8, 2, wallMat);
      addObstacle(0, 0, -40, 80, 8, 2, wallMat);
      addObstacle(40, 0, 0, 2, 8, 80, wallMat);
      addObstacle(-40, 0, 0, 2, 8, 80, wallMat);

      addObstacle(0, 5, 0, 10, 0.5, 36, wallMat);
      addObstacle(-4, 0, 0, 1.5, 5, 1.5, redMat);
      addObstacle(4, 0, 0, 1.5, 5, 1.5, redMat);

      const worldProps = buildInteractiveWorldProps(scene, MAPS.industrial, collision);
      MAPS.industrial.collisionBoxes = collision;
      return { ...worldProps };
    },
  },

  training: {
    id: 'training',
    name: 'Training Facility',
    subtitle: 'Firing range with reactive target drones, auto-turrets & parkour course',
    spawnPoints: [
      new THREE.Vector3(0, 0.5, 32),
      new THREE.Vector3(12, 0.5, 32),
      new THREE.Vector3(-12, 0.5, 32),
    ],
    botWaypoints: [
      new THREE.Vector3(0, 0.5, 10),
      new THREE.Vector3(10, 0.5, 0),
      new THREE.Vector3(-10, 0.5, 0),
      new THREE.Vector3(0, 0.5, -15),
    ],
    collisionBoxes: [],
    jumpPads: [
      { id: 'jp_tr_1', position: { x: -15, y: 0.1, z: 20 }, boostVelocity: 24 },
    ],
    pickups: [
      { id: 'pk_tr_med', type: 'health', position: { x: 0, y: 0.8, z: 18 }, respawnTimer: 0, isAvailable: true },
    ],
    explosiveBarrels: [
      { id: 'bar_tr_1', position: { x: 8, y: 0, z: 8 }, health: 50, isExploded: false },
    ],
    teleporters: [
      {
        id: 'tp_tr_a',
        pairId: 'tp_tr_b',
        label: 'Range Entry Gate',
        position: { x: -8, y: 0, z: 24 },
        targetPosition: { x: -15, y: 6.5, z: -10 },
        colorHex: 0x06b6d4,
        cooldown: 0,
      },
      {
        id: 'tp_tr_b',
        pairId: 'tp_tr_a',
        label: 'Parkour Summit Gate',
        position: { x: -15, y: 6.0, z: -10 },
        targetPosition: { x: -8, y: 0.5, z: 21 },
        colorHex: 0xec4899,
        cooldown: 0,
      },
    ],
    turrets: [
      {
        id: 'tur_tr_1',
        label: 'Range Training Turret',
        position: { x: 6, y: 0, z: 20 },
        owner: 'neutral',
        activeTimer: 0,
        fireCooldown: 0,
        yaw: 0,
      },
    ],
    supplyCrates: [
      {
        id: 'sup_tr_1',
        label: 'Training Overdrive Cache',
        position: { x: 4, y: 0, z: 25 },
        isAvailable: true,
        respawnTimer: 0,
      },
    ],
    destructibleCrates: [
      { id: 'dc_t1', position: { x: 4, y: 0, z: 14 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
      { id: 'dc_t2', position: { x: -4, y: 0, z: 14 }, health: 60, maxHealth: 60, isDestroyed: false, respawnTimer: 0 },
    ],
    targetDrones: [
      {
        id: 'dr_t1',
        basePosition: { x: 0, y: 6.0, z: 8 },
        position: { x: 0, y: 6.0, z: 8 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 0,
      },
      {
        id: 'dr_t2',
        basePosition: { x: 8, y: 6.8, z: -4 },
        position: { x: 8, y: 6.8, z: -4 },
        health: 45,
        maxHealth: 45,
        isDestroyed: false,
        respawnTimer: 0,
        phase: 1.5,
      },
    ],
    buildVisuals: (scene, renderer) => {
      const collision: Box3Like[] = [];
      const gridTex = textures.getGridFloor(renderer);
      const targetTex = textures.getTargetBullseye(renderer);
      const concreteTex = textures.getConcrete(renderer);

      const groundGeo = new THREE.PlaneGeometry(90, 90);
      const groundMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: gridTex, roughness: 0.6 });
      gridTex.repeat.set(18, 18);
      const ground = new THREE.Mesh(groundGeo, groundMat);
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      scene.add(ground);

      const addObstacle = (
        x: number,
        y: number,
        z: number,
        w: number,
        h: number,
        d: number,
        mat: THREE.Material
      ) => {
        const geo = new THREE.BoxGeometry(w, h, d);
        const mesh = new THREE.Mesh(geo, mat);
        mesh.position.set(x, y + h / 2, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        scene.add(mesh);

        collision.push({
          min: { x: x - w / 2, y: y, z: z - d / 2 },
          max: { x: x + w / 2, y: y + h, z: z + d / 2 },
        });
        return mesh;
      };

      const wallMat = new THREE.MeshStandardMaterial({ color: 0xffffff, map: concreteTex, roughness: 0.7 });
      const neonPlatformMat = new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x0284c7,
        emissiveIntensity: 0.4,
        roughness: 0.3,
      });

      addObstacle(0, 0, 42, 84, 6, 2, wallMat);
      addObstacle(0, 0, -42, 84, 6, 2, wallMat);
      addObstacle(42, 0, 0, 2, 6, 84, wallMat);
      addObstacle(-42, 0, 0, 2, 6, 84, wallMat);

      addObstacle(-15, 0, 20, 4, 1.2, 4, neonPlatformMat);
      addObstacle(-22, 0, 14, 3.5, 2.2, 3.5, neonPlatformMat);
      addObstacle(-28, 0, 6, 3.5, 3.5, 3.5, neonPlatformMat);
      addObstacle(-22, 0, -2, 3.5, 4.8, 3.5, neonPlatformMat);
      addObstacle(-15, 0, -10, 3.5, 6.0, 3.5, neonPlatformMat);

      const targets: { mesh: THREE.Mesh; health: number; resetTime: number }[] = [];
      const distances = [{ z: 12 }, { z: 0 }, { z: -12 }, { z: -25 }];
      distances.forEach((dist) => {
        addObstacle(18, 0, dist.z, 0.4, 2.2, 0.4, wallMat);
        const disc = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 0.8, 0.08, 24),
          new THREE.MeshStandardMaterial({ color: 0xffffff, map: targetTex, roughness: 0.4 })
        );
        disc.rotation.x = Math.PI / 2;
        disc.position.set(18, 2.2, dist.z);
        scene.add(disc);
        targets.push({ mesh: disc, health: 100, resetTime: 0 });
      });

      const worldProps = buildInteractiveWorldProps(scene, MAPS.training, collision);
      MAPS.training.collisionBoxes = collision;
      return { targets, ...worldProps };
    },
  },
};
