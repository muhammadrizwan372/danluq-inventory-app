from datetime import datetime
from typing import Optional

from pydantic import BaseModel


class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None


class CategoryCreate(CategoryBase):
    pass


class CategoryResponse(CategoryBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    sku: str
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: float = 0.0
    cost: float = 0.0
    stock_quantity: int = 0
    reorder_level: int = 10
    unit: str = "pcs"


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    description: Optional[str] = None
    category_id: Optional[int] = None
    price: Optional[float] = None
    cost: Optional[float] = None
    stock_quantity: Optional[int] = None
    reorder_level: Optional[int] = None
    unit: Optional[str] = None


class ProductResponse(ProductBase):
    id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    category: Optional[CategoryResponse] = None

    class Config:
        from_attributes = True
