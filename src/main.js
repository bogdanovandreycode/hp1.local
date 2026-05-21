import "./style.css";

import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import {
  MeshBVH,
  acceleratedRaycast,
  computeBoundsTree,
  disposeBoundsTree
} from "three-mesh-bvh";


THREE.BufferGeometry.prototype.computeBoundsTree =
  computeBoundsTree;

THREE.BufferGeometry.prototype.disposeBoundsTree =
  disposeBoundsTree;

THREE.Mesh.prototype.raycast =
  acceleratedRaycast;

//
// CREATE CANVAS
//

document.body.innerHTML = `
    <canvas id="game"></canvas>

    <div class="hud">
        PS1 Harry Potter Prototype | Bobs: 0 / 3
    </div>
`;

//
// CANVAS
//

const canvas = document.getElementById("game");

//
// RENDERER
//

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: false
});

renderer.setSize(window.innerWidth, window.innerHeight);

renderer.setPixelRatio(1);

renderer.outputColorSpace = THREE.SRGBColorSpace;

renderer.toneMapping = THREE.NoToneMapping;

//
// SCENE
//

const scene = new THREE.Scene();

scene.background = new THREE.Color(0x0b0b14);

//
// CAMERA
//

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);

camera.position.set(0, 5, 14);

//
// LIGHT
//

const light = new THREE.DirectionalLight(
  0xffffff,
  1.2
);

light.position.set(5, 10, 7);

scene.add(light);

const ambient = new THREE.AmbientLight(
  0xffffff,
  0.7
);

scene.add(ambient);

//
// LOADER
//

const loader = new GLTFLoader();

//
// MODELS
//

let hall = null;
let wizard = null;
let bobTemplate = null;

const bobs = [];

//
// COLLIDERS
//

const colliders      = [];
let   enterTrigger   = null;
const enterTriggerBox = new THREE.Box3();

//
// FIND SPAWN
//

function tryPlaceWizard() {

  if (!hall || !wizard) {
    return;
  }

  //
  // DEBUG OBJECTS
  //

  hall.traverse(obj => {

    console.log(obj.name);
  });

  //
  // FIND EMPTY
  //

  const spawn =
    hall.getObjectByName("SPAWN_PLAYER");

  if (spawn) {

    wizard.position.copy(spawn.position);

    console.log("spawn found");
  }
  else {

    console.log("spawn NOT found");
  }
}

//
// PLACE BOBS
//

function tryPlaceBobs() {

  if (!hall || !bobTemplate || bobs.length > 0) {
    return;
  }

  for (let i = 1; i <= 3; i++) {

    const spawn =
      hall.getObjectByName(`SPAWN_BOB_${i}`);

    if (!spawn) {
      console.log(`SPAWN_BOB_${i} not found`);
      continue;
    }

    const bob = bobTemplate.clone(true);

    const worldPos = new THREE.Vector3();
    spawn.getWorldPosition(worldPos);

    bob.position.copy(worldPos);

    bob.traverse(obj => {

      if (!obj.isMesh) return;

      const hasMat =
        obj.material &&
        !obj.material.transparent &&
        obj.material.opacity > 0;

      if (hasMat) {

        obj.material = obj.material.clone();
        obj.material.side = THREE.DoubleSide;

        if (obj.material.map) {

          obj.material.map.magFilter = THREE.NearestFilter;
          obj.material.map.minFilter = THREE.NearestFilter;
          obj.material.map.generateMipmaps = false;
          obj.material.map.needsUpdate = true;
        }

      } else {

        obj.material = new THREE.MeshLambertMaterial({
          color: 0xffd700,
          side: THREE.DoubleSide
        });
      }
    });

    scene.add(bob);

    bobs.push({
      mesh: bob,
      baseY: worldPos.y,
      collected: false
    });

    console.log(`SPAWN_BOB_${i} placed`);
  }
}

//
// LOAD HALL
//

loader.load(

  "/Assets/Models/hall.glb",

  (gltf) => {

    hall = gltf.scene;

    //
    // PS1 TEXTURES
    //

    hall.traverse(obj => {

      if (!obj.isMesh) return;

      const mat = obj.material;

      mat.side = THREE.DoubleSide;

      if (mat.map) {

        mat.map.magFilter = THREE.NearestFilter;
        mat.map.minFilter = THREE.NearestFilter;
        mat.map.generateMipmaps = false;
        mat.map.needsUpdate = true;
      }
    });

    scene.add(hall);

    hall.updateMatrixWorld(true);

    //
    // COLLIDERS + TRIGGERS
    //

    hall.traverse(obj => {

      if (obj.name.startsWith("COLLISION_WALL")) {

        obj.visible = false;
        obj.geometry.computeBoundsTree();

        colliders.push(obj);
      }

      if (obj.name === "ENTER_GAME") {

        obj.visible = false;
        enterTrigger = obj;
        enterTriggerBox.setFromObject(obj);
      }
    });

    console.log(`colliders found: ${colliders.length}`);

    tryPlaceWizard();

    tryPlaceBobs();

    console.log("hall loaded");
  }
);

//
// LOAD WIZARD
//

loader.load(

  "/Assets/Models/wizard_raw.glb",

  (gltf) => {

    wizard = gltf.scene;

    wizard.scale.set(1, 1, 1);

    wizard.position.set(0, 0, 5);

    //
    // FIX MATERIALS
    //

    wizard.traverse(obj => {

      if (!obj.isMesh) return;

      const hasMat =
        obj.material &&
        !obj.material.transparent &&
        obj.material.opacity > 0;

      if (hasMat) {

        obj.material.side = THREE.DoubleSide;

        if (obj.material.map) {

          obj.material.map.magFilter = THREE.NearestFilter;
          obj.material.map.minFilter = THREE.NearestFilter;
          obj.material.map.generateMipmaps = false;
          obj.material.map.needsUpdate = true;
        }

      } else {

        obj.material = new THREE.MeshLambertMaterial({
          color: 0x9966cc,
          side: THREE.DoubleSide
        });
      }
    });

    scene.add(wizard);

    tryPlaceWizard();

    console.log("wizard loaded");
  }
);

//
// LOAD BOB
//

loader.load(

  "/Assets/Models/bob.glb",

  (gltf) => {

    bobTemplate = gltf.scene;

    tryPlaceBobs();

    console.log("bob loaded");
  }
);

//
// CONTROLS
//

const keys = {};

window.addEventListener("keydown", e => {

  keys[e.code] = true;
});

window.addEventListener("keyup", e => {

  keys[e.code] = false;
});

//
// CAMERA
//

let yaw = 0;

let pitch = -0.2;

let wizardYaw = 0;

document.body.addEventListener("click", () => {

  document.body.requestPointerLock();
});

document.addEventListener("mousemove", e => {

  if (
    document.pointerLockElement !==
    document.body
  ) {
    return;
  }

  yaw -= e.movementX * 0.002;

  pitch -= e.movementY * 0.002;

  pitch = Math.max(-1, Math.min(1, pitch));
});

//
// ANIMATION
//

const FRAME_MS = 1000 / 60;
let lastFrameTime = 0;
let elapsed = 0;

// cached vectors — avoid allocations every frame
const _camOffset       = new THREE.Vector3();
const _camTarget       = new THREE.Vector3();
const _camDesired      = new THREE.Vector3();
const _camEye          = new THREE.Vector3();
const _camRayDir       = new THREE.Vector3();
const _camRaycaster    = new THREE.Raycaster();
const _rayIntersects   = [];
const _playerBox       = new THREE.Box3();
const _playerCenter    = new THREE.Vector3();
const _playerSize      = new THREE.Vector3(0.6, 1.8, 0.6);
const _playerSphere    = new THREE.Sphere();
const _localSphere     = new THREE.Sphere();
const _prevPos         = new THREE.Vector3();

function animate(now) {

  requestAnimationFrame(animate);

  // FPS cap: skip frame if not enough time has passed
  const delta = now - lastFrameTime;
  if (delta < FRAME_MS) return;

  // accumulate time for bob levitation
  elapsed += Math.min(delta, 50) * 0.001; // clamp spike to 50ms
  lastFrameTime = now - (delta % FRAME_MS);

  // normalized delta factor (1.0 = exactly 60fps)
  const dt = Math.min(delta, 50) / (1000 / 60);

  if (wizard) {

    const speed = 0.06;

    //
    // MOVE + ROTATE TOWARD MOVEMENT
    //

    let dx = 0;
    let dz = 0;

    if (keys["KeyW"]) {
      dx += Math.sin(yaw);
      dz += Math.cos(yaw);
    }

    if (keys["KeyS"]) {
      dx -= Math.sin(yaw);
      dz -= Math.cos(yaw);
    }

    if (keys["KeyA"]) {
      dx += Math.cos(yaw);
      dz -= Math.sin(yaw);
    }

    if (keys["KeyD"]) {
      dx -= Math.cos(yaw);
      dz += Math.sin(yaw);
    }

    if (dx !== 0 || dz !== 0) {

      const len   = Math.sqrt(dx * dx + dz * dz);
      const moveX = (dx / len) * speed * dt;
      const moveZ = (dz / len) * speed * dt;

      _prevPos.copy(wizard.position);

      //
      // SLIDE X
      //

      wizard.position.x += moveX;
      _playerCenter.copy(wizard.position);
      _playerCenter.y += 0.9;
      _playerSphere.set(_playerCenter, 0.4);

      for (const mesh of colliders) {
        _localSphere.copy(_playerSphere);
        mesh.worldToLocal(_localSphere.center);
        if (mesh.geometry.boundsTree.intersectsSphere(_localSphere)) {
          wizard.position.x = _prevPos.x;
          break;
        }
      }

      //
      // SLIDE Z
      //

      wizard.position.z += moveZ;
      _playerCenter.copy(wizard.position);
      _playerCenter.y += 0.9;
      _playerSphere.set(_playerCenter, 0.4);

      for (const mesh of colliders) {
        _localSphere.copy(_playerSphere);
        mesh.worldToLocal(_localSphere.center);
        if (mesh.geometry.boundsTree.intersectsSphere(_localSphere)) {
          wizard.position.z = _prevPos.z;
          break;
        }
      }

      const targetYaw = Math.atan2(dx, dz);

      let diff = targetYaw - wizardYaw;
      while (diff >  Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;

      wizardYaw += diff * 0.15 * dt;
    }

    //
    // ROTATE
    //

    wizard.rotation.y = wizardYaw;

    //
    // CAMERA
    //

    _camOffset.set(
      Math.sin(yaw) * -4.5,
      2.5,
      Math.cos(yaw) * -4.5
    );

    _camDesired.copy(wizard.position).add(_camOffset);

    //
    // CAMERA OBSTRUCTION
    //

    _camEye.copy(wizard.position);
    _camEye.y += 1.5;

    _camRayDir
      .subVectors(_camDesired, _camEye)
      .normalize();

    const camFullDist = _camEye.distanceTo(_camDesired);
    let   camDist     = camFullDist;

    _camRaycaster.set(_camEye, _camRayDir);
    _camRaycaster.far = camFullDist;

    _rayIntersects.length = 0;
    _camRaycaster.intersectObjects(colliders, false, _rayIntersects);

    if (_rayIntersects.length > 0 && _rayIntersects[0].distance > 0.1) {
      camDist = _rayIntersects[0].distance;
    }

    if (camDist < camFullDist) {

      _camTarget
        .copy(_camEye)
        .addScaledVector(_camRayDir, Math.max(0.5, camDist - 0.3));

      camera.position.lerp(_camTarget, 0.3 * dt);

    } else {

      camera.position.lerp(_camDesired, 0.1 * dt);
    }

    camera.lookAt(
      wizard.position.x,
      wizard.position.y + 1.5,
      wizard.position.z
    );
  }

  //
  // ENTER_GAME TRIGGER
  //

  if (enterTrigger && wizard) {

    _playerCenter.copy(wizard.position);
    _playerCenter.y += 0.9;
    _playerBox.setFromCenterAndSize(_playerCenter, _playerSize);

    if (_playerBox.intersectsBox(enterTriggerBox)) {
      console.log("ENTER GAME");
    }
  }

  //
  // BOB ANIMATION
  //

  for (let i = bobs.length - 1; i >= 0; i--) {

    const bob = bobs[i];

    if (bob.collected) continue;

    bob.mesh.rotation.y += 0.025 * dt;

    bob.mesh.position.y =
      bob.baseY + Math.sin(elapsed * 1.8 + i * 1.2) * 0.15;

    if (wizard) {

      const dist =
        wizard.position.distanceTo(bob.mesh.position);

      if (dist < 1.5) {

        scene.remove(bob.mesh);

        bob.collected = true;

        const count =
          bobs.filter(b => b.collected).length;

        document.querySelector(".hud").textContent =
          `PS1 Harry Potter Prototype | Bobs: ${count} / 3`;

        console.log(`bob collected (${count}/3)`);
      }
    }
  }

  renderer.render(scene, camera);
}

animate(0);

//
// RESIZE
//

window.addEventListener("resize", () => {

  camera.aspect =
    window.innerWidth / window.innerHeight;

  camera.updateProjectionMatrix();

  renderer.setSize(
    window.innerWidth,
    window.innerHeight
  );
});