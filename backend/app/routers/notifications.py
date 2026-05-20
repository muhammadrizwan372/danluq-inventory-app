from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.notification import Notification, NotificationType
from app.models.user import User
from app.services.auth import get_current_user
from app.services.analytics_engine import generate_ai_recommendations

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("/")
def list_notifications(
    unread_only: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    return [
        {
            "id": n.id,
            "type": n.type.value,
            "title": n.title,
            "message": n.message,
            "category": n.category,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat(),
        }
        for n in notifications
    ]


@router.post("/{notification_id}/read")
def mark_read(
    notification_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"status": "ok"}


@router.post("/mark-all-read")
def mark_all_read(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"status": "ok"}


@router.get("/smart-alerts")
def smart_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    recommendations = generate_ai_recommendations(db)
    alerts = []
    for r in recommendations:
        severity_map = {"critical": "alert", "high": "warning", "medium": "info", "low": "success"}
        alert_type = severity_map.get(r["severity"], "info")
        alerts.append({
            "type": alert_type,
            "title": r["title"],
            "message": r["message"],
            "category": r["type"],
            "severity": r["severity"],
            "action": r.get("action"),
        })
    return alerts


@router.get("/unread-count")
def unread_count(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    count = db.query(Notification).filter(Notification.is_read == False).count()
    return {"count": count}
