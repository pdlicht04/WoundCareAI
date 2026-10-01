from fastapi import APIRouter, UploadFile, File
from fastapi.responses import JSONResponse
from PIL import Image
import io
import numpy as np
import cv2
from ultralytics import YOLO
import base64

router = APIRouter()

yolo_model = YOLO("app/models/best_yolov11_segment.pt")

def yolo_predict_pil(pil_img):
    img_np = np.array(pil_img)
    h, w = img_np.shape[:2]

    results = yolo_model.predict(source=pil_img, conf=0.25, imgsz=640, save=False)
    r = results[0]

    if r.masks is None or len(r.masks.data) == 0:
        return None, None, []

    masks = r.masks.data.cpu().numpy()
    img_vis = img_np.copy()
    output_info = []

    for i, mask in enumerate(masks):
        mask_resized = cv2.resize(mask.astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
        color = np.random.randint(0, 255, (1, 3)).tolist()[0]
        mask_rgb = np.stack([mask_resized]*3, axis=-1)
        img_vis = np.where(mask_rgb, img_vis*0.5 + np.array(color)*0.5, img_vis).astype(np.uint8)

        contours, _ = cv2.findContours(mask_resized, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(img_vis, contours, -1, color, 2)

        cls_id = int(r.boxes.cls[i].item()) if r.boxes.cls is not None else -1
        conf = float(r.boxes.conf[i].item()) if r.boxes.conf is not None else None
        cls_name = r.names[cls_id] if cls_id >= 0 else "N/A"
        output_info.append({"label": cls_name, "probability": conf})

    # Crop vùng mask lớn nhất
    areas = [mask.sum() for mask in masks]
    best_idx = np.argmax(areas)
    mask_best = cv2.resize(masks[best_idx].astype(np.uint8), (w, h), interpolation=cv2.INTER_NEAREST)
    ys, xs = np.where(mask_best)
    x1, y1, x2, y2 = xs.min(), ys.min(), xs.max(), ys.max()
    cropped_img = pil_img.crop((x1, y1, x2, y2))

    return img_vis, cropped_img, output_info

@router.post("/predict")
async def predict(file: UploadFile = File(...)):
    img_bytes = await file.read()
    pil_img = Image.open(io.BytesIO(img_bytes)).convert("RGB")

    img_vis, cropped_img, yolo_info = yolo_predict_pil(pil_img)

    # Fallback nếu không detect được
    if img_vis is None or len(yolo_info) == 0:
        pil_img_copy = pil_img.copy()
        buffered_crop = io.BytesIO()
        pil_img_copy.save(buffered_crop, format="JPEG")
        cropped_base64 = base64.b64encode(buffered_crop.getvalue()).decode()

        buffered_vis = io.BytesIO()
        pil_img_copy.save(buffered_vis, format="JPEG")
        vis_base64 = base64.b64encode(buffered_vis.getvalue()).decode()

        return JSONResponse({
            "predicted_class": "4.0",
            "top3_predictions": [],
            "cropped_image": f"data:image/jpeg;base64,{cropped_base64}",
            "image_with_bbox": f"data:image/jpeg;base64,{vis_base64}"
        })

    # Encode ảnh crop và ảnh mask+contour ra base64
    buffered_crop = io.BytesIO()
    cropped_img.save(buffered_crop, format="JPEG")
    cropped_base64 = base64.b64encode(buffered_crop.getvalue()).decode()

    buffered_vis = io.BytesIO()
    Image.fromarray(img_vis).save(buffered_vis, format="JPEG")
    vis_base64 = base64.b64encode(buffered_vis.getvalue()).decode()

    # Map YOLO info vào key JSON
    predicted_class = yolo_info[0]["label"]
    top3_predictions = []  # luôn là mảng rỗng để frontend không crash

    return JSONResponse({
        "predicted_class": predicted_class,
        "top3_predictions": top3_predictions,
        "cropped_image": f"data:image/jpeg;base64,{cropped_base64}",
        "image_with_bbox": f"data:image/jpeg;base64,{vis_base64}"
    })
