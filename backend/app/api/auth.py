"""Authentication endpoints."""

import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.auth import (
    UserContext,
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from app.db.metadata_store import create_user, get_user_by_email
from app.models.auth import AuthResponse, LoginRequest, RegisterRequest, UserOut

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])


def _to_user_out(row: dict) -> UserOut:
    return UserOut(id=row["id"], email=row["email"], created_at=row["created_at"])


@router.post("/register", response_model=AuthResponse, status_code=201)
async def register_user(request: RegisterRequest):
    email = request.email.lower().strip()
    existing = await get_user_by_email(email)
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    now = datetime.now(timezone.utc).isoformat()
    user = await create_user(
        user_id=str(uuid.uuid4()),
        email=email,
        password_hash=hash_password(request.password),
        created_at=now,
    )
    token = create_access_token(user["id"])
    return AuthResponse(access_token=token, user=_to_user_out(user))


@router.post("/login", response_model=AuthResponse)
async def login_user(request: LoginRequest):
    user = await get_user_by_email(request.email.lower().strip())
    if not user or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token(user["id"])
    return AuthResponse(access_token=token, user=_to_user_out(user))


@router.get("/me", response_model=UserOut)
async def get_me(user: UserContext = Depends(get_current_user)):
    return UserOut(id=user.user_id, email=user.email, created_at="")
