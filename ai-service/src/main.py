from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.routers import diagnosis, matching, chatbot
from src.config.settings import get_settings

settings = get_settings()

app = FastAPI(
    title="FastFix AI Service",
    description="AI-powered diagnosis, technician matching, and chatbot for FastFix platform",
    version="1.0.0",
    docs_url="/ai/docs",
    openapi_url="/ai/openapi.json",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:80"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(diagnosis.router, prefix="/ai", tags=["Chẩn đoán AI"])
app.include_router(matching.router, prefix="/ai", tags=["Matching Kỹ thuật viên"])
app.include_router(chatbot.router, prefix="/ai", tags=["Chatbot Hỗ trợ"])


@app.get("/ai/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "FastFix AI Service",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT,
    }
