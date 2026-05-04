from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.database import get_db
from app.models.hr import Employee, PayrollRecord, PayrollStatus, EmploymentStatus
from app.models.user import User, UserRole
from app.schemas.hr import PayrollCreate, PayrollUpdate, PayrollResponse, PayrollBatchCreate, PayrollSummary
from app.services.auth import get_current_user, require_role

router = APIRouter(prefix="/api/payroll", tags=["payroll"])


def build_payroll_response(record: PayrollRecord) -> dict:
    return {
        "id": record.id,
        "employee_id": record.employee_id,
        "employee_name": record.employee.full_name if record.employee else None,
        "employee_code": record.employee.employee_id if record.employee else None,
        "department": record.employee.department.value if record.employee else None,
        "position": record.employee.position if record.employee else None,
        "month": record.month,
        "year": record.year,
        "base_salary": record.base_salary,
        "housing_allowance": record.housing_allowance,
        "transport_allowance": record.transport_allowance,
        "overtime_pay": record.overtime_pay,
        "other_allowances": record.other_allowances,
        "tax_deduction": record.tax_deduction,
        "pension_deduction": record.pension_deduction,
        "loan_deduction": record.loan_deduction,
        "advance_deduction": record.advance_deduction,
        "late_deduction": record.late_deduction,
        "other_deductions": record.other_deductions,
        "gross_salary": record.gross_salary,
        "total_deductions": record.total_deductions,
        "net_salary": record.net_salary,
        "status": record.status,
        "payment_date": record.payment_date,
        "notes": record.notes,
        "created_at": record.created_at,
    }


@router.get("/", response_model=list[PayrollResponse])
def list_payroll(
    month: int = None,
    year: int = None,
    status: str = None,
    employee_id: int = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(PayrollRecord)
    if month:
        query = query.filter(PayrollRecord.month == month)
    if year:
        query = query.filter(PayrollRecord.year == year)
    if status:
        query = query.filter(PayrollRecord.status == status)
    if employee_id:
        query = query.filter(PayrollRecord.employee_id == employee_id)
    records = query.order_by(PayrollRecord.year.desc(), PayrollRecord.month.desc()).offset(skip).limit(limit).all()
    return [build_payroll_response(r) for r in records]


@router.get("/summary", response_model=PayrollSummary)
def payroll_summary(
    month: int,
    year: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    records = db.query(PayrollRecord).filter(
        and_(PayrollRecord.month == month, PayrollRecord.year == year)
    ).all()
    paid_count = sum(1 for r in records if r.status == PayrollStatus.PAID)
    return {
        "month": month,
        "year": year,
        "total_employees": len(records),
        "total_gross": sum(r.gross_salary for r in records),
        "total_deductions": sum(r.total_deductions for r in records),
        "total_net": sum(r.net_salary for r in records),
        "paid_count": paid_count,
        "pending_count": len(records) - paid_count,
    }


@router.post("/", response_model=PayrollResponse)
def create_payroll(
    data: PayrollCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    employee = db.query(Employee).filter(Employee.id == data.employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    existing = db.query(PayrollRecord).filter(
        and_(
            PayrollRecord.employee_id == data.employee_id,
            PayrollRecord.month == data.month,
            PayrollRecord.year == data.year,
        )
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Payroll record already exists for this employee and period")

    gross = employee.base_salary + data.housing_allowance + data.transport_allowance + data.overtime_pay + data.other_allowances
    total_deductions = data.tax_deduction + data.pension_deduction + data.loan_deduction + data.advance_deduction + data.late_deduction + data.other_deductions
    net = gross - total_deductions

    record = PayrollRecord(
        employee_id=data.employee_id,
        month=data.month,
        year=data.year,
        base_salary=employee.base_salary,
        housing_allowance=data.housing_allowance,
        transport_allowance=data.transport_allowance,
        overtime_pay=data.overtime_pay,
        other_allowances=data.other_allowances,
        tax_deduction=data.tax_deduction,
        pension_deduction=data.pension_deduction,
        loan_deduction=data.loan_deduction,
        advance_deduction=data.advance_deduction,
        late_deduction=data.late_deduction,
        other_deductions=data.other_deductions,
        gross_salary=gross,
        total_deductions=total_deductions,
        net_salary=net,
        created_by=current_user.id,
        notes=data.notes,
    )
    db.add(record)
    db.commit()
    db.refresh(record)
    return build_payroll_response(record)


@router.post("/batch", response_model=list[PayrollResponse])
def batch_create_payroll(
    data: PayrollBatchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT)),
):
    active_employees = db.query(Employee).filter(Employee.status == EmploymentStatus.ACTIVE).all()
    if not active_employees:
        raise HTTPException(status_code=400, detail="No active employees found")

    created = []
    for emp in active_employees:
        existing = db.query(PayrollRecord).filter(
            and_(
                PayrollRecord.employee_id == emp.id,
                PayrollRecord.month == data.month,
                PayrollRecord.year == data.year,
            )
        ).first()
        if existing:
            continue

        gross = emp.base_salary
        record = PayrollRecord(
            employee_id=emp.id,
            month=data.month,
            year=data.year,
            base_salary=emp.base_salary,
            gross_salary=gross,
            total_deductions=0.0,
            net_salary=gross,
            created_by=current_user.id,
        )
        db.add(record)
        created.append(record)

    db.commit()
    for r in created:
        db.refresh(r)
    return [build_payroll_response(r) for r in created]


@router.put("/{record_id}", response_model=PayrollResponse)
def update_payroll(
    record_id: int,
    data: PayrollUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT, UserRole.MANAGER)),
):
    record = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    update_data = data.model_dump(exclude_unset=True)

    if "status" in update_data and update_data["status"] == PayrollStatus.PAID.value:
        update_data["payment_date"] = datetime.now(timezone.utc)

    for key, value in update_data.items():
        setattr(record, key, value)

    gross = record.base_salary + record.housing_allowance + record.transport_allowance + record.overtime_pay + record.other_allowances
    total_deductions = record.tax_deduction + record.pension_deduction + record.loan_deduction + record.advance_deduction + record.late_deduction + record.other_deductions
    record.gross_salary = gross
    record.total_deductions = total_deductions
    record.net_salary = gross - total_deductions

    db.commit()
    db.refresh(record)
    return build_payroll_response(record)


@router.delete("/{record_id}")
def delete_payroll(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role(UserRole.ADMIN, UserRole.ACCOUNTANT)),
):
    record = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found")
    if record.status == PayrollStatus.PAID:
        raise HTTPException(status_code=400, detail="Cannot delete a paid payroll record")
    db.delete(record)
    db.commit()
    return {"detail": "Payroll record deleted"}


@router.get("/{record_id}/slip")
def get_salary_slip(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(PayrollRecord).filter(PayrollRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Payroll record not found")

    emp = record.employee
    month_names = ["", "January", "February", "March", "April", "May", "June",
                   "July", "August", "September", "October", "November", "December"]

    return {
        "company": "Danluq Petro Industries",
        "period": f"{month_names[record.month]} {record.year}",
        "employee": {
            "id": emp.employee_id,
            "name": emp.full_name,
            "department": emp.department.value,
            "position": emp.position,
            "bank_name": emp.bank_name,
            "bank_account": emp.bank_account,
        },
        "earnings": {
            "base_salary": record.base_salary,
            "housing_allowance": record.housing_allowance,
            "transport_allowance": record.transport_allowance,
            "overtime_pay": record.overtime_pay,
            "other_allowances": record.other_allowances,
        },
        "deductions": {
            "tax": record.tax_deduction,
            "pension": record.pension_deduction,
            "loan": record.loan_deduction,
            "advance": record.advance_deduction,
            "late": record.late_deduction,
            "other": record.other_deductions,
        },
        "gross_salary": record.gross_salary,
        "total_deductions": record.total_deductions,
        "net_salary": record.net_salary,
        "status": record.status.value,
        "payment_date": record.payment_date.isoformat() if record.payment_date else None,
    }
