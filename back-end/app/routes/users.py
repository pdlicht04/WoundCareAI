from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import database, crud, utils
from ..schemas import UserOut
from fastapi.security import OAuth2PasswordBearer

router = APIRouter(prefix="/users", tags=["Users"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.get("/me", response_model=UserOut)
def get_my_profile(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    """Lấy thông tin user hiện tại"""
    user_id = utils.decode_access_token(token)
    user = crud.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user


@router.put("/me", response_model=UserOut)
def update_profile(data: dict, db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    """Cập nhật thông tin người dùng"""
    user_id = utils.decode_access_token(token)
    user = crud.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")

    updated_user = crud.update_user(db, user, **data)
    return updated_user
