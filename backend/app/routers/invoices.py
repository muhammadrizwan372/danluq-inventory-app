import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.order import Order
from app.models.user import User
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceUpdate
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/invoices", tags=["Invoices"])


def generate_invoice_number() -> str:
    return f"INV-{uuid.uuid4().hex[:8].upper()}"


@router.get("/", response_model=List[InvoiceResponse])
def list_invoices(
    status_filter: Optional[InvoiceStatus] = Query(None, alias="status"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Invoice).order_by(Invoice.created_at.desc())
    if status_filter:
        query = query.filter(Invoice.status == status_filter)
    return query.all()


@router.post("/", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED)
def create_invoice(
    data: InvoiceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    order = db.query(Order).filter(Order.id == data.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    existing = db.query(Invoice).filter(Invoice.order_id == data.order_id).first()
    if existing:
        raise HTTPException(
            status_code=400, detail="Invoice already exists for this order"
        )

    invoice = Invoice(
        invoice_number=generate_invoice_number(),
        order_id=data.order_id,
        subtotal=order.subtotal,
        tax=order.tax,
        discount=order.discount,
        total=order.total,
        notes=data.notes,
        due_date=data.due_date,
    )
    db.add(invoice)
    db.commit()
    db.refresh(invoice)
    return invoice


@router.get("/{invoice_id}", response_model=InvoiceResponse)
def get_invoice(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.put("/{invoice_id}", response_model=InvoiceResponse)
def update_invoice(
    invoice_id: int,
    data: InvoiceUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == InvoiceStatus.PAID:
        update_data["paid_date"] = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(invoice, key, value)
    db.commit()
    db.refresh(invoice)
    return invoice
