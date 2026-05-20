from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User
from app.services.auth import get_current_user
from app.services.analytics_engine import (
    predict_production,
    predict_electricity_costs,
    predict_inventory_shortages,
    forecast_monthly_profit,
    production_efficiency,
    generate_ai_recommendations,
    department_wise_electricity,
    expense_analytics,
    get_performance_comparison,
    machine_wise_production,
    hourly_production_tracking,
    downtime_analysis,
    peak_load_analytics,
    cost_per_product,
    employee_efficiency_analysis,
    management_report,
)

router = APIRouter(prefix="/api/analytics", tags=["Analytics & AI"])


@router.get("/predict/production")
def api_predict_production(
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return predict_production(db, days_ahead)


@router.get("/predict/electricity")
def api_predict_electricity(
    days_ahead: int = Query(30, ge=1, le=365),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return predict_electricity_costs(db, days_ahead)


@router.get("/predict/inventory")
def api_predict_inventory(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return predict_inventory_shortages(db)


@router.get("/predict/profit")
def api_predict_profit(
    months_ahead: int = Query(3, ge=1, le=12),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return forecast_monthly_profit(db, months_ahead)


@router.get("/production/efficiency")
def api_production_efficiency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return production_efficiency(db)


@router.get("/recommendations")
def api_recommendations(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return generate_ai_recommendations(db)


@router.get("/electricity/departments")
def api_electricity_departments(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return department_wise_electricity(db)


@router.get("/expenses")
def api_expense_analytics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return expense_analytics(db)


@router.get("/performance/comparison")
def api_performance_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return get_performance_comparison(db)


@router.get("/dashboard/executive")
def api_executive_dashboard(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return {
        "recommendations": generate_ai_recommendations(db),
        "efficiency": production_efficiency(db),
        "profit_forecast": forecast_monthly_profit(db, 3),
        "inventory_risks": predict_inventory_shortages(db),
        "performance": get_performance_comparison(db),
        "expense_breakdown": expense_analytics(db),
        "electricity": department_wise_electricity(db),
    }


@router.get("/production/machines")
def api_machine_production(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return machine_wise_production(db)


@router.get("/production/hourly")
def api_hourly_production(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return hourly_production_tracking(db)


@router.get("/production/downtime")
def api_downtime_analysis(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return downtime_analysis(db)


@router.get("/electricity/peak-load")
def api_peak_load(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return peak_load_analytics(db)


@router.get("/cost-per-product")
def api_cost_per_product(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return cost_per_product(db)


@router.get("/employees/efficiency")
def api_employee_efficiency(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return employee_efficiency_analysis(db)


@router.get("/reports/{period}")
def api_management_report(
    period: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if period not in ("daily", "weekly", "monthly"):
        period = "daily"
    return management_report(db, period)
