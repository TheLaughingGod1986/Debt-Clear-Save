"""Database layer — SQLite via SQLAlchemy.

Two tables:
  * plans          — the user's starting position + strategy
  * month_progress — which months have been ticked off, plus optional actuals
"""
from __future__ import annotations

import datetime as dt
from typing import Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    create_engine,
)
from sqlalchemy.orm import (
    DeclarativeBase,
    Mapped,
    mapped_column,
    relationship,
    sessionmaker,
)

DATABASE_URL = "sqlite:///./debt_freedom.db"

engine = create_engine(
    DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


class PlanModel(Base):
    __tablename__ = "plans"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String, default="My Plan")

    credit_card: Mapped[float] = mapped_column(Float, default=15_700.0)
    dmp_balance: Mapped[float] = mapped_column(Float, default=26_955.99)
    equity: Mapped[float] = mapped_column(Float, default=21_800.0)
    savings: Mapped[float] = mapped_column(Float, default=0.0)

    monthly_budget: Mapped[float] = mapped_column(Float, default=2_092.0)
    p1_cc_payment: Mapped[float] = mapped_column(Float, default=1_300.0)
    p1_dmp_payment: Mapped[float] = mapped_column(Float, default=492.0)
    p1_savings: Mapped[float] = mapped_column(Float, default=300.0)
    p2_dmp_payment: Mapped[float] = mapped_column(Float, default=1_492.0)
    p2_savings: Mapped[float] = mapped_column(Float, default=600.0)
    equity_growth: Mapped[float] = mapped_column(Float, default=200.0)

    property_value: Mapped[float] = mapped_column(Float, default=330_000.0)
    ownership_share_pct: Mapped[float] = mapped_column(Float, default=70.0)
    mortgage: Mapped[float] = mapped_column(Float, default=186_707.0)
    oplo: Mapped[float] = mapped_column(Float, default=22_460.0)

    savings_target: Mapped[float] = mapped_column(Float, default=60_000.0)

    created_at: Mapped[dt.datetime] = mapped_column(
        DateTime, default=dt.datetime.utcnow
    )

    progress: Mapped[list["MonthProgressModel"]] = relationship(
        back_populates="plan",
        cascade="all, delete-orphan",
    )


class MonthProgressModel(Base):
    __tablename__ = "month_progress"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    plan_id: Mapped[int] = mapped_column(
        ForeignKey("plans.id", ondelete="CASCADE"), index=True
    )
    month: Mapped[int] = mapped_column(Integer)
    done: Mapped[bool] = mapped_column(Boolean, default=False)

    # Optional real-world figures the user can log against the projection.
    actual_saved: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    note: Mapped[Optional[str]] = mapped_column(String, nullable=True)
    completed_at: Mapped[Optional[dt.datetime]] = mapped_column(
        DateTime, nullable=True
    )

    plan: Mapped["PlanModel"] = relationship(back_populates="progress")


def init_db() -> None:
    Base.metadata.create_all(bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
