from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from backend.models.db_models import AuditLog

def log_action(
    db: Session,
    action: str,
    user_id: Optional[str] = None,
    details: Optional[str] = None,
) -> AuditLog:
    """
    Append-only audit log entry.
    """
    entry = AuditLog(
        user_id=user_id,
        action=action,
        details=details,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry

def list_audit_logs(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    user_id: Optional[str] = None,
    action: Optional[str] = None,
) -> Tuple[List[AuditLog], int]:
    query = db.query(AuditLog)
    if user_id:
        query = query.filter(AuditLog.user_id == user_id)
    if action:
        query = query.filter(AuditLog.action.ilike(f"%{action}%"))

    total = query.count()
    logs = query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()
    return logs, total
