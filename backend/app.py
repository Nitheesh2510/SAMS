from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
import pickle
import os
import traceback

# Lazy-load TensorFlow to speed up startup
model = None
scaler_spectral = None
scaler_iot = None

app = Flask(__name__)

# Allow a specific origin in production (set ALLOWED_ORIGIN env var on Render),
# fall back to all origins for local development.
_allowed_origin = os.environ.get("ALLOWED_ORIGIN", "*")
CORS(app, origins=_allowed_origin)

# ─── Model Loading ────────────────────────────────────────────────────────────

def load_model_and_scalers():
    global model, scaler_spectral, scaler_iot
    if model is not None:
        return  # Already loaded

    import tensorflow as tf

    model_path       = os.path.join(os.path.dirname(__file__), "sams_model.h5")
    scaler_spec_path = os.path.join(os.path.dirname(__file__), "scaler_spectral.pkl")
    scaler_iot_path  = os.path.join(os.path.dirname(__file__), "scaler_iot.pkl")

    if not os.path.exists(model_path):
        raise FileNotFoundError(f"Model file not found: {model_path}")
    if not os.path.exists(scaler_spec_path):
        raise FileNotFoundError(f"Spectral scaler not found: {scaler_spec_path}")
    if not os.path.exists(scaler_iot_path):
        raise FileNotFoundError(f"IoT scaler not found: {scaler_iot_path}")

    model           = tf.keras.models.load_model(model_path)
    scaler_spectral = pickle.load(open(scaler_spec_path, "rb"))
    scaler_iot      = pickle.load(open(scaler_iot_path,  "rb"))


# ─── Routes ───────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Quick liveness check."""
    return jsonify({"status": "ok", "service": "SAMS API"}), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Accepts JSON body:
    {
        "spectral":      [<131 floats>],
        "soil_moisture": <float>,
        "temperature":   <float>
    }
    Returns:
    {
        "yield_tph": <float>,
        "unit":      "tons per hectare"
    }
    """
    # ── 1. Load model on first request ────────────────────────────────────────
    try:
        load_model_and_scalers()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    # ── 2. Parse & validate request body ──────────────────────────────────────
    data = request.get_json(silent=True)
    if data is None:
        return jsonify({"error": "Request body must be JSON"}), 400

    # Spectral features
    spectral = data.get("spectral")
    if spectral is None:
        return jsonify({"error": "Missing field: spectral"}), 400
    if not isinstance(spectral, list) or len(spectral) != 131:
        return jsonify({"error": f"spectral must be a list of exactly 131 numbers, got {len(spectral) if isinstance(spectral, list) else type(spectral).__name__}"}), 400

    # IoT features
    soil_moisture = data.get("soil_moisture")
    temperature   = data.get("temperature")
    if soil_moisture is None:
        return jsonify({"error": "Missing field: soil_moisture"}), 400
    if temperature is None:
        return jsonify({"error": "Missing field: temperature"}), 400

    try:
        spectral      = [float(v) for v in spectral]
        soil_moisture = float(soil_moisture)
        temperature   = float(temperature)
    except (ValueError, TypeError) as e:
        return jsonify({"error": f"All values must be numeric: {e}"}), 400

    # ── 3. Preprocess ──────────────────────────────────────────────────────────
    try:
        X_spectral = np.array(spectral).reshape(1, -1)
        X_iot      = np.array([[soil_moisture, temperature]])

        X_spectral_scaled = scaler_spectral.transform(X_spectral)
        X_iot_scaled      = scaler_iot.transform(X_iot)

        # CNN needs shape (batch, timesteps, channels)
        X_spectral_reshaped = X_spectral_scaled.reshape(1, 131, 1)

    except Exception as e:
        return jsonify({"error": f"Preprocessing failed: {e}"}), 500

    # ── 4. Predict ─────────────────────────────────────────────────────────────
    try:
        prediction = model.predict(
            {"spectral_input": X_spectral_reshaped, "iot_input": X_iot_scaled},
            verbose=0
        )
        yield_tph = float(prediction[0][0])
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    # ── 5. Save to history ─────────────────────────────────────────────────────
    rounded = round(yield_tph, 4)
    cat = (
        "Excellent"    if rounded >= 5.5
        else "Good"    if rounded >= 4.5
        else "Average" if rounded >= 3.5
        else "Below Average" if rounded >= 2
        else "Poor"
    )
    _prediction_history.append({
        "id":            len(_prediction_history) + 1,
        "yield_tph":     rounded,
        "unit":          "tons per hectare",
        "category":      cat,
        "soil_moisture": round(soil_moisture, 2),
        "temperature":   round(temperature, 1),
        "timestamp":     datetime.now().strftime("%Y-%m-%d %H:%M"),
    })

    # ── 6. Return result ───────────────────────────────────────────────────────
    return jsonify({
        "yield_tph": rounded,
        "unit":      "tons per hectare",
        "category":  cat,
    }), 200


@app.route("/predict/sample", methods=["POST"])
def predict_sample():
    """
    Trial / demo prediction using built-in sample data.
    No CSV upload or sensor input required.
    Accepts optional JSON body to override defaults:
    {
        "soil_moisture": <float>,   # default: 0.45
        "temperature":   <float>    # default: 28
    }
    """
    # ── 1. Load model on first request ────────────────────────────────────────
    try:
        load_model_and_scalers()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    # ── 2. Built-in sample spectral data (mean values from training set) ──────
    sample_spectral = [
        18.83, 17.07, 16.12, 16.05, 15.93, 15.78, 15.54, 15.44, 15.63, 15.86,
        16.41, 16.85, 16.82, 16.27, 15.93, 15.50, 15.53, 15.14, 15.01, 14.76,
        14.74, 14.49, 14.45, 14.35, 14.60, 15.13, 16.82, 18.89, 23.38, 28.55,
        33.81, 36.68, 38.15, 39.74, 40.75, 41.23, 39.87, 38.36, 37.91, 39.68,
        42.43, 44.56, 45.98, 46.13, 45.07, 40.91, 39.42, 37.21, 37.18, 35.42,
        33.51, 36.33, 37.97, 39.37, 40.83, 42.19, 43.19, 43.96, 44.09, 44.14,
        42.12, 38.68, 32.96, 33.83, 34.92, 36.11, 37.94, 39.83, 40.41, 39.98,
        37.98, 37.15, 37.59, 38.89, 36.87, 33.15, 27.76, 20.69, 22.51, 23.94,
        25.22, 25.50, 25.56, 25.81, 26.48, 27.29, 28.25, 29.42, 29.96, 30.16,
        30.12, 30.39, 30.30, 30.04, 29.49, 29.07, 28.38, 27.63, 26.53, 25.57,
        24.23, 22.31, 12.43, 14.47, 16.22, 17.55, 18.40, 18.71, 19.08, 19.54,
        19.83, 19.25, 18.51, 18.71, 18.95, 18.71, 18.33, 18.76, 19.35, 18.82,
        17.63, 16.58, 16.24, 15.83, 15.03, 14.60, 14.10, 14.05, 13.14, 12.11,
        11.27
    ]

    # ── 3. Parse optional overrides ───────────────────────────────────────────
    data = request.get_json(silent=True) or {}
    soil_moisture = float(data.get("soil_moisture", 0.45))
    temperature   = float(data.get("temperature", 28.0))

    # ── 4. Preprocess ─────────────────────────────────────────────────────────
    try:
        X_spectral = np.array(sample_spectral).reshape(1, -1)
        X_iot      = np.array([[soil_moisture, temperature]])

        X_spectral_scaled   = scaler_spectral.transform(X_spectral)
        X_iot_scaled        = scaler_iot.transform(X_iot)
        X_spectral_reshaped = X_spectral_scaled.reshape(1, 131, 1)
    except Exception as e:
        return jsonify({"error": f"Preprocessing failed: {e}"}), 500

    # ── 5. Predict ────────────────────────────────────────────────────────────
    try:
        prediction = model.predict(
            {"spectral_input": X_spectral_reshaped, "iot_input": X_iot_scaled},
            verbose=0
        )
        yield_tph = float(prediction[0][0])
    except Exception as e:
        return jsonify({"error": f"Prediction failed: {e}"}), 500

    # ── 6. Save to history ────────────────────────────────────────────────────
    rounded = round(yield_tph, 4)
    cat = (
        "Excellent"    if rounded >= 5.5
        else "Good"    if rounded >= 4.5
        else "Average" if rounded >= 3.5
        else "Below Average" if rounded >= 2
        else "Poor"
    )
    _prediction_history.append({
        "id":            len(_prediction_history) + 1,
        "yield_tph":     rounded,
        "unit":          "tons per hectare",
        "category":      cat,
        "soil_moisture": round(soil_moisture, 2),
        "temperature":   round(temperature, 1),
        "timestamp":     datetime.now().strftime("%Y-%m-%d %H:%M"),
    })

    # ── 7. Return result ──────────────────────────────────────────────────────
    return jsonify({
        "yield_tph":  rounded,
        "unit":       "tons per hectare",
        "category":   cat,
        "is_sample":  True,
        "sample_info": {
            "soil_moisture":  soil_moisture,
            "temperature":    temperature,
            "spectral_bands": 131,
            "note": "This prediction used built-in sample spectral data from the training dataset."
        }
    }), 200


@app.route("/predict/batch", methods=["POST"])
def predict_batch():
    """
    Accepts JSON body:
    {
        "samples": [
            {"spectral": [...131], "soil_moisture": 0.4, "temperature": 28},
            ...
        ]
    }
    Returns list of predictions in the same order.
    """
    try:
        load_model_and_scalers()
    except FileNotFoundError as e:
        return jsonify({"error": str(e)}), 503

    data = request.get_json(silent=True)
    if data is None or "samples" not in data:
        return jsonify({"error": "Missing field: samples"}), 400

    samples = data["samples"]
    if not isinstance(samples, list) or len(samples) == 0:
        return jsonify({"error": "samples must be a non-empty list"}), 400

    results = []
    errors  = []

    spectral_batch = []
    iot_batch      = []

    for i, s in enumerate(samples):
        try:
            spec = [float(v) for v in s["spectral"]]
            sm   = float(s["soil_moisture"])
            temp = float(s["temperature"])
            if len(spec) != 131:
                raise ValueError(f"spectral must have 131 values, got {len(spec)}")
            spectral_batch.append(spec)
            iot_batch.append([sm, temp])
        except Exception as e:
            errors.append({"index": i, "error": str(e)})

    if errors:
        return jsonify({"error": "Invalid samples", "details": errors}), 400

    X_spec = np.array(spectral_batch)
    X_iot  = np.array(iot_batch)

    X_spec_scaled    = scaler_spectral.transform(X_spec)
    X_iot_scaled     = scaler_iot.transform(X_iot)
    X_spec_reshaped  = X_spec_scaled.reshape(len(samples), 131, 1)

    predictions = model.predict(
        {"spectral_input": X_spec_reshaped, "iot_input": X_iot_scaled},
        verbose=0
    )

    results = [
        {"index": i, "yield_tph": round(float(p[0]), 4), "unit": "tons per hectare"}
        for i, p in enumerate(predictions)
    ]

    return jsonify({"predictions": results, "count": len(results)}), 200


# ─── Sample Data Store (in-memory) ────────────────────────────────────────────

import random
import threading
import time as _time
from datetime import datetime
from flask import Response, stream_with_context

# ── Field Grid (5×5) ──────────────────────────────────────────────────────────

def _make_cell(status=None):
    """Generate a realistic field cell."""
    ndvi = round(random.uniform(0.15, 0.95), 3)
    if ndvi >= 0.65:
        st = "Healthy"
    elif ndvi >= 0.35:
        st = "Moderate"
    else:
        st = "Critical"
    return {
        "ndvi":        ndvi,
        "moisture":    round(random.uniform(0.20, 0.60), 3),
        "temperature": round(random.uniform(22, 36), 1),
        "nitrogen":    round(random.uniform(20, 90), 1),
        "phosphorus":  round(random.uniform(10, 55), 1),
        "potassium":   round(random.uniform(80, 280), 1),
        "ph":          round(random.uniform(5.5, 7.8), 2),
        "status":      status or st,
    }

_field_grid = {}
for _r in range(5):
    for _c in range(5):
        _field_grid[f"{_r}-{_c}"] = _make_cell()

# ── Prediction History (sample) ───────────────────────────────────────────────

_prediction_history = []
_categories = ["Poor", "Below Average", "Average", "Good", "Excellent"]
for _i in range(1, 21):
    _yield = round(random.uniform(1.5, 7.0), 2)
    _cat = (
        "Poor" if _yield < 2
        else "Below Average" if _yield < 3.5
        else "Average" if _yield < 4.5
        else "Good" if _yield < 5.5
        else "Excellent"
    )
    _prediction_history.append({
        "id":             _i,
        "yield_tph":      _yield,
        "unit":           "tons per hectare",
        "category":       _cat,
        "soil_moisture":  round(random.uniform(0.2, 0.6), 2),
        "temperature":    round(random.uniform(22, 35), 1),
        "timestamp":      f"2026-05-0{random.randint(1,6)} {random.randint(8,17)}:{random.randint(10,59):02d}",
    })

# ── Simulation State ─────────────────────────────────────────────────────────

_sim_running   = False
_sim_thread    = None
_alert_clients = []       # list of queues for SSE


def _simulation_loop():
    """Background thread that drifts field values when simulation is running."""
    global _sim_running
    while _sim_running:
        for cid, cell in _field_grid.items():
            # Drift NDVI
            cell["ndvi"] = round(max(0.05, min(0.98, cell["ndvi"] + random.uniform(-0.06, 0.04))), 3)
            # Drift moisture (slowly decreases — evaporation)
            cell["moisture"] = round(max(0.05, min(0.70, cell["moisture"] + random.uniform(-0.03, 0.01))), 3)
            # Drift temperature
            cell["temperature"] = round(max(18, min(42, cell["temperature"] + random.uniform(-0.5, 0.5))), 1)
            # Drift nutrients
            cell["nitrogen"]   = round(max(5, min(100, cell["nitrogen"]   + random.uniform(-2, 1))), 1)
            cell["phosphorus"] = round(max(3, min(60,  cell["phosphorus"] + random.uniform(-1, 0.5))), 1)
            cell["potassium"]  = round(max(30, min(300, cell["potassium"] + random.uniform(-3, 1.5))), 1)
            # Update status
            if cell["ndvi"] >= 0.65:
                cell["status"] = "Healthy"
            elif cell["ndvi"] >= 0.35:
                cell["status"] = "Moderate"
            else:
                cell["status"] = "Critical"

        # Generate alerts for critical cells
        for cid, cell in _field_grid.items():
            if cell["status"] == "Critical":
                alert = {
                    "severity": "Critical",
                    "message":  f"Cell {cid}: NDVI dropped to {cell['ndvi']} — immediate action needed",
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                }
                for q in _alert_clients:
                    try:
                        q.append(alert)
                    except Exception:
                        pass
            elif cell["moisture"] < 0.15:
                alert = {
                    "severity": "Warning",
                    "message":  f"Cell {cid}: Soil moisture critically low ({cell['moisture']})",
                    "timestamp": datetime.now().strftime("%H:%M:%S"),
                }
                for q in _alert_clients:
                    try:
                        q.append(alert)
                    except Exception:
                        pass

        _time.sleep(5)


# ─── Sensor Summary ───────────────────────────────────────────────────────────

@app.route("/sensors/summary", methods=["GET"])
def sensors_summary():
    """Aggregated sensor readings across all field cells."""
    cells = list(_field_grid.values())
    n = len(cells)
    if n == 0:
        return jsonify({}), 200

    healthy  = sum(1 for c in cells if c["status"] == "Healthy")
    moderate = sum(1 for c in cells if c["status"] == "Moderate")
    critical = sum(1 for c in cells if c["status"] == "Critical")

    return jsonify({
        "avg_ndvi":        round(sum(c["ndvi"]        for c in cells) / n, 3),
        "avg_moisture":    round(sum(c["moisture"]    for c in cells) / n, 3),
        "avg_temperature": round(sum(c["temperature"] for c in cells) / n, 1),
        "avg_nitrogen":    round(sum(c["nitrogen"]    for c in cells) / n, 1),
        "avg_phosphorus":  round(sum(c["phosphorus"]  for c in cells) / n, 1),
        "avg_potassium":   round(sum(c["potassium"]   for c in cells) / n, 1),
        "avg_ph":          round(sum(c["ph"]          for c in cells) / n, 2),
        "healthy_cells":   healthy,
        "moderate_cells":  moderate,
        "critical_cells":  critical,
        "total_cells":     n,
    }), 200


# ─── Analytics Overview ───────────────────────────────────────────────────────

@app.route("/analytics/overview", methods=["GET"])
def analytics_overview():
    """Aggregated analytics for dashboard and analytics pages."""
    cells = list(_field_grid.values())
    n = len(cells) or 1

    yields = [p["yield_tph"] for p in _prediction_history] if _prediction_history else [0]

    healthy  = sum(1 for c in cells if c["status"] == "Healthy")
    moderate = sum(1 for c in cells if c["status"] == "Moderate")
    critical = sum(1 for c in cells if c["status"] == "Critical")

    return jsonify({
        "total_predictions": len(_prediction_history),
        "avg_yield_tph":     round(sum(yields) / len(yields), 2),
        "best_yield_tph":    round(max(yields), 2),
        "worst_yield_tph":   round(min(yields), 2),
        "avg_ndvi":          round(sum(c["ndvi"] for c in cells) / n, 3),
        "field_health": {
            "healthy":  healthy,
            "moderate": moderate,
            "critical": critical,
        }
    }), 200


# ─── Prediction History ──────────────────────────────────────────────────────

@app.route("/history", methods=["GET"])
def history():
    """Return past predictions (limited by query param)."""
    limit = request.args.get("limit", 50, type=int)
    return jsonify({
        "history": _prediction_history[-limit:],
        "total":   len(_prediction_history),
    }), 200


# ─── Field Grid ───────────────────────────────────────────────────────────────

@app.route("/field/grid", methods=["GET"])
def field_grid():
    """Return the current 5×5 field grid state."""
    return jsonify({"grid": _field_grid}), 200


@app.route("/field/grid/<cid>/remediate", methods=["POST"])
def field_remediate(cid):
    """Apply a remediation action to a specific cell."""
    if cid not in _field_grid:
        return jsonify({"error": f"Cell {cid} not found"}), 404

    data   = request.get_json(silent=True) or {}
    action = data.get("action", "")
    cell   = _field_grid[cid]

    if action == "water":
        cell["moisture"] = round(min(0.70, cell["moisture"] + 0.15), 3)
        cell["ndvi"]     = round(min(0.98, cell["ndvi"] + 0.08), 3)
    elif action == "fertilize":
        cell["nitrogen"]   = round(min(100, cell["nitrogen"]   + 20), 1)
        cell["phosphorus"] = round(min(60,  cell["phosphorus"] + 10), 1)
        cell["potassium"]  = round(min(300, cell["potassium"]  + 30), 1)
        cell["ndvi"]       = round(min(0.98, cell["ndvi"] + 0.05), 3)
    elif action == "adjust_ph":
        cell["ph"] = round(max(5.5, min(7.5, 6.5 + random.uniform(-0.3, 0.3))), 2)
        cell["ndvi"] = round(min(0.98, cell["ndvi"] + 0.03), 3)
    else:
        return jsonify({"error": f"Unknown action: {action}"}), 400

    # Recalculate status
    if cell["ndvi"] >= 0.65:
        cell["status"] = "Healthy"
    elif cell["ndvi"] >= 0.35:
        cell["status"] = "Moderate"
    else:
        cell["status"] = "Critical"

    return jsonify({"message": f"Applied {action} to cell {cid}", "cell": cell}), 200


# ─── Crop Recommendation ─────────────────────────────────────────────────────

@app.route("/recommend/crop", methods=["POST"])
def recommend_crop():
    """Rule-based crop recommendation from soil parameters."""
    data = request.get_json(silent=True) or {}
    moisture    = float(data.get("moisture", 0.4))
    temperature = float(data.get("temperature", 28))
    nitrogen    = float(data.get("nitrogen", 50))
    ph          = float(data.get("ph", 6.5))

    recommendations = []

    # Rice — high moisture, warm temps
    if moisture >= 0.35 and temperature >= 24:
        recommendations.append({
            "name": "Rice (Paddy)",
            "confidence": min(95, int(60 + moisture * 40 + (temperature - 20) * 1.5)),
            "reason": "High moisture & warm temperature ideal for paddy"
        })

    # Wheat — moderate conditions
    if 0.20 <= moisture <= 0.55 and 15 <= temperature <= 30:
        recommendations.append({
            "name": "Wheat",
            "confidence": min(90, int(55 + (1 - abs(moisture - 0.35)) * 30 + nitrogen * 0.2)),
            "reason": "Moderate moisture & temperature suitable for wheat"
        })

    # Maize / Corn
    if moisture >= 0.25 and temperature >= 20 and nitrogen >= 30:
        recommendations.append({
            "name": "Maize (Corn)",
            "confidence": min(88, int(50 + nitrogen * 0.3 + temperature * 0.5)),
            "reason": "Good nitrogen & warmth for maize growth"
        })

    # Soybean
    if 5.8 <= ph <= 7.0 and moisture >= 0.30:
        recommendations.append({
            "name": "Soybean",
            "confidence": min(85, int(45 + (7.0 - abs(ph - 6.4)) * 10 + moisture * 20)),
            "reason": "Near-neutral pH & adequate moisture for soybean"
        })

    # Sugarcane
    if moisture >= 0.40 and temperature >= 26:
        recommendations.append({
            "name": "Sugarcane",
            "confidence": min(82, int(40 + moisture * 35 + (temperature - 24) * 2)),
            "reason": "High moisture & heat ideal for sugarcane"
        })

    # Sort by confidence descending
    recommendations.sort(key=lambda x: x["confidence"], reverse=True)

    return jsonify({"recommendations": recommendations[:5]}), 200


# ─── Simulation Control ──────────────────────────────────────────────────────

@app.route("/simulation/start", methods=["POST"])
def sim_start():
    global _sim_running, _sim_thread
    if _sim_running:
        return jsonify({"message": "Already running"}), 200
    _sim_running = True
    _sim_thread  = threading.Thread(target=_simulation_loop, daemon=True)
    _sim_thread.start()
    return jsonify({"message": "Simulation started", "running": True}), 200


@app.route("/simulation/stop", methods=["POST"])
def sim_stop():
    global _sim_running
    _sim_running = False
    return jsonify({"message": "Simulation stopped", "running": False}), 200


@app.route("/simulation/status", methods=["GET"])
def sim_status():
    return jsonify({"running": _sim_running}), 200


# ─── Live Alerts (SSE) ────────────────────────────────────────────────────────

@app.route("/alerts/stream", methods=["GET"])
def alerts_stream():
    """Server-Sent Events stream for live alerts."""
    import json as _json

    def generate():
        q = []
        _alert_clients.append(q)
        try:
            yield f"data: {_json.dumps({'type': 'connected'})}\n\n"
            while True:
                if q:
                    alert = q.pop(0)
                    yield f"data: {_json.dumps(alert)}\n\n"
                else:
                    # Send heartbeat to keep connection alive
                    yield ": heartbeat\n\n"
                _time.sleep(2)
        except GeneratorExit:
            _alert_clients.remove(q)

    return Response(
        stream_with_context(generate()),
        mimetype="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*",
        }
    )


# ─── Entry Point ──────────────────────────────────────────────────────────────

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)