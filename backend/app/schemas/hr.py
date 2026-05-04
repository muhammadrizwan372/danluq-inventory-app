from datetime import datetime, date
from typing import Optional

from pydantic import BaseModel

from app.models.hr import Department, EmploymentStatus, PayrollStatus


class EmployeeCreate(BaseModel):
    employee_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Department
    position: str
    date_joined: date
    base_salary: float
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    user_id: Optional[int] = None


class EmployeeUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Optional[Department] = None
    position: Optional[str] = None
    base_salary: Optional[float] = None
    status: Optional[EmploymentStatus] = None
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    user_id: Optional[int] = None


class EmployeeResponse(BaseModel):
    id: int
    employee_id: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    department: Department
    position: str
    date_joined: date
    status: EmploymentStatus
    base_salary: float
    bank_name: Optional[str] = None
    bank_account: Optional[str] = None
    address: Optional[str] = None
    emergency_contact: Optional[str] = None
    user_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollCreate(BaseModel):
    employee_id: int
    month: int
    year: int
    housing_allowance: float = 0.0
    transport_allowance: float = 0.0
    overtime_pay: float = 0.0
    other_allowances: float = 0.0
    tax_deduction: float = 0.0
    pension_deduction: float = 0.0
    loan_deduction: float = 0.0
    advance_deduction: float = 0.0
    late_deduction: float = 0.0
    other_deductions: float = 0.0
    notes: Optional[str] = None


class PayrollUpdate(BaseModel):
    housing_allowance: Optional[float] = None
    transport_allowance: Optional[float] = None
    overtime_pay: Optional[float] = None
    other_allowances: Optional[float] = None
    tax_deduction: Optional[float] = None
    pension_deduction: Optional[float] = None
    loan_deduction: Optional[float] = None
    advance_deduction: Optional[float] = None
    late_deduction: Optional[float] = None
    other_deductions: Optional[float] = None
    status: Optional[PayrollStatus] = None
    notes: Optional[str] = None


class PayrollResponse(BaseModel):
    id: int
    employee_id: int
    employee_name: Optional[str] = None
    employee_code: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    month: int
    year: int
    base_salary: float
    housing_allowance: float
    transport_allowance: float
    overtime_pay: float
    other_allowances: float
    tax_deduction: float
    pension_deduction: float
    loan_deduction: float
    advance_deduction: float
    late_deduction: float
    other_deductions: float
    gross_salary: float
    total_deductions: float
    net_salary: float
    status: PayrollStatus
    payment_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class PayrollBatchCreate(BaseModel):
    month: int
    year: int


class PayrollSummary(BaseModel):
    month: int
    year: int
    total_employees: int
    total_gross: float
    total_deductions: float
    total_net: float
    paid_count: int
    pending_count: int
