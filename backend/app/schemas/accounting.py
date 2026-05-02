from datetime import datetime
from typing import Optional

from pydantic import BaseModel

from app.models.accounting import AccountType, JournalEntryStatus, ExpenseCategory, PayableReceivableType, PayableReceivableStatus


class AccountBase(BaseModel):
    code: str
    name: str
    account_type: AccountType
    description: Optional[str] = None
    parent_id: Optional[int] = None


class AccountCreate(AccountBase):
    pass


class AccountUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None
    parent_id: Optional[int] = None


class AccountResponse(AccountBase):
    id: int
    is_active: bool
    balance: float
    created_at: datetime

    class Config:
        from_attributes = True


class JournalEntryBase(BaseModel):
    account_id: int
    debit: float = 0.0
    credit: float = 0.0
    description: Optional[str] = None


class JournalEntryResponse(JournalEntryBase):
    id: int
    account_name: Optional[str] = None

    class Config:
        from_attributes = True


class TransactionCreate(BaseModel):
    date: Optional[datetime] = None
    description: str
    entries: list[JournalEntryBase]


class TransactionUpdate(BaseModel):
    status: Optional[JournalEntryStatus] = None
    description: Optional[str] = None


class TransactionResponse(BaseModel):
    id: int
    reference: str
    date: datetime
    description: str
    status: JournalEntryStatus
    created_by: Optional[int] = None
    created_at: datetime
    entries: list[JournalEntryResponse] = []

    class Config:
        from_attributes = True


class ExpenseCreate(BaseModel):
    date: Optional[datetime] = None
    category: ExpenseCategory
    description: str
    amount: float
    reference: Optional[str] = None
    account_id: Optional[int] = None
    supplier_id: Optional[int] = None
    is_paid: bool = False


class ExpenseUpdate(BaseModel):
    category: Optional[ExpenseCategory] = None
    description: Optional[str] = None
    amount: Optional[float] = None
    reference: Optional[str] = None
    account_id: Optional[int] = None
    supplier_id: Optional[int] = None
    is_paid: Optional[bool] = None


class ExpenseResponse(BaseModel):
    id: int
    date: datetime
    category: ExpenseCategory
    description: str
    amount: float
    reference: Optional[str] = None
    account_id: Optional[int] = None
    supplier_id: Optional[int] = None
    is_paid: bool
    paid_date: Optional[datetime] = None
    created_at: datetime
    supplier_name: Optional[str] = None
    account_name: Optional[str] = None

    class Config:
        from_attributes = True


class PayableReceivableCreate(BaseModel):
    type: PayableReceivableType
    party_name: str
    description: Optional[str] = None
    total_amount: float
    due_date: Optional[datetime] = None
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    order_id: Optional[int] = None
    purchase_order_id: Optional[int] = None


class PayableReceivableUpdate(BaseModel):
    status: Optional[PayableReceivableStatus] = None
    paid_amount: Optional[float] = None
    due_date: Optional[datetime] = None
    description: Optional[str] = None


class PayableReceivableResponse(BaseModel):
    id: int
    type: PayableReceivableType
    reference: Optional[str] = None
    party_name: str
    description: Optional[str] = None
    total_amount: float
    paid_amount: float
    balance: Optional[float] = None
    due_date: Optional[datetime] = None
    status: PayableReceivableStatus
    customer_id: Optional[int] = None
    supplier_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class FinancialSummary(BaseModel):
    total_revenue: float
    total_expenses: float
    net_income: float
    total_receivables: float
    total_payables: float
    cash_balance: float


class ProfitLossReport(BaseModel):
    period_start: datetime
    period_end: datetime
    revenue_items: list[dict]
    expense_items: list[dict]
    total_revenue: float
    total_expenses: float
    gross_profit: float
    net_income: float


class BalanceSheetReport(BaseModel):
    as_of_date: datetime
    assets: list[dict]
    liabilities: list[dict]
    equity: list[dict]
    total_assets: float
    total_liabilities: float
    total_equity: float
