from fastapi import APIRouter, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai
from PIL import Image
import io

from src.config.settings import get_settings

router = APIRouter()
settings = get_settings()

# Configure Gemini
genai.configure(api_key=settings.GEMINI_API_KEY)


class DiagnosisRequest(BaseModel):
    description: str
    category: Optional[str] = None


class DiagnosisResponse(BaseModel):
    diagnosis: str
    severity: str  # low, medium, high, critical
    severity_score: float  # 0.0 - 1.0
    estimated_cost_min: float
    estimated_cost_max: float
    recommended_category: str
    safety_warning: Optional[str] = None
    suggested_actions: list[str]


@router.post("/diagnose", response_model=DiagnosisResponse)
async def diagnose_issue(
    description: str = Form(...),
    image: Optional[UploadFile] = File(None),
):
    """
    Chẩn đoán sự cố từ mô tả văn bản và/hoặc hình ảnh.
    Sử dụng Gemini Vision để phân tích hình ảnh hư hỏng.
    """
    prompt = f"""Bạn là chuyên gia chẩn đoán sửa chữa nhà ở tại Việt Nam.
    
Khách hàng mô tả sự cố: "{description}"

Hãy phân tích và trả về JSON với format sau:
{{
    "diagnosis": "Chẩn đoán chi tiết vấn đề",
    "severity": "low/medium/high/critical",
    "severity_score": 0.0-1.0,
    "estimated_cost_min": số tiền VNĐ tối thiểu,
    "estimated_cost_max": số tiền VNĐ tối đa,
    "recommended_category": "Điện/Nước/HVAC/Sơn/Mộc/Khóa/Gia dụng",
    "safety_warning": "Cảnh báo an toàn nếu có, null nếu không",
    "suggested_actions": ["bước 1", "bước 2", "..."]
}}

Chỉ trả về JSON, không thêm text khác."""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")

        if image:
            # Đọc ảnh và gửi cùng Gemini Vision
            image_data = await image.read()
            img = Image.open(io.BytesIO(image_data))
            response = model.generate_content([prompt, img])
        else:
            response = model.generate_content(prompt)

        # Parse JSON response from Gemini
        import json
        result_text = response.text.strip()
        # Loại bỏ markdown code block nếu có
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
        
        result = json.loads(result_text)
        return DiagnosisResponse(**result)

    except Exception as e:
        # Fallback response
        return DiagnosisResponse(
            diagnosis=f"Không thể chẩn đoán tự động. Mô tả: {description}",
            severity="medium",
            severity_score=0.5,
            estimated_cost_min=200000,
            estimated_cost_max=1000000,
            recommended_category="Gia dụng",
            safety_warning=None,
            suggested_actions=[
                "Chụp thêm ảnh chi tiết sự cố",
                "Mô tả cụ thể hơn vấn đề đang gặp",
                "Liên hệ kỹ thuật viên để khảo sát trực tiếp",
            ],
        )


@router.post("/estimate-cost")
async def estimate_cost(
    category: str = Form(...),
    description: str = Form(...),
):
    """Ước tính chi phí sửa chữa dựa trên danh mục và mô tả."""
    prompt = f"""Ước tính chi phí sửa chữa tại Việt Nam 2026:
Danh mục: {category}
Mô tả: {description}

Trả về JSON:
{{"min_cost": số VNĐ, "max_cost": số VNĐ, "average_cost": số VNĐ, "note": "ghi chú"}}
Chỉ trả JSON."""

    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)
        import json
        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(result_text)
    except Exception:
        return {"min_cost": 200000, "max_cost": 2000000, "average_cost": 500000, "note": "Giá ước tính"}


@router.get("/safety-guide/{category}")
async def safety_guide(category: str):
    """Hướng dẫn an toàn khẩn cấp theo danh mục."""
    guides = {
        "Điện": {
            "title": "⚡ An toàn Điện",
            "steps": [
                "Ngắt cầu dao tổng ngay lập tức",
                "Không chạm vào dây điện trần bằng tay ướt",
                "Tránh xa khu vực nghi ngờ rò rỉ điện",
                "Gọi kỹ thuật viên qua FastFix ngay",
            ],
        },
        "Nước": {
            "title": "🔧 An toàn Nước",
            "steps": [
                "Tắt van nước tổng",
                "Dùng khăn hoặc xô hứng nước rò rỉ",
                "Ngắt nguồn điện gần khu vực ngập nước",
                "Chụp ảnh và gửi yêu cầu qua FastFix",
            ],
        },
    }
    return guides.get(category, {
        "title": f"🏠 Hướng dẫn an toàn - {category}",
        "steps": ["Giữ bình tĩnh", "Chụp ảnh sự cố", "Gửi yêu cầu qua FastFix"],
    })
