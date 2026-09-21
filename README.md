# Offshore Energy 3D Digital Twin & Spatial Telemetry Portal

[![Three.js](https://img.shields.io/badge/Three.js-WebGL%203D-black.svg?logo=three.js)](https://threejs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Telemetry%20Bridge-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com/)
[![Spatial Computing](https://img.shields.io/badge/Spatial-Meta%20Quest%20%7C%20Matterport-blueviolet.svg)](https://www.meta.com/quest/)
[![xAPI / SCORM](https://img.shields.io/badge/LMS-xAPI%20Compliant-0284c7.svg)](https://xapi.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
[![Author](https://img.shields.io/badge/Author-Jerry%20A.%20Nabasu-blue.svg)](https://github.com/JayNabasu)

An interactive, browser-native 3D Digital Twin and spatial telemetry monitoring platform of a **Deepwater Subsea Production Manifold**. Built with **Three.js (WebGL)**, procedural geometry, and a **FastAPI** telemetry bridge, it incorporates an **xAPI-compliant virtual reality training walkthrough** designed for enterprise Learning Management System (LMS) integration.

---

## Key Highlights & Architectural Features

- **Interactive 3D Subsea Environment**: Fully responsive 3D WebGL scene featuring subsea Christmas trees, guide columns, production headers, and deepwater particle effects.
- **3D Sensor Telemetry Overlays**: Pulsing spatial telemetry nodes in 3D coordinates measuring Wellhead Pressure (PSI), Header Fluid Temperature (°C), Booster Pump Vibration (mm/s), and Choke Actuator openings (%).
- **NNPC Academy Training Walkthrough Mode**: Interactive step-by-step operator inspection scenario verifying all 4 subsea nodes, reporting duration and mastery score, and syncing xAPI event payloads with the LMS backend.
- **Microservice Telemetry Bridge**: FastAPI backend serving sub-second SCADA simulation streams, jitter modeling, alarm thresholds, and learner assessment records.

---

## 3D Controls & Navigation

| Action | Control | Description |
| :--- | :--- | :--- |
| **Orbit / Rotate** | `Left Click + Drag` | Rotates the camera 360° around the subsea manifold. |
| **Pan Scene** | `Right Click + Drag` | Moves the viewpoint laterally across the seabed. |
| **Zoom** | `Mouse Wheel` | Smooth perspective zoom in and out. |
| **Inspect Sensor** | `Click Glowing Node` | Opens real-time telemetry HUD overlay on the right. |

---

## Repository Structure

```text
energy-digital-twin-spatial-telemetry/
├── backend/
│   └── server.py                  # FastAPI telemetry streaming & LMS xAPI bridge
├── frontend/
│   ├── index.html                 # 3D spatial viewport and HUD container
│   ├── style.css                  # Deepwater glassmorphism styling
│   └── twin.js                    # Three.js scene, geometry, and raycasting
├── tests/
│   └── test_twin_backend.py       # Automated pytest test suite
├── requirements.txt               # Backend dependencies
├── .gitignore
└── README.md
```

---

## Quick Start Guide

### 1. Install Dependencies
```powershell
# Clone the repository
git clone https://github.com/JayNabasu/energy-digital-twin-spatial-telemetry.git
cd energy-digital-twin-spatial-telemetry

# Install dependencies
pip install -r requirements.txt
```

### 2. Run Automated Tests
```powershell
python -m pytest tests/test_twin_backend.py
```

### 3. Launch the 3D Digital Twin Platform
```powershell
python -m uvicorn backend.server:app --reload --port 8000
```
Open your browser at **`http://localhost:8000`** to navigate the 3D subsea manifold and launch the virtual training walkthrough.

---

## Author & Contact

**Jerry A. Nabasu**  
- **Role**: Automation & Digital Innovation Professional  
- **Specialty**: Spatial Computing, Digital Twins & Enterprise AI  
- **Directorate**: Research, Technology & Innovation (RTI), NNPC Limited  
- **GitHub**: [@JayNabasu](https://github.com/JayNabasu)  
- **Email**: [jerrynabasu@gmail.com](mailto:jerrynabasu@gmail.com)
