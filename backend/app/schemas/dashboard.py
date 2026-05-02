from typing import List, Optional

from pydantic import BaseModel


class DashboardStats(BaseModel):
    total_products: int
    total_orders: int
    total_customers: int
    total_suppliers: int
    total_revenue: float
    pending_orders: int
    low_stock_count: int


class LowStockProduct(BaseModel):
    id: int
    name: str
    sku: str
    stock_quantity: int
    reorder_level: int


class RecentOrder(BaseModel):
    id: int
    order_number: str
    customer_name: str
    total: float
    status: str
    created_at: str


class TopProduct(BaseModel):
    id: int
    name: str
    sku: str
    total_sold: int
    total_revenue: float


class DashboardResponse(BaseModel):
    stats: DashboardStats
    low_stock_products: List[LowStockProduct]
    recent_orders: List[RecentOrder]
    top_products: List[TopProduct]
