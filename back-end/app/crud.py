from sqlalchemy.orm import Session
from . import models


# ============================
# 👤 USER CRUD
# ============================

def get_user_by_email(db: Session, email: str):
    """Tìm người dùng theo email"""
    return db.query(models.User).filter(models.User.email == email).first()


def get_user_by_id(db: Session, user_id: int):
    """Tìm người dùng theo ID"""
    return db.query(models.User).filter(models.User.id == user_id).first()


def create_user(db: Session, email: str, hashed_password: str, name: str = None):
    """Tạo người dùng mới (local auth)"""
    user = models.User(
        email=email,
        hashed_password=hashed_password,
        name=name,
        is_verified=True,  # có thể để False nếu muốn gửi email xác thực
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def update_user(db: Session, user: models.User, **kwargs):
    """Cập nhật thông tin người dùng (vd: tên, avatar, ...)"""
    for key, value in kwargs.items():
        if hasattr(user, key) and value is not None:
            setattr(user, key, value)
    db.commit()
    db.refresh(user)
    return user


# ============================
# 🧠 DIAGNOSIS CRUD
# ============================

def create_diagnosis(
    db: Session,
    user_id: int,
    image_path: str,
    predicted_result: str = None,
    confidence: float = None,
    actual_result: float = None,
    details: str = None,
):
    diag = models.Diagnosis(
        user_id=user_id,
        image_path=image_path,
        predicted_result=predicted_result,
        confidence=confidence,
        actual_result=actual_result,
        details=details,
    )
    db.add(diag)
    db.flush()  # 👈 bắt buộc để MySQL sinh id
    db.refresh(diag)  # 👈 lấy lại id và created_at từ DB
    db.commit()
    return diag



def list_diagnoses_by_user(db: Session, user_id: int):
    """Lấy danh sách chẩn đoán của người dùng (mới nhất trước)"""
    return (
        db.query(models.Diagnosis)
        .filter(models.Diagnosis.user_id == user_id)
        .order_by(models.Diagnosis.created_at.desc())
        .all()
    )
