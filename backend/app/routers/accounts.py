from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.accounting import Account
from app.models.user import User, UserRole
from app.schemas.accounting import AccountCreate, AccountUpdate, AccountResponse
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/accounts", tags=["accounts"])


@router.get("/", response_model=list[AccountResponse])
def list_accounts(
    account_type: str = None,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Account)
    if account_type:
        query = query.filter(Account.account_type == account_type)
    if active_only:
        query = query.filter(Account.is_active == True)
    return query.order_by(Account.code).all()


@router.post("/", response_model=AccountResponse)
def create_account(
    data: AccountCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT)),
):
    existing = db.query(Account).filter(Account.code == data.code).first()
    if existing:
        raise HTTPException(status_code=400, detail="Account code already exists")
    account = Account(**data.model_dump())
    db.add(account)
    db.commit()
    db.refresh(account)
    return account


@router.get("/{account_id}", response_model=AccountResponse)
def get_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    return account


@router.put("/{account_id}", response_model=AccountResponse)
def update_account(
    account_id: int,
    data: AccountUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT)),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(account, key, value)
    db.commit()
    db.refresh(account)
    return account


@router.delete("/{account_id}")
def delete_account(
    account_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN)),
):
    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")
    db.delete(account)
    db.commit()
    return {"detail": "Account deleted"}
