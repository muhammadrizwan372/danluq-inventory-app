import io
import uuid
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfgen import canvas
from reportlab.lib.styles import getSampleStyleSheet

from app.database import get_db
from app.models.invoice import Invoice, InvoiceStatus
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.customer import Customer
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


def _draw_gradient_rect(c: canvas.Canvas, x: float, y: float, w: float, h: float,
                        color_start: tuple, color_end: tuple, steps: int = 60):
    """Draw a vertical gradient rectangle from color_start (top) to color_end (bottom)."""
    step_h = h / steps
    for i in range(steps):
        r = color_start[0] + (color_end[0] - color_start[0]) * i / steps
        g = color_start[1] + (color_end[1] - color_start[1]) * i / steps
        b = color_start[2] + (color_end[2] - color_start[2]) * i / steps
        c.setFillColorRGB(r, g, b)
        c.rect(x, y + h - (i + 1) * step_h, w, step_h + 0.5, fill=1, stroke=0)


@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(
    invoice_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invoice = (
        db.query(Invoice)
        .filter(Invoice.id == invoice_id)
        .first()
    )
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")

    order = (
        db.query(Order)
        .options(joinedload(Order.items).joinedload(OrderItem.product))
        .options(joinedload(Order.customer))
        .filter(Order.id == invoice.order_id)
        .first()
    )

    customer = order.customer if order else None
    items = order.items if order else []

    buf = io.BytesIO()
    width, height = A4
    c = canvas.Canvas(buf, pagesize=A4)

    # --- Color palette ---
    dark1 = (0.08, 0.08, 0.14)       # #14142e deep navy
    dark2 = (0.12, 0.12, 0.22)       # #1e1e38
    accent = (0.30, 0.50, 1.0)       # #4d80ff blue accent
    accent2 = (0.55, 0.36, 0.96)     # #8c5cf5 purple accent
    gold = (0.90, 0.75, 0.30)        # #e6bf4d gold
    white = (1.0, 1.0, 1.0)
    light_gray = (0.75, 0.78, 0.85)
    mid_gray = (0.50, 0.53, 0.60)

    # ===================== FULL PAGE DARK BACKGROUND =====================
    c.setFillColorRGB(*dark2)
    c.rect(0, 0, width, height, fill=1, stroke=0)

    # ===================== HEADER GRADIENT BAR =====================
    header_h = 140
    _draw_gradient_rect(c, 0, height - header_h, width, header_h, dark1, (0.15, 0.18, 0.35))

    # Accent stripe at top
    c.setFillColorRGB(*accent)
    c.rect(0, height - 4, width, 4, fill=1, stroke=0)

    # Company name
    c.setFillColorRGB(*white)
    c.setFont("Helvetica-Bold", 26)
    c.drawString(40, height - 50, "DANLUQ PETRO INDUSTRIES")

    # Tagline
    c.setFillColorRGB(*light_gray)
    c.setFont("Helvetica", 9)
    c.drawString(40, height - 68, "Premium Petrochemical Solutions  •  Industrial Excellence")

    # Invoice label (right side)
    c.setFillColorRGB(*gold)
    c.setFont("Helvetica-Bold", 32)
    c.drawRightString(width - 40, height - 55, "INVOICE")

    # Invoice number
    c.setFillColorRGB(*light_gray)
    c.setFont("Helvetica", 11)
    c.drawRightString(width - 40, height - 75, f"#{invoice.invoice_number}")

    # Status badge
    status_text = invoice.status.value.upper()
    status_colors = {
        "draft": (0.45, 0.55, 0.65),
        "sent": (0.30, 0.50, 1.0),
        "paid": (0.15, 0.70, 0.40),
        "overdue": (0.90, 0.30, 0.25),
        "cancelled": (0.55, 0.55, 0.55),
    }
    sc = status_colors.get(invoice.status.value, mid_gray)
    badge_w = c.stringWidth(status_text, "Helvetica-Bold", 10) + 20
    badge_x = width - 40 - badge_w
    badge_y = height - 100
    c.setFillColorRGB(*sc)
    c.roundRect(badge_x, badge_y, badge_w, 22, 6, fill=1, stroke=0)
    c.setFillColorRGB(*white)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(badge_x + badge_w / 2, badge_y + 6, status_text)

    # Decorative line under header
    c.setStrokeColorRGB(*accent)
    c.setLineWidth(0.5)
    c.line(40, height - header_h + 10, width - 40, height - header_h + 10)

    # ===================== INVOICE META & BILL TO =====================
    meta_y = height - header_h - 20

    # Left: Bill To
    c.setFillColorRGB(*gold)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(40, meta_y, "BILL TO")

    c.setFillColorRGB(*white)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(40, meta_y - 18, customer.name if customer else "—")

    details_y = meta_y - 35
    c.setFont("Helvetica", 9)
    c.setFillColorRGB(*light_gray)
    if customer:
        if customer.address:
            c.drawString(40, details_y, customer.address)
            details_y -= 14
        city_country = ", ".join(filter(None, [customer.city, customer.country]))
        if city_country:
            c.drawString(40, details_y, city_country)
            details_y -= 14
        if customer.phone:
            c.drawString(40, details_y, f"Phone: {customer.phone}")
            details_y -= 14
        if customer.email:
            c.drawString(40, details_y, f"Email: {customer.email}")

    # Right: Invoice details
    right_x = width - 200
    c.setFillColorRGB(*gold)
    c.setFont("Helvetica-Bold", 9)
    c.drawString(right_x, meta_y, "INVOICE DETAILS")

    labels = ["Invoice Date:", "Due Date:", "Order #:"]
    inv_date = invoice.created_at.strftime("%B %d, %Y") if invoice.created_at else "—"
    due = invoice.due_date.strftime("%B %d, %Y") if invoice.due_date else "—"
    order_num = order.order_number if order else "—"
    values = [inv_date, due, order_num]

    for i, (label, val) in enumerate(zip(labels, values)):
        y_pos = meta_y - 18 - i * 18
        c.setFillColorRGB(*light_gray)
        c.setFont("Helvetica", 9)
        c.drawString(right_x, y_pos, label)
        c.setFillColorRGB(*white)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(right_x + 80, y_pos, val)

    # ===================== LINE ITEMS TABLE =====================
    table_top = meta_y - 100
    col_x = [40, 60, 310, 380, 460]  # #, Description, Qty, Unit Price, Total
    col_labels = ["#", "DESCRIPTION", "QTY", "UNIT PRICE", "TOTAL"]

    # Table header background
    c.setFillColorRGB(0.10, 0.10, 0.18)
    c.roundRect(30, table_top - 5, width - 60, 28, 6, fill=1, stroke=0)

    # Header text
    c.setFillColorRGB(*accent)
    c.setFont("Helvetica-Bold", 8)
    for i, label in enumerate(col_labels):
        if i >= 2:
            c.drawRightString(col_x[i] + 60, table_top + 5, label)
        else:
            c.drawString(col_x[i], table_top + 5, label)

    # Items
    row_y = table_top - 28
    c.setFont("Helvetica", 10)
    for idx, item in enumerate(items):
        product_name = item.product.name if item.product else f"Product #{item.product_id}"
        product_sku = item.product.sku if item.product else ""

        # Alternating row background
        if idx % 2 == 0:
            c.setFillColorRGB(0.09, 0.09, 0.16)
            c.rect(30, row_y - 6, width - 60, 28, fill=1, stroke=0)

        # Row text
        c.setFillColorRGB(*light_gray)
        c.setFont("Helvetica", 9)
        c.drawString(col_x[0], row_y + 4, str(idx + 1))
        c.setFillColorRGB(*white)
        c.setFont("Helvetica-Bold", 10)
        c.drawString(col_x[1], row_y + 4, product_name)
        if product_sku:
            c.setFillColorRGB(*mid_gray)
            c.setFont("Helvetica", 7)
            c.drawString(col_x[1], row_y - 8, f"SKU: {product_sku}")
        c.setFillColorRGB(*light_gray)
        c.setFont("Helvetica", 10)
        c.drawRightString(col_x[2] + 60, row_y + 4, str(item.quantity))
        c.drawRightString(col_x[3] + 60, row_y + 4, f"Rs.{item.unit_price:,.2f}")
        c.setFillColorRGB(*white)
        c.setFont("Helvetica-Bold", 10)
        c.drawRightString(col_x[4] + 60, row_y + 4, f"Rs.{item.total:,.2f}")

        row_y -= 32

    # Divider line
    row_y -= 5
    c.setStrokeColorRGB(0.25, 0.25, 0.35)
    c.setLineWidth(0.5)
    c.line(300, row_y + 8, width - 40, row_y + 8)

    # ===================== TOTALS SECTION =====================
    totals_x = 380
    totals_val_x = width - 40

    def draw_total_line(label: str, value: str, y: float, bold: bool = False, highlight: bool = False):
        if highlight:
            c.setFillColorRGB(*accent)
            c.roundRect(totals_x - 15, y - 6, totals_val_x - totals_x + 55, 28, 6, fill=1, stroke=0)
            c.setFillColorRGB(*white)
            c.setFont("Helvetica-Bold", 13)
        else:
            c.setFillColorRGB(*light_gray)
            c.setFont("Helvetica-Bold" if bold else "Helvetica", 10)
        c.drawString(totals_x, y + 2, label)
        if highlight:
            c.setFont("Helvetica-Bold", 14)
        c.drawRightString(totals_val_x, y + 2, value)

    row_y -= 8
    draw_total_line("Subtotal", f"Rs.{invoice.subtotal:,.2f}", row_y)
    row_y -= 22
    if invoice.tax > 0:
        draw_total_line("Tax", f"Rs.{invoice.tax:,.2f}", row_y)
        row_y -= 22
    if invoice.discount > 0:
        draw_total_line("Discount", f"- Rs.{invoice.discount:,.2f}", row_y)
        row_y -= 22
    row_y -= 8
    draw_total_line("TOTAL DUE", f"Rs.{invoice.total:,.2f}", row_y, bold=True, highlight=True)

    # ===================== NOTES SECTION =====================
    if invoice.notes:
        notes_y = row_y - 50
        c.setFillColorRGB(*gold)
        c.setFont("Helvetica-Bold", 9)
        c.drawString(40, notes_y, "NOTES")
        c.setFillColorRGB(*light_gray)
        c.setFont("Helvetica", 9)
        notes_lines = invoice.notes.split("\n")
        for i, line in enumerate(notes_lines[:4]):
            c.drawString(40, notes_y - 16 - i * 14, line)

    # ===================== FOOTER =====================
    footer_y = 60

    # Footer separator
    _draw_gradient_rect(c, 0, footer_y - 10, width, 2, accent, accent2)

    # Payment info
    c.setFillColorRGB(*gold)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(40, footer_y - 30, "PAYMENT INFORMATION")
    c.setFillColorRGB(*light_gray)
    c.setFont("Helvetica", 8)
    c.drawString(40, footer_y - 44, "Bank: Danluq Petro Industries Account")
    c.drawString(40, footer_y - 56, "Please include invoice number as reference")

    # Thank you
    c.setFillColorRGB(*mid_gray)
    c.setFont("Helvetica-Oblique", 9)
    c.drawCentredString(width / 2, 20, "Thank you for your business  •  Danluq Petro Industries")

    c.save()
    buf.seek(0)

    filename = f"{invoice.invoice_number}.pdf"
    return StreamingResponse(
        buf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )
