import uuid
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.product import Product
from app.models.purchase_order import POStatus, PurchaseOrder, PurchaseOrderItem
from app.models.user import User
from app.schemas.purchase_order import (
    POItemResponse,
    PurchaseOrderCreate,
    PurchaseOrderResponse,
    PurchaseOrderUpdate,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/purchase-orders", tags=["Purchase Orders"])


def generate_po_number() -> str:
    return f"PO-{uuid.uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[PurchaseOrderResponse])
def list_purchase_orders(
    status_filter: Optional[POStatus] = Query(None, alias="status"),
    supplier_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = (
        db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product),
        )
        .order_by(PurchaseOrder.created_at.desc())
    )
    if status_filter:
        query = query.filter(PurchaseOrder.status == status_filter)
    if supplier_id:
        query = query.filter(PurchaseOrder.supplier_id == supplier_id)
    pos = query.all()
    result = []
    for po in pos:
        result.append(
            PurchaseOrderResponse(
                id=po.id,
                po_number=po.po_number,
                supplier_id=po.supplier_id,
                status=po.status,
                subtotal=po.subtotal,
                tax=po.tax,
                total=po.total,
                notes=po.notes,
                expected_date=po.expected_date,
                created_at=po.created_at,
                updated_at=po.updated_at,
                supplier=po.supplier,
                items=[
                    POItemResponse(
                        id=item.id,
                        product_id=item.product_id,
                        quantity=item.quantity,
                        unit_cost=item.unit_cost,
                        total=item.total,
                        product_name=item.product.name if item.product else None,
                    )
                    for item in po.items
                ],
            )
        )
    return result


@router.post("/", response_model=PurchaseOrderResponse, status_code=status.HTTP_201_CREATED)
def create_purchase_order(
    data: PurchaseOrderCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po = PurchaseOrder(
        po_number=generate_po_number(),
        supplier_id=data.supplier_id,
        tax=data.tax,
        notes=data.notes,
        expected_date=data.expected_date,
    )

    subtotal = 0.0
    po_items = []
    for item_data in data.items:
        product = db.query(Product).filter(Product.id == item_data.product_id).first()
        if not product:
            raise HTTPException(
                status_code=400, detail=f"Product {item_data.product_id} not found"
            )
        item_total = item_data.quantity * item_data.unit_cost
        subtotal += item_total
        po_items.append(
            PurchaseOrderItem(
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_cost=item_data.unit_cost,
                total=item_total,
            )
        )

    po.subtotal = subtotal
    po.total = subtotal + data.tax
    po.items = po_items

    db.add(po)
    db.commit()
    db.refresh(po)

    po = (
        db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product),
        )
        .filter(PurchaseOrder.id == po.id)
        .first()
    )
    return PurchaseOrderResponse(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        status=po.status,
        subtotal=po.subtotal,
        tax=po.tax,
        total=po.total,
        notes=po.notes,
        expected_date=po.expected_date,
        created_at=po.created_at,
        updated_at=po.updated_at,
        supplier=po.supplier,
        items=[
            POItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                total=item.total,
                product_name=item.product.name if item.product else None,
            )
            for item in po.items
        ],
    )


@router.put("/{po_id}", response_model=PurchaseOrderResponse)
def update_purchase_order(
    po_id: int,
    data: PurchaseOrderUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    po = db.query(PurchaseOrder).filter(PurchaseOrder.id == po_id).first()
    if not po:
        raise HTTPException(status_code=404, detail="Purchase order not found")

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == POStatus.RECEIVED:
        if po.status != POStatus.RECEIVED:
            for item in po.items:
                product = db.query(Product).filter(Product.id == item.product_id).first()
                if product:
                    product.stock_quantity += item.quantity

    for key, value in update_data.items():
        setattr(po, key, value)
    db.commit()
    db.refresh(po)

    po = (
        db.query(PurchaseOrder)
        .options(
            joinedload(PurchaseOrder.supplier),
            joinedload(PurchaseOrder.items).joinedload(PurchaseOrderItem.product),
        )
        .filter(PurchaseOrder.id == po.id)
        .first()
    )
    return PurchaseOrderResponse(
        id=po.id,
        po_number=po.po_number,
        supplier_id=po.supplier_id,
        status=po.status,
        subtotal=po.subtotal,
        tax=po.tax,
        total=po.total,
        notes=po.notes,
        expected_date=po.expected_date,
        created_at=po.created_at,
        updated_at=po.updated_at,
        supplier=po.supplier,
        items=[
            POItemResponse(
                id=item.id,
                product_id=item.product_id,
                quantity=item.quantity,
                unit_cost=item.unit_cost,
                total=item.total,
                product_name=item.product.name if item.product else None,
            )
            for item in po.items
        ],
    )
