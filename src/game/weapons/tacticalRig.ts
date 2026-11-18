import * as THREE from 'three';
import { WeaponId, WeaponSkinId } from '../types';

export interface EjectedShell {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  angularVelocity: THREE.Vector3;
  aliveTime: number;
}

export function createTacticalArmsAndWeapon(
  weaponId: WeaponId,
  skinId: WeaponSkinId = 'tactical'
): { rigGroup: THREE.Group; holographicReticle?: THREE.Mesh; shellEjectionPoint: THREE.Vector3 } {
  const rigGroup = new THREE.Group();
  rigGroup.name = `tactical_rig_${weaponId}`;

  // Skin color palettes
  let primaryColor = 0x242830;
  let secondaryColor = 0x181a20;
  let accentColor = 0x38bdf8;
  let metalness = 0.85;
  let roughness = 0.3;

  if (skinId === 'cyber') {
    primaryColor = 0x1e1035;
    secondaryColor = 0x0f0520;
    accentColor = 0x06b6d4;
    metalness = 0.7;
    roughness = 0.25;
  } else if (skinId === 'gold') {
    primaryColor = 0xd4af37;
    secondaryColor = 0xaa8c2c;
    accentColor = 0xffdf78;
    metalness = 0.95;
    roughness = 0.15;
  } else if (skinId === 'camo') {
    primaryColor = 0x786c52;
    secondaryColor = 0x4d4637;
    accentColor = 0xa39b85;
    metalness = 0.4;
    roughness = 0.6;
  } else if (skinId === 'hyperbeast') {
    primaryColor = 0x991b1b;
    secondaryColor = 0x450a0a;
    accentColor = 0xf97316;
    metalness = 0.75;
    roughness = 0.25;
  }

  const weaponMat = new THREE.MeshStandardMaterial({
    color: primaryColor,
    metalness,
    roughness,
  });

  const weaponAccentMat = new THREE.MeshStandardMaterial({
    color: secondaryColor,
    metalness: Math.min(1.0, metalness + 0.1),
    roughness: Math.max(0.1, roughness - 0.1),
  });

  const glowAccentMat = new THREE.MeshStandardMaterial({
    color: accentColor,
    emissive: accentColor,
    emissiveIntensity: 0.6,
    roughness: 0.2,
  });

  const steelMat = new THREE.MeshStandardMaterial({
    color: 0x94a3b8,
    metalness: 0.9,
    roughness: 0.2,
  });

  // Tactical arm and glove materials
  const sleeveMat = new THREE.MeshStandardMaterial({
    color: 0x1f2937,
    roughness: 0.85,
    metalness: 0.1,
  });

  const gloveMat = new THREE.MeshStandardMaterial({
    color: 0x111827,
    roughness: 0.6,
    metalness: 0.3,
  });

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd4a373,
    roughness: 0.7,
    metalness: 0.05,
  });

  // Weapon Container
  const weaponGroup = new THREE.Group();
  weaponGroup.name = 'gun_mesh';
  rigGroup.add(weaponGroup);

  let reticleMesh: THREE.Mesh | undefined;
  let shellEjectionPoint = new THREE.Vector3(0.12, 0.05, -0.15);

  // BUILD REALISTIC WEAPON GEOMETRY
  if (weaponId === 'sniper_rifle') {
    // 1. Long heavy fluted barrel
    const barrelGeo = new THREE.CylinderGeometry(0.018, 0.018, 1.35, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, steelMat);
    barrel.position.set(0, 0.05, -0.75);
    weaponGroup.add(barrel);

    // Muzzle brake compensator
    const brakeGeo = new THREE.CylinderGeometry(0.026, 0.022, 0.12, 12);
    brakeGeo.rotateX(Math.PI / 2);
    const brake = new THREE.Mesh(brakeGeo, steelMat);
    brake.position.set(0, 0.05, -1.42);
    weaponGroup.add(brake);

    // 2. Main receiver body
    const bodyGeo = new THREE.BoxGeometry(0.075, 0.11, 0.55);
    const body = new THREE.Mesh(bodyGeo, weaponMat);
    body.position.set(0, 0.04, -0.12);
    weaponGroup.add(body);

    // Top Picatinny Rail
    const railGeo = new THREE.BoxGeometry(0.05, 0.018, 0.4);
    const rail = new THREE.Mesh(railGeo, weaponAccentMat);
    rail.position.set(0, 0.105, -0.15);
    weaponGroup.add(rail);

    // 3. High-Magnification Sniper Optic Scope
    const scopeTubeGeo = new THREE.CylinderGeometry(0.038, 0.038, 0.42, 16);
    scopeTubeGeo.rotateX(Math.PI / 2);
    const scopeTube = new THREE.Mesh(scopeTubeGeo, weaponAccentMat);
    scopeTube.position.set(0, 0.16, -0.14);

    const bellFrontGeo = new THREE.CylinderGeometry(0.048, 0.038, 0.09, 16);
    bellFrontGeo.rotateX(Math.PI / 2);
    const bellFront = new THREE.Mesh(bellFrontGeo, steelMat);
    bellFront.position.set(0, 0.16, -0.37);

    const scopeMountGeo = new THREE.BoxGeometry(0.045, 0.05, 0.04);
    const mount1 = new THREE.Mesh(scopeMountGeo, weaponAccentMat);
    mount1.position.set(0, 0.13, -0.05);
    const mount2 = mount1.clone();
    mount2.position.set(0, 0.13, -0.25);

    weaponGroup.add(scopeTube, bellFront, mount1, mount2);

    // 4. Tactical Stock with Cheek Rest
    const stockGeo = new THREE.BoxGeometry(0.055, 0.14, 0.38);
    const stock = new THREE.Mesh(stockGeo, weaponMat);
    stock.position.set(0, 0, 0.28);
    weaponGroup.add(stock);

    // 5. Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.048, 0.18, 0.075);
    gripGeo.rotateX(0.28);
    const grip = new THREE.Mesh(gripGeo, weaponAccentMat);
    grip.position.set(0, -0.1, 0.06);
    weaponGroup.add(grip);

    // 6. Bolt Handle
    const boltShaftGeo = new THREE.CylinderGeometry(0.007, 0.007, 0.09, 8);
    boltShaftGeo.rotateZ(Math.PI / 2);
    const boltKnobGeo = new THREE.SphereGeometry(0.016, 8, 8);
    const boltShaft = new THREE.Mesh(boltShaftGeo, steelMat);
    const boltKnob = new THREE.Mesh(boltKnobGeo, steelMat);
    boltShaft.position.set(0.07, 0.08, 0.02);
    boltKnob.position.set(0.12, 0.08, 0.02);
    weaponGroup.add(boltShaft, boltKnob);

  } else {
    // Assault Rifle / SMG / Shotgun / Standard Tactical Platform
    // 1. Lower & Upper Receiver with Ejection Port
    const lowerGeo = new THREE.BoxGeometry(0.065, 0.1, 0.45);
    const lower = new THREE.Mesh(lowerGeo, weaponMat);
    lower.position.set(0, 0.04, -0.1);

    const upperRailGeo = new THREE.BoxGeometry(0.045, 0.02, 0.42);
    const upperRail = new THREE.Mesh(upperRailGeo, weaponAccentMat);
    upperRail.position.set(0, 0.1, -0.1);
    weaponGroup.add(lower, upperRail);

    // 2. Fluted Barrel with Gas Block
    const barrelGeo = new THREE.CylinderGeometry(0.016, 0.016, 0.58, 14);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, steelMat);
    barrel.position.set(0, 0.05, -0.55);

    const muzzleBrakeGeo = new THREE.CylinderGeometry(0.022, 0.018, 0.08, 12);
    muzzleBrakeGeo.rotateX(Math.PI / 2);
    const muzzleBrake = new THREE.Mesh(muzzleBrakeGeo, steelMat);
    muzzleBrake.position.set(0, 0.05, -0.87);
    weaponGroup.add(barrel, muzzleBrake);

    // 3. M-LOK / Quad Rail Handguard
    const handguardGeo = new THREE.BoxGeometry(0.068, 0.085, 0.34);
    const handguard = new THREE.Mesh(handguardGeo, weaponAccentMat);
    handguard.position.set(0, 0.045, -0.42);
    weaponGroup.add(handguard);

    // 4. Curved Textured Polymer Magazine
    const magGeo = new THREE.BoxGeometry(0.042, 0.24, 0.085);
    magGeo.rotateX(0.24);
    const mag = new THREE.Mesh(magGeo, weaponAccentMat);
    mag.position.set(0, -0.11, -0.16);
    weaponGroup.add(mag);

    // 5. Ergonomic Pistol Grip
    const gripGeo = new THREE.BoxGeometry(0.046, 0.17, 0.07);
    gripGeo.rotateX(0.32);
    const grip = new THREE.Mesh(gripGeo, weaponAccentMat);
    grip.position.set(0, -0.09, 0.07);
    weaponGroup.add(grip);

    // 6. Adjustable Tactical Crane Stock
    const stockTubeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.28, 12);
    stockTubeGeo.rotateX(Math.PI / 2);
    const stockTube = new THREE.Mesh(stockTubeGeo, steelMat);
    stockTube.position.set(0, 0.05, 0.2);

    const buttpadGeo = new THREE.BoxGeometry(0.055, 0.14, 0.18);
    const buttpad = new THREE.Mesh(buttpadGeo, weaponMat);
    buttpad.position.set(0, 0.02, 0.3);
    weaponGroup.add(stockTube, buttpad);

    // 7. Holographic Red Dot Sight (EOTech Optic)
    const opticHoodGeo = new THREE.BoxGeometry(0.06, 0.065, 0.14);
    const opticHood = new THREE.Mesh(opticHoodGeo, weaponAccentMat);
    opticHood.position.set(0, 0.14, -0.1);

    // Glass lens inside sight
    const lensGeo = new THREE.PlaneGeometry(0.042, 0.042);
    const lensMat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
    });
    const lens = new THREE.Mesh(lensGeo, lensMat);
    lens.position.set(0, 0.14, -0.09);

    // Glowing projected Holographic Reticle
    const reticleGeo = new THREE.RingGeometry(0.007, 0.009, 16);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0xff0044,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.9,
    });
    reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    reticleMesh.position.set(0, 0.14, -0.088);

    weaponGroup.add(opticHood, lens, reticleMesh);

    // Accent glow stripe for cyber / special skins
    if (skinId === 'cyber' || skinId === 'hyperbeast') {
      const glowStripeGeo = new THREE.BoxGeometry(0.07, 0.008, 0.3);
      const glowStripe = new THREE.Mesh(glowStripeGeo, glowAccentMat);
      glowStripe.position.set(0, 0.08, -0.42);
      weaponGroup.add(glowStripe);
    }
  }

  // BUILD REALISTIC FIRST-PERSON ARMS & GLOVED HANDS
  // Right Arm (Trigger Hand)
  const rightForearmGeo = new THREE.CylinderGeometry(0.052, 0.044, 0.45, 12);
  rightForearmGeo.rotateX(0.7);
  rightForearmGeo.rotateZ(-0.25);
  const rightForearm = new THREE.Mesh(rightForearmGeo, sleeveMat);
  rightForearm.position.set(0.18, -0.28, 0.25);
  rigGroup.add(rightForearm);

  // Right Hand & Tactical Glove
  const rightHandGeo = new THREE.BoxGeometry(0.06, 0.09, 0.07);
  rightHandGeo.rotateX(0.3);
  const rightHand = new THREE.Mesh(rightHandGeo, gloveMat);
  rightHand.position.set(0.02, -0.09, 0.06);
  rigGroup.add(rightHand);

  // Left Arm (Foregrip Hand)
  const leftForearmGeo = new THREE.CylinderGeometry(0.048, 0.042, 0.52, 12);
  leftForearmGeo.rotateX(0.9);
  leftForearmGeo.rotateZ(0.38);
  leftForearmGeo.rotateY(0.2);
  const leftForearm = new THREE.Mesh(leftForearmGeo, sleeveMat);
  leftForearm.position.set(-0.22, -0.32, -0.15);
  rigGroup.add(leftForearm);

  // Left Hand grasping front handguard
  const leftHandGeo = new THREE.BoxGeometry(0.065, 0.08, 0.07);
  leftHandGeo.rotateZ(0.4);
  const leftHand = new THREE.Mesh(leftHandGeo, gloveMat);
  leftHand.position.set(-0.04, -0.03, -0.36);
  rigGroup.add(leftHand);

  // Rig default positioning
  rigGroup.position.set(0.22, -0.22, -0.42);
  rigGroup.scale.set(0.85, 0.85, 0.85);

  return { rigGroup, holographicReticle: reticleMesh, shellEjectionPoint };
}
