from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.electricity import ElectricityLog, ElectricityDepartment
from app.models.user import User
from app.schemas.electricity import (
    ElectricityLogCreate,
    ElectricityLogResponse,
    ElectricityLogUpdate,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Electricity"])


@router.get("/electricity", response_model=List[ElectricityLogResponse])
def list_electricity_logs(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ElectricityLog).options(joinedload(ElectricityLog.departments))
    if start_date:
        query = query.filter(ElectricityLog.date >= start_date)
    if end_date:
        query = query.filter(ElectricityLog.date <= end_date)
    return query.order_by(ElectricityLog.date.desc()).all()


@router.post(
    "/electricity", response_model=ElectricityLogResponse, status_code=status.HTTP_201_CREATED
)
def create_electricity_log(
    data: ElectricityLogCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    existing = db.query(ElectricityLog).filter(ElectricityLog.date == data.date).first()
    if existing:
        raise HTTPException(status_code=400, detail="An electricity log already exists for this date")

    total_units = data.main_meter + data.solar
    total_cost = total_units * data.per_unit_price

    log = ElectricityLog(
        date=data.date,
        main_meter=data.main_meter,
        solar=data.solar,
        total_units=total_units,
        per_unit_price=data.per_unit_price,
        total_cost=total_cost,
        notes=data.notes,
    )
    db.add(log)
    db.flush()

    for dept in data.departments:
        db.add(ElectricityDepartment(log_id=log.id, **dept.model_dump()))

    db.commit()
    return (
        db.query(ElectricityLog)
        .options(joinedload(ElectricityLog.departments))
        .filter(ElectricityLog.id == log.id)
        .first()
    )


@router.put("/electricity/{log_id}", response_model=ElectricityLogResponse)
def update_electricity_log(
    log_id: int,
    data: ElectricityLogUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(ElectricityLog).filter(ElectricityLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Electricity log not found")

    if data.date is not None:
        existing = (
            db.query(ElectricityLog)
            .filter(ElectricityLog.date == data.date, ElectricityLog.id != log_id)
            .first()
        )
        if existing:
            raise HTTPException(status_code=400, detail="An electricity log already exists for this date")
        log.date = data.date

    if data.main_meter is not None:
        log.main_meter = data.main_meter
    if data.solar is not None:
        log.solar = data.solar
    if data.per_unit_price is not None:
        log.per_unit_price = data.per_unit_price
    if data.notes is not None:
        log.notes = data.notes

    log.total_units = log.main_meter + log.solar
    log.total_cost = log.total_units * log.per_unit_price

    if data.departments is not None:
        db.query(ElectricityDepartment).filter(ElectricityDepartment.log_id == log_id).delete()
        for dept in data.departments:
            db.add(ElectricityDepartment(log_id=log_id, **dept.model_dump()))

    db.commit()
    return (
        db.query(ElectricityLog)
        .options(joinedload(ElectricityLog.departments))
        .filter(ElectricityLog.id == log_id)
        .first()
    )


@router.delete("/electricity/{log_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_electricity_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = db.query(ElectricityLog).filter(ElectricityLog.id == log_id).first()
    if not log:
        raise HTTPException(status_code=404, detail="Electricity log not found")
    db.delete(log)
    db.commit()


@router.get("/electricity/{log_id}", response_model=ElectricityLogResponse)
def get_electricity_log(
    log_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    log = (
        db.query(ElectricityLog)
        .options(joinedload(ElectricityLog.departments))
        .filter(ElectricityLog.id == log_id)
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="Electricity log not found")
    return log
