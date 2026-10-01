from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from .. import database, crud, utils
from ..schemas import UserCreate, Token, UserOut

router = APIRouter(prefix="/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


@router.post("/register", response_model=UserOut)
def register(user_data: UserCreate, db: Session = Depends(database.get_db)):
    """Đăng ký tài khoản mới"""
    existing = crud.get_user_by_email(db, user_data.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email đã được đăng ký"
        )

    hashed_pw = utils.hash_password(user_data.password)
    user = crud.create_user(
        db,
        email=user_data.email,
        hashed_password=hashed_pw,
        name=user_data.name
    )
    return user


@router.post("/login")
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(database.get_db)):
    """Đăng nhập (OAuth2 form-data: username=email, password=...)"""
    user = crud.get_user_by_email(db, form_data.username)
    if not user or not utils.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Email hoặc mật khẩu không đúng")

    token = utils.create_access_token(user.id)
    print(user.to_dict())
    return {"access_token": token, "token_type": "bearer", "user": user.to_dict()}


@router.get("/me", response_model=UserOut)
def get_me(db: Session = Depends(database.get_db), token: str = Depends(oauth2_scheme)):
    """Lấy thông tin người dùng hiện tại"""
    user_id = utils.decode_access_token(token)
    user = crud.get_user_by_id(db, int(user_id))
    if not user:
        raise HTTPException(status_code=404, detail="Không tìm thấy người dùng")
    return user
