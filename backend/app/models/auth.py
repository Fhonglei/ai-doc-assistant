"""Auth-related Pydantic schemas."""

from pydantic import BaseModel, EmailStr, Field


class UserOut(BaseModel):
    id: str
    email: str
    created_at: str


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut
