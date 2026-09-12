from fastapi import APIRouter, Depends, HTTPException, status, Response, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from backend.database import get_db
from backend.schemas import (
    LoginRequest,
    TokenResponse,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UserOut,
)
from backend.services.auth_service import (
    authenticate_user,
    create_access_token,
    create_refresh_token,
    decode_token,
    generate_password_reset_token,
    verify_and_reset_password,
)
from backend.services.audit_service import log_action
from backend.middleware.auth_middleware import get_current_user
from backend.models.db_models import User

limiter = Limiter(key_func=get_remote_address)
router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/login", response_model=TokenResponse)
@limiter.limit("10/minute")
def login(req: LoginRequest, request: Request, response: Response, db: Session = Depends(get_db)):
    user, error = authenticate_user(db, req.username_or_email, req.password)
    if error or not user:
        log_action(db, "LOGIN_FAILED", details=f"Target: {req.username_or_email} - {error}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=error or "Invalid credentials")

    access_token = create_access_token({"sub": user.id, "role": user.role, "username": user.username})
    refresh_token = create_refresh_token({"sub": user.id, "role": user.role})

    # Set httpOnly refresh cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 3600,
    )

    log_action(db, "LOGIN_SUCCESS", user_id=user.id, details=f"Role: {user.role}")

    return TokenResponse(
        access_token=access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        username=user.username,
    )

@router.post("/refresh", response_model=TokenResponse)
def refresh_token(request: Request, response: Response, db: Session = Depends(get_db)):
    refresh_cookie = request.cookies.get("refresh_token")
    if not refresh_cookie:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Refresh token cookie missing")

    payload = decode_token(refresh_cookie)
    if not payload or payload.get("type") != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired refresh token")

    user_id = payload.get("sub")
    user = db.query(User).filter(User.id == user_id).first()
    if not user or user.status != "active":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User inactive or not found")

    new_access_token = create_access_token({"sub": user.id, "role": user.role, "username": user.username})
    new_refresh_token = create_refresh_token({"sub": user.id, "role": user.role})

    response.set_cookie(
        key="refresh_token",
        value=new_refresh_token,
        httponly=True,
        samesite="lax",
        secure=False,
        max_age=7 * 24 * 3600,
    )

    return TokenResponse(
        access_token=new_access_token,
        token_type="bearer",
        role=user.role,
        user_id=user.id,
        username=user.username,
    )

@router.post("/logout")
def logout(response: Response, current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    response.delete_cookie(key="refresh_token")
    log_action(db, "LOGOUT", user_id=current_user.id)
    return {"message": "Logged out successfully"}

@router.post("/forgot-password")
@limiter.limit("5/minute")
def forgot_password(req: ForgotPasswordRequest, request: Request, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if user:
        token = generate_password_reset_token(user, db)
        # Log reset link to console in dev
        print(f"\n[DEV PASSWORD RESET LINK] /reset-password?token={token}\n")
        log_action(db, "PASSWORD_RESET_REQUESTED", user_id=user.id)
    # Always return success to prevent email enumeration
    return {"message": "If this email is registered, a password reset instruction has been generated."}

@router.post("/reset-password")
def reset_password(req: ResetPasswordRequest, db: Session = Depends(get_db)):
    success, msg = verify_and_reset_password(db, req.token, req.new_password)
    if not success:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=msg)
    return {"message": msg}

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
