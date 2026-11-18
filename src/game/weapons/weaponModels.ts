import * as THREE from 'three';
import { WeaponId } from '../types';

export function createProceduralWeaponModel(weaponId: WeaponId): THREE.Group {
  const group = new THREE.Group();
  group.name = `weapon_${weaponId}`;

  const darkMetal = new THREE.MeshStandardMaterial({
    color: 0x212529,
    metalness: 0.85,
    roughness: 0.25,
  });

  const gunBody = new THREE.MeshStandardMaterial({
    color: 0x343a40,
    metalness: 0.7,
    roughness: 0.35,
  });

  const accentMetal = new THREE.MeshStandardMaterial({
    color: 0x495057,
    metalness: 0.9,
    roughness: 0.2,
  });

  const orangeAccent = new THREE.MeshStandardMaterial({
    color: 0xf77f00,
    metalness: 0.4,
    roughness: 0.5,
  });

  const woodGrip = new THREE.MeshStandardMaterial({
    color: 0x6f1d1b,
    metalness: 0.1,
    roughness: 0.7,
  });

  if (weaponId === 'sniper_rifle') {
    // 1. Long heavy barrel
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 1.1, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, darkMetal);
    barrel.position.set(0, 0.05, -0.65);
    group.add(barrel);

    // 2. Main receiver body
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.1, 0.45);
    const body = new THREE.Mesh(bodyGeo, gunBody);
    body.position.set(0, 0.04, -0.1);
    group.add(body);

    // 3. Sniper Scope Tube
    const scopeGeo = new THREE.CylinderGeometry(0.035, 0.035, 0.35, 16);
    scopeGeo.rotateX(Math.PI / 2);
    const scope = new THREE.Mesh(scopeGeo, accentMetal);
    scope.position.set(0, 0.13, -0.12);
    group.add(scope);

    // 4. Scope mount rings
    const ringGeo = new THREE.BoxGeometry(0.04, 0.06, 0.03);
    const ring1 = new THREE.Mesh(ringGeo, darkMetal);
    ring1.position.set(0, 0.1, -0.04);
    const ring2 = ring1.clone();
    ring2.position.set(0, 0.1, -0.2);
    group.add(ring1, ring2);

    // 5. Stock
    const stockGeo = new THREE.BoxGeometry(0.06, 0.12, 0.35);
    const stock = new THREE.Mesh(stockGeo, gunBody);
    stock.position.set(0, -0.01, 0.25);
    group.add(stock);

    // 6. Grip
    const gripGeo = new THREE.BoxGeometry(0.05, 0.16, 0.07);
    gripGeo.rotateX(0.25);
    const grip = new THREE.Mesh(gripGeo, woodGrip);
    grip.position.set(0, -0.09, 0.05);
    group.add(grip);

    // 7. Bolt handle
    const boltGeo = new THREE.CylinderGeometry(0.008, 0.008, 0.07, 8);
    boltGeo.rotateZ(Math.PI / 2);
    const bolt = new THREE.Mesh(boltGeo, accentMetal);
    bolt.position.set(0.06, 0.07, 0.05);
    group.add(bolt);

  } else if (weaponId === 'smg') {
    // 1. Compact body
    const bodyGeo = new THREE.BoxGeometry(0.07, 0.12, 0.4);
    const body = new THREE.Mesh(bodyGeo, gunBody);
    body.position.set(0, 0.04, -0.1);
    group.add(body);

    // 2. Short barrel with suppressor/shroud
    const barrelGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.3, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, darkMetal);
    barrel.position.set(0, 0.05, -0.4);
    group.add(barrel);

    // 3. Extended stick magazine
    const magGeo = new THREE.BoxGeometry(0.04, 0.28, 0.06);
    magGeo.rotateX(0.15);
    const mag = new THREE.Mesh(magGeo, darkMetal);
    mag.position.set(0, -0.12, -0.1);
    group.add(mag);

    // 4. Pistol grip
    const gripGeo = new THREE.BoxGeometry(0.05, 0.15, 0.07);
    gripGeo.rotateX(0.3);
    const grip = new THREE.Mesh(gripGeo, accentMetal);
    grip.position.set(0, -0.08, 0.08);
    group.add(grip);

    // 5. Wire stock
    const stockGeo = new THREE.BoxGeometry(0.05, 0.04, 0.22);
    const stock = new THREE.Mesh(stockGeo, darkMetal);
    stock.position.set(0, 0.04, 0.2);
    group.add(stock);

    // 6. Top reflex optic
    const sightGeo = new THREE.BoxGeometry(0.03, 0.04, 0.08);
    const sight = new THREE.Mesh(sightGeo, orangeAccent);
    sight.position.set(0, 0.12, -0.1);
    group.add(sight);

  } else if (weaponId === 'shotgun') {
    // 1. Thick pump-action receiver
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.12, 0.45);
    const body = new THREE.Mesh(bodyGeo, gunBody);
    body.position.set(0, 0.04, -0.1);
    group.add(body);

    // 2. Twin heavy barrels
    const barrelGeo = new THREE.CylinderGeometry(0.026, 0.026, 0.7, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel1 = new THREE.Mesh(barrelGeo, darkMetal);
    barrel1.position.set(0, 0.06, -0.55);
    group.add(barrel1);

    // 3. Magazine tube underneath
    const tubeGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 16);
    tubeGeo.rotateX(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeo, accentMetal);
    tube.position.set(0, 0.01, -0.5);
    group.add(tube);

    // 4. Pump slide
    const pumpGeo = new THREE.BoxGeometry(0.085, 0.07, 0.2);
    const pump = new THREE.Mesh(pumpGeo, woodGrip);
    pump.position.set(0, 0.01, -0.45);
    group.add(pump);

    // 5. Stock
    const stockGeo = new THREE.BoxGeometry(0.06, 0.13, 0.35);
    const stock = new THREE.Mesh(stockGeo, woodGrip);
    stock.position.set(0, -0.02, 0.25);
    group.add(stock);

  } else if (weaponId === 'revolver') {
    // 1. Heavy frame
    const frameGeo = new THREE.BoxGeometry(0.06, 0.1, 0.22);
    const frame = new THREE.Mesh(frameGeo, accentMetal);
    frame.position.set(0, 0.03, -0.05);
    group.add(frame);

    // 2. Rotating cylinder
    const cylGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.12, 12);
    cylGeo.rotateX(Math.PI / 2);
    const cyl = new THREE.Mesh(cylGeo, darkMetal);
    cyl.position.set(0, 0.03, -0.08);
    group.add(cyl);

    // 3. Fluted barrel
    const barrelGeo = new THREE.BoxGeometry(0.04, 0.06, 0.3);
    const barrel = new THREE.Mesh(barrelGeo, accentMetal);
    barrel.position.set(0, 0.05, -0.28);
    group.add(barrel);

    // 4. Wooden Grip
    const gripGeo = new THREE.BoxGeometry(0.05, 0.16, 0.08);
    gripGeo.rotateX(0.4);
    const grip = new THREE.Mesh(gripGeo, woodGrip);
    grip.position.set(0, -0.08, 0.06);
    group.add(grip);

    // 5. Hammer
    const hammerGeo = new THREE.BoxGeometry(0.02, 0.05, 0.03);
    const hammer = new THREE.Mesh(hammerGeo, darkMetal);
    hammer.position.set(0, 0.08, 0.05);
    group.add(hammer);

  } else if (weaponId === 'rocket_launcher') {
    // 1. Main heavy tube
    const tubeGeo = new THREE.CylinderGeometry(0.07, 0.07, 1.2, 16);
    tubeGeo.rotateX(Math.PI / 2);
    const tube = new THREE.Mesh(tubeGeo, gunBody);
    tube.position.set(0, 0.08, -0.2);
    group.add(tube);

    // 2. Front conical flare
    const flareGeo = new THREE.CylinderGeometry(0.09, 0.07, 0.15, 16);
    flareGeo.rotateX(Math.PI / 2);
    const flare = new THREE.Mesh(flareGeo, darkMetal);
    flare.position.set(0, 0.08, -0.82);
    group.add(flare);

    // 3. Sight housing
    const sightGeo = new THREE.BoxGeometry(0.08, 0.12, 0.15);
    const sight = new THREE.Mesh(sightGeo, orangeAccent);
    sight.position.set(-0.08, 0.15, -0.3);
    group.add(sight);

    // 4. Grip & shoulder rest
    const gripGeo = new THREE.BoxGeometry(0.05, 0.16, 0.07);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -0.08, -0.1);
    group.add(grip);

  } else if (weaponId === 'knife') {
    // 1. Blade
    const bladeGeo = new THREE.BoxGeometry(0.02, 0.06, 0.3);
    const blade = new THREE.Mesh(bladeGeo, accentMetal);
    blade.position.set(0, 0.03, -0.2);
    group.add(blade);

    // 2. Crossguard
    const guardGeo = new THREE.BoxGeometry(0.05, 0.1, 0.02);
    const guard = new THREE.Mesh(guardGeo, darkMetal);
    guard.position.set(0, 0.03, -0.05);
    group.add(guard);

    // 3. Handle grip
    const handleGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.18, 12);
    handleGeo.rotateX(Math.PI / 2);
    const handle = new THREE.Mesh(handleGeo, woodGrip);
    handle.position.set(0, 0.03, 0.06);
    group.add(handle);

  } else {
    // Assault Rifle & Semi-Auto
    // 1. Receiver body
    const bodyGeo = new THREE.BoxGeometry(0.07, 0.11, 0.45);
    const body = new THREE.Mesh(bodyGeo, gunBody);
    body.position.set(0, 0.04, -0.1);
    group.add(body);

    // 2. Barrel
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.6, 16);
    barrelGeo.rotateX(Math.PI / 2);
    const barrel = new THREE.Mesh(barrelGeo, darkMetal);
    barrel.position.set(0, 0.05, -0.5);
    group.add(barrel);

    // 3. Handguard shroud
    const guardGeo = new THREE.BoxGeometry(0.075, 0.09, 0.3);
    const guard = new THREE.Mesh(guardGeo, accentMetal);
    guard.position.set(0, 0.04, -0.4);
    group.add(guard);

    // 4. Curved magazine
    const magGeo = new THREE.BoxGeometry(0.04, 0.25, 0.08);
    magGeo.rotateX(0.3);
    const mag = new THREE.Mesh(magGeo, darkMetal);
    mag.position.set(0, -0.1, -0.15);
    group.add(mag);

    // 5. Pistol grip
    const gripGeo = new THREE.BoxGeometry(0.05, 0.15, 0.07);
    gripGeo.rotateX(0.3);
    const grip = new THREE.Mesh(gripGeo, darkMetal);
    grip.position.set(0, -0.08, 0.08);
    group.add(grip);

    // 6. Tactical Stock
    const stockGeo = new THREE.BoxGeometry(0.06, 0.11, 0.3);
    const stock = new THREE.Mesh(stockGeo, gunBody);
    stock.position.set(0, 0.02, 0.24);
    group.add(stock);

    // 7. Sights
    const frontSightGeo = new THREE.BoxGeometry(0.015, 0.04, 0.02);
    const frontSight = new THREE.Mesh(frontSightGeo, orangeAccent);
    frontSight.position.set(0, 0.11, -0.55);
    group.add(frontSight);
  }

  // Set default viewmodel positioning
  group.position.set(0.24, -0.22, -0.45);
  group.scale.set(0.85, 0.85, 0.85);

  return group;
}
