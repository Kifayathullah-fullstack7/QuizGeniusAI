from typing import Callable
from fastapi import Depends, HTTPException, status
from backend.models.db_models import User, Role
from backend.middleware.auth_middleware import get_current_user

def require_role(allowed_role: str) -> Callable[[User], User]:
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        # Admin can access admin and optionally student routes, student can only access student
        if current_user.role != allowed_role and current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access forbidden: requires '{allowed_role}' role",
            )
        # If route explicitly requires admin and user is student, deny
        if allowed_role == Role.ADMIN and current_user.role != Role.ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access forbidden: requires 'admin' role",
            )
        return current_user
    return role_checker
