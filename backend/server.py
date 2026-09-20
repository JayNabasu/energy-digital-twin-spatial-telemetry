"""
FastAPI Telemetry & Spatial LMS Bridge Service.
Serves real-time IoT/SCADA sensor telemetry and records xAPI spatial training events.
"""

from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from typing import List, Dict, Optional
from datetime import datetime, timezone
import random
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = FastAPI(
    title="Energy Asset 3D Digital Twin & Spatial Telemetry API",
    version="1.0.0",
    description="Backend microservice delivering real-time telemetry overlays and LMS xAPI training integrations for OML 119 Deepwater Asset."
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Active Sensor Nodes in 3D Space
SENSOR_NODES = {
    "SN-WH-01": {
        "id": "SN-WH-01",
        "name": "Wellhead A1 Pressure Sensor",
        "type": "PRESSURE",
        "position_3d": [-6.0, 3.2, -4.0],
        "unit": "PSI",
        "base_val": 3450.0,
        "nominal_range": [3200.0, 3800.0],
        "critical_threshold": 4200.0
    },
    "SN-TMP-02": {
        "id": "SN-TMP-02",
        "name": "Manifold Header Fluid Temp",
        "type": "TEMPERATURE",
        "position_3d": [0.0, 2.5, 0.0],
        "unit": "°C",
        "base_val": 84.5,
        "nominal_range": [70.0, 95.0],
        "critical_threshold": 110.0
    },
    "SN-VIB-03": {
        "id": "SN-VIB-03",
        "name": "Export Booster Pump Vibration",
        "type": "VIBRATION",
        "position_3d": [5.5, 1.8, 3.5],
        "unit": "mm/s",
        "base_val": 2.4,
        "nominal_range": [1.0, 4.5],
        "critical_threshold": 7.0
    },
    "SN-CHK-04": {
        "id": "SN-CHK-04",
        "name": "Subsea Production Choke Valve",
        "type": "ACTUATOR",
        "position_3d": [-2.5, 4.0, 2.0],
        "unit": "% Open",
        "base_val": 68.0,
        "nominal_range": [40.0, 85.0],
        "critical_threshold": 95.0
    }
}

LMS_TRAINING_RECORDS = []

class TrainingEventPayload(BaseModel):
    learner_id: str = Field(..., json_schema_extra={"example": "EMP-NNPC-4819"})
    course_code: str = Field(..., json_schema_extra={"example": "ACAD-VR-OML119"})
    scenario_name: str = Field(..., json_schema_extra={"example": "Subsea Manifold Isolation Walkthrough"})
    inspected_nodes: List[str] = Field(..., min_length=1)
    duration_seconds: int = Field(..., gt=0)
    score_percentage: float = Field(..., ge=0.0, le=100.0)
    passed: bool

@app.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "facility": "OML 119 Deepwater Subsea Digital Twin",
        "coordinates": {"lat": 4.281, "lon": 6.892},
        "active_sensor_count": len(SENSOR_NODES),
        "timestamp": datetime.now(timezone.utc).isoformat()
    }

@app.get("/api/v1/telemetry/snapshot")
def get_telemetry_snapshot():
    now_iso = datetime.now(timezone.utc).isoformat()
    snapshot = []
    
    for s_id, s_data in SENSOR_NODES.items():
        # Inject realistic jitter
        jitter = random.uniform(-0.03, 0.03) * s_data["base_val"]
        current_val = round(s_data["base_val"] + jitter, 2)
        
        status_label = "NORMAL"
        if current_val > s_data["critical_threshold"]:
            status_label = "CRITICAL_ALARM"
        elif current_val > s_data["nominal_range"][1] or current_val < s_data["nominal_range"][0]:
            status_label = "WARNING"

        snapshot.append({
            "sensor_id": s_id,
            "name": s_data["name"],
            "type": s_data["type"],
            "current_value": current_val,
            "unit": s_data["unit"],
            "status": status_label,
            "position_3d": s_data["position_3d"],
            "timestamp": now_iso
        })

    return {
        "facility_id": "OML-119-FPSO-MANIFOLD",
        "telemetry_stream": snapshot
    }

@app.post("/api/v1/lms/training-event", status_code=status.HTTP_201_CREATED)
def record_lms_training_event(event: TrainingEventPayload):
    record = {
        "event_id": f"xAPI-{len(LMS_TRAINING_RECORDS) + 101}",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **event.model_dump()
    }
    LMS_TRAINING_RECORDS.append(record)
    return {
        "status": "RECORDED",
        "message": "Spatial inspection training event synced with NNPC Academy LMS via xAPI.",
        "event_id": record["event_id"]
    }

@app.get("/api/v1/lms/records")
def get_training_records():
    return {"total_records": len(LMS_TRAINING_RECORDS), "records": LMS_TRAINING_RECORDS}

# Serve frontend
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

@app.get("/")
def serve_index():
    index_file = FRONTEND_DIR / "index.html"
    if index_file.exists():
        return FileResponse(str(index_file))
    return {"message": "3D Digital Twin API is operational. Visit /docs for OpenAPI specs."}
