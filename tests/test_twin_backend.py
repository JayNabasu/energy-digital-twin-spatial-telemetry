from fastapi.testclient import TestClient
from backend.server import app

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"
    assert data["active_sensor_count"] == 4

def test_telemetry_snapshot():
    response = client.get("/api/v1/telemetry/snapshot")
    assert response.status_code == 200
    data = response.json()
    assert data["facility_id"] == "OML-119-FPSO-MANIFOLD"
    assert len(data["telemetry_stream"]) == 4

def test_lms_training_event_submission():
    payload = {
        "learner_id": "EMP-NNPC-4819",
        "course_code": "ACAD-VR-OML119",
        "scenario_name": "Subsea Manifold Isolation Walkthrough",
        "inspected_nodes": ["SN-WH-01", "SN-TMP-02", "SN-VIB-03", "SN-CHK-04"],
        "duration_seconds": 120,
        "score_percentage": 100.0,
        "passed": True
    }
    response = client.post("/api/v1/lms/training-event", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert data["status"] == "RECORDED"
    assert "xAPI" in data["event_id"]
