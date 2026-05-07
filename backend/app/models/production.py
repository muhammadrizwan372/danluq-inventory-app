from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Date
from sqlalchemy.orm import relationship

from app.database import Base


class ProductionRecord(Base):
    __tablename__ = "production_records"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    shift = Column(String, nullable=False)  # "day" or "night"
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity_kg = Column(Float, nullable=False, default=0.0)
    waste_kg = Column(Float, nullable=False, default=0.0)
    notes = Column(Text, nullable=True)
    operator = Column(String, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    product = relationship("Product")
