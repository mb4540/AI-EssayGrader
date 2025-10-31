"""
BulletProof Grading Calculator

Deterministic, Decimal-based score calculator that eliminates float arithmetic errors.
LLM provides per-criterion scores; this calculator handles ALL math.

Core Philosophy: "LLM for language, tools for math."
"""

from decimal import Decimal, ROUND_HALF_UP, ROUND_HALF_EVEN, ROUND_HALF_DOWN
from typing import Dict
from models import Rubric, ExtractedScores, ComputedScores, Rounding


# Rounding mode mappings
ROUNDING_MODES = {
    "HALF_UP": ROUND_HALF_UP,
    "HALF_EVEN": ROUND_HALF_EVEN,
    "HALF_DOWN": ROUND_HALF_DOWN
}


def _quantizer(decimals: int) -> Decimal:
    """Create quantizer for rounding to specified decimal places"""
    return Decimal(10) ** (-decimals)


def _sum_max_points(rubric: Rubric) -> Decimal:
    """Calculate maximum possible weighted points from rubric"""
    total = Decimal("0")
    for criterion in rubric.criteria:
        total += criterion.max_points * criterion.weight
    return total


def _sum_awarded_points(rubric: Rubric, extracted: ExtractedScores) -> Decimal:
    """
    Calculate total weighted points awarded.
    
    Validates that:
    - All criteria are present
    - Points are within valid range [0, max_points]
    - No duplicate criteria
    """
    # Create lookup of awarded points by criterion_id
    points_by_id = {score.criterion_id: score.points_awarded for score in extracted.scores}
    
    # Validate all criteria present
    rubric_criterion_ids = {c.id for c in rubric.criteria}
    awarded_criterion_ids = set(points_by_id.keys())
    
    if rubric_criterion_ids != awarded_criterion_ids:
        missing = rubric_criterion_ids - awarded_criterion_ids
        extra = awarded_criterion_ids - rubric_criterion_ids
        error_parts = []
        if missing:
            error_parts.append(f"Missing criteria: {missing}")
        if extra:
            error_parts.append(f"Extra criteria: {extra}")
        raise ValueError(f"Criterion mismatch. {', '.join(error_parts)}")
    
    # Calculate weighted total with range validation
    total = Decimal("0")
    for criterion in rubric.criteria:
        awarded = points_by_id[criterion.id]
        
        # Validate range
        if awarded < 0 or awarded > criterion.max_points:
            raise ValueError(
                f"Invalid points for '{criterion.id}': {awarded} "
                f"not in range [0, {criterion.max_points}]"
            )
        
        total += awarded * criterion.weight
    
    return total


def _round_decimal(value: Decimal, rounding: Rounding) -> Decimal:
    """Round Decimal value using specified rounding mode and precision"""
    quantizer = _quantizer(rounding.decimals)
    rounding_mode = ROUNDING_MODES[rounding.mode]
    return value.quantize(quantizer, rounding=rounding_mode)


def compute_scores(rubric: Rubric, extracted: ExtractedScores) -> Dict[str, str]:
    """
    Compute final scores deterministically using Decimal math.
    
    Args:
        rubric: Grading rubric with criteria and scale configuration
        extracted: LLM-extracted per-criterion scores
    
    Returns:
        Dictionary with computed scores as strings:
        - raw_points: Weighted points awarded
        - max_points: Maximum possible weighted points
        - percent: Percentage score (0-100)
        - final_points: Scaled points (only in points mode)
    
    Raises:
        ValueError: If validation fails or points are out of range
    """
    # Calculate raw weighted totals
    max_weighted = _sum_max_points(rubric)
    raw_weighted = _sum_awarded_points(rubric, extracted)
    
    # Calculate percentage
    if max_weighted == 0:
        raise ValueError("Maximum points cannot be zero")
    
    percent = (raw_weighted / max_weighted) * Decimal("100")
    
    # Round values
    rounding = rubric.scale.rounding
    raw_rounded = _round_decimal(raw_weighted, rounding)
    max_rounded = _round_decimal(max_weighted, rounding)
    percent_rounded = _round_decimal(percent, rounding)
    
    # Return based on scale mode
    if rubric.scale.mode == "percent":
        return {
            "raw_points": str(raw_rounded),
            "max_points": str(max_rounded),
            "percent": str(percent_rounded),
            "final_points": None
        }
    
    # Points mode - scale to total_points
    if rubric.scale.total_points is None:
        raise ValueError("scale.total_points required when mode='points'")
    
    # Scale: final = (raw / max) * total_points
    scaled = (raw_weighted / max_weighted) * rubric.scale.total_points
    final_rounded = _round_decimal(scaled, rounding)
    
    return {
        "raw_points": str(raw_rounded),
        "max_points": str(max_rounded),
        "percent": str(percent_rounded),
        "final_points": str(final_rounded)
    }


def validate_rubric(rubric: Rubric) -> None:
    """
    Validate rubric structure and values.
    
    Raises:
        ValueError: If rubric is invalid
    """
    # Validate at least one criterion
    if not rubric.criteria:
        raise ValueError("Rubric must have at least one criterion")
    
    # Validate each criterion has at least one level
    for criterion in rubric.criteria:
        if not criterion.levels:
            raise ValueError(f"Criterion '{criterion.id}' must have at least one level")
        
        # Validate level points don't exceed max_points
        for level in criterion.levels:
            if level.points > criterion.max_points:
                raise ValueError(
                    f"Level '{level.label}' in criterion '{criterion.id}' "
                    f"has points ({level.points}) exceeding max ({criterion.max_points})"
                )
    
    # Validate points mode has total_points
    if rubric.scale.mode == "points" and rubric.scale.total_points is None:
        raise ValueError("Points mode requires scale.total_points to be set")
    
    # Validate total_points is positive if set
    if rubric.scale.total_points is not None and rubric.scale.total_points <= 0:
        raise ValueError("scale.total_points must be greater than zero")
