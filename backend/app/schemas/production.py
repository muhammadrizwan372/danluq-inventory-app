from datetime import date, datetime
from typing import Optional

from pydantic import BaseModel


class ProductionRecordCreate(BaseModel):
    date: date
    shift: str  # "day" or "night"
    product_id: int
    quantity_kg: float
    waste_kg: float = 0.0
    notes: Optional[str] = None
    operator: Optional[str] = None


class ProductionRecordUpdate(BaseModel):
    date: Optional[date] = None
    shift: Optional[str] = None
    product_id: Optional[int] = None
    quantity_kg: Optional[float] = None
    waste_kg: Optional[float] = None
    notes: Optional[str] = None
    operator: Optional[str] = None


class ProductInfo(BaseModel):
    id: int
    name: str
    sku: str

    class Config:
        from_attributes = True


class ProductionRecordResponse(BaseModel):
    id: int
    date: date
    shift: str
    product_id: int
    quantity_kg: float
    waste_kg: float
    notes: Optional[str] = None
    operator: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    product: Optional[ProductInfo] = None

    class Config:
        from_attributes = True


class DailyProductionSummary(BaseModel):
    date: date
    day_total_kg: float
    night_total_kg: float
    total_kg: float
    day_waste_kg: float
    night_waste_kg: float
    total_waste_kg: float
    day_records: int
    night_records: int
