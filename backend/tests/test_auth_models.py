import pytest
from pydantic import ValidationError

from app.models.auth import LoginRequest, RegisterRequest


def test_auth_email_is_normalized():
    request = RegisterRequest(email="  USER@Example.COM  ", password="strong-pass")

    assert request.email == "user@example.com"


def test_auth_email_rejects_invalid_values():
    with pytest.raises(ValidationError):
        LoginRequest(email="not-an-email", password="secret")
