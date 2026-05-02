from datetime import datetime, timezone, timedelta

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.accounting import (
    Account, AccountType, Transaction, JournalEntry, JournalEntryStatus,
    Expense, PayableReceivable, PayableReceivableType, PayableReceivableStatus,
)
from app.models.order import Order
from app.models.user import User
from app.services.auth import get_current_user

router = APIRouter(prefix="/api/financial-reports", tags=["financial_reports"])


@router.get("/summary")
def financial_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total_revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(
        Order.status.notin_(["cancelled"])
    ).scalar()

    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).scalar()

    total_receivables = db.query(
        func.coalesce(func.sum(PayableReceivable.total_amount - PayableReceivable.paid_amount), 0)
    ).filter(
        PayableReceivable.type == PayableReceivableType.RECEIVABLE,
        PayableReceivable.status != PayableReceivableStatus.PAID,
    ).scalar()

    total_payables = db.query(
        func.coalesce(func.sum(PayableReceivable.total_amount - PayableReceivable.paid_amount), 0)
    ).filter(
        PayableReceivable.type == PayableReceivableType.PAYABLE,
        PayableReceivable.status != PayableReceivableStatus.PAID,
    ).scalar()

    cash_accounts = db.query(func.coalesce(func.sum(Account.balance), 0)).filter(
        Account.account_type == AccountType.ASSET,
        Account.code.like("1%"),
    ).scalar()

    return {
        "total_revenue": float(total_revenue),
        "total_expenses": float(total_expenses),
        "net_income": float(total_revenue) - float(total_expenses),
        "total_receivables": float(total_receivables),
        "total_payables": float(total_payables),
        "cash_balance": float(cash_accounts),
    }


@router.get("/profit-loss")
def profit_loss(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    revenue_entries = (
        db.query(Account.name, func.sum(JournalEntry.credit - JournalEntry.debit).label("amount"))
        .join(JournalEntry, JournalEntry.account_id == Account.id)
        .join(Transaction, Transaction.id == JournalEntry.transaction_id)
        .filter(
            Account.account_type == AccountType.REVENUE,
            Transaction.status == JournalEntryStatus.POSTED,
            Transaction.date >= start_date,
        )
        .group_by(Account.name)
        .all()
    )

    expense_entries = (
        db.query(Account.name, func.sum(JournalEntry.debit - JournalEntry.credit).label("amount"))
        .join(JournalEntry, JournalEntry.account_id == Account.id)
        .join(Transaction, Transaction.id == JournalEntry.transaction_id)
        .filter(
            Account.account_type == AccountType.EXPENSE,
            Transaction.status == JournalEntryStatus.POSTED,
            Transaction.date >= start_date,
        )
        .group_by(Account.name)
        .all()
    )

    direct_expenses = (
        db.query(Expense.category, func.sum(Expense.amount).label("amount"))
        .filter(Expense.date >= start_date)
        .group_by(Expense.category)
        .all()
    )

    order_revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(
        Order.status.notin_(["cancelled"]),
        Order.created_at >= start_date,
    ).scalar()

    rev_items = [{"name": r[0], "amount": float(r[1])} for r in revenue_entries]
    if float(order_revenue) > 0:
        rev_items.append({"name": "Sales Revenue", "amount": float(order_revenue)})
    total_revenue = sum(r["amount"] for r in rev_items)

    exp_items = [{"name": e[0], "amount": float(e[1])} for e in expense_entries]
    for de in direct_expenses:
        exp_items.append({"name": de[0].value if hasattr(de[0], 'value') else str(de[0]), "amount": float(de[1])})
    total_expenses = sum(e["amount"] for e in exp_items)

    return {
        "period_start": start_date.isoformat(),
        "period_end": datetime.now(timezone.utc).isoformat(),
        "revenue_items": rev_items,
        "expense_items": exp_items,
        "total_revenue": total_revenue,
        "total_expenses": total_expenses,
        "gross_profit": total_revenue - total_expenses,
        "net_income": total_revenue - total_expenses,
    }


@router.get("/balance-sheet")
def balance_sheet(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    assets = db.query(Account).filter(
        Account.account_type == AccountType.ASSET, Account.is_active == True
    ).all()
    liabilities = db.query(Account).filter(
        Account.account_type == AccountType.LIABILITY, Account.is_active == True
    ).all()
    equity = db.query(Account).filter(
        Account.account_type == AccountType.EQUITY, Account.is_active == True
    ).all()

    total_receivables = db.query(
        func.coalesce(func.sum(PayableReceivable.total_amount - PayableReceivable.paid_amount), 0)
    ).filter(
        PayableReceivable.type == PayableReceivableType.RECEIVABLE,
        PayableReceivable.status != PayableReceivableStatus.PAID,
    ).scalar()

    total_payables = db.query(
        func.coalesce(func.sum(PayableReceivable.total_amount - PayableReceivable.paid_amount), 0)
    ).filter(
        PayableReceivable.type == PayableReceivableType.PAYABLE,
        PayableReceivable.status != PayableReceivableStatus.PAID,
    ).scalar()

    asset_items = [{"name": a.name, "code": a.code, "balance": a.balance} for a in assets]
    if float(total_receivables) > 0:
        asset_items.append({"name": "Accounts Receivable", "code": "AR", "balance": float(total_receivables)})

    liability_items = [{"name": l.name, "code": l.code, "balance": l.balance} for l in liabilities]
    if float(total_payables) > 0:
        liability_items.append({"name": "Accounts Payable", "code": "AP", "balance": float(total_payables)})

    equity_items = [{"name": e.name, "code": e.code, "balance": e.balance} for e in equity]

    total_assets = sum(a["balance"] for a in asset_items)
    total_liabilities = sum(l["balance"] for l in liability_items)
    total_equity = sum(e["balance"] for e in equity_items)

    return {
        "as_of_date": datetime.now(timezone.utc).isoformat(),
        "assets": asset_items,
        "liabilities": liability_items,
        "equity": equity_items,
        "total_assets": total_assets,
        "total_liabilities": total_liabilities,
        "total_equity": total_equity,
    }


@router.get("/cash-flow")
def cash_flow(
    days: int = 30,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    sales_income = db.query(func.coalesce(func.sum(Order.total), 0)).filter(
        Order.status.notin_(["cancelled"]),
        Order.created_at >= start_date,
    ).scalar()

    payments_received = db.query(func.coalesce(func.sum(PayableReceivable.paid_amount), 0)).filter(
        PayableReceivable.type == PayableReceivableType.RECEIVABLE,
        PayableReceivable.created_at >= start_date,
    ).scalar()

    expenses_paid = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.is_paid == True,
        Expense.date >= start_date,
    ).scalar()

    supplier_payments = db.query(func.coalesce(func.sum(PayableReceivable.paid_amount), 0)).filter(
        PayableReceivable.type == PayableReceivableType.PAYABLE,
        PayableReceivable.created_at >= start_date,
    ).scalar()

    total_inflow = float(sales_income) + float(payments_received)
    total_outflow = float(expenses_paid) + float(supplier_payments)

    return {
        "period_start": start_date.isoformat(),
        "period_end": datetime.now(timezone.utc).isoformat(),
        "inflows": {
            "sales_income": float(sales_income),
            "payments_received": float(payments_received),
            "total": total_inflow,
        },
        "outflows": {
            "expenses_paid": float(expenses_paid),
            "supplier_payments": float(supplier_payments),
            "total": total_outflow,
        },
        "net_cash_flow": total_inflow - total_outflow,
    }
