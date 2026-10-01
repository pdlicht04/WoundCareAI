from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordBearer
import os, shutil
from uuid import uuid4
from typing import List
from .. import database, crud, utils, schemas, models

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

@router.post("/upload", response_model=schemas.DiagnosisOut)
async def upload_diagnosis(
    file: UploadFile = File(...),
    result: str = Form(...),              # ✅ bắt buộc có
    confidence: float = Form(None),        # ✅ bắt buộc có
    actual_result: str = Form(None),
    db: Session = Depends(database.get_db),
    token: str = Depends(oauth2_scheme),
):
    """Upload ảnh và lưu kết quả dự đoán"""
    print("🔥 Route /diagnoses/upload STARTED")
    user_id = utils.decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    try:
        filename = f"{uuid4().hex}_{file.filename}"
        dest = os.path.join(utils.UPLOAD_DIR, filename)
        os.makedirs(utils.UPLOAD_DIR, exist_ok=True)
        with open(dest, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi lưu file: {str(e)}")

    diagnosis = crud.create_diagnosis(
        db=db,
        user_id=user_id,
        image_path=dest,
        predicted_result=result,
        confidence=confidence,
        actual_result = actual_result,
        details="bio"
    )

    return diagnosis



# ============================
# 🧾 Xem lịch sử kết quả
# ============================
@router.get("/history", response_model=List[schemas.DiagnosisOut])
def get_history(
    db: Session = Depends(database.get_db),
    token: str = Depends(oauth2_scheme),
):
    """Lấy danh sách lịch sử chẩn đoán của người dùng"""
    user_id = utils.decode_access_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Token không hợp lệ")

    items = crud.list_diagnoses_by_user(db, int(user_id))
    return items


# ============================
# 🧩 Cập nhật kết quả thật (người dùng góp ý)
# ============================
@router.patch("/{diagnosis_id}/feedback", response_model=schemas.DiagnosisOut)
def update_actual_result(
    diagnosis_id: int,
    actual_result: str = Form(...),
    db: Session = Depends(database.get_db),
    token: str = Depends(oauth2_scheme),
):
    """Người dùng góp ý kết quả thật (nếu dự đoán sai)"""
    user_id = utils.decode_access_token(token)
    diagnosis = db.query(models.Diagnosis).filter_by(id=diagnosis_id, user_id=user_id).first()
    if not diagnosis:
        raise HTTPException(status_code=404, detail="Không tìm thấy bản ghi")

    diagnosis.details = f"Actual: {actual_result}"
    db.commit()
    db.refresh(diagnosis)
    return diagnosis
