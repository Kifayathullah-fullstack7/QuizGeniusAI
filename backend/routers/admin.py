from typing import List, Optional
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from backend.database import get_db
from backend.models.db_models import User, Role, Status, AuditLog, Profile
from backend.schemas import (
    UserOut,
    UserCreate,
    UserUpdate,
    AuditLogOut,
    AdminStats,
    SystemConfig,
)
from backend.middleware.role_middleware import require_role
from backend.services.user_service import (
    create_user,
    list_users,
    get_user_by_id,
    get_user_by_email,
    get_user_by_username,
    update_user_status,
)
from backend.services.audit_service import log_action, list_audit_logs

router = APIRouter(
    prefix="/admin",
    tags=["Admin"],
    dependencies=[Depends(require_role("admin"))],
)

# In-memory system config store
_system_config = {
    "maintenance_mode": False,
    "announcement_banner": "Welcome to the Academic Portal — Fall Semester",
    "allow_registrations": True,
}

@router.get("/stats", response_model=AdminStats)
def get_admin_stats(db: Session = Depends(get_db)):
    total_students = db.query(User).filter(User.role == Role.STUDENT).count()

    cutoff_active = datetime.now(timezone.utc) - timedelta(days=30)
    active_users = (
        db.query(User)
        .filter(User.status == Status.ACTIVE)
        .count()
    )

    recent_cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    recent_logins = (
        db.query(User)
        .filter(User.last_login_at >= recent_cutoff)
        .count()
    )

    return AdminStats(
        total_students=total_students,
        active_users=active_users,
        recent_logins=recent_logins,
    )

@router.get("/users", response_model=List[UserOut])
def get_users_list(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db),
):
    users, _ = list_users(db, skip=skip, limit=limit, role=role, status=status, search=search)
    return users

@router.post("/users", response_model=UserOut, status_code=status.HTTP_201_CREATED)
def create_new_user(
    req: UserCreate,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    if get_user_by_email(db, req.email):
        raise HTTPException(status_code=400, detail="Email already in use")
    if get_user_by_username(db, req.username):
        raise HTTPException(status_code=400, detail="Username already taken")

    user = create_user(
        db,
        email=req.email,
        username=req.username,
        password=req.password,
        role=Role(req.role),
        full_name=req.full_name,
        program=req.program,
    )
    log_action(
        db,
        "USER_CREATED",
        user_id=current_admin.id,
        details=f"Created {user.role}: {user.username} ({user.email})",
    )
    return user

@router.patch("/users/{user_id}", response_model=UserOut)
def update_existing_user(
    user_id: str,
    req: UserUpdate,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    if req.status:
        user.status = Status(req.status)
    if req.full_name or req.program:
        if not user.profile:
            user.profile = Profile(user_id=user.id)
        if req.full_name is not None:
            user.profile.full_name = req.full_name
        if req.program is not None:
            user.profile.program = req.program

    db.commit()
    db.refresh(user)

    log_action(
        db,
        "USER_UPDATED",
        user_id=current_admin.id,
        details=f"Updated user {user.username} (Status: {user.status})",
    )
    return user

@router.patch("/users/{user_id}/deactivate", response_model=UserOut)
def deactivate_user_account(
    user_id: str,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    user = update_user_status(db, user_id, Status.INACTIVE)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    log_action(
        db,
        "USER_DEACTIVATED",
        user_id=current_admin.id,
        details=f"Deactivated user {user.username} ({user.id})",
    )
    return user

@router.get("/audit-logs", response_model=List[AuditLogOut])
def get_audit_logs(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    user_id: Optional[str] = None,
    action: Optional[str] = None,
    db: Session = Depends(get_db),
):
    logs, _ = list_audit_logs(db, skip=skip, limit=limit, user_id=user_id, action=action)
    return logs

@router.get("/config", response_model=SystemConfig)
def get_system_config():
    return SystemConfig(**_system_config)

@router.patch("/config", response_model=SystemConfig)
def update_system_config(
    req: SystemConfig,
    current_admin: User = Depends(require_role("admin")),
    db: Session = Depends(get_db),
):
    _system_config["maintenance_mode"] = req.maintenance_mode
    _system_config["announcement_banner"] = req.announcement_banner
    _system_config["allow_registrations"] = req.allow_registrations

    log_action(
        db,
        "CONFIG_UPDATED",
        user_id=current_admin.id,
        details=f"Updated system configuration",
    )
    return SystemConfig(**_system_config)
