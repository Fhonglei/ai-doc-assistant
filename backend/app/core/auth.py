"""Small HMAC token auth layer without external auth dependencies."""

from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from dataclasses import dataclass

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from config import settings
from app.db.metadata_store import get_user_by_id


bearer_scheme = HTTPBearer(auto_error=False)


@dataclass(frozen=True)
class UserContext:
    user_id: str
    email: str


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
    return f"pbkdf2_sha256${base64.urlsafe_b64encode(salt).decode()}${base64.urlsafe_b64encode(digest).decode()}"


def verify_password(password: str, stored_hash: str) -> bool:
    try:
        algorithm, salt_b64, digest_b64 = stored_hash.split("$", 2)
        if algorithm != "pbkdf2_sha256":
            return False
        salt = base64.urlsafe_b64decode(salt_b64.encode())
        expected = base64.urlsafe_b64decode(digest_b64.encode())
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120_000)
        return hmac.compare_digest(actual, expected)
    except (ValueError, TypeError):
        return False


def _b64encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode().rstrip("=")


def _b64decode(data: str) -> bytes:
    padding = "=" * (-len(data) % 4)
    return base64.urlsafe_b64decode((data + padding).encode())


def create_access_token(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": int(time.time()) + settings.auth_token_ttl_minutes * 60,
    }
    payload_b64 = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    signature = hmac.new(
        settings.auth_secret_key.encode("utf-8"),
        payload_b64.encode("utf-8"),
        hashlib.sha256,
    ).digest()
    return f"{payload_b64}.{_b64encode(signature)}"


def verify_access_token(token: str) -> str:
    try:
        payload_b64, signature_b64 = token.split(".", 1)
        expected_signature = hmac.new(
            settings.auth_secret_key.encode("utf-8"),
            payload_b64.encode("utf-8"),
            hashlib.sha256,
        ).digest()
        signature = _b64decode(signature_b64)
        if not hmac.compare_digest(signature, expected_signature):
            raise ValueError("Bad signature")
        payload = json.loads(_b64decode(payload_b64))
        if int(payload["exp"]) < int(time.time()):
            raise ValueError("Expired token")
        return str(payload["sub"])
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        ) from exc


async def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
) -> UserContext:
    if not credentials:
        if settings.auth_enabled:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Authentication required.",
            )
        return UserContext(user_id="public", email="public@local")

    user_id = verify_access_token(credentials.credentials)
    user = await get_user_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found.",
        )
    return UserContext(user_id=user["id"], email=user["email"])
