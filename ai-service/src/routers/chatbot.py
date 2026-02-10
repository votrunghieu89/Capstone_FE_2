from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
import google.generativeai as genai

from src.config.settings import get_settings

router = APIRouter()
settings = get_settings()

genai.configure(api_key=settings.GEMINI_API_KEY)


class ChatMessage(BaseModel):
    message: str
    context: Optional[str] = None  # Ngữ cảnh bổ sung (category, request history...)


class ChatResponse(BaseModel):
    reply: str
    suggested_actions: list[str]


# System prompt cho chatbot
SYSTEM_PROMPT = """Bạn là trợ lý AI của FastFix - nền tảng sửa chữa nhà ở tại Việt Nam.

Vai trò của bạn:
1. Hỗ trợ kỹ thuật: Tư vấn cách xử lý tạm thời các sự cố nhà cửa
2. Hướng dẫn an toàn: Cảnh báo nguy hiểm (điện, nước, khí gas)
3. Trả lời câu hỏi: Về dịch vụ, giá cả, quy trình sử dụng FastFix
4. Phân loại sự cố: Giúp khách hàng mô tả chính xác vấn đề

Quy tắc:
- Trả lời bằng tiếng Việt, thân thiện, dễ hiểu
- Luôn nhấn mạnh an toàn trước tiên
- Nếu sự cố nghiêm trọng (điện giật, rò khí gas), yêu cầu gọi 114 NGAY
- Đề xuất hành động cụ thể cho người dùng
- Giữ câu trả lời ngắn gọn, cụ thể"""


@router.post("/chatbot", response_model=ChatResponse)
async def chatbot(request: ChatMessage):
    """Chatbot hỗ trợ kỹ thuật dùng Gemini + LangChain."""
    try:
        model = genai.GenerativeModel(
            "gemini-1.5-flash",
            system_instruction=SYSTEM_PROMPT,
        )

        user_input = request.message
        if request.context:
            user_input += f"\n\n[Ngữ cảnh: {request.context}]"

        response = model.generate_content(user_input)

        # Extract suggested actions
        actions = []
        if "ngắt" in response.text.lower() or "tắt" in response.text.lower():
            actions.append("Ngắt nguồn điện/nước ngay")
        if "thợ" in response.text.lower() or "kỹ thuật" in response.text.lower():
            actions.append("Gửi yêu cầu sửa chữa qua FastFix")
        if "ảnh" in response.text.lower() or "chụp" in response.text.lower():
            actions.append("Chụp ảnh sự cố để AI chẩn đoán")
        if not actions:
            actions.append("Hỏi thêm nếu cần hỗ trợ")

        return ChatResponse(reply=response.text, suggested_actions=actions)

    except Exception as e:
        return ChatResponse(
            reply="Xin lỗi, tôi đang gặp sự cố kết nối. Vui lòng thử lại sau hoặc gọi hotline: 1900-FASTFIX",
            suggested_actions=["Thử lại sau", "Gọi hotline hỗ trợ"],
        )


@router.post("/voice-to-request")
async def voice_to_request(transcription: str):
    """Chuyển đổi mô kếtả giọng nói thành yêu cầu sửa chữa có cấu trúc."""
    try:
        model = genai.GenerativeModel("gemini-1.5-flash")
        prompt = f"""Chuyển đổi mô tả giọng nói sau thành yêu cầu sửa chữa có cấu trúc:

Mô tả giọng nói: "{transcription}"

Trả về JSON:
{{
    "title": "Tiêu đề ngắn gọn cho yêu cầu",
    "description": "Mô tả chi tiết, rõ ràng",
    "category": "Điện/Nước/HVAC/Sơn/Mộc/Khóa/Gia dụng",
    "urgency": "low/medium/high/emergency",
    "keywords": ["từ khóa 1", "từ khóa 2"]
}}
Chỉ trả JSON."""

        response = model.generate_content(prompt)
        import json
        result_text = response.text.strip()
        if result_text.startswith("```"):
            result_text = result_text.split("\n", 1)[1].rsplit("```", 1)[0]
        return json.loads(result_text)

    except Exception:
        return {
            "title": "Yêu cầu sửa chữa",
            "description": transcription,
            "category": "Gia dụng",
            "urgency": "medium",
            "keywords": [],
        }
