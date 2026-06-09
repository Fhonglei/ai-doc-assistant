"""Auth-related Pydantic schemas."""

from pydantic import BaseModel, Field, field_validator


class UserOut(BaseModel):
    id: str
    email: str
    created_at: str


class EmailRequest(BaseModel):
    email: str = Field(min_length=3, max_length=254)

    @field_validator("email")
    @classmethod
    def normalize_email(cls, value: str) -> str:
        email = value.strip().lower()
        if " " in email or "@" not in email:
            raise ValueError("Enter a valid email address.")
        local, _, domain = email.partition("@")
        if not local or "." not in domain or domain.startswith(".") or domain.endswith("."):
            raise ValueError("Enter a valid email address.")
        return email


class RegisterRequest(EmailRequest):
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(EmailRequest):
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
