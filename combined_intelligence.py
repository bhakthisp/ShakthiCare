from __future__ import annotations

from dataclasses import dataclass
from typing import TypedDict

from pcod_risk_engine import RiskLevel


class CombinedIntelligenceResult(TypedDict):
    """Core ShaktiCare AI output: fused Digital Twin + ML assessment."""

    final_risk: RiskLevel
    final_ai_insight: str


@dataclass(frozen=True)
class IntelligenceThresholds:
    """
    Digital Twin deviation score bands (same spirit as DigitalTwinPage.tsx).

    - Above ``high_deviation`` → strong twin signal (paired with ML in fusion rules).
    - Above ``mild_deviation`` up to and including ``high_deviation`` → mild deviation
      when ML alone would not already imply High.
    """

    high_deviation: float = 5.0
    mild_deviation: float = 2.0


def _normalize_ml_risk(ml_risk_level: str) -> RiskLevel:
    key = (ml_risk_level or "").strip().lower()
    if key == "high":
        return "High"
    if key == "medium":
        return "Medium"
    if key == "low":
        return "Low"
    raise ValueError(f"Invalid ml_risk_level: {ml_risk_level!r} (expected High, Medium, or Low)")


def combine_digital_twin_and_ml(
    *,
    digital_twin_deviation_score: float,
    ml_risk_level: str,
    thresholds: IntelligenceThresholds | None = None,
) -> CombinedIntelligenceResult:
    """
    ShaktiCare AI intelligence core: merge Digital Twin deviation with ML risk.

    Logic:
    - Final High if ML is High OR twin deviation is strictly above the high threshold.
    - Else Final Medium if ML is Medium OR mild deviation (between mild and high band).
    - Else Final Low.

    Narrative:
    - Non-Low → twin + ML risk alignment copy.
    - Low → normal behavior across both systems.
    """
    t = thresholds or IntelligenceThresholds()
    ml = _normalize_ml_risk(ml_risk_level)

    high_twin = digital_twin_deviation_score > t.high_deviation
    mild_twin = (
        digital_twin_deviation_score > t.mild_deviation
        and digital_twin_deviation_score <= t.high_deviation
    )

    if ml == "High" or high_twin:
        final_risk: RiskLevel = "High"
    elif ml == "Medium" or mild_twin:
        final_risk = "Medium"
    else:
        final_risk = "Low"

    if final_risk == "Low":
        insight = "Normal behavior detected across both systems"
    else:
        insight = "Digital Twin shows deviation + ML model confirms risk pattern"

    return {"final_risk": final_risk, "final_ai_insight": insight}
