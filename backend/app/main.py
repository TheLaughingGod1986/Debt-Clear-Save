"""FastAPI application — the decoupled backend.

Endpoints
---------
GET    /                         health / banner
POST   /plans                    create a plan
GET    /plans                    list plans
GET    /plans/{id}               fetch one plan
PATCH  /plans/{id}               update fields (recalculates on next projection)
DELETE /plans/{id}               delete a plan

GET    /plans/{id}/projection    the full month-by-month projection + summary,
                                  with each row's done-state merged in
PUT    /plans/{id}/progress/{m}  tick / untick a month (and log actuals)
GET    /plans/{id}/progress      list all progress rows

The projection is always computed fresh from the engine, so editing the plan
instantly reshapes the journey. Progress (the tick-offs) is the only mutable
per-month state and is stored separately.
"""
from __future__ import annotations

import datetime as dt

from fastapi import Depends, FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import schemas
from .database import MonthProgressModel, PlanModel, get_db, init_db
from .engine import Plan, project

app = FastAPI(
    title="Road to Debt Freedom API",
    description="Backend engine + persistence for the debt-payoff tracker.",
    version="1.0.0",
)

# Wide-open CORS for local dev / Expo. Lock this down for production.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def _startup() -> None:
    init_db()


# --------------------------------------------------------------------------- #
# Helpers
# --------------------------------------------------------------------------- #
_PLAN_FIELDS = (
    "credit_card", "dmp_balance", "equity", "savings", "monthly_budget",
    "p1_cc_payment", "p1_dmp_payment", "p1_savings", "p2_dmp_payment",
    "p2_savings", "equity_growth", "property_value", "ownership_share_pct",
    "mortgage", "oplo",
)


def _to_engine_plan(row: PlanModel) -> Plan:
    return Plan(**{f: getattr(row, f) for f in _PLAN_FIELDS})


def _get_plan_or_404(plan_id: int, db: Session) -> PlanModel:
    plan = db.get(PlanModel, plan_id)
    if plan is None:
        raise HTTPException(status_code=404, detail="Plan not found")
    return plan


# --------------------------------------------------------------------------- #
# Health
# --------------------------------------------------------------------------- #
@app.get("/")
def root():
    return {"app": "Road to Debt Freedom", "status": "ok", "version": "1.0.0"}


# --------------------------------------------------------------------------- #
# Plans CRUD
# --------------------------------------------------------------------------- #
@app.post("/plans", response_model=schemas.PlanOut, status_code=201)
def create_plan(payload: schemas.PlanCreate, db: Session = Depends(get_db)):
    plan = PlanModel(**payload.model_dump())
    db.add(plan)
    db.commit()
    db.refresh(plan)
    return plan


@app.get("/plans", response_model=list[schemas.PlanOut])
def list_plans(db: Session = Depends(get_db)):
    return db.query(PlanModel).order_by(PlanModel.created_at.desc()).all()


@app.get("/plans/{plan_id}", response_model=schemas.PlanOut)
def get_plan(plan_id: int, db: Session = Depends(get_db)):
    return _get_plan_or_404(plan_id, db)


@app.patch("/plans/{plan_id}", response_model=schemas.PlanOut)
def update_plan(
    plan_id: int,
    payload: schemas.PlanUpdate,
    db: Session = Depends(get_db),
):
    plan = _get_plan_or_404(plan_id, db)
    updates = payload.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(plan, key, value)
    db.commit()
    db.refresh(plan)
    return plan


@app.delete("/plans/{plan_id}", status_code=204)
def delete_plan(plan_id: int, db: Session = Depends(get_db)):
    plan = _get_plan_or_404(plan_id, db)
    db.delete(plan)
    db.commit()


# --------------------------------------------------------------------------- #
# Projection
# --------------------------------------------------------------------------- #
@app.get("/plans/{plan_id}/projection", response_model=schemas.ProjectionOut)
def get_projection(plan_id: int, db: Session = Depends(get_db)):
    plan = _get_plan_or_404(plan_id, db)
    try:
        proj = project(
            _to_engine_plan(plan), savings_target=plan.savings_target
        )
    except ValueError as exc:
        # e.g. Phase 1 allocations exceed the monthly budget.
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    done_map = {
        p.month: p.done
        for p in db.query(MonthProgressModel)
        .filter(MonthProgressModel.plan_id == plan_id)
        .all()
    }

    rows: list[schemas.MonthRowOut] = []
    months_done = 0
    next_action_month = None
    for r in proj.rows:
        done = done_map.get(r.month, False)
        if done:
            months_done += 1
        elif next_action_month is None:
            next_action_month = r.month
        rows.append(schemas.MonthRowOut(**vars(r), done=done))

    total_months = len(proj.rows) or 1
    summary = schemas.SummaryOut(
        **vars(proj.summary),
        months_done=months_done,
        next_action_month=next_action_month,
        pct_complete=round(100 * months_done / total_months, 1),
    )
    return schemas.ProjectionOut(
        plan=schemas.PlanOut.model_validate(plan),
        rows=rows,
        summary=summary,
    )


# --------------------------------------------------------------------------- #
# Progress
# --------------------------------------------------------------------------- #
@app.get("/plans/{plan_id}/progress", response_model=list[schemas.ProgressOut])
def list_progress(plan_id: int, db: Session = Depends(get_db)):
    _get_plan_or_404(plan_id, db)
    return (
        db.query(MonthProgressModel)
        .filter(MonthProgressModel.plan_id == plan_id)
        .order_by(MonthProgressModel.month)
        .all()
    )


@app.put(
    "/plans/{plan_id}/progress/{month}", response_model=schemas.ProgressOut
)
def set_progress(
    plan_id: int,
    month: int,
    payload: schemas.ProgressUpdate,
    db: Session = Depends(get_db),
):
    _get_plan_or_404(plan_id, db)
    if month < 1:
        raise HTTPException(status_code=400, detail="month must be >= 1")

    row = (
        db.query(MonthProgressModel)
        .filter(
            MonthProgressModel.plan_id == plan_id,
            MonthProgressModel.month == month,
        )
        .first()
    )
    if row is None:
        row = MonthProgressModel(plan_id=plan_id, month=month)
        db.add(row)

    row.done = payload.done
    row.actual_saved = payload.actual_saved
    row.note = payload.note
    row.completed_at = dt.datetime.utcnow() if payload.done else None

    db.commit()
    db.refresh(row)
    return row
