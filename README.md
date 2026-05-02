# Danluq Petro Industries - Business Management System

A comprehensive web-based business management system built for Danluq Petro Industries, featuring inventory management, accounting & financial management, order processing, and reporting.

## Features

### Inventory Management
- Product tracking with SKUs, categories, pricing, and stock levels
- Automated low-stock alerts with configurable reorder levels
- Category management (Lubricants, Fuel Products, Industrial Chemicals, Equipment & Parts, Safety Gear)

### Order & Sales Management
- Customer order creation with line items
- Order status workflow: Pending → Confirmed → Processing → Shipped → Delivered
- Automatic inventory deduction on order confirmation
- Invoice generation from orders

### Supplier & Purchase Management
- Supplier directory with contact details
- Purchase order creation and tracking
- Automatic stock increase on PO receipt

### Accounting & Financial Management
- **Chart of Accounts** — 25 pre-seeded accounts (Assets, Liabilities, Equity, Revenue, Expenses)
- **Journal Entries** — Double-entry bookkeeping with debit/credit validation
- **Expense Tracking** — 9 categories with paid/unpaid status tracking
- **Accounts Payable/Receivable** — AP/AR tracking with partial payment recording
- **Financial Reports** — Summary, Profit & Loss, Balance Sheet, Cash Flow (7D/30D/90D/1Y periods)

### User Management
- Role-based access control (Admin, Manager, Accountant, Inventory Manager, Staff)
- Support for 3-4 concurrent users
- User activation/deactivation

### Reports & Dashboards
- Executive dashboard with key metrics
- Sales summary and trends
- Stock level reports
- Top selling products
- Sales by category

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS v4 |
| Backend | Python + FastAPI + SQLAlchemy 2.0 |
| Database | SQLite (upgradeable to PostgreSQL) |
| Auth | JWT-based with role-based access control |

## Getting Started

### Prerequisites
- Python 3.12+
- Node.js 18+
- npm

### Backend Setup

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

### Production Build

```bash
cd frontend
npm run build
cp -r dist/* ../backend/static/
# Restart backend — it serves the built frontend automatically
```

### Seed Demo Data

```bash
cd backend
source venv/bin/activate
pip install requests
python seed_demo_data.py
```

## Default Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Accountant | accountant@danluq.com | account123 |
| Inventory Manager | inventory@danluq.com | inventory123 |
| Manager | manager@danluq.com | manager123 |

> **Note:** Change these passwords in production!

## Project Structure

```
inventory-management-system/
├── backend/
│   ├── app/
│   │   ├── models/        # SQLAlchemy models
│   │   ├── routers/       # API endpoints
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── config.py      # App configuration
│   │   ├── database.py    # Database setup
│   │   └── main.py        # FastAPI app entry
│   ├── static/            # Built frontend (production)
│   ├── seed_demo_data.py  # Demo data seeder
│   └── requirements.txt   # Python dependencies
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── api/           # API client
│   │   └── context/       # React context (auth)
│   ├── package.json
│   └── vite.config.ts
└── README.md
```

## API Documentation

Once running, visit `http://localhost:8000/docs` for interactive Swagger API documentation.

## License

Proprietary — Danluq Petro Industries
