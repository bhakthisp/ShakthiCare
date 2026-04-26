from __future__ import annotations

from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Literal, Optional, Sequence, TypedDict, Union, overload

RiskLevel = Literal["Low", "Medium", "High"]


class PredictionResult(TypedDict):
    risk: RiskLevel
    explanation: List[str]


class InputRow(TypedDict, total=False):
    cycle_length: float
    stress_level: float
    sleep_hours: float
    mood_score: float
    symptom_count: int


@dataclass(frozen=True)
class RuleConfig:
    high_cycle_threshold: float = 35
    high_stress_threshold: float = 4
    medium_cycle_threshold: float = 30
    low_sleep_threshold: float = 5


class ShaktiCarePCODRiskModel:
    """
    Lightweight "ML-style" predictor for hackathon demos.

    - sklearn-like surface area: fit / predict / predict_one
    - No training: rule-based inference only
    - Returns { risk: "...", explanation: [...] } as requested
    """

    def __init__(self, config: RuleConfig | None = None):
        self.config = config or RuleConfig()
        self._is_fitted = False

    def fit(self, X: Any = None, y: Any = None) -> "ShaktiCarePCODRiskModel":
        # Intentionally no training; keep sklearn-like API.
        self._is_fitted = True
        return self

    def _require_fitted(self) -> None:
        # For a more "model-like" feel; still safe for demo usage.
        if not self._is_fitted:
            self.fit()

    @staticmethod
    def _to_float(value: Any, default: float = 0.0) -> float:
        try:
            if value is None:
                return default
            return float(value)
        except (TypeError, ValueError):
            return default

    @staticmethod
    def _to_int(value: Any, default: int = 0) -> int:
        try:
            if value is None:
                return default
            return int(value)
        except (TypeError, ValueError):
            return default

    def _predict_core(
        self,
        *,
        cycle_length: float,
        stress_level: float,
        sleep_hours: float,
        mood_score: float,
        symptom_count: int,
    ) -> PredictionResult:
        c = self.config
        explanation: List[str] = []

        if cycle_length > c.high_cycle_threshold:
            explanation.append("Cycle irregularity")
        if stress_level > c.high_stress_threshold:
            explanation.append("Stress impact")
        if sleep_hours < c.low_sleep_threshold:
            explanation.append("Low sleep")

        # Rule-based risk logic (exactly as provided)
        if cycle_length > c.high_cycle_threshold and stress_level > c.high_stress_threshold:
            risk: RiskLevel = "High"
        elif cycle_length > c.medium_cycle_threshold or sleep_hours < c.low_sleep_threshold:
            risk = "Medium"
        else:
            risk = "Low"

        # Optional extra explanation (kept lightweight)
        if symptom_count >= 2 and risk != "Low":
            explanation.append("Multiple symptoms reported")
        if mood_score <= 2 and risk != "Low":
            explanation.append("Low mood signal")

        # Ensure at least one explanation line
        if not explanation:
            explanation.append("Normal pattern")

        return {"risk": risk, "explanation": explanation}

    def predict_one(self, row: Union[InputRow, Dict[str, Any]]) -> PredictionResult:
        """
        Predict for a single feature dict.

        Expected keys:
        - cycle_length, stress_level, sleep_hours, mood_score, symptom_count
        """
        self._require_fitted()
        cycle_length = self._to_float(row.get("cycle_length", 0))
        stress_level = self._to_float(row.get("stress_level", 0))
        sleep_hours = self._to_float(row.get("sleep_hours", 0))
        mood_score = self._to_float(row.get("mood_score", 0))
        symptom_count = self._to_int(row.get("symptom_count", 0))

        return self._predict_core(
            cycle_length=cycle_length,
            stress_level=stress_level,
            sleep_hours=sleep_hours,
            mood_score=mood_score,
            symptom_count=symptom_count,
        )

    def predict(self, rows: Sequence[Union[InputRow, Dict[str, Any]]]) -> List[PredictionResult]:
        """Batch predict."""
        return [self.predict_one(r) for r in rows]


if __name__ == "__main__":
    model = ShaktiCarePCODRiskModel().fit()

    demo_input: InputRow = {
        "cycle_length": 38,
        "stress_level": 5,
        "sleep_hours": 4.5,
        "mood_score": 3,
        "symptom_count": 2,
    }

    print(model.predict_one(demo_input))

