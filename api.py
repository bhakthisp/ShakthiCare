from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict

from flask import Flask, jsonify, request

from combined_intelligence import IntelligenceThresholds, combine_digital_twin_and_ml
from pcod_risk_engine import ShaktiCarePCODRiskModel

app = Flask(__name__)
model = ShaktiCarePCODRiskModel().fit()


@app.get("/")
def root():
    return jsonify({"message": "ShaktiCare AI Backend Running", "status": "active"}), 200


@app.after_request
def _add_dev_cors_headers(response):
    """
    Dev-only CORS: allow the Vite frontend to call Flask directly.
    (Open origin/methods/headers as requested for development.)
    """
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET,POST,OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


@app.before_request
def _handle_options_preflight():
    # Handle preflight for any route path without creating a catch-all route
    # (which would otherwise turn unknown GETs into 405).
    if request.method == "OPTIONS":
        return ("", 204)
    return None


@app.errorhandler(404)
def _json_404(_err):
    return jsonify({"error": "Not found"}), 404


@app.errorhandler(405)
def _json_405(_err):
    return jsonify({"error": "Method not allowed"}), 405


@app.errorhandler(500)
def _json_500(_err):
    # Keep response JSON-only for PowerShell/curl testing.
    return jsonify({"error": "Internal server error"}), 500


def _require_number(payload: Dict[str, Any], key: str) -> float:
    if key not in payload:
        raise ValueError(f"Missing field: {key}")
    try:
        return float(payload[key])
    except (TypeError, ValueError):
        raise ValueError(f"Invalid number for: {key}")


@app.post("/predict")
def predict():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        features = {
            "cycle_length": _require_number(payload, "cycle_length"),
            "stress_level": _require_number(payload, "stress_level"),
            "sleep_hours": _require_number(payload, "sleep_hours"),
            "mood_score": _require_number(payload, "mood_score"),
            "symptom_count": int(_require_number(payload, "symptom_count")),
        }
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    result = model.predict_one(features)
    return jsonify(result), 200


@app.post("/combined-intelligence")
def combined_intelligence():
    """Fuse Digital Twin deviation score with ML risk (ShaktiCare AI core)."""
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        deviation = _require_number(payload, "digital_twin_deviation_score")
        ml_risk = payload.get("ml_risk_level")
        if not isinstance(ml_risk, str) or not ml_risk.strip():
            raise ValueError("Missing or invalid string field: ml_risk_level")

        high_t = payload.get("high_deviation_threshold")
        mild_t = payload.get("mild_deviation_threshold")
        thresholds = None
        if high_t is not None or mild_t is not None:
            thresholds = IntelligenceThresholds(
                high_deviation=float(high_t) if high_t is not None else 5.0,
                mild_deviation=float(mild_t) if mild_t is not None else 2.0,
            )

        result = combine_digital_twin_and_ml(
            digital_twin_deviation_score=deviation,
            ml_risk_level=ml_risk,
            thresholds=thresholds,
        )
    except ValueError as e:
        return jsonify({"error": str(e)}), 400

    return (
        jsonify(
            {
                "final_risk": result["final_risk"],
                "final_ai_insight": result["final_ai_insight"],
            }
        ),
        200,
    )


@app.get("/health")
def health():
    return jsonify({"ok": True}), 200


def _require_string(payload: Dict[str, Any], key: str) -> str:
    if key not in payload:
        raise ValueError(f"Missing field: {key}")
    value = payload.get(key)
    if not isinstance(value, str) or not value.strip():
        raise ValueError(f"Invalid string for: {key}")
    return value.strip()


@app.post("/add-data")
def add_data():
    """
    Append daily/weekly/monthly user health data to a CSV file for demo purposes.
    Never overwrites old data. Always returns JSON.
    """
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    try:
        user_id = _require_string(payload, "user_id")
        ts = payload.get("timestamp")
        timestamp = int(ts) if isinstance(ts, (int, float, str)) and str(ts).strip() else int(
            __import__("time").time() * 1000
        )

        daily = payload.get("daily") or {}
        weekly = payload.get("weekly") or {}
        monthly = payload.get("monthly") or {}

        if not isinstance(daily, dict) or not isinstance(weekly, dict) or not isinstance(monthly, dict):
            raise ValueError("Invalid section: daily/weekly/monthly must be objects")

        # Daily
        mood = float(daily.get("mood")) if daily.get("mood") is not None else None
        sleep_hours = float(daily.get("sleep_hours")) if daily.get("sleep_hours") is not None else None
        stress_level = float(daily.get("stress_level")) if daily.get("stress_level") is not None else None

        # Weekly
        weight = float(weekly.get("weight")) if weekly.get("weight") is not None else None
        exercise_minutes = (
            float(weekly.get("exercise_minutes")) if weekly.get("exercise_minutes") is not None else None
        )
        symptoms = weekly.get("symptoms") or {}
        if not isinstance(symptoms, dict):
            raise ValueError("Invalid section: weekly.symptoms must be an object")
        sym_acne = bool(symptoms.get("acne"))
        sym_hairfall = bool(symptoms.get("hairfall"))
        sym_fatigue = bool(symptoms.get("fatigue"))

        # Monthly
        cycle_start_date = str(monthly.get("cycle_start_date") or "").strip()
        cycle_end_date = str(monthly.get("cycle_end_date") or "").strip()
        pain_level = float(monthly.get("pain_level")) if monthly.get("pain_level") is not None else None
        regularity = monthly.get("regularity")
        if regularity not in (True, False, None):
            # allow "yes/no" strings from frontend too
            if isinstance(regularity, str):
                regularity = regularity.strip().lower() in ("yes", "true", "1")
            else:
                regularity = None

    except (TypeError, ValueError) as e:
        return jsonify({"error": str(e)}), 400

    csv_path = Path(__file__).with_name("shakticare_health_data.csv")
    header = [
        "user_id",
        "timestamp",
        "daily_mood",
        "daily_sleep_hours",
        "daily_stress_level",
        "weekly_weight",
        "weekly_exercise_minutes",
        "weekly_symptom_acne",
        "weekly_symptom_hairfall",
        "weekly_symptom_fatigue",
        "monthly_cycle_start_date",
        "monthly_cycle_end_date",
        "monthly_pain_level",
        "monthly_regularity",
        "monthly_missed_period",
    ]
    row = [
        user_id,
        str(timestamp),
        "" if mood is None else str(mood),
        "" if sleep_hours is None else str(sleep_hours),
        "" if stress_level is None else str(stress_level),
        "" if weight is None else str(weight),
        "" if exercise_minutes is None else str(exercise_minutes),
        "1" if sym_acne else "0",
        "1" if sym_hairfall else "0",
        "1" if sym_fatigue else "0",
        cycle_start_date,
        cycle_end_date,
        "" if pain_level is None else str(pain_level),
        "" if regularity is None else ("1" if regularity else "0"),
        "1" if bool(monthly.get("missed_period")) else "0",
    ]

    try:
        exists = csv_path.exists()
        with csv_path.open("a", encoding="utf-8", newline="") as f:
            if not exists:
                f.write(",".join(header) + "\n")
            f.write(",".join(r.replace(",", " ") for r in row) + "\n")
    except Exception:
        return jsonify({"error": "Failed to write data"}), 500

    return jsonify({"ok": True}), 200


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_ENV") == "development"
    
    # Print startup info once (avoid duplicate prints due to debug reloader).
    if os.environ.get("WERKZEUG_RUN_MAIN") == "true" or not debug:
        protocol = "http"
        host_display = f"0.0.0.0:{port}"
        print(f"ShaktiCare AI Backend Running on {protocol}://{host_display}")
        print("Available routes:")
        for rule in sorted(app.url_map.iter_rules(), key=lambda r: r.rule):
            methods = ",".join(sorted(m for m in (rule.methods or set()) if m not in {"HEAD"}))
            print(f" - {methods:18s} {rule.rule}")

    app.run(host="0.0.0.0", port=port, debug=debug)

