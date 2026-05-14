"""
AI-powered analytics engine for predictive analytics, trend analysis,
and intelligent business recommendations.
Uses statistical methods (linear regression, moving averages) on existing data.
"""

from datetime import date, datetime, timedelta, timezone
from typing import List, Optional

from sqlalchemy import func, extract, case
from sqlalchemy.orm import Session

from app.models.production import ProductionRecord
from app.models.electricity import ElectricityLog, ElectricityDepartment
from app.models.order import Order, OrderItem, OrderStatus
from app.models.product import Product
from app.models.accounting import Expense, ExpenseCategory, PayableReceivable, PayableReceivableType, PayableReceivableStatus
from app.models.invoice import Invoice
from app.models.hr import Employee, PayrollRecord, EmploymentStatus, Department


def _linear_regression(values: List[float]) -> tuple:
    n = len(values)
    if n < 2:
        return (0.0, values[0] if values else 0.0)
    x_mean = (n - 1) / 2.0
    y_mean = sum(values) / n
    numerator = sum((i - x_mean) * (v - y_mean) for i, v in enumerate(values))
    denominator = sum((i - x_mean) ** 2 for i in range(n))
    if denominator == 0:
        return (0.0, y_mean)
    slope = numerator / denominator
    intercept = y_mean - slope * x_mean
    return (slope, intercept)


def _moving_average(values: List[float], window: int = 7) -> List[float]:
    result = []
    for i in range(len(values)):
        start = max(0, i - window + 1)
        chunk = values[start:i + 1]
        result.append(sum(chunk) / len(chunk))
    return result


def _percent_change(current: float, previous: float) -> float:
    if previous == 0:
        return 100.0 if current > 0 else 0.0
    return round(((current - previous) / previous) * 100, 1)


def predict_production(db: Session, days_ahead: int = 30) -> dict:
    end = date.today()
    start = end - timedelta(days=90)
    records = (
        db.query(
            ProductionRecord.date,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
        )
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .group_by(ProductionRecord.date)
        .order_by(ProductionRecord.date)
        .all()
    )
    if not records:
        return {"forecast": [], "trend": "insufficient_data", "confidence": 0}

    daily_values = [float(r.total_kg) for r in records]
    dates = [r.date for r in records]
    slope, intercept = _linear_regression(daily_values)

    forecast = []
    n = len(daily_values)
    for i in range(1, days_ahead + 1):
        predicted = slope * (n + i - 1) + intercept
        forecast.append({
            "date": (end + timedelta(days=i)).isoformat(),
            "predicted_kg": round(max(0, predicted), 2),
        })

    trend = "increasing" if slope > 0.5 else ("decreasing" if slope < -0.5 else "stable")
    avg_recent = sum(daily_values[-7:]) / min(7, len(daily_values))
    avg_all = sum(daily_values) / len(daily_values)
    confidence = min(95, max(20, int(60 + len(daily_values) * 0.3)))

    return {
        "forecast": forecast,
        "trend": trend,
        "confidence": confidence,
        "current_daily_avg": round(avg_recent, 2),
        "historical_daily_avg": round(avg_all, 2),
        "total_data_points": len(daily_values),
        "historical": [
            {"date": d.isoformat(), "actual_kg": round(v, 2)}
            for d, v in zip(dates, daily_values)
        ],
    }


def predict_electricity_costs(db: Session, days_ahead: int = 30) -> dict:
    end = date.today()
    start = end - timedelta(days=90)
    logs = (
        db.query(ElectricityLog)
        .filter(ElectricityLog.date >= start, ElectricityLog.date <= end)
        .order_by(ElectricityLog.date)
        .all()
    )
    if not logs:
        return {"forecast": [], "trend": "insufficient_data", "confidence": 0}

    costs = [float(l.total_cost) for l in logs]
    units = [float(l.total_units) for l in logs]
    dates = [l.date for l in logs]

    slope_cost, intercept_cost = _linear_regression(costs)
    slope_units, intercept_units = _linear_regression(units)

    n = len(costs)
    forecast = []
    for i in range(1, days_ahead + 1):
        predicted_cost = slope_cost * (n + i - 1) + intercept_cost
        predicted_units = slope_units * (n + i - 1) + intercept_units
        forecast.append({
            "date": (end + timedelta(days=i)).isoformat(),
            "predicted_cost": round(max(0, predicted_cost), 2),
            "predicted_units": round(max(0, predicted_units), 2),
        })

    avg_cost_recent = sum(costs[-7:]) / min(7, len(costs))
    avg_cost_all = sum(costs) / len(costs)
    trend = "increasing" if slope_cost > 0.5 else ("decreasing" if slope_cost < -0.5 else "stable")

    return {
        "forecast": forecast,
        "trend": trend,
        "confidence": min(95, max(20, int(60 + len(costs) * 0.3))),
        "current_daily_avg_cost": round(avg_cost_recent, 2),
        "historical_daily_avg_cost": round(avg_cost_all, 2),
        "current_daily_avg_units": round(sum(units[-7:]) / min(7, len(units)), 2),
        "cost_per_unit_trend": round(slope_cost, 4),
        "historical": [
            {"date": d.isoformat(), "cost": round(c, 2), "units": round(u, 2)}
            for d, c, u in zip(dates, costs, units)
        ],
    }


def predict_inventory_shortages(db: Session) -> dict:
    products = db.query(Product).all()
    shortage_risks = []

    for p in products:
        order_items = (
            db.query(func.sum(OrderItem.quantity))
            .join(Order)
            .filter(
                OrderItem.product_id == p.id,
                Order.created_at >= datetime.now(timezone.utc) - timedelta(days=30),
            )
            .scalar()
        ) or 0

        daily_usage = float(order_items) / 30.0
        if daily_usage > 0:
            days_until_stockout = p.stock_quantity / daily_usage
        else:
            days_until_stockout = 999

        risk_level = "critical" if days_until_stockout < 7 else (
            "high" if days_until_stockout < 14 else (
                "medium" if days_until_stockout < 30 else "low"
            )
        )

        shortage_risks.append({
            "product_id": p.id,
            "product_name": p.name,
            "sku": p.sku,
            "current_stock": p.stock_quantity,
            "reorder_level": p.reorder_level,
            "daily_usage_rate": round(daily_usage, 2),
            "days_until_stockout": round(days_until_stockout, 1),
            "risk_level": risk_level,
            "recommended_reorder_qty": max(0, int(daily_usage * 30 - p.stock_quantity)),
        })

    shortage_risks.sort(key=lambda x: x["days_until_stockout"])
    critical = sum(1 for s in shortage_risks if s["risk_level"] == "critical")
    high = sum(1 for s in shortage_risks if s["risk_level"] == "high")

    return {
        "products": shortage_risks,
        "critical_count": critical,
        "high_risk_count": high,
        "total_products": len(products),
    }


def forecast_monthly_profit(db: Session, months_ahead: int = 3) -> dict:
    monthly_data = []
    for i in range(6, 0, -1):
        month_start = (date.today().replace(day=1) - timedelta(days=i * 30)).replace(day=1)
        if month_start.month == 12:
            month_end = month_start.replace(year=month_start.year + 1, month=1) - timedelta(days=1)
        else:
            month_end = month_start.replace(month=month_start.month + 1) - timedelta(days=1)

        revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(
            Order.created_at >= datetime(month_start.year, month_start.month, month_start.day, tzinfo=timezone.utc),
            Order.created_at <= datetime(month_end.year, month_end.month, month_end.day, 23, 59, 59, tzinfo=timezone.utc),
            Order.status != OrderStatus.CANCELLED,
        ).scalar()

        expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.date >= datetime(month_start.year, month_start.month, month_start.day, tzinfo=timezone.utc),
            Expense.date <= datetime(month_end.year, month_end.month, month_end.day, 23, 59, 59, tzinfo=timezone.utc),
        ).scalar()

        monthly_data.append({
            "month": month_start.strftime("%Y-%m"),
            "revenue": float(revenue),
            "expenses": float(expenses),
            "profit": float(revenue) - float(expenses),
        })

    profits = [m["profit"] for m in monthly_data]
    revenues = [m["revenue"] for m in monthly_data]
    slope_p, intercept_p = _linear_regression(profits) if profits else (0, 0)
    slope_r, intercept_r = _linear_regression(revenues) if revenues else (0, 0)

    forecast = []
    n = len(profits)
    for i in range(1, months_ahead + 1):
        forecast_date = date.today().replace(day=1) + timedelta(days=i * 30)
        pred_profit = slope_p * (n + i - 1) + intercept_p
        pred_revenue = slope_r * (n + i - 1) + intercept_r
        forecast.append({
            "month": forecast_date.strftime("%Y-%m"),
            "predicted_revenue": round(max(0, pred_revenue), 2),
            "predicted_profit": round(pred_profit, 2),
        })

    return {
        "historical": monthly_data,
        "forecast": forecast,
        "profit_trend": "increasing" if slope_p > 0 else ("decreasing" if slope_p < 0 else "stable"),
    }


def production_efficiency(db: Session) -> dict:
    end = date.today()
    start_30 = end - timedelta(days=30)
    start_7 = end - timedelta(days=7)
    prev_start = start_30 - timedelta(days=30)

    def _calc_efficiency(start_d: date, end_d: date):
        records = (
            db.query(
                func.sum(ProductionRecord.quantity_kg).label("total"),
                func.sum(ProductionRecord.waste_kg).label("waste"),
            )
            .filter(ProductionRecord.date >= start_d, ProductionRecord.date <= end_d)
            .first()
        )
        total = float(records.total or 0)
        waste = float(records.waste or 0)
        if total + waste == 0:
            return 0.0
        return round((total / (total + waste)) * 100, 1)

    current_eff = _calc_efficiency(start_30, end)
    prev_eff = _calc_efficiency(prev_start, start_30)
    weekly_eff = _calc_efficiency(start_7, end)

    shift_records = (
        db.query(
            ProductionRecord.shift,
            func.sum(ProductionRecord.quantity_kg).label("total"),
            func.sum(ProductionRecord.waste_kg).label("waste"),
        )
        .filter(ProductionRecord.date >= start_30)
        .group_by(ProductionRecord.shift)
        .all()
    )

    shift_efficiency = {}
    for r in shift_records:
        total = float(r.total or 0)
        waste = float(r.waste or 0)
        eff = round((total / (total + waste)) * 100, 1) if total + waste > 0 else 0
        shift_efficiency[r.shift] = {
            "total_kg": round(total, 2),
            "waste_kg": round(waste, 2),
            "efficiency": eff,
        }

    daily_records = (
        db.query(
            ProductionRecord.date,
            func.sum(ProductionRecord.quantity_kg).label("total"),
            func.sum(ProductionRecord.waste_kg).label("waste"),
        )
        .filter(ProductionRecord.date >= start_30)
        .group_by(ProductionRecord.date)
        .order_by(ProductionRecord.date)
        .all()
    )
    daily_efficiency = []
    for r in daily_records:
        total = float(r.total or 0)
        waste = float(r.waste or 0)
        eff = round((total / (total + waste)) * 100, 1) if total + waste > 0 else 0
        daily_efficiency.append({
            "date": r.date.isoformat(),
            "efficiency": eff,
            "total_kg": round(total, 2),
            "waste_kg": round(waste, 2),
        })

    return {
        "current_month_efficiency": current_eff,
        "previous_month_efficiency": prev_eff,
        "weekly_efficiency": weekly_eff,
        "efficiency_change": round(current_eff - prev_eff, 1),
        "shift_efficiency": shift_efficiency,
        "daily_efficiency": daily_efficiency,
    }


def generate_ai_recommendations(db: Session) -> List[dict]:
    recommendations = []

    shortages = predict_inventory_shortages(db)
    for p in shortages["products"][:3]:
        if p["risk_level"] in ("critical", "high"):
            recommendations.append({
                "type": "inventory",
                "severity": p["risk_level"],
                "icon": "package",
                "title": f"Low Stock Alert: {p['product_name']}",
                "message": f"Raw material may finish in {int(p['days_until_stockout'])} days. "
                           f"Current stock: {p['current_stock']} units. Recommend ordering {p['recommended_reorder_qty']} units.",
                "action": "Review purchase orders",
            })

    efficiency = production_efficiency(db)
    eff_change = efficiency["efficiency_change"]
    if eff_change < -2:
        recommendations.append({
            "type": "production",
            "severity": "high" if eff_change < -5 else "medium",
            "icon": "trending-down",
            "title": "Production Efficiency Dropped",
            "message": f"Production efficiency dropped {abs(eff_change)}% compared to last month "
                       f"(from {efficiency['previous_month_efficiency']}% to {efficiency['current_month_efficiency']}%).",
            "action": "Review production logs",
        })

    for shift, data in efficiency.get("shift_efficiency", {}).items():
        if data["efficiency"] < 85:
            recommendations.append({
                "type": "production",
                "severity": "medium",
                "icon": "alert-triangle",
                "title": f"{shift.capitalize()} Shift Inefficiency",
                "message": f"The {shift} shift has {data['efficiency']}% efficiency with "
                           f"{data['waste_kg']}kg waste. Consider investigating causes.",
                "action": "Review shift reports",
            })

    elec = predict_electricity_costs(db)
    if elec.get("trend") == "increasing" and elec.get("cost_per_unit_trend", 0) > 0:
        recent = elec.get("current_daily_avg_cost", 0)
        historical = elec.get("historical_daily_avg_cost", 0)
        pct = _percent_change(recent, historical)
        if abs(pct) > 5:
            recommendations.append({
                "type": "electricity",
                "severity": "high" if pct > 15 else "medium",
                "icon": "zap",
                "title": f"Electricity Usage {'Increased' if pct > 0 else 'Decreased'} {abs(pct)}%",
                "message": f"Average daily electricity cost is Rs.{recent:,.0f} vs historical average Rs.{historical:,.0f}.",
                "action": "Review energy consumption",
            })

    profit = forecast_monthly_profit(db)
    if profit.get("profit_trend") == "decreasing":
        historical = profit.get("historical", [])
        if len(historical) >= 2:
            recent = historical[-1]["profit"]
            prev = historical[-2]["profit"]
            if prev > 0 and recent < prev:
                pct = _percent_change(recent, prev)
                recommendations.append({
                    "type": "financial",
                    "severity": "high",
                    "icon": "trending-down",
                    "title": "Profit Margins Decreasing",
                    "message": f"Profit dropped {abs(pct)}% from last month. "
                               f"Current: Rs.{recent:,.0f}, Previous: Rs.{prev:,.0f}.",
                    "action": "Review financial reports",
                })

    if not recommendations:
        recommendations.append({
            "type": "info",
            "severity": "low",
            "icon": "check-circle",
            "title": "All Systems Operating Normally",
            "message": "No critical issues detected. Business metrics are within expected ranges.",
            "action": None,
        })

    return recommendations


def department_wise_electricity(db: Session) -> dict:
    end = date.today()
    start = end - timedelta(days=30)

    dept_data = (
        db.query(
            ElectricityDepartment.name,
            func.sum(ElectricityDepartment.units).label("total_units"),
        )
        .join(ElectricityLog)
        .filter(ElectricityLog.date >= start)
        .group_by(ElectricityDepartment.name)
        .order_by(func.sum(ElectricityDepartment.units).desc())
        .all()
    )

    total_units = sum(float(d.total_units) for d in dept_data)
    departments = []
    for d in dept_data:
        units = float(d.total_units)
        departments.append({
            "name": d.name,
            "total_units": round(units, 2),
            "percentage": round((units / total_units * 100) if total_units > 0 else 0, 1),
        })

    avg_price = db.query(func.avg(ElectricityLog.per_unit_price)).filter(
        ElectricityLog.date >= start
    ).scalar() or 0

    for dept in departments:
        dept["estimated_cost"] = round(dept["total_units"] * float(avg_price), 2)

    return {
        "departments": departments,
        "total_units": round(total_units, 2),
        "avg_unit_price": round(float(avg_price), 2),
        "period_days": 30,
    }


def expense_analytics(db: Session) -> dict:
    end = datetime.now(timezone.utc)
    start_30 = end - timedelta(days=30)
    start_prev = start_30 - timedelta(days=30)

    current_by_category = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .filter(Expense.date >= start_30)
        .group_by(Expense.category)
        .all()
    )

    prev_by_category = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .filter(Expense.date >= start_prev, Expense.date < start_30)
        .group_by(Expense.category)
        .all()
    )

    prev_map = {str(c.category.value if hasattr(c.category, 'value') else c.category): float(c.total) for c in prev_by_category}

    categories = []
    total_current = 0
    for c in current_by_category:
        cat_name = str(c.category.value if hasattr(c.category, 'value') else c.category)
        current = float(c.total)
        previous = prev_map.get(cat_name, 0)
        change = _percent_change(current, previous)
        total_current += current
        categories.append({
            "category": cat_name,
            "current_amount": round(current, 2),
            "previous_amount": round(previous, 2),
            "change_percent": change,
        })

    categories.sort(key=lambda x: x["current_amount"], reverse=True)

    profit_leaks = [c for c in categories if c["change_percent"] > 15]

    return {
        "by_category": categories,
        "total_current_expenses": round(total_current, 2),
        "total_previous_expenses": round(sum(prev_map.values()), 2),
        "profit_leaks": profit_leaks,
    }


def get_performance_comparison(db: Session) -> dict:
    end = date.today()
    current_start = end.replace(day=1)
    if current_start.month == 1:
        prev_start = current_start.replace(year=current_start.year - 1, month=12)
    else:
        prev_start = current_start.replace(month=current_start.month - 1)
    prev_end = current_start - timedelta(days=1)

    def _get_period_stats(start_d, end_d):
        revenue = db.query(func.coalesce(func.sum(Order.total), 0)).filter(
            Order.created_at >= datetime(start_d.year, start_d.month, start_d.day, tzinfo=timezone.utc),
            Order.created_at <= datetime(end_d.year, end_d.month, end_d.day, 23, 59, 59, tzinfo=timezone.utc),
            Order.status != OrderStatus.CANCELLED,
        ).scalar()

        orders = db.query(func.count(Order.id)).filter(
            Order.created_at >= datetime(start_d.year, start_d.month, start_d.day, tzinfo=timezone.utc),
            Order.created_at <= datetime(end_d.year, end_d.month, end_d.day, 23, 59, 59, tzinfo=timezone.utc),
        ).scalar()

        production = db.query(func.coalesce(func.sum(ProductionRecord.quantity_kg), 0)).filter(
            ProductionRecord.date >= start_d,
            ProductionRecord.date <= end_d,
        ).scalar()

        expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.date >= datetime(start_d.year, start_d.month, start_d.day, tzinfo=timezone.utc),
            Expense.date <= datetime(end_d.year, end_d.month, end_d.day, 23, 59, 59, tzinfo=timezone.utc),
        ).scalar()

        return {
            "revenue": float(revenue),
            "orders": int(orders),
            "production_kg": float(production),
            "expenses": float(expenses),
            "profit": float(revenue) - float(expenses),
        }

    current = _get_period_stats(current_start, end)
    previous = _get_period_stats(prev_start, prev_end)

    return {
        "current_month": {
            "period": current_start.strftime("%B %Y"),
            **current,
        },
        "previous_month": {
            "period": prev_start.strftime("%B %Y"),
            **previous,
        },
        "changes": {
            "revenue": _percent_change(current["revenue"], previous["revenue"]),
            "orders": _percent_change(current["orders"], previous["orders"]),
            "production": _percent_change(current["production_kg"], previous["production_kg"]),
            "expenses": _percent_change(current["expenses"], previous["expenses"]),
            "profit": _percent_change(current["profit"], previous["profit"]),
        },
    }


def machine_wise_production(db: Session) -> dict:
    """Analyze production by operator (used as machine/line proxy)."""
    end = date.today()
    start = end - timedelta(days=30)
    prev_start = start - timedelta(days=30)

    records = (
        db.query(
            ProductionRecord.operator,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
            func.sum(ProductionRecord.waste_kg).label("waste_kg"),
            func.count(ProductionRecord.id).label("record_count"),
        )
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .group_by(ProductionRecord.operator)
        .all()
    )

    prev_records = (
        db.query(
            ProductionRecord.operator,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
        )
        .filter(ProductionRecord.date >= prev_start, ProductionRecord.date < start)
        .group_by(ProductionRecord.operator)
        .all()
    )
    prev_map = {r.operator or "Unassigned": float(r.total_kg) for r in prev_records}

    machines = []
    total_production = sum(float(r.total_kg) for r in records)
    for r in records:
        name = r.operator or "Unassigned"
        total = float(r.total_kg)
        waste = float(r.waste_kg)
        efficiency = round((total / (total + waste)) * 100, 1) if total + waste > 0 else 0
        prev_total = prev_map.get(name, 0)
        change = _percent_change(total, prev_total)
        machines.append({
            "name": name,
            "total_kg": round(total, 2),
            "waste_kg": round(waste, 2),
            "efficiency": efficiency,
            "record_count": int(r.record_count),
            "share_percent": round((total / total_production * 100) if total_production > 0 else 0, 1),
            "change_vs_prev": change,
            "status": "efficient" if efficiency >= 90 else ("warning" if efficiency >= 75 else "inefficient"),
        })

    machines.sort(key=lambda x: x["total_kg"], reverse=True)

    return {
        "machines": machines,
        "total_production": round(total_production, 2),
        "total_machines": len(machines),
        "avg_efficiency": round(sum(m["efficiency"] for m in machines) / max(len(machines), 1), 1),
        "period_days": 30,
    }


def hourly_production_tracking(db: Session) -> dict:
    """Analyze production patterns by time of day using shift data."""
    end = date.today()
    start = end - timedelta(days=30)

    shift_data = (
        db.query(
            ProductionRecord.shift,
            ProductionRecord.date,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
            func.sum(ProductionRecord.waste_kg).label("waste_kg"),
        )
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .group_by(ProductionRecord.shift, ProductionRecord.date)
        .order_by(ProductionRecord.date)
        .all()
    )

    day_totals = []
    night_totals = []
    daily_map: dict = {}
    for r in shift_data:
        d = r.date.isoformat()
        if d not in daily_map:
            daily_map[d] = {"date": d, "day_kg": 0, "night_kg": 0, "day_waste": 0, "night_waste": 0}
        if r.shift == "day":
            daily_map[d]["day_kg"] = round(float(r.total_kg), 2)
            daily_map[d]["day_waste"] = round(float(r.waste_kg), 2)
            day_totals.append(float(r.total_kg))
        else:
            daily_map[d]["night_kg"] = round(float(r.total_kg), 2)
            daily_map[d]["night_waste"] = round(float(r.waste_kg), 2)
            night_totals.append(float(r.total_kg))

    avg_day = round(sum(day_totals) / max(len(day_totals), 1), 2)
    avg_night = round(sum(night_totals) / max(len(night_totals), 1), 2)
    peak_shift = "day" if avg_day >= avg_night else "night"

    return {
        "daily_breakdown": sorted(daily_map.values(), key=lambda x: x["date"]),
        "avg_day_production": avg_day,
        "avg_night_production": avg_night,
        "peak_shift": peak_shift,
        "total_day_production": round(sum(day_totals), 2),
        "total_night_production": round(sum(night_totals), 2),
        "day_count": len(day_totals),
        "night_count": len(night_totals),
    }


def downtime_analysis(db: Session) -> dict:
    """Analyze production gaps and wastage patterns as downtime indicators."""
    end = date.today()
    start = end - timedelta(days=30)

    all_dates = set()
    d = start
    while d <= end:
        all_dates.add(d)
        d += timedelta(days=1)

    production_dates = set(
        r.date for r in
        db.query(ProductionRecord.date)
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .distinct()
        .all()
    )

    no_production_days = sorted(all_dates - production_dates)

    waste_records = (
        db.query(
            ProductionRecord.date,
            ProductionRecord.operator,
            func.sum(ProductionRecord.waste_kg).label("waste"),
            func.sum(ProductionRecord.quantity_kg).label("production"),
        )
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .group_by(ProductionRecord.date, ProductionRecord.operator)
        .all()
    )

    high_waste_events = []
    for r in waste_records:
        total = float(r.production) + float(r.waste)
        waste_pct = round((float(r.waste) / total * 100), 1) if total > 0 else 0
        if waste_pct > 15:
            high_waste_events.append({
                "date": r.date.isoformat(),
                "operator": r.operator or "Unassigned",
                "waste_kg": round(float(r.waste), 2),
                "waste_percent": waste_pct,
            })

    high_waste_events.sort(key=lambda x: x["waste_percent"], reverse=True)

    total_days = len(all_dates)
    active_days = len(production_dates)
    uptime_pct = round((active_days / total_days * 100) if total_days > 0 else 0, 1)

    return {
        "uptime_percent": uptime_pct,
        "active_days": active_days,
        "inactive_days": len(no_production_days),
        "total_days": total_days,
        "no_production_dates": [d.isoformat() for d in no_production_days[:10]],
        "high_waste_events": high_waste_events[:10],
        "total_high_waste_events": len(high_waste_events),
    }


def peak_load_analytics(db: Session) -> dict:
    """Analyze electricity peak loads and usage patterns."""
    end = date.today()
    start = end - timedelta(days=90)

    logs = (
        db.query(ElectricityLog)
        .filter(ElectricityLog.date >= start, ElectricityLog.date <= end)
        .order_by(ElectricityLog.date)
        .all()
    )
    if not logs:
        return {"daily_loads": [], "peak_day": None, "avg_load": 0, "efficiency_score": 0}

    daily_loads = []
    max_load = 0
    peak_day = None
    total_units = 0
    for log in logs:
        units = float(log.total_units)
        cost = float(log.total_cost)
        total_units += units
        if units > max_load:
            max_load = units
            peak_day = log.date.isoformat()
        daily_loads.append({
            "date": log.date.isoformat(),
            "units": round(units, 2),
            "cost": round(cost, 2),
            "cost_per_unit": round(cost / units, 2) if units > 0 else 0,
        })

    avg_load = round(total_units / len(logs), 2)
    load_factor = round((avg_load / max_load * 100) if max_load > 0 else 0, 1)

    weekday_loads: dict = {}
    for log in logs:
        wd = log.date.strftime("%A")
        if wd not in weekday_loads:
            weekday_loads[wd] = []
        weekday_loads[wd].append(float(log.total_units))

    weekday_avg = {
        wd: round(sum(vals) / len(vals), 2)
        for wd, vals in weekday_loads.items()
    }

    return {
        "daily_loads": daily_loads,
        "peak_day": peak_day,
        "peak_units": round(max_load, 2),
        "avg_daily_units": avg_load,
        "load_factor": load_factor,
        "total_units": round(total_units, 2),
        "total_cost": round(sum(float(l.total_cost) for l in logs), 2),
        "weekday_averages": weekday_avg,
        "period_days": len(logs),
    }


def cost_per_product(db: Session) -> dict:
    """Calculate production cost per product using production, electricity, and expense data."""
    end = date.today()
    start = end - timedelta(days=30)

    prod_records = (
        db.query(
            ProductionRecord.product_id,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
            func.sum(ProductionRecord.waste_kg).label("waste_kg"),
        )
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .group_by(ProductionRecord.product_id)
        .all()
    )

    total_production = sum(float(r.total_kg) for r in prod_records)

    total_elec_cost = db.query(func.coalesce(func.sum(ElectricityLog.total_cost), 0)).filter(
        ElectricityLog.date >= start, ElectricityLog.date <= end
    ).scalar()
    total_elec_cost = float(total_elec_cost)

    total_expenses = db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
        Expense.date >= datetime(start.year, start.month, start.day, tzinfo=timezone.utc),
        Expense.date <= datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc),
    ).scalar()
    total_expenses = float(total_expenses)

    total_overhead = total_elec_cost + total_expenses

    products_cost = []
    for r in prod_records:
        product = db.query(Product).filter(Product.id == r.product_id).first()
        if not product:
            continue
        qty = float(r.total_kg)
        waste = float(r.waste_kg)
        share = qty / total_production if total_production > 0 else 0
        allocated_overhead = total_overhead * share
        material_cost = product.cost * qty
        total_cost = material_cost + allocated_overhead
        cost_per_kg = round(total_cost / qty, 2) if qty > 0 else 0
        waste_cost = round(product.cost * waste, 2)

        products_cost.append({
            "product_id": product.id,
            "product_name": product.name,
            "sku": product.sku,
            "quantity_kg": round(qty, 2),
            "waste_kg": round(waste, 2),
            "material_cost": round(material_cost, 2),
            "overhead_allocated": round(allocated_overhead, 2),
            "total_cost": round(total_cost, 2),
            "cost_per_kg": cost_per_kg,
            "waste_cost": waste_cost,
            "selling_price": product.price,
            "margin_per_kg": round(product.price - cost_per_kg, 2),
            "margin_percent": round(((product.price - cost_per_kg) / product.price * 100) if product.price > 0 else 0, 1),
        })

    products_cost.sort(key=lambda x: x["total_cost"], reverse=True)

    return {
        "products": products_cost,
        "total_production_kg": round(total_production, 2),
        "total_electricity_cost": round(total_elec_cost, 2),
        "total_overhead": round(total_overhead, 2),
        "total_expenses": round(total_expenses, 2),
        "period_days": 30,
    }


def employee_efficiency_analysis(db: Session) -> dict:
    """Analyze employee productivity through production operator data and payroll."""
    end = date.today()
    start = end - timedelta(days=30)

    operator_production = (
        db.query(
            ProductionRecord.operator,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
            func.sum(ProductionRecord.waste_kg).label("waste_kg"),
            func.count(ProductionRecord.id).label("shifts_worked"),
        )
        .filter(
            ProductionRecord.date >= start,
            ProductionRecord.date <= end,
            ProductionRecord.operator.isnot(None),
        )
        .group_by(ProductionRecord.operator)
        .all()
    )

    employees_data = []
    total_production = sum(float(r.total_kg) for r in operator_production)
    for r in operator_production:
        total = float(r.total_kg)
        waste = float(r.waste_kg)
        efficiency = round((total / (total + waste)) * 100, 1) if total + waste > 0 else 0
        per_shift = round(total / max(int(r.shifts_worked), 1), 2)
        employees_data.append({
            "operator": r.operator,
            "total_production_kg": round(total, 2),
            "waste_kg": round(waste, 2),
            "efficiency": efficiency,
            "shifts_worked": int(r.shifts_worked),
            "avg_per_shift": per_shift,
            "production_share": round((total / total_production * 100) if total_production > 0 else 0, 1),
            "rating": "excellent" if efficiency >= 95 else ("good" if efficiency >= 85 else ("average" if efficiency >= 75 else "needs_improvement")),
        })

    employees_data.sort(key=lambda x: x["efficiency"], reverse=True)

    dept_stats = (
        db.query(Employee.department, func.count(Employee.id).label("count"))
        .filter(Employee.status == EmploymentStatus.ACTIVE)
        .group_by(Employee.department)
        .all()
    )
    department_headcount = {
        str(d.department.value if hasattr(d.department, "value") else d.department): int(d.count)
        for d in dept_stats
    }

    total_active = db.query(func.count(Employee.id)).filter(
        Employee.status == EmploymentStatus.ACTIVE
    ).scalar() or 0

    return {
        "operators": employees_data,
        "total_operators": len(employees_data),
        "avg_efficiency": round(sum(e["efficiency"] for e in employees_data) / max(len(employees_data), 1), 1),
        "total_production": round(total_production, 2),
        "department_headcount": department_headcount,
        "total_active_employees": int(total_active),
    }


def management_report(db: Session, period: str = "daily") -> dict:
    """Generate management intelligence reports: daily, weekly, or monthly."""
    end = date.today()
    if period == "daily":
        start = end
        prev_start = end - timedelta(days=1)
        prev_end = prev_start
    elif period == "weekly":
        start = end - timedelta(days=6)
        prev_start = start - timedelta(days=7)
        prev_end = start - timedelta(days=1)
    else:
        start = end.replace(day=1)
        if start.month == 1:
            prev_start = start.replace(year=start.year - 1, month=12)
        else:
            prev_start = start.replace(month=start.month - 1)
        prev_end = start - timedelta(days=1)

    def _period_stats(s: date, e: date) -> dict:
        revenue = float(db.query(func.coalesce(func.sum(Order.total), 0)).filter(
            Order.created_at >= datetime(s.year, s.month, s.day, tzinfo=timezone.utc),
            Order.created_at <= datetime(e.year, e.month, e.day, 23, 59, 59, tzinfo=timezone.utc),
            Order.status != OrderStatus.CANCELLED,
        ).scalar())

        orders_count = int(db.query(func.count(Order.id)).filter(
            Order.created_at >= datetime(s.year, s.month, s.day, tzinfo=timezone.utc),
            Order.created_at <= datetime(e.year, e.month, e.day, 23, 59, 59, tzinfo=timezone.utc),
        ).scalar())

        production_kg = float(db.query(func.coalesce(func.sum(ProductionRecord.quantity_kg), 0)).filter(
            ProductionRecord.date >= s, ProductionRecord.date <= e,
        ).scalar())

        waste_kg = float(db.query(func.coalesce(func.sum(ProductionRecord.waste_kg), 0)).filter(
            ProductionRecord.date >= s, ProductionRecord.date <= e,
        ).scalar())

        expenses_total = float(db.query(func.coalesce(func.sum(Expense.amount), 0)).filter(
            Expense.date >= datetime(s.year, s.month, s.day, tzinfo=timezone.utc),
            Expense.date <= datetime(e.year, e.month, e.day, 23, 59, 59, tzinfo=timezone.utc),
        ).scalar())

        elec_cost = float(db.query(func.coalesce(func.sum(ElectricityLog.total_cost), 0)).filter(
            ElectricityLog.date >= s, ElectricityLog.date <= e,
        ).scalar())

        elec_units = float(db.query(func.coalesce(func.sum(ElectricityLog.total_units), 0)).filter(
            ElectricityLog.date >= s, ElectricityLog.date <= e,
        ).scalar())

        efficiency = round((production_kg / (production_kg + waste_kg)) * 100, 1) if production_kg + waste_kg > 0 else 0

        return {
            "revenue": round(revenue, 2),
            "orders": orders_count,
            "production_kg": round(production_kg, 2),
            "waste_kg": round(waste_kg, 2),
            "efficiency": efficiency,
            "expenses": round(expenses_total, 2),
            "electricity_cost": round(elec_cost, 2),
            "electricity_units": round(elec_units, 2),
            "profit": round(revenue - expenses_total, 2),
        }

    current = _period_stats(start, end)
    previous = _period_stats(prev_start, prev_end)

    changes = {}
    for key in current:
        if isinstance(current[key], (int, float)) and isinstance(previous[key], (int, float)):
            changes[key] = _percent_change(float(current[key]), float(previous[key]))

    top_products = (
        db.query(
            Product.name,
            func.sum(ProductionRecord.quantity_kg).label("total_kg"),
        )
        .join(ProductionRecord, Product.id == ProductionRecord.product_id)
        .filter(ProductionRecord.date >= start, ProductionRecord.date <= end)
        .group_by(Product.name)
        .order_by(func.sum(ProductionRecord.quantity_kg).desc())
        .limit(5)
        .all()
    )

    top_expense_categories = (
        db.query(Expense.category, func.sum(Expense.amount).label("total"))
        .filter(
            Expense.date >= datetime(start.year, start.month, start.day, tzinfo=timezone.utc),
            Expense.date <= datetime(end.year, end.month, end.day, 23, 59, 59, tzinfo=timezone.utc),
        )
        .group_by(Expense.category)
        .order_by(func.sum(Expense.amount).desc())
        .limit(5)
        .all()
    )

    insights = []
    if changes.get("revenue", 0) > 10:
        insights.append(f"Revenue increased {changes['revenue']}% compared to previous period")
    elif changes.get("revenue", 0) < -10:
        insights.append(f"Revenue decreased {abs(changes['revenue'])}% — review sales strategy")

    if changes.get("efficiency", 0) < -5:
        insights.append(f"Production efficiency dropped {abs(changes['efficiency'])}% — investigate waste")
    elif changes.get("efficiency", 0) > 5:
        insights.append(f"Production efficiency improved {changes['efficiency']}%")

    if changes.get("expenses", 0) > 20:
        insights.append(f"Expenses surged {changes['expenses']}% — review cost controls")

    if current["production_kg"] > 0 and current["waste_kg"] / (current["production_kg"] + current["waste_kg"]) > 0.15:
        insights.append(f"Waste rate is {round(current['waste_kg'] / (current['production_kg'] + current['waste_kg']) * 100, 1)}% — above 15% threshold")

    if not insights:
        insights.append("Operations are running within normal parameters")

    return {
        "period": period,
        "date_range": {"start": start.isoformat(), "end": end.isoformat()},
        "current": current,
        "previous": previous,
        "changes": changes,
        "top_products": [{"name": p.name, "total_kg": round(float(p.total_kg), 2)} for p in top_products],
        "top_expenses": [
            {"category": str(e.category.value if hasattr(e.category, "value") else e.category), "total": round(float(e.total), 2)}
            for e in top_expense_categories
        ],
        "insights": insights,
    }
