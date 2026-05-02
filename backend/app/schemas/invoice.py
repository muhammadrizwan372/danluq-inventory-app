from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.invoice import InvoiceStatus


class InvoiceBase(BaseModel):
    order_id: int
    notes: Optional[str] = None
    due_date: Optional[datetime] = None


class InvoiceCreate(InvoiceBase):
    pass


class InvoiceUpdate(BaseModel):
    status: Optional[InvoiceStatus] = None
    notes: Optional[str] = None
    due_date: Optional[datetime] = None


class InvoiceResponse(BaseModel):
    id: int
    invoice_number: str
    order_id: int
    status: InvoiceStatus
    subtotal: float
    tax: float
    discount: float
    total: float
    notes: Optional[str] = None
    due_date: Optional[datetime] = None
    paid_date: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
