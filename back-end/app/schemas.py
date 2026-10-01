from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


# ============================
# 👤 USER SCHEMAS
# ============================

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None
    avatar_url: Optional[str] = None
    is_verified: Optional[bool] = False

    class Config:
        orm_mode = True


class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(UserBase):
    id: int
    created_at: datetime


# ============================
# 🔑 TOKEN SCHEMAS
# ============================

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: Optional[UserOut] = None  # 👈 để trả thông tin user sau khi login


# ============================
# 🧠 DIAGNOSIS SCHEMAS
# ============================

class DiagnosisCreate(BaseModel):
    """Schema khi người dùng bấm nút lưu kết quả"""
    predicted_result: Optional[str] = None
    confidence: Optional[float] = None
    details: Optional[str] = None


class DiagnosisFeedback(BaseModel):
    """Schema khi người dùng góp ý lại kết quả thật"""
    actual_result: str


class DiagnosisOut(BaseModel):
    """Kết quả trả về khi lấy lịch sử / sau khi lưu"""
    id: int
    user_id: int
    image_path: str
    predicted_result: Optional[str]
    actual_result: Optional[str]
    confidence: Optional[float]
    details: Optional[str]
    created_at: datetime

    class Config:
        orm_mode = True
