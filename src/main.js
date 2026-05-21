import "./style.css";

import * as THREE from "three";

import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

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

    scene.add(hall);

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

function animate() {

  requestAnimationFrame(animate);

  if (wizard) {

    const speed = 0.06;

    const forward = new THREE.Vector3(
      Math.sin(yaw),
      0,
      Math.cos(yaw)
    );

    const right = new THREE.Vector3(
      Math.cos(yaw),
      0,
      -Math.sin(yaw)
    );

    //
    // MOVE
    //

    if (keys["KeyW"]) {

      wizard.position.addScaledVector(
        forward,
        speed
      );
    }

    if (keys["KeyS"]) {

      wizard.position.addScaledVector(
        forward,
        -speed
      );
    }

    if (keys["KeyA"]) {

      wizard.position.addScaledVector(
        right,
        speed
      );
    }

    if (keys["KeyD"]) {

      wizard.position.addScaledVector(
        right,
        -speed
      );
    }

    //
    // ROTATE
    //

    wizard.rotation.y = yaw;

    //
    // CAMERA
    //

    const camOffset = new THREE.Vector3(
      Math.sin(yaw) * -7,
      4,
      Math.cos(yaw) * -7
    );

    camera.position.lerp(
      wizard.position.clone().add(camOffset),
      0.08
    );

    camera.lookAt(
      wizard.position.x,
      wizard.position.y + 2,
      wizard.position.z
    );
  }

  //
  // BOB ANIMATION
  //

  const t = Date.now() * 0.001;

  for (let i = bobs.length - 1; i >= 0; i--) {

    const bob = bobs[i];

    if (bob.collected) continue;

    bob.mesh.rotation.y += 0.025;

    bob.mesh.position.y =
      bob.baseY + Math.sin(t * 1.8 + i * 1.2) * 0.15;

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

animate();

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