import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.accounting import Transaction, JournalEntry, JournalEntryStatus, Account
from app.models.user import User, UserRole
from app.schemas.accounting import TransactionCreate, TransactionUpdate, TransactionResponse
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/transactions", tags=["transactions"])


@router.get("/", response_model=list[TransactionResponse])
def list_transactions(
    status: str = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Transaction)
    if status:
        query = query.filter(Transaction.status == status)
    transactions = query.order_by(Transaction.date.desc()).offset(skip).limit(limit).all()
    result = []
    for txn in transactions:
        entries = []
        for entry in txn.entries:
            entries.append({
                "id": entry.id,
                "account_id": entry.account_id,
                "debit": entry.debit,
                "credit": entry.credit,
                "description": entry.description,
                "account_name": entry.account.name if entry.account else None,
            })
        result.append({
            "id": txn.id,
            "reference": txn.reference,
            "date": txn.date,
            "description": txn.description,
            "status": txn.status,
            "created_by": txn.created_by,
            "created_at": txn.created_at,
            "entries": entries,
        })
    return result


@router.post("/", response_model=TransactionResponse)
def create_transaction(
    data: TransactionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    total_debits = sum(e.debit for e in data.entries)
    total_credits = sum(e.credit for e in data.entries)
    if abs(total_debits - total_credits) > 0.01:
        raise HTTPException(status_code=400, detail=f"Debits ({total_debits}) must equal credits ({total_credits})")
    if len(data.entries) < 2:
        raise HTTPException(status_code=400, detail="At least 2 journal entries required")

    ref = f"TXN-{uuid.uuid4().hex[:8].upper()}"
    txn = Transaction(
        reference=ref,
        date=data.date or datetime.now(timezone.utc),
        description=data.description,
        created_by=current_user.id,
    )
    db.add(txn)
    db.flush()

    for entry_data in data.entries:
        account = db.query(Account).filter(Account.id == entry_data.account_id).first()
        if not account:
            raise HTTPException(status_code=400, detail=f"Account {entry_data.account_id} not found")
        entry = JournalEntry(
            transaction_id=txn.id,
            account_id=entry_data.account_id,
            debit=entry_data.debit,
            credit=entry_data.credit,
            description=entry_data.description,
        )
        db.add(entry)

    db.commit()
    db.refresh(txn)
    entries = []
    for entry in txn.entries:
        entries.append({
            "id": entry.id,
            "account_id": entry.account_id,
            "debit": entry.debit,
            "credit": entry.credit,
            "description": entry.description,
            "account_name": entry.account.name if entry.account else None,
        })
    return {
        "id": txn.id,
        "reference": txn.reference,
        "date": txn.date,
        "description": txn.description,
        "status": txn.status,
        "created_by": txn.created_by,
        "created_at": txn.created_at,
        "entries": entries,
    }


@router.put("/{txn_id}", response_model=TransactionResponse)
def update_transaction(
    txn_id: int,
    data: TransactionUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT)),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")

    if data.status == JournalEntryStatus.POSTED and txn.status == JournalEntryStatus.DRAFT:
        for entry in txn.entries:
            account = entry.account
            if account.account_type in ("asset", "expense"):
                account.balance += entry.debit - entry.credit
            else:
                account.balance += entry.credit - entry.debit

    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(txn, key, value)
    db.commit()
    db.refresh(txn)
    entries = []
    for entry in txn.entries:
        entries.append({
            "id": entry.id,
            "account_id": entry.account_id,
            "debit": entry.debit,
            "credit": entry.credit,
            "description": entry.description,
            "account_name": entry.account.name if entry.account else None,
        })
    return {
        "id": txn.id,
        "reference": txn.reference,
        "date": txn.date,
        "description": txn.description,
        "status": txn.status,
        "created_by": txn.created_by,
        "created_at": txn.created_at,
        "entries": entries,
    }


@router.delete("/{txn_id}")
def delete_transaction(
    txn_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    txn = db.query(Transaction).filter(Transaction.id == txn_id).first()
    if not txn:
        raise HTTPException(status_code=404, detail="Transaction not found")
    if txn.status == JournalEntryStatus.POSTED:
        raise HTTPException(status_code=400, detail="Cannot delete posted transaction")
    db.delete(txn)
    db.commit()
    return {"detail": "Transaction deleted"}
