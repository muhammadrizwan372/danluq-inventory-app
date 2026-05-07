from typing import List, Optional
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

from app.database import get_db
from app.models.production import ProductionRecord
from app.models.product import Product
from app.models.user import User
from app.schemas.production import (
    ProductionRecordCreate,
    ProductionRecordResponse,
    ProductionRecordUpdate,
    DailyProductionSummary,
)
from app.services.auth import get_current_user

router = APIRouter(prefix="/api", tags=["Production"])


@router.get("/production", response_model=List[ProductionRecordResponse])
def list_production_records(
    date_filter: Optional[date] = Query(None, alias="date"),
    shift: Optional[str] = Query(None),
    product_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProductionRecord).options(joinedload(ProductionRecord.product))
    if date_filter:
        query = query.filter(ProductionRecord.date == date_filter)
    if shift:
        query = query.filter(ProductionRecord.shift == shift)
    if product_id:
        query = query.filter(ProductionRecord.product_id == product_id)
    return query.order_by(ProductionRecord.date.desc(), ProductionRecord.shift).all()


@router.post(
    "/production", response_model=ProductionRecordResponse, status_code=status.HTTP_201_CREATED
)
def create_production_record(
    data: ProductionRecordCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if data.shift not in ("day", "night"):
        raise HTTPException(status_code=400, detail="Shift must be 'day' or 'night'")
    product = db.query(Product).filter(Product.id == data.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    record = ProductionRecord(**data.model_dump())
    db.add(record)
    db.commit()
    db.refresh(record)
    return (
        db.query(ProductionRecord)
        .options(joinedload(ProductionRecord.product))
        .filter(ProductionRecord.id == record.id)
        .first()
    )


@router.put("/production/{record_id}", response_model=ProductionRecordResponse)
def update_production_record(
    record_id: int,
    data: ProductionRecordUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(ProductionRecord).filter(ProductionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    update_data = data.model_dump(exclude_unset=True)
    if "shift" in update_data and update_data["shift"] not in ("day", "night"):
        raise HTTPException(status_code=400, detail="Shift must be 'day' or 'night'")
    for key, value in update_data.items():
        setattr(record, key, value)
    db.commit()
    db.refresh(record)
    return (
        db.query(ProductionRecord)
        .options(joinedload(ProductionRecord.product))
        .filter(ProductionRecord.id == record.id)
        .first()
    )


@router.delete("/production/{record_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_production_record(
    record_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    record = db.query(ProductionRecord).filter(ProductionRecord.id == record_id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Production record not found")
    db.delete(record)
    db.commit()


@router.get("/production/summary", response_model=List[DailyProductionSummary])
def production_summary(
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(ProductionRecord)
    if start_date:
        query = query.filter(ProductionRecord.date >= start_date)
    if end_date:
        query = query.filter(ProductionRecord.date <= end_date)
    records = query.order_by(ProductionRecord.date.desc()).all()

    daily: dict = {}
    for r in records:
        d = r.date
        if d not in daily:
            daily[d] = {
                "date": d,
                "day_total_kg": 0.0,
                "night_total_kg": 0.0,
                "total_kg": 0.0,
                "day_waste_kg": 0.0,
                "night_waste_kg": 0.0,
                "total_waste_kg": 0.0,
                "day_records": 0,
                "night_records": 0,
            }
        if r.shift == "day":
            daily[d]["day_total_kg"] += r.quantity_kg
            daily[d]["day_waste_kg"] += r.waste_kg
            daily[d]["day_records"] += 1
        else:
            daily[d]["night_total_kg"] += r.quantity_kg
            daily[d]["night_waste_kg"] += r.waste_kg
            daily[d]["night_records"] += 1
        daily[d]["total_kg"] += r.quantity_kg
        daily[d]["total_waste_kg"] += r.waste_kg

    return sorted(daily.values(), key=lambda x: x["date"], reverse=True)
