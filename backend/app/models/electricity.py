from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship

from app.database import Base


class ElectricityLog(Base):
    __tablename__ = "electricity_logs"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False, unique=True)
    main_meter = Column(Float, nullable=False, default=0.0)
    solar = Column(Float, nullable=False, default=0.0)
    total_units = Column(Float, nullable=False, default=0.0)
    per_unit_price = Column(Float, nullable=False, default=0.0)
    total_cost = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    departments = relationship("ElectricityDepartment", back_populates="log", cascade="all, delete-orphan")


class ElectricityDepartment(Base):
    __tablename__ = "electricity_departments"

    id = Column(Integer, primary_key=True, index=True)
    log_id = Column(Integer, ForeignKey("electricity_logs.id", ondelete="CASCADE"), nullable=False)
    name = Column(String, nullable=False)
    units = Column(Float, nullable=False, default=0.0)
    production = Column(String, nullable=True)
    details = Column(Text, nullable=True)

    log = relationship("ElectricityLog", back_populates="departments")
