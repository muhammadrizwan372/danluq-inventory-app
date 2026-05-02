import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship

from app.database import Base


class AccountType(str, enum.Enum):
    ASSET = "asset"
    LIABILITY = "liability"
    EQUITY = "equity"
    REVENUE = "revenue"
    EXPENSE = "expense"


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    account_type = Column(Enum(AccountType), nullable=False)
    description = Column(Text)
    parent_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    balance = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    parent = relationship("Account", remote_side=[id], backref="children")
    entries = relationship("JournalEntry", back_populates="account")


class JournalEntryStatus(str, enum.Enum):
    DRAFT = "draft"
    POSTED = "posted"
    REVERSED = "reversed"


class Transaction(Base):
    __tablename__ = "transactions"

    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String, unique=True, index=True, nullable=False)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    description = Column(Text, nullable=False)
    status = Column(Enum(JournalEntryStatus), default=JournalEntryStatus.DRAFT)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    entries = relationship("JournalEntry", back_populates="transaction", cascade="all, delete-orphan")


class JournalEntry(Base):
    __tablename__ = "journal_entries"

    id = Column(Integer, primary_key=True, index=True)
    transaction_id = Column(Integer, ForeignKey("transactions.id"), nullable=False)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=False)
    debit = Column(Float, default=0.0)
    credit = Column(Float, default=0.0)
    description = Column(Text)

    transaction = relationship("Transaction", back_populates="entries")
    account = relationship("Account", back_populates="entries")


class ExpenseCategory(str, enum.Enum):
    UTILITIES = "utilities"
    RENT = "rent"
    SALARIES = "salaries"
    TRANSPORT = "transport"
    SUPPLIES = "supplies"
    MAINTENANCE = "maintenance"
    INSURANCE = "insurance"
    MARKETING = "marketing"
    OTHER = "other"


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    category = Column(Enum(ExpenseCategory), nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)
    reference = Column(String)
    account_id = Column(Integer, ForeignKey("accounts.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    is_paid = Column(Boolean, default=False)
    paid_date = Column(DateTime, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"))
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    account = relationship("Account")
    supplier = relationship("Supplier")


class PayableReceivableType(str, enum.Enum):
    PAYABLE = "payable"
    RECEIVABLE = "receivable"


class PayableReceivableStatus(str, enum.Enum):
    PENDING = "pending"
    PARTIAL = "partial"
    PAID = "paid"
    OVERDUE = "overdue"


class PayableReceivable(Base):
    __tablename__ = "payables_receivables"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(Enum(PayableReceivableType), nullable=False)
    reference = Column(String, index=True)
    party_name = Column(String, nullable=False)
    description = Column(Text)
    total_amount = Column(Float, nullable=False)
    paid_amount = Column(Float, default=0.0)
    due_date = Column(DateTime, nullable=True)
    status = Column(Enum(PayableReceivableStatus), default=PayableReceivableStatus.PENDING)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=True)
    purchase_order_id = Column(Integer, ForeignKey("purchase_orders.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    customer = relationship("Customer")
    supplier = relationship("Supplier")
