import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.accounting import PayableReceivable, PayableReceivableStatus
from app.models.user import User, UserRole
from app.schemas.accounting import PayableReceivableCreate, PayableReceivableUpdate, PayableReceivableResponse
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/payables-receivables", tags=["payables_receivables"])


@router.get("/", response_model=list[PayableReceivableResponse])
def list_pr(
    type: str = None,
    status: str = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PayableReceivable)
    if type:
        query = query.filter(PayableReceivable.type == type)
    if status:
        query = query.filter(PayableReceivable.status == status)
    items = query.order_by(PayableReceivable.created_at.desc()).all()
    result = []
    for item in items:
        result.append({
            **{c.name: getattr(item, c.name) for c in item.__table__.columns},
            "balance": item.total_amount - item.paid_amount,
        })
    return result


@router.post("/", response_model=PayableReceivableResponse)
def create_pr(
    data: PayableReceivableCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    ref = f"{'AP' if data.type == 'payable' else 'AR'}-{uuid.uuid4().hex[:8].upper()}"
    pr = PayableReceivable(
        reference=ref,
        **data.model_dump(),
    )
    db.add(pr)
    db.commit()
    db.refresh(pr)
    return {
        **{c.name: getattr(pr, c.name) for c in pr.__table__.columns},
        "balance": pr.total_amount - pr.paid_amount,
    }


@router.put("/{pr_id}", response_model=PayableReceivableResponse)
def update_pr(
    pr_id: int,
    data: PayableReceivableUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    pr = db.query(PayableReceivable).filter(PayableReceivable.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Record not found")
    update_data = data.model_dump(exclude_unset=True)
    if "paid_amount" in update_data:
        if update_data["paid_amount"] >= pr.total_amount:
            update_data["status"] = PayableReceivableStatus.PAID
        elif update_data["paid_amount"] > 0:
            update_data["status"] = PayableReceivableStatus.PARTIAL
    for key, value in update_data.items():
        setattr(pr, key, value)
    db.commit()
    db.refresh(pr)
    return {
        **{c.name: getattr(pr, c.name) for c in pr.__table__.columns},
        "balance": pr.total_amount - pr.paid_amount,
    }


@router.delete("/{pr_id}")
def delete_pr(
    pr_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    pr = db.query(PayableReceivable).filter(PayableReceivable.id == pr_id).first()
    if not pr:
        raise HTTPException(status_code=404, detail="Record not found")
    db.delete(pr)
    db.commit()
    return {"detail": "Record deleted"}
