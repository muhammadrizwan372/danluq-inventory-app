from datetime import datetime, timezone, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, extract
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product, Category
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/sales-summary")
def sales_summary(
    days: int = Query(30, description="Number of days to look back"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    orders = (
        db.query(Order)
        .filter(Order.created_at >= since, Order.status != OrderStatus.CANCELLED)
        .all()
    )
    total_revenue = sum(o.total for o in orders)
    total_orders = len(orders)
    avg_order_value = total_revenue / total_orders if total_orders > 0 else 0

    return {
        "period_days": days,
        "total_revenue": round(total_revenue, 2),
        "total_orders": total_orders,
        "average_order_value": round(avg_order_value, 2),
    }


@router.get("/stock-report")
def stock_report(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    products = db.query(Product).all()
    total_value = sum(p.stock_quantity * p.cost for p in products)
    low_stock = [p for p in products if p.stock_quantity <= p.reorder_level]
    out_of_stock = [p for p in products if p.stock_quantity == 0]

    return {
        "total_products": len(products),
        "total_stock_value": round(total_value, 2),
        "low_stock_count": len(low_stock),
        "out_of_stock_count": len(out_of_stock),
        "low_stock_items": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "stock_quantity": p.stock_quantity,
                "reorder_level": p.reorder_level,
                "cost": p.cost,
            }
            for p in low_stock
        ],
    }


@router.get("/top-selling")
def top_selling_products(
    limit: int = Query(10),
    days: int = Query(30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(
            OrderItem.product_id,
            func.sum(OrderItem.quantity).label("total_sold"),
            func.sum(OrderItem.total).label("total_revenue"),
        )
        .join(Order)
        .filter(Order.created_at >= since, Order.status != OrderStatus.CANCELLED)
        .group_by(OrderItem.product_id)
        .order_by(func.sum(OrderItem.total).desc())
        .limit(limit)
        .all()
    )

    products = []
    for product_id, total_sold, total_revenue in results:
        product = db.query(Product).filter(Product.id == product_id).first()
        if product:
            products.append(
                {
                    "id": product.id,
                    "name": product.name,
                    "sku": product.sku,
                    "total_sold": total_sold,
                    "total_revenue": round(total_revenue, 2),
                }
            )

    return {"period_days": days, "products": products}


@router.get("/sales-by-category")
def sales_by_category(
    days: int = Query(30),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    since = datetime.now(timezone.utc) - timedelta(days=days)
    results = (
        db.query(
            Category.name,
            func.sum(OrderItem.total).label("total_revenue"),
            func.sum(OrderItem.quantity).label("total_sold"),
        )
        .join(Product, Product.category_id == Category.id)
        .join(OrderItem, OrderItem.product_id == Product.id)
        .join(Order, Order.id == OrderItem.order_id)
        .filter(Order.created_at >= since, Order.status != OrderStatus.CANCELLED)
        .group_by(Category.name)
        .order_by(func.sum(OrderItem.total).desc())
        .all()
    )

    return {
        "period_days": days,
        "categories": [
            {
                "category": name,
                "total_revenue": round(revenue, 2),
                "total_sold": sold,
            }
            for name, revenue, sold in results
        ],
    }
