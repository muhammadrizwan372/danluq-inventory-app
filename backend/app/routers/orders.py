import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderResponse, OrderUpdate, OrderItemResponse
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/orders", tags=["Orders"])


def generate_order_number() -> str:
    return f"ORD-{uuid.uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[OrderResponse])
def list_orders(
    status_filter: Optional[OrderStatus] = Query(None, alias="status"),
    customer_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    if status_filter:
        query = query.filter(Order.status == status_filter)
    if customer_id:
        query = query.filter(Order.customer_id == customer_id)
    orders = query.all()
    result = []
    for order in orders:
        order_dict = {
            "id": order.id,
            "order_number": order.order_number,
            "customer_id": order.customer_id,
            "status": order.status,
            "subtotal": order.subtotal,
            "tax": order.tax,
            "discount": order.discount,
            "total": order.total,
            "notes": order.notes,
            "created_at": order.created_at,
            "updated_at": order.updated_at,
            "customer": order.customer,
            "items": [
                OrderItemResponse(
                    id=item.id,
                    product_id=item.product_id,
                    quantity=item.quantity,
                    unit_price=item.unit_price,
                    total=item.total,
                    product_name=item.product.name if item.product else None,
                )
                for item in order.items
            ],
        }
        result.append(order_dict)
    return result


@router.post("/", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_order(
    data: OrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = Order(
        order_number=generate_order_number(),
        customer_id=data.customer_id,
        tax=data.tax,
        discount=data.discount,
        notes=data.notes,
    )

    subtotal = 0.0
    order_items = []
    for item_data in data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=400, detail=f"Product {item_data.product_id} not found"
            )
        if product.stock_quantity < item_data.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.name}. Available: {product.stock_quantity}",
            )
        item_total = item_data.quantity * item_data.unit_price
        subtotal += item_total
        order_items.append(
            OrderItem(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total=item_total,
            )
        )
        product.stock_quantity -= item_data.quantity

    order.subtotal = subtotal
    order.total = subtotal + data.tax - data.discount
    order.items = order_items

    db.add(order)
    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order.id)
        .first()
    )
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        status=order.status,
        subtotal=order.subtotal,
        tax=order.tax,
        discount=order.discount,
        total=order.total,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=order.customer,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total=item.total,
                product_name=item.product.name if item.product else None,
            )
            for item in order.items
        ],
    )


@router.get("/{order_id}", response_model=OrderResponse)
def get_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        status=order.status,
        subtotal=order.subtotal,
        tax=order.tax,
        discount=order.discount,
        total=order.total,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=order.customer,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total=item.total,
                product_name=item.product.name if item.product else None,
            )
            for item in order.items
        ],
    )


@router.put("/{order_id}", response_model=OrderResponse)
def update_order(
    order_id: int,
    data: OrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == OrderStatus.CANCELLED:
        if order.status != OrderStatus.CANCELLED:
            for item in order.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity

    for key, value in update_data.items():
        setattr(order, key, value)

    if "tax" in update_data or "discount" in update_data:
        tax = update_data.get("tax", order.tax)
        discount = update_data.get("discount", order.discount)
        order.total = order.subtotal + tax - discount

    db.commit()
    db.refresh(order)

    order = (
        db.query(Order)
        .options(joinedload(Order.customer), joinedload(Order.items).joinedload(OrderItem.product))
        .filter(Order.id == order.id)
        .first()
    )
    return OrderResponse(
        id=order.id,
        order_number=order.order_number,
        customer_id=order.customer_id,
        status=order.status,
        subtotal=order.subtotal,
        tax=order.tax,
        discount=order.discount,
        total=order.total,
        notes=order.notes,
        created_at=order.created_at,
        updated_at=order.updated_at,
        customer=order.customer,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_price=item.unit_price,
                total=item.total,
                product_name=item.product.name if item.product else None,
            )
            for item in order.items
        ],
    )
