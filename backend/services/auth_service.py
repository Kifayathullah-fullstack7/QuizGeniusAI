import os
import secrets
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional, Tuple
import jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from backend.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)
from backend.models.db_models import User, Status, Role

import bcrypt

LOCKOUT_THRESHOLD = 5
LOCKOUT_DURATION_MINUTES = 15

def utcnow():
    return datetime.now(timezone.utc)

def hash_password(password: str) -> str:
    pwd_bytes = password.encode("utf-8")[:72]
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode("utf-8")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        pwd_bytes = plain_password.encode("utf-8")[:72]
        hash_bytes = hashed_password.encode("utf-8")
        return bcrypt.checkpw(pwd_bytes, hash_bytes)
    except Exception:
        return False

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = utcnow() + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode.update({"exp": expire, "type": "access"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def create_refresh_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    expire = utcnow() + (expires_delta or timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS))
    to_encode.update({"exp": expire, "type": "refresh"})
    return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[dict]:
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.PyJWTError:
        return None

def authenticate_user(db: Session, username_or_email: str, password: str) -> Tuple[Optional[User], Optional[str]]:
    """
    Validates user credentials, checks status and lockout, handles failure counter and locking.
    Returns (user, None) on success, or (None, error_message) on failure.
    """
    user = (
        db.query(User)
        .filter((User.username == username_or_email) | (User.email == username_or_email))
        .first()
    )
    if not user:
        return None, "Invalid credentials"

    # Check if account is suspended or inactive
    if user.status == Status.SUSPENDED:
        return None, "Account is suspended. Contact administrator."
    if user.status == Status.INACTIVE:
        return None, "Account is deactivated. Contact administrator."

    # Check lockout
    now = utcnow()
    if user.locked_until:
        # Normalize naive/aware datetime comparison
        locked_until = user.locked_until.replace(tzinfo=timezone.utc) if user.locked_until.tzinfo is None else user.locked_until
        if now < locked_until:
            minutes_left = int((locked_until - now).total_seconds() / 60) + 1
            return None, f"Account temporarily locked due to too many failed attempts. Try again in {minutes_left} minutes."
        else:
            # Lockout expired, reset
            user.locked_until = None
            user.failed_login_attempts = 0

    # Verify password
    if not verify_password(password, user.password_hash):
        user.failed_login_attempts += 1
        if user.failed_login_attempts >= LOCKOUT_THRESHOLD:
            user.locked_until = now + timedelta(minutes=LOCKOUT_DURATION_MINUTES)
            db.commit()
            return None, f"Account locked for {LOCKOUT_DURATION_MINUTES} minutes due to {LOCKOUT_THRESHOLD} consecutive failed login attempts."
        db.commit()
        remaining = LOCKOUT_THRESHOLD - user.failed_login_attempts
        return None, f"Invalid credentials. {remaining} attempt(s) remaining before lockout."

    # Reset on success
    user.failed_login_attempts = 0
    user.locked_until = None
    user.last_login_at = now
    db.commit()
    db.refresh(user)

    return user, None

def generate_password_reset_token(user: User, db: Session) -> str:
    raw_token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    user.reset_token_hash = token_hash
    user.reset_token_expires_at = utcnow() + timedelta(hours=1)
    db.commit()
    return raw_token

def verify_and_reset_password(db: Session, raw_token: str, new_password: str) -> Tuple[bool, str]:
    token_hash = hashlib.sha256(raw_token.encode()).hexdigest()
    user = db.query(User).filter(User.reset_token_hash == token_hash).first()
    if not user:
        return False, "Invalid or expired reset token"

    now = utcnow()
    if user.reset_token_expires_at:
        expires_at = user.reset_token_expires_at.replace(tzinfo=timezone.utc) if user.reset_token_expires_at.tzinfo is None else user.reset_token_expires_at
        if now > expires_at:
            return False, "Reset token has expired"

    user.password_hash = hash_password(new_password)
    user.reset_token_hash = None
    user.reset_token_expires_at = None
    db.commit()
    return True, "Password reset successfully"
