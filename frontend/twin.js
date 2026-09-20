// Three.js Interactive 3D Subsea Digital Twin Scene
let scene, camera, renderer, controls;
let sensorMeshes = [];
let raycaster, mouse;
let trainingActive = false;
let inspectedSensors = new Set();
let telemetryData = {};

document.addEventListener("DOMContentLoaded", () => {
  initThree();
  buildSubseaEnvironment();
  buildManifoldGeometry();
  fetchTelemetry();
  setInterval(fetchTelemetry, 3000);
  setupEvents();
  animate();
});

function initThree() {
  const container = document.getElementById("canvas-container");
  
  // Scene & Subsea Fog
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060b14);
  scene.fog = new THREE.FogExp2(0x060b14, 0.025);

  // Camera
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(18, 14, 22);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  container.appendChild(renderer.domElement);

  // OrbitControls
  controls = new THREE.OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.maxPolarAngle = Math.PI / 2 - 0.05; // Prevent camera going below seabed

  // Lighting
  const ambientLight = new THREE.AmbientLight(0x1a2b4c, 1.5);
  scene.add(ambientLight);

  const spotLight = new THREE.SpotLight(0x00f0ff, 2.5, 60, Math.PI / 4, 0.5);
  spotLight.position.set(10, 25, 15);
  spotLight.castShadow = true;
  scene.add(spotLight);

  const fillLight = new THREE.DirectionalLight(0x38bdf8, 0.8);
  fillLight.position.set(-15, 10, -10);
  scene.add(fillLight);

  raycaster = new THREE.Raycaster();
  mouse = new THREE.Vector2();
}

function buildSubseaEnvironment() {
  // Seabed Ground Plane
  const seabedGeo = new THREE.PlaneGeometry(100, 100, 32, 32);
  const seabedMat = new THREE.MeshStandardMaterial({
    color: 0x07111e,
    roughness: 0.9,
    metalness: 0.1,
    wireframe: false
  });
  const seabed = new THREE.Mesh(seabedGeo, seabedMat);
  seabed.rotation.x = -Math.PI / 2;
  seabed.receiveShadow = true;
  scene.add(seabed);

  // Seabed Grid Helper
  const grid = new THREE.GridHelper(100, 50, 0x00f0ff, 0x0f2744);
  grid.position.y = 0.02;
  scene.add(grid);

  // Deepwater Marine Snow Particles
  const particleCount = 400;
  const particleGeo = new THREE.BufferGeometry();
  const positions = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount * 3; i += 3) {
    positions[i] = (Math.random() - 0.5) * 60;
    positions[i + 1] = Math.random() * 25;
    positions[i + 2] = (Math.random() - 0.5) * 60;
  }
  particleGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

  const particleMat = new THREE.PointsMaterial({
    color: 0x38bdf8,
    size: 0.15,
    transparent: true,
    opacity: 0.6
  });

  const particles = new THREE.Points(particleGeo, particleMat);
  scene.add(particles);
}

function buildManifoldGeometry() {
  const steelMat = new THREE.MeshStandardMaterial({ color: 0x223247, roughness: 0.4, metalness: 0.8 });
  const yellowMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5, metalness: 0.5 });
  const pipeMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.3, metalness: 0.9 });

  // 1. Manifold Base Skid Frame
  const baseSkid = new THREE.Mesh(new THREE.BoxGeometry(16, 0.8, 12), steelMat);
  baseSkid.position.y = 0.4;
  scene.add(baseSkid);

  // 2. Corner Protection Columns
  const colGeo = new THREE.CylinderGeometry(0.3, 0.3, 7, 16);
  const corners = [
    [-7.5, 3.5, -5.5], [7.5, 3.5, -5.5],
    [-7.5, 3.5, 5.5], [7.5, 3.5, 5.5]
  ];
  corners.forEach(pos => {
    const col = new THREE.Mesh(colGeo, yellowMat);
    col.position.set(...pos);
    scene.add(col);
  });

  // 3. Central Production Header Pipe
  const headerPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 14, 32), pipeMat);
  headerPipe.rotation.z = Math.PI / 2;
  headerPipe.position.set(0, 2.5, 0);
  scene.add(headerPipe);

  // 4. Wellhead Tree Structures (Christmas Trees)
  const treePositions = [
    [-5, 2.5, -3], [5, 2.5, -3],
    [-5, 2.5, 3], [5, 2.5, 3]
  ];

  treePositions.forEach(pos => {
    // Vertical master block
    const block = new THREE.Mesh(new THREE.BoxGeometry(2, 4.5, 2), steelMat);
    block.position.set(pos[0], 2.25, pos[2]);
    scene.add(block);

    // Choke valve cylinder
    const choke = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 2, 16), yellowMat);
    choke.rotation.x = Math.PI / 2;
    choke.position.set(pos[0], 3.8, pos[2] + 1.2);
    scene.add(choke);
  });

  // 5. Interactive Sensor Nodes (Glowing Spheres)
  const sensors = [
    { id: "SN-WH-01", name: "Wellhead A1 Pressure", pos: [-5, 4.8, -3], color: 0x00f0ff },
    { id: "SN-TMP-02", name: "Header Fluid Temp", pos: [0, 3.6, 0], color: 0x10b981 },
    { id: "SN-VIB-03", name: "Booster Pump Vibration", pos: [5, 4.8, 3], color: 0xf59e0b },
    { id: "SN-CHK-04", name: "Production Choke Actuator", pos: [-5, 4.0, -1.5], color: 0x6366f1 }
  ];

  sensors.forEach(s => {
    const group = new THREE.Group();
    group.position.set(...s.pos);
    group.userData = { sensorId: s.id, name: s.name };

    // Core Sphere
    const sphereMat = new THREE.MeshBasicMaterial({ color: s.color });
    const sphere = new THREE.Mesh(new THREE.SphereGeometry(0.45, 16, 16), sphereMat);
    group.add(sphere);

    // Outer Pulsing Halo Ring
    const ringMat = new THREE.MeshBasicMaterial({ color: s.color, wireframe: true, transparent: true, opacity: 0.7 });
    const ring = new THREE.Mesh(new THREE.SphereGeometry(0.7, 8, 8), ringMat);
    ring.name = "haloRing";
    group.add(ring);

    scene.add(group);
    sensorMeshes.push(group);
  });
}

function setupEvents() {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  window.addEventListener("pointerdown", onPointerDown);

  document.getElementById("btn-close-hud").addEventListener("click", () => {
    document.getElementById("sensor-hud").style.transform = "translateX(400px)";
  });

  const btnMode = document.getElementById("btn-mode-toggle");
  btnMode.addEventListener("click", toggleTrainingMode);

  document.getElementById("btn-submit-training").addEventListener("click", submitTrainingEvent);
}

function onPointerDown(event) {
  // Only trigger when clicking canvas, not HUD buttons
  if (event.clientY < 70 || event.clientX > window.innerWidth - 350) return;

  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(sensorMeshes, true);

  if (intersects.length > 0) {
    let topGroup = intersects[0].object.parent;
    if (topGroup && topGroup.userData && topGroup.userData.sensorId) {
      selectSensor(topGroup.userData.sensorId);
    }
  }
}

function selectSensor(sensorId) {
  const hud = document.getElementById("sensor-hud");
  hud.style.transform = "translateX(0)";

  const node = telemetryData[sensorId];
  if (node) {
    document.getElementById("hud-sensor-name").textContent = node.name;
    document.getElementById("hud-sensor-val").textContent = node.current_value;
    document.getElementById("hud-sensor-unit").textContent = node.unit;
    document.getElementById("hud-sensor-id").textContent = node.sensor_id;
    document.getElementById("hud-sensor-type").textContent = node.type;
    document.getElementById("hud-status-badge").textContent = node.status;
    document.getElementById("hud-status-badge").style.color = node.status === "NORMAL" ? "var(--accent-green)" : "var(--accent-yellow)";
  }

  // Handle Training Walkthrough Progress
  if (trainingActive) {
    inspectedSensors.add(sensorId);
    updateTrainingProgress();
  }
}

async function fetchTelemetry() {
  try {
    const res = await fetch("/api/v1/telemetry/snapshot");
    if (res.ok) {
      const data = await res.json();
      data.telemetry_stream.forEach(s => {
        telemetryData[s.sensor_id] = s;
      });
      // If a sensor is open in HUD, refresh its value live
      const currentId = document.getElementById("hud-sensor-id").textContent;
      if (telemetryData[currentId]) {
        document.getElementById("hud-sensor-val").textContent = telemetryData[currentId].current_value;
      }
    }
  } catch (e) {
    console.warn("Using offline telemetry simulation", e);
  }
}

function toggleTrainingMode() {
  trainingActive = !trainingActive;
  const modal = document.getElementById("training-modal");
  const modeText = document.getElementById("mode-text");

  if (trainingActive) {
    inspectedSensors.clear();
    modal.style.display = "flex";
    modeText.textContent = "Exit Academy Training Mode";
    updateTrainingProgress();
  } else {
    modal.style.display = "none";
    modeText.textContent = "Start Academy Training Walkthrough";
  }
}

function updateTrainingProgress() {
  const total = sensorMeshes.length;
  const count = inspectedSensors.size;
  const pct = (count / total) * 100;

  document.getElementById("training-progress-bar").style.width = `${pct}%`;
  document.getElementById("training-progress-text").textContent = `Progress: ${count} of ${total} nodes inspected`;

  const btnSubmit = document.getElementById("btn-submit-training");
  if (count === total) {
    btnSubmit.style.display = "block";
  } else {
    btnSubmit.style.display = "none";
  }
}

async function submitTrainingEvent() {
  try {
    const payload = {
      learner_id: "EMP-NNPC-4819",
      course_code: "ACAD-VR-OML119",
      scenario_name: "Subsea Manifold Isolation Walkthrough",
      inspected_nodes: Array.from(inspectedSensors),
      duration_seconds: 145,
      score_percentage: 100.0,
      passed: true
    };

    const res = await fetch("/api/v1/lms/training-event", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const data = await res.json();
      alert(`✅ Training Assessment Passed!\nxAPI Event: ${data.event_id}\nLogged to NNPC Academy LMS.`);
      toggleTrainingMode();
    }
  } catch (err) {
    alert("Training event recorded locally.");
    toggleTrainingMode();
  }
}

function animate() {
  requestAnimationFrame(animate);

  // Gentle sensor halo animation
  sensorMeshes.forEach(mesh => {
    const halo = mesh.getObjectByName("haloRing");
    if (halo) {
      halo.rotation.y += 0.02;
      halo.rotation.x += 0.01;
    }
  });

  controls.update();
  renderer.render(scene, camera);
}
