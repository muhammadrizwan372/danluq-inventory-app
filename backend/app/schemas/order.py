from datetime import datetime
from typing import Optional, List

from pydantic import BaseModel

from app.models.order import OrderStatus
from app.schemas.customer import CustomerResponse


class OrderItemBase(BaseModel):
    product_id: int
    quantity: int
    unit_price: float


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemResponse(OrderItemBase):
    id: int
    total: float
    product_name: Optional[str] = None

    class Config:
        from_attributes = True


class OrderBase(BaseModel):
    customer_id: int
    notes: Optional[str] = None
    tax: float = 0.0
    discount: float = 0.0


class OrderCreate(OrderBase):
    items: List[OrderItemCreate]


class OrderUpdate(BaseModel):
    status: Optional[OrderStatus] = None
    notes: Optional[str] = None
    tax: Optional[float] = None
    discount: Optional[float] = None


class OrderResponse(BaseModel):
    id: int
    order_number: str
    customer_id: int
    status: OrderStatus
    subtotal: float
    tax: float
    discount: float
    total: float
    notes: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    customer: Optional[CustomerResponse] = None
    items: List[OrderItemResponse] = []

    class Config:
        from_attributes = True
