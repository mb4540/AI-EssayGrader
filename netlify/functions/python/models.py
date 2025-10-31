"""
Pydantic models for BulletProof Grading Calculator

These models enforce strict typing and validation for rubric-based grading.
All point values use Decimal to eliminate float arithmetic errors.
"""

from pydantic import BaseModel, Field, field_validator
from typing import List, Optional, Literal
from decimal import Decimal


class Rounding(BaseModel):
    """Rounding configuration for score calculations"""
    mode: Literal["HALF_UP", "HALF_EVEN", "HALF_DOWN"] = "HALF_UP"
    decimals: int = Field(default=2, ge=0, le=4)


class Scale(BaseModel):
    """Scoring scale configuration (percent or points mode)"""
    mode: Literal["percent", "points"] = "percent"
    total_points: Optional[Decimal] = None
    rounding: Rounding = Rounding()


class Level(BaseModel):
    """Individual performance level within a criterion"""
    label: str = Field(..., min_length=1, max_length=100)
    points: Decimal = Field(..., ge=0)
    descriptor: str = Field(..., min_length=1)


class Criterion(BaseModel):
    """Single grading criterion with levels and weighting"""
    id: str = Field(..., min_length=1, max_length=100)
    name: str = Field(..., min_length=1, max_length=255)
    max_points: Decimal = Field(..., gt=0)
    weight: Decimal = Field(default=Decimal("1.00"), gt=0)
    levels: List[Level] = Field(..., min_length=1)


class Rubric(BaseModel):
    """Complete grading rubric with criteria and scale"""
    rubric_id: str
    title: str = Field(..., min_length=1, max_length=255)
    criteria: List[Criterion] = Field(..., min_length=1)
    scale: Scale
    schema_version: int = 1


class Award(BaseModel):
    """Points awarded for a single criterion"""
    criterion_id: str
    level: str
    points_awarded: Decimal = Field(..., ge=0)
    rationale: str = Field(..., min_length=1)


class ExtractedScores(BaseModel):
    """LLM-extracted scores for all criteria (no totals computed)"""
    submission_id: str
    scores: List[Award] = Field(..., min_length=1)
    notes: Optional[str] = None


class ComputedScores(BaseModel):
    """Deterministically computed final scores"""
    raw_points: str  # Decimal as string for JSON serialization
    max_points: str
    percent: str
    final_points: Optional[str] = None  # Only present in points mode
