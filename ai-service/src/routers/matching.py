from fastapi import APIRouter, Query
from pydantic import BaseModel
from typing import Optional
import math

router = APIRouter()


class MatchRequest(BaseModel):
    latitude: float
    longitude: float
    category_id: Optional[int] = None
    urgency: str = "medium"  # low, medium, high, emergency
    description: Optional[str] = None


class TechnicianMatch(BaseModel):
    technician_id: str
    name: str
    distance_km: float
    rating: float
    match_score: float  # 0-100
    estimated_arrival_min: int
    skills: list[str]


class MatchResponse(BaseModel):
    matches: list[TechnicianMatch]
    total_found: int


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Tính khoảng cách giữa 2 điểm GPS (km)."""
    R = 6371  # Bán kính Trái Đất (km)
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = (
        math.sin(dlat / 2) ** 2
        + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2) ** 2
    )
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def calculate_match_score(
    distance_km: float,
    rating: float,
    total_jobs: int,
    urgency: str,
) -> float:
    """
    Thuật toán Matching đa yếu tố:
    - 40% Khoảng cách (gần = điểm cao)
    - 35% Đánh giá (rating cao = điểm cao) 
    - 15% Kinh nghiệm (nhiều jobs = điểm cao)
    - 10% Urgency bonus (khẩn cấp = ưu tiên gần nhất)
    """
    # Distance score (0-100): gần hơn = cao hơn
    max_distance = 20.0  # km
    distance_score = max(0, (1 - distance_km / max_distance)) * 100

    # Rating score (0-100)
    rating_score = (rating / 5.0) * 100

    # Experience score (0-100)
    exp_score = min(total_jobs / 100, 1.0) * 100

    # Urgency weight adjustment
    urgency_weights = {
        "emergency": {"distance": 0.55, "rating": 0.25, "experience": 0.10, "urgency": 0.10},
        "high": {"distance": 0.45, "rating": 0.30, "experience": 0.15, "urgency": 0.10},
        "medium": {"distance": 0.40, "rating": 0.35, "experience": 0.15, "urgency": 0.10},
        "low": {"distance": 0.30, "rating": 0.40, "experience": 0.20, "urgency": 0.10},
    }

    w = urgency_weights.get(urgency, urgency_weights["medium"])

    score = (
        distance_score * w["distance"]
        + rating_score * w["rating"]
        + exp_score * w["experience"]
        + 100 * w["urgency"]  # bonus for available technicians
    )

    return round(min(score, 100), 1)


@router.post("/match-technician", response_model=MatchResponse)
async def match_technician(request: MatchRequest):
    """
    Đề xuất kỹ thuật viên phù hợp nhất dựa trên:
    - Khoảng cách GPS (Haversine formula)
    - Đánh giá cộng đồng
    - Kinh nghiệm hoàn thành
    - Mức độ khẩn cấp
    """
    # TODO: Sprint 2 - Kết nối PostgreSQL để lấy technician thực
    # Mock data cho Sprint 1
    mock_technicians = [
        {"id": "tech-001", "name": "Nguyễn Văn An", "lat": 10.776, "lng": 106.700, "rating": 4.8, "jobs": 156, "skills": ["Sửa ổ cắm điện", "Sửa tủ điện"]},
        {"id": "tech-002", "name": "Trần Minh Tuấn", "lat": 10.780, "lng": 106.695, "rating": 4.6, "jobs": 89, "skills": ["Sửa ống nước", "Thông tắc cống"]},
        {"id": "tech-003", "name": "Lê Hoàng Phú", "lat": 10.773, "lng": 106.710, "rating": 4.9, "jobs": 234, "skills": ["Vệ sinh điều hòa", "Sửa điều hòa"]},
    ]

    matches = []
    for tech in mock_technicians:
        dist = haversine_distance(request.latitude, request.longitude, tech["lat"], tech["lng"])
        score = calculate_match_score(dist, tech["rating"], tech["jobs"], request.urgency)
        arrival = max(10, int(dist * 5))  # ~5 phút/km

        matches.append(
            TechnicianMatch(
                technician_id=tech["id"],
                name=tech["name"],
                distance_km=round(dist, 2),
                rating=tech["rating"],
                match_score=score,
                estimated_arrival_min=arrival,
                skills=tech["skills"],
            )
        )

    # Sắp xếp theo match_score giảm dần
    matches.sort(key=lambda x: x.match_score, reverse=True)

    return MatchResponse(matches=matches, total_found=len(matches))


@router.post("/classify-request")
async def classify_request(description: str = Query(...)):
    """Tự động phân loại yêu cầu sửa chữa bằng NLP."""
    # Keyword-based classification (Sprint 1)
    # TODO: Sprint 2 - thay bằng SpaCy/BERT model
    keywords = {
        "Điện": ["điện", "ổ cắm", "bóng đèn", "cầu dao", "dây điện", "quạt", "công tắc"],
        "Nước": ["nước", "ống", "vòi", "bồn cầu", "tắc", "rò rỉ", "sen", "bể nước"],
        "HVAC": ["điều hòa", "máy lạnh", "quạt", "thông gió", "nóng", "lạnh"],
        "Sơn": ["sơn", "tường", "thấm", "nứt", "trát", "vôi"],
        "Mộc": ["gỗ", "cửa", "tủ", "kệ", "sàn", "bản lề"],
        "Khóa": ["khóa", "chìa", "cửa", "mở", "ổ khóa"],
        "Gia dụng": ["máy giặt", "tủ lạnh", "lò vi sóng", "bếp", "máy nước nóng"],
    }

    desc_lower = description.lower()
    scores = {}
    for category, kws in keywords.items():
        score = sum(1 for kw in kws if kw in desc_lower)
        if score > 0:
            scores[category] = score

    if scores:
        best = max(scores, key=scores.get)
        return {"category": best, "confidence": min(scores[best] / 3, 1.0), "all_scores": scores}

    return {"category": "Gia dụng", "confidence": 0.3, "all_scores": {}}
