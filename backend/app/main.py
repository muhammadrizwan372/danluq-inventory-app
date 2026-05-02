import os
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

from app.config import settings
from app.database import Base, engine
from app.models.user import User, UserRole
from app.models.product import Product, Category
from app.models.customer import Customer
from app.models.supplier import Supplier
from app.models.order import Order, OrderItem
from app.models.purchase_order import PurchaseOrder, PurchaseOrderItem
from app.models.invoice import Invoice
from app.models.accounting import Account, AccountType, Transaction, JournalEntry, Expense, PayableReceivable
from app.routers import (
    auth,
    users,
    products,
    customers,
    suppliers,
    orders,
    purchase_orders,
    invoices,
    dashboard,
    reports,
)
from app.routers import accounts, transactions, expenses, payables_receivables, financial_reports
from app.services.auth import get_password_hash
from app.database import SessionLocal

app = FastAPI(title=settings.APP_NAME, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(users.router)
app.include_router(products.router)
app.include_router(customers.router)
app.include_router(suppliers.router)
app.include_router(orders.router)
app.include_router(purchase_orders.router)
app.include_router(invoices.router)
app.include_router(dashboard.router)
app.include_router(reports.router)
app.include_router(accounts.router)
app.include_router(transactions.router)
app.include_router(expenses.router)
app.include_router(payables_receivables.router)
app.include_router(financial_reports.router)

DEFAULT_ACCOUNTS = [
    ("1000", "Cash", AccountType.ASSET),
    ("1100", "Bank Account", AccountType.ASSET),
    ("1200", "Accounts Receivable", AccountType.ASSET),
    ("1300", "Inventory", AccountType.ASSET),
    ("1400", "Prepaid Expenses", AccountType.ASSET),
    ("2000", "Accounts Payable", AccountType.LIABILITY),
    ("2100", "Accrued Expenses", AccountType.LIABILITY),
    ("2200", "Short-term Loans", AccountType.LIABILITY),
    ("2300", "Tax Payable", AccountType.LIABILITY),
    ("3000", "Owner's Equity", AccountType.EQUITY),
    ("3100", "Retained Earnings", AccountType.EQUITY),
    ("4000", "Sales Revenue", AccountType.REVENUE),
    ("4100", "Service Revenue", AccountType.REVENUE),
    ("4200", "Other Income", AccountType.REVENUE),
    ("5000", "Cost of Goods Sold", AccountType.EXPENSE),
    ("5100", "Salaries & Wages", AccountType.EXPENSE),
    ("5200", "Rent Expense", AccountType.EXPENSE),
    ("5300", "Utilities Expense", AccountType.EXPENSE),
    ("5400", "Transport & Logistics", AccountType.EXPENSE),
    ("5500", "Office Supplies", AccountType.EXPENSE),
    ("5600", "Insurance Expense", AccountType.EXPENSE),
    ("5700", "Marketing Expense", AccountType.EXPENSE),
    ("5800", "Maintenance & Repairs", AccountType.EXPENSE),
    ("5900", "Miscellaneous Expense", AccountType.EXPENSE),
]


@app.on_event("startup")
def on_startup():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@example.com").first()
        if not admin:
            admin = User(
                email="admin@example.com",
                full_name="System Admin",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
            )
            db.add(admin)
            db.commit()

        existing_accounts = db.query(Account).count()
        if existing_accounts == 0:
            for code, name, acct_type in DEFAULT_ACCOUNTS:
                db.add(Account(code=code, name=name, account_type=acct_type))
            db.commit()
    finally:
        db.close()


@app.get("/api/health")
def health_check():
    return {"status": "healthy", "app": settings.APP_NAME}


static_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "static")
if os.path.isdir(static_dir):
    app.mount("/assets", StaticFiles(directory=os.path.join(static_dir, "assets")), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(request: Request, full_path: str):
        if full_path.startswith("api"):
            from fastapi.responses import JSONResponse
            return JSONResponse(status_code=404, content={"detail": "Not found"})
        file_path = os.path.join(static_dir, full_path)
        if os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(static_dir, "index.html"))
