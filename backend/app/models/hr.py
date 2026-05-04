import enum
from datetime import datetime, timezone

from sqlalchemy import Column, Integer, String, Float, DateTime, Enum, ForeignKey, Text, Boolean, Date
from sqlalchemy.orm import relationship

from app.database import Base


class Department(str, enum.Enum):
    MANAGEMENT = "management"
    OPERATIONS = "operations"
    SALES = "sales"
    ACCOUNTS = "accounts"
    WAREHOUSE = "warehouse"
    LOGISTICS = "logistics"
    ADMIN = "admin"


class EmploymentStatus(str, enum.Enum):
    ACTIVE = "active"
    ON_LEAVE = "on_leave"
    TERMINATED = "terminated"
    RESIGNED = "resigned"


class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(String, unique=True, index=True, nullable=False)
    full_name = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=True)
    phone = Column(String, nullable=True)
    department = Column(Enum(Department), nullable=False)
    position = Column(String, nullable=False)
    date_joined = Column(Date, nullable=False)
    status = Column(Enum(EmploymentStatus), default=EmploymentStatus.ACTIVE)
    base_salary = Column(Float, nullable=False)
    bank_name = Column(String, nullable=True)
    bank_account = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    payroll_records = relationship("PayrollRecord", back_populates="employee", cascade="all, delete-orphan")


class PayrollStatus(str, enum.Enum):
    DRAFT = "draft"
    APPROVED = "approved"
    PAID = "paid"


class PayrollRecord(Base):
    __tablename__ = "payroll_records"

    id = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    month = Column(Integer, nullable=False)
    year = Column(Integer, nullable=False)
    base_salary = Column(Float, nullable=False)
    housing_allowance = Column(Float, default=0.0)
    transport_allowance = Column(Float, default=0.0)
    overtime_pay = Column(Float, default=0.0)
    other_allowances = Column(Float, default=0.0)
    tax_deduction = Column(Float, default=0.0)
    pension_deduction = Column(Float, default=0.0)
    loan_deduction = Column(Float, default=0.0)
    advance_deduction = Column(Float, default=0.0)
    late_deduction = Column(Float, default=0.0)
    other_deductions = Column(Float, default=0.0)
    gross_salary = Column(Float, nullable=False)
    total_deductions = Column(Float, nullable=False)
    net_salary = Column(Float, nullable=False)
    status = Column(Enum(PayrollStatus), default=PayrollStatus.DRAFT)
    payment_date = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    employee = relationship("Employee", back_populates="payroll_records")
