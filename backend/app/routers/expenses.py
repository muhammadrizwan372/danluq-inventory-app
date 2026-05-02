from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.accounting import Expense
from app.models.user import User, UserRole
from app.schemas.accounting import ExpenseCreate, ExpenseUpdate, ExpenseResponse
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/expenses", tags=["expenses"])


@router.get("/", response_model=list[ExpenseResponse])
def list_expenses(
    category: str = None,
    paid: bool = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Expense)
    if category:
        query = query.filter(Expense.category == category)
    if paid is not None:
        query = query.filter(Expense.is_paid == paid)
    expenses = query.order_by(Expense.date.desc()).offset(skip).limit(limit).all()
    result = []
    for exp in expenses:
        result.append({
            "id": exp.id,
            "date": exp.date,
            "category": exp.category,
            "description": exp.description,
            "amount": exp.amount,
            "reference": exp.reference,
            "account_id": exp.account_id,
            "supplier_id": exp.supplier_id,
            "is_paid": exp.is_paid,
            "paid_date": exp.paid_date,
            "created_at": exp.created_at,
            "supplier_name": exp.supplier.name if exp.supplier else None,
            "account_name": exp.account.name if exp.account else None,
        })
    return result


@router.post("/", response_model=ExpenseResponse)
def create_expense(
    data: ExpenseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    expense = Expense(
        date=data.date or datetime.now(timezone.utc),
        category=data.category,
        description=data.description,
        amount=data.amount,
        reference=data.reference,
        account_id=data.account_id,
        supplier_id=data.supplier_id,
        is_paid=data.is_paid,
        paid_date=datetime.now(timezone.utc) if data.is_paid else None,
        created_by=current_user.id,
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)
    return {
        "id": expense.id,
        "date": expense.date,
        "category": expense.category,
        "description": expense.description,
        "amount": expense.amount,
        "reference": expense.reference,
        "account_id": expense.account_id,
        "supplier_id": expense.supplier_id,
        "is_paid": expense.is_paid,
        "paid_date": expense.paid_date,
        "created_at": expense.created_at,
        "supplier_name": expense.supplier.name if expense.supplier else None,
        "account_name": expense.account.name if expense.account else None,
    }


@router.put("/{expense_id}", response_model=ExpenseResponse)
def update_expense(
    expense_id: int,
    data: ExpenseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    update_data = data.model_dump(exclude_unset=True)
    if "is_paid" in update_data and update_data["is_paid"] and not expense.is_paid:
        update_data["paid_date"] = datetime.now(timezone.utc)
    for key, value in update_data.items():
        setattr(expense, key, value)
    db.commit()
    db.refresh(expense)
    return {
        "id": expense.id,
        "date": expense.date,
        "category": expense.category,
        "description": expense.description,
        "amount": expense.amount,
        "reference": expense.reference,
        "account_id": expense.account_id,
        "supplier_id": expense.supplier_id,
        "is_paid": expense.is_paid,
        "paid_date": expense.paid_date,
        "created_at": expense.created_at,
        "supplier_name": expense.supplier.name if expense.supplier else None,
        "account_name": expense.account.name if expense.account else None,
    }


@router.delete("/{expense_id}")
def delete_expense(
    expense_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT)),
):
    expense = db.query(Expense).filter(Expense.id == expense_id).first()
    if not expense:
        raise HTTPException(status_code=404, detail="Expense not found")
    db.delete(expense)
    db.commit()
    return {"detail": "Expense deleted"}
