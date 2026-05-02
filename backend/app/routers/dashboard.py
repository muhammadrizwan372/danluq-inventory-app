from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.customer import Customer
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.supplier import Supplier
from app.models.user import User
from app.schemas.dashboard import (
    DashboardResponse,
    DashboardStats,
    LowStockProduct,
    RecentOrder,
    TopProduct,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["Dashboard"])


@router.get("/", response_model=DashboardResponse)
def get_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_products = db.query(func.count(Product.id)).scalar() or 0
    total_orders = db.query(func.count(Order.id)).scalar() or 0
    total_customers = db.query(func.count(Customer.id)).scalar() or 0
    total_suppliers = db.query(func.count(Supplier.id)).scalar() or 0

    total_revenue = (
        db.query(func.sum(Order.total))
        .filter(Order.status != OrderStatus.CANCELLED)
        .scalar()
        or 0.0
    )

    pending_orders = (
        db.query(func.count(Order.id))
        .filter(Order.status == OrderStatus.PENDING)
        .scalar()
        or 0
    )

    low_stock_count = (
        db.query(func.count(Product.id))
        .filter(Product.stock_quantity <= Product.reorder_level)
        .scalar()
        or 0
    )

    stats = DashboardStats(
        total_products=total_products,
        total_orders=total_orders,
        total_customers=total_customers,
        total_suppliers=total_suppliers,
        total_revenue=total_revenue,
        pending_orders=pending_orders,
        low_stock_count=low_stock_count,
    )

    low_stock_products = (
        db.query(Product)
        .filter(Product.stock_quantity <= Product.reorder_level)
        .limit(10)
        .all()
    )
    low_stock_list = [
        LowStockProduct(
            id=p.id,
            name=p.name,
            sku=p.sku,
            stock_quantity=p.stock_quantity,
            reorder_level=p.reorder_level,
        )
        for p in low_stock_products
    ]

    recent_orders = (
        db.query(Order)
        .order_by(Order.created_at.desc())
        .limit(10)
        .all()
    )
    recent_list = []
    for o in recent_orders:
        customer = db.query(Customer).filter(Customer.id == o.customer_id).first()
        recent_list.append(
            RecentOrder(
                id=o.id,
                order_number=o.order_number,
                customer_name=customer.name if customer else "Unknown",
                total=o.total,
                status=o.status.value,
                created_at=o.created_at.isoformat(),
            )
        )

    top_products_query = (
        db.query(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.total).label("total_revenue"),
        )
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.total).desc())
        .limit(5)
        .all()
    )
    top_products_list = []
    for product_id, total_sold, total_revenue in top_products_query:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            top_products_list.append(
                TopProduct(
                    id=product.id,
                    name=product.name,
                    sku=product.sku,
                    total_sold=total_sold,
                    total_revenue=total_revenue,
                )
            )

    return DashboardResponse(
        stats=stats,
        low_stock_products=low_stock_list,
        recent_orders=recent_list,
        top_products=top_products_list,
    )
