"""
Unit tests for BulletProof Grading Calculator

Tests all edge cases, rounding modes, and validation logic.
"""

import pytest
from decimal import Decimal
from pydantic import ValidationError
from calculator import compute_scores, validate_rubric, _sum_max_points, _sum_awarded_points
from models import (
    Rubric, Criterion, Level, Scale, Rounding,
    ExtractedScores, Award
)


# Test Fixtures

def create_simple_rubric(mode="percent", total_points=None, rounding_mode="HALF_UP", decimals=2):
    """Create a simple 4-criterion rubric for testing"""
    return Rubric(
        rubric_id="test-rubric-1",
        title="Test Rubric",
        scale=Scale(
            mode=mode,
            total_points=Decimal(str(total_points)) if total_points else None,
            rounding=Rounding(mode=rounding_mode, decimals=decimals)
        ),
        criteria=[
            Criterion(
                id="org",
                name="Organization",
                max_points=Decimal("4.0"),
                weight=Decimal("1.0"),
                levels=[
                    Level(label="Exemplary", points=Decimal("4.0"), descriptor="Excellent"),
                    Level(label="Proficient", points=Decimal("3.0"), descriptor="Good"),
                    Level(label="Developing", points=Decimal("2.0"), descriptor="Fair"),
                    Level(label="Beginning", points=Decimal("1.0"), descriptor="Poor"),
                ]
            ),
            Criterion(
                id="evidence",
                name="Evidence",
                max_points=Decimal("4.0"),
                weight=Decimal("1.0"),
                levels=[
                    Level(label="Exemplary", points=Decimal("4.0"), descriptor="Excellent"),
                    Level(label="Proficient", points=Decimal("3.0"), descriptor="Good"),
                ]
            ),
            Criterion(
                id="grammar",
                name="Grammar",
                max_points=Decimal("4.0"),
                weight=Decimal("1.0"),
                levels=[
                    Level(label="Exemplary", points=Decimal("4.0"), descriptor="Excellent"),
                    Level(label="Proficient", points=Decimal("3.0"), descriptor="Good"),
                ]
            ),
            Criterion(
                id="style",
                name="Style",
                max_points=Decimal("4.0"),
                weight=Decimal("1.0"),
                levels=[
                    Level(label="Exemplary", points=Decimal("4.0"), descriptor="Excellent"),
                    Level(label="Proficient", points=Decimal("3.0"), descriptor="Good"),
                ]
            ),
        ]
    )


def create_extracted_scores(scores_dict):
    """Create ExtractedScores from a dict of {criterion_id: (level, points, rationale)}"""
    return ExtractedScores(
        submission_id="test-submission-1",
        scores=[
            Award(
                criterion_id=cid,
                level=data[0],
                points_awarded=Decimal(str(data[1])),
                rationale=data[2]
            )
            for cid, data in scores_dict.items()
        ]
    )


# Tests: Percent Mode

def test_percent_mode_full_points():
    """Test perfect score (100%) in percent mode"""
    rubric = create_simple_rubric(mode="percent")
    extracted = create_extracted_scores({
        "org": ("Exemplary", 4.0, "Perfect organization"),
        "evidence": ("Exemplary", 4.0, "Strong evidence"),
        "grammar": ("Exemplary", 4.0, "No errors"),
        "style": ("Exemplary", 4.0, "Excellent style"),
    })
    
    result = compute_scores(rubric, extracted)
    
    assert result["raw_points"] == "16.00"
    assert result["max_points"] == "16.00"
    assert result["percent"] == "100.00"
    assert result["final_points"] is None


def test_percent_mode_zero_points():
    """Test zero score (0%) in percent mode"""
    rubric = create_simple_rubric(mode="percent")
    extracted = create_extracted_scores({
        "org": ("Beginning", 0.0, "No organization"),
        "evidence": ("Beginning", 0.0, "No evidence"),
        "grammar": ("Beginning", 0.0, "Many errors"),
        "style": ("Beginning", 0.0, "Poor style"),
    })
    
    result = compute_scores(rubric, extracted)
    
    assert result["raw_points"] == "0.00"
    assert result["max_points"] == "16.00"
    assert result["percent"] == "0.00"
    assert result["final_points"] is None


def test_percent_mode_mixed_scores():
    """Test mixed scores (75%) in percent mode"""
    rubric = create_simple_rubric(mode="percent")
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good organization"),
        "evidence": ("Exemplary", 4.0, "Strong evidence"),
        "grammar": ("Proficient", 3.0, "Few errors"),
        "style": ("Developing", 2.0, "Needs work"),
    })
    
    result = compute_scores(rubric, extracted)
    
    assert result["raw_points"] == "12.00"
    assert result["max_points"] == "16.00"
    assert result["percent"] == "75.00"
    assert result["final_points"] is None


# Tests: Points Mode

def test_points_mode_simple_scaling():
    """Test points mode with simple scaling (50 total points)"""
    rubric = create_simple_rubric(mode="points", total_points=50)
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good organization"),
        "evidence": ("Exemplary", 4.0, "Strong evidence"),
        "grammar": ("Proficient", 3.0, "Few errors"),
        "style": ("Developing", 2.0, "Needs work"),
    })
    
    result = compute_scores(rubric, extracted)
    
    assert result["raw_points"] == "12.00"
    assert result["max_points"] == "16.00"
    assert result["percent"] == "75.00"
    assert result["final_points"] == "37.50"  # 12/16 * 50 = 37.5


def test_points_mode_large_total():
    """Test points mode with large total (500 points)"""
    rubric = create_simple_rubric(mode="points", total_points=500)
    extracted = create_extracted_scores({
        "org": ("Exemplary", 4.0, "Perfect"),
        "evidence": ("Exemplary", 4.0, "Perfect"),
        "grammar": ("Exemplary", 4.0, "Perfect"),
        "style": ("Exemplary", 4.0, "Perfect"),
    })
    
    result = compute_scores(rubric, extracted)
    
    assert result["final_points"] == "500.00"


def test_points_mode_small_total():
    """Test points mode with small total (5 points)"""
    rubric = create_simple_rubric(mode="points", total_points=5)
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good"),
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Proficient", 3.0, "Good"),
        "style": ("Proficient", 3.0, "Good"),
    })
    
    result = compute_scores(rubric, extracted)
    
    # 12/16 * 5 = 3.75
    assert result["final_points"] == "3.75"


# Tests: Rounding Modes

def test_rounding_half_up():
    """Test HALF_UP rounding (0.5 rounds up)"""
    rubric = create_simple_rubric(mode="points", total_points=50, rounding_mode="HALF_UP", decimals=1)
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good"),
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Developing", 2.5, "Fair"),
        "style": ("Developing", 2.5, "Fair"),
    })
    
    result = compute_scores(rubric, extracted)
    
    # 11/16 * 50 = 34.375 → rounds to 34.4 (HALF_UP, 1 decimal)
    assert result["final_points"] == "34.4"


def test_rounding_half_even():
    """Test HALF_EVEN rounding (banker's rounding)"""
    rubric = create_simple_rubric(mode="points", total_points=100, rounding_mode="HALF_EVEN", decimals=0)
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good"),
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Proficient", 3.0, "Good"),
        "style": ("Developing", 2.0, "Fair"),
    })
    
    result = compute_scores(rubric, extracted)
    
    # 11/16 * 100 = 68.75 → rounds to 69 (HALF_EVEN, 0 decimals, rounds to nearest odd)
    assert result["final_points"] == "69"


# Tests: Weighted Criteria

def test_weighted_criteria():
    """Test rubric with weighted criteria"""
    rubric = Rubric(
        rubric_id="weighted-rubric",
        title="Weighted Rubric",
        scale=Scale(mode="percent"),
        criteria=[
            Criterion(
                id="content",
                name="Content",
                max_points=Decimal("10.0"),
                weight=Decimal("2.0"),  # Double weight
                levels=[Level(label="Good", points=Decimal("10.0"), descriptor="Good")]
            ),
            Criterion(
                id="grammar",
                name="Grammar",
                max_points=Decimal("10.0"),
                weight=Decimal("1.0"),  # Normal weight
                levels=[Level(label="Good", points=Decimal("10.0"), descriptor="Good")]
            ),
        ]
    )
    
    extracted = create_extracted_scores({
        "content": ("Good", 10.0, "Excellent content"),
        "grammar": ("Good", 5.0, "Some errors"),
    })
    
    result = compute_scores(rubric, extracted)
    
    # Max: (10*2) + (10*1) = 30
    # Raw: (10*2) + (5*1) = 25
    # Percent: 25/30 = 83.33%
    assert result["max_points"] == "30.00"
    assert result["raw_points"] == "25.00"
    assert result["percent"] == "83.33"


# Tests: Validation

def test_missing_criterion():
    """Test error when criterion is missing from extracted scores"""
    rubric = create_simple_rubric()
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good"),
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Proficient", 3.0, "Good"),
        # Missing "style"
    })
    
    with pytest.raises(ValueError, match="Missing criteria"):
        compute_scores(rubric, extracted)


def test_extra_criterion():
    """Test error when extra criterion in extracted scores"""
    rubric = create_simple_rubric()
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good"),
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Proficient", 3.0, "Good"),
        "style": ("Proficient", 3.0, "Good"),
        "extra": ("Proficient", 3.0, "Extra"),  # Not in rubric
    })
    
    with pytest.raises(ValueError, match="Extra criteria"):
        compute_scores(rubric, extracted)


def test_points_over_max():
    """Test error when awarded points exceed max"""
    rubric = create_simple_rubric()
    extracted = create_extracted_scores({
        "org": ("Proficient", 5.0, "Good"),  # Max is 4.0
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Proficient", 3.0, "Good"),
        "style": ("Proficient", 3.0, "Good"),
    })
    
    with pytest.raises(ValueError, match="not in range"):
        compute_scores(rubric, extracted)


def test_negative_points():
    """Test error when awarded points are negative"""
    rubric = create_simple_rubric()
    
    # Pydantic will catch negative points during model creation
    with pytest.raises(ValidationError, match="greater than or equal to 0"):
        extracted = create_extracted_scores({
            "org": ("Proficient", -1.0, "Negative"),  # Invalid
            "evidence": ("Proficient", 3.0, "Good"),
            "grammar": ("Proficient", 3.0, "Good"),
            "style": ("Proficient", 3.0, "Good"),
        })


def test_points_mode_missing_total():
    """Test error when points mode lacks total_points"""
    rubric = create_simple_rubric(mode="points", total_points=None)
    extracted = create_extracted_scores({
        "org": ("Proficient", 3.0, "Good"),
        "evidence": ("Proficient", 3.0, "Good"),
        "grammar": ("Proficient", 3.0, "Good"),
        "style": ("Proficient", 3.0, "Good"),
    })
    
    with pytest.raises(ValueError, match="total_points required"):
        compute_scores(rubric, extracted)


# Tests: Rubric Validation

def test_validate_rubric_success():
    """Test valid rubric passes validation"""
    rubric = create_simple_rubric()
    validate_rubric(rubric)  # Should not raise


def test_validate_rubric_no_criteria():
    """Test error when rubric has no criteria"""
    # Pydantic will catch empty criteria list during model creation
    with pytest.raises(ValidationError, match="at least 1 item"):
        rubric = Rubric(
            rubric_id="empty",
            title="Empty",
            scale=Scale(mode="percent"),
            criteria=[]
        )


def test_validate_rubric_level_exceeds_max():
    """Test error when level points exceed criterion max"""
    rubric = Rubric(
        rubric_id="invalid",
        title="Invalid",
        scale=Scale(mode="percent"),
        criteria=[
            Criterion(
                id="test",
                name="Test",
                max_points=Decimal("4.0"),
                weight=Decimal("1.0"),
                levels=[
                    Level(label="Too High", points=Decimal("5.0"), descriptor="Invalid")
                ]
            )
        ]
    )
    
    with pytest.raises(ValueError, match="exceeding max"):
        validate_rubric(rubric)


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
