from typing import List, Optional, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_

from backend.models.db_models import User, Profile, Role, Status
from backend.services.auth_service import hash_password

def create_user(
    db: Session,
    email: str,
    username: str,
    password: str,
    role: Role = Role.STUDENT,
    full_name: Optional[str] = None,
    program: Optional[str] = None,
) -> User:
    user = User(
        email=email.strip().lower(),
        username=username.strip(),
        password_hash=hash_password(password),
        role=role,
        status=Status.ACTIVE,
    )
    db.add(user)
    db.flush()

    profile = Profile(
        user_id=user.id,
        full_name=full_name.strip() if full_name else username,
        program=program.strip() if program else "General Studies",
    )
    db.add(profile)
    db.commit()
    db.refresh(user)
    return user

def get_user_by_id(db: Session, user_id: str) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email.strip().lower()).first()

def get_user_by_username(db: Session, username: str) -> Optional[User]:
    return db.query(User).filter(User.username == username.strip()).first()

def list_users(
    db: Session,
    skip: int = 0,
    limit: int = 50,
    role: Optional[str] = None,
    status: Optional[str] = None,
    search: Optional[str] = None,
) -> Tuple[List[User], int]:
    query = db.query(User)

    if role:
        query = query.filter(User.role == role)
    if status:
        query = query.filter(User.status == status)
    if search:
        s = f"%{search.strip()}%"
        query = query.filter(or_(User.email.ilike(s), User.username.ilike(s)))

    total = query.count()
    users = query.order_by(User.created_at.desc()).offset(skip).limit(limit).all()
    return users, total

def update_user_status(db: Session, user_id: str, new_status: Status) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if not user:
        return None
    user.status = new_status
    db.commit()
    db.refresh(user)
    return user
