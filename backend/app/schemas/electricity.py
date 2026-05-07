from datetime import date, datetime
from typing import Optional, List

from pydantic import BaseModel


class ElectricityDepartmentCreate(BaseModel):
    name: str
    units: float = 0.0
    production: Optional[str] = None
    details: Optional[str] = None


class ElectricityDepartmentResponse(BaseModel):
    id: int
    log_id: int
    name: str
    units: float
    production: Optional[str] = None
    details: Optional[str] = None

    class Config:
        from_attributes = True


class ElectricityLogCreate(BaseModel):
    date: date
    main_meter: float
    solar: float = 0.0
    per_unit_price: float
    notes: Optional[str] = None
    departments: List[ElectricityDepartmentCreate] = []


class ElectricityLogUpdate(BaseModel):
    date: Optional[date] = None
    main_meter: Optional[float] = None
    solar: Optional[float] = None
    per_unit_price: Optional[float] = None
    notes: Optional[str] = None
    departments: Optional[List[ElectricityDepartmentCreate]] = None


class ElectricityLogResponse(BaseModel):
    id: int
    date: date
    main_meter: float
    solar: float
    total_units: float
    per_unit_price: float
    total_cost: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    departments: List[ElectricityDepartmentResponse] = []

    class Config:
        from_attributes = True
