# ⚡ FastFix - Rapid Household Repair Service Matching

> Nền tảng kết nối dịch vụ sửa chữa hộ gia đình nhanh chóng, minh bạch và thông minh - Powered by AI.

## 🏗️ Kiến trúc hệ thống

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Frontend   │     │   Backend    │     │  AI Service  │
│ React + Vite │────▶│ ASP.NET Core │────▶│   FastAPI    │
│   :3000      │     │    :5000     │     │    :8000     │
└─────────────┘     └──────┬───────┘     └──────┬───────┘
                           │                     │
                    ┌──────┼──────────────────────┤
                    │      │                      │
              ┌─────▼──┐ ┌─▼────────┐  ┌─────────▼──┐
              │ Redis   │ │PostgreSQL│  │  MongoDB    │
              │  :6379  │ │  :5432   │  │   :27017    │
              └─────────┘ └──────────┘  └────────────┘
```

## 🚀 Bắt đầu nhanh

### Yêu cầu

- Docker & Docker Compose
- Node.js 20+ (cho phát triển Frontend)
- .NET 8 SDK (cho phát triển Backend)
- Python 3.11+ (cho phát triển AI Service)

### Chạy toàn bộ hệ thống với Docker

```bash
# 1. Clone repo
git clone https://github.com/nguyenthehieu0109/FastFix.git
cd FastFix

# 2. Cấu hình môi trường
cp .env.example .env
# Chỉnh sửa .env với Gemini API Key của bạn

# 3. Khởi chạy
docker compose up --build

# 4. Truy cập
# Frontend:  http://localhost:3000
# Backend:   http://localhost:5000/swagger
# AI Docs:   http://localhost:8000/ai/docs
```

### Chạy từng service riêng (Development)

```bash
# PostgreSQL + MongoDB + Redis
docker compose up postgres mongodb redis -d

# Backend
cd backend && dotnet run --project src/FastFix.API

# Frontend
cd frontend && npm install && npm run dev

# AI Service
cd ai-service && pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

## 📁 Cấu trúc dự án

```
FastFix/
├── backend/          # ASP.NET Core 8 - Clean Architecture
├── frontend/         # React 19 + Vite - Glassmorphism UI
├── ai-service/       # Python FastAPI - Gemini AI
├── nginx/            # Reverse Proxy
├── scripts/          # DB init & seed data
├── docker-compose.yml
└── .env
```

## 👥 Nhóm phát triển

| Tên              | Vai trò                        |
| ---------------- | ------------------------------ |
| Võ Trung Hiếu    | Leader, Backend & AI Developer |
| Bùi Quang Quyết  | Frontend Developer & Tester    |
| Hoàng Minh Tuyên | Backend Developer              |
| Nguyễn Thế Hiếu  | Frontend Developer & Designer  |
| Hồ Tuấn Phát     | Frontend Developer & Tester    |

## 📄 Giấy phép

© 2026 FastFix Team - International School CMU
