from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Cấu hình AI Service"""

    # Environment
    ENVIRONMENT: str = "development"

    # Database
    DATABASE_URL: str = "postgresql://fastfix:FastFix@2026@localhost:5432/fastfix_db"
    MONGODB_URL: str = "mongodb://fastfix:FastFix@2026@localhost:27017/fastfix_media?authSource=admin"
    REDIS_URL: str = "redis://:FastFix@2026@localhost:6379/0"

    # AI
    GEMINI_API_KEY: str = "your_gemini_api_key_here"

    # Backend
    BACKEND_URL: str = "http://localhost:5000"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
