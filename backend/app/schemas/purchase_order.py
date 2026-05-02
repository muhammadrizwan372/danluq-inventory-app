from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.purchase_order import POStatus
from app.schemas.supplier import SupplierResponse


class POItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_cost: float


class POItemCreate(POItemBase):
    pass


class POItemResponse(POItemBase):
    id: int
    total: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class PurchaseOrderBase(BaseModel):
    supplier_id: int
    notes: Optional[str] = None
    tax: float = 0.0
    expected_date: Optional[datetime] = None


class PurchaseOrderCreate(PurchaseOrderBase):
    items: List[POItemCreate]


class PurchaseOrderUpdate(BaseModel):
    status: Optional[POStatus] = None
    notes: Optional[str] = None
    tax: Optional[float] = None
    expected_date: Optional[datetime] = None


class PurchaseOrderResponse(BaseModel):
    id: int
    po_number: str
    supplier_id: int
    status: POStatus
    subtotal: float
    tax: float
    total: float
    notes: Optional[str] = None
    expected_date: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    supplier: Optional[SupplierResponse] = None
    items: List[POItemResponse] = []

    class Config:
        from_attributes = True
