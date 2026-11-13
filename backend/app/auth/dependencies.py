from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from ..database import get_db
from .utils import decode_token

security = HTTPBearer()


class CurrentUser:
    def __init__(self, user_id: UUID, organization_id: UUID, role: str):
        self.user_id = user_id
        self.organization_id = organization_id
        self.role = role


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> CurrentUser:
    token = credentials.credentials
    payload = decode_token(token)

    if not payload or payload.get("type") != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        user_id = UUID(payload["sub"])
        organization_id = UUID(payload["org"])
        role = payload["role"]
    except (KeyError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
        )

    return CurrentUser(user_id=user_id, organization_id=organization_id, role=role)


def require_roles(*allowed_roles: str):
    async def checker(current_user: CurrentUser = Depends(get_current_user)):
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions",
            )
        return current_user
    return checker


require_owner = require_roles("owner")
require_admin = require_roles("owner", "admin")
require_manager = require_roles("owner", "admin", "manager")
require_accountant = require_roles("owner", "admin", "manager", "accountant")
require_staff = require_roles("owner", "admin", "manager", "accountant", "staff")
require_any = require_roles("owner", "admin", "manager", "accountant", "staff", "viewer")
