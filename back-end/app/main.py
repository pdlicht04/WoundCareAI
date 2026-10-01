import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from . import models
from .database import engine
from .routes import users, auth, predict, diagnosis  # 👈 thêm diagnosis
from fastapi.staticfiles import StaticFiles
# ============================
# ⚙️ Khởi tạo ứng dụng
# ============================

load_dotenv()

# Tạo bảng DB nếu chưa có
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="BloodApp API",
    version="1.0.0",
    description="API cho ứng dụng nhận diện và lưu trữ kết quả xét nghiệm máu."
)

# ============================
# 🌐 Cấu hình CORS
# ============================

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Dev mode: cho phép tất cả domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================
# 🧩 Đăng ký các router
# ============================

# Auth routes (đăng ký / đăng nhập / lấy thông tin user)
app.include_router(auth.router, tags=["Auth"])

# User routes (lấy thông tin người dùng)
app.include_router(users.router, prefix="/users", tags=["Users"])

# Prediction routes (gửi ảnh -> model dự đoán)
app.include_router(predict.router, prefix="/api", tags=["Predict"])

# Diagnosis routes (lưu kết quả, xem lịch sử, góp ý)
app.include_router(diagnosis.router, prefix="/diagnoses", tags=["Diagnoses"])

# ============================
# ✅ Root endpoint
# ============================
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")
@app.get("/")
def read_root():
    return {"message": "✅ BloodApp API is running successfully"}
