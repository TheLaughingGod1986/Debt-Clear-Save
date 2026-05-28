"""Pydantic schemas — the API's request and response contracts."""
from __future__ import annotations

import datetime as dt
from typing import Optional

from pydantic import BaseModel, Field, ConfigDict


# --------------------------------------------------------------------------- #
# Plan
# --------------------------------------------------------------------------- #
class PlanBase(BaseModel):
    name: str = "My Plan"

    credit_card: float = Field(15_700.0, ge=0)
    dmp_balance: float = Field(26_955.99, ge=0)
    equity: float = Field(21_800.0, ge=0)
    savings: float = Field(0.0, ge=0)

    monthly_budget: float = Field(2_092.0, gt=0)
    p1_cc_payment: float = Field(1_300.0, ge=0)
    p1_dmp_payment: float = Field(492.0, ge=0)
    p1_savings: float = Field(300.0, ge=0)
    p2_dmp_payment: float = Field(1_492.0, ge=0)
    p2_savings: float = Field(600.0, ge=0)
    equity_growth: float = Field(200.0, ge=0)

    property_value: float = Field(330_000.0, ge=0)
    ownership_share_pct: float = Field(70.0, ge=0, le=100)
    mortgage: float = Field(186_707.0, ge=0)
    oplo: float = Field(22_460.0, ge=0)

    savings_target: float = Field(60_000.0, gt=0)


class PlanCreate(PlanBase):
    pass


class PlanUpdate(BaseModel):
    """All fields optional — patch only what changed."""
    model_config = ConfigDict(extra="forbid")

    name: Optional[str] = None
    credit_card: Optional[float] = Field(None, ge=0)
    dmp_balance: Optional[float] = Field(None, ge=0)
    equity: Optional[float] = Field(None, ge=0)
    savings: Optional[float] = Field(None, ge=0)
    monthly_budget: Optional[float] = Field(None, gt=0)
    p1_cc_payment: Optional[float] = Field(None, ge=0)
    p1_dmp_payment: Optional[float] = Field(None, ge=0)
    p1_savings: Optional[float] = Field(None, ge=0)
    p2_dmp_payment: Optional[float] = Field(None, ge=0)
    p2_savings: Optional[float] = Field(None, ge=0)
    equity_growth: Optional[float] = Field(None, ge=0)
    property_value: Optional[float] = Field(None, ge=0)
    ownership_share_pct: Optional[float] = Field(None, ge=0, le=100)
    mortgage: Optional[float] = Field(None, ge=0)
    oplo: Optional[float] = Field(None, ge=0)
    savings_target: Optional[float] = Field(None, gt=0)


class PlanOut(PlanBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    created_at: dt.datetime


# --------------------------------------------------------------------------- #
# Projection (computed, read-only)
# --------------------------------------------------------------------------- #
class MonthRowOut(BaseModel):
    month: int
    phase: int
    cc_payment: float
    cc_left: float
    dmp_payment: float
    dmp_left: float
    savings_added: float
    total_saved: float
    equity: float
    total_position: float
    milestone: Optional[str] = None
    # Merged-in progress state for convenience on the client:
    done: bool = False


class SummaryOut(BaseModel):
    cc_cleared_month: Optional[int] = None
    dmp_cleared_month: Optional[int] = None
    debt_free_month: Optional[int] = None
    target_hit_month: Optional[int] = None
    final_month: int
    final_total_position: float
    total_saved: float
    final_equity: float
    # Live progress stats:
    months_done: int = 0
    next_action_month: Optional[int] = None
    pct_complete: float = 0.0


class ProjectionOut(BaseModel):
    plan: PlanOut
    rows: list[MonthRowOut]
    summary: SummaryOut


# --------------------------------------------------------------------------- #
# Progress
# --------------------------------------------------------------------------- #
class ProgressUpdate(BaseModel):
    done: bool
    actual_saved: Optional[float] = None
    note: Optional[str] = None


class ProgressOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    month: int
    done: bool
    actual_saved: Optional[float] = None
    note: Optional[str] = None
    completed_at: Optional[dt.datetime] = None
