from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./urimai.db"
    LLM_API_KEY: Optional[str] = "mock-key-for-local-dev"
    LLM_MODEL: str = "gemini-1.5-flash"
    ADMIN_JWT_SECRET: str = "super-secret-jwt-key-for-urimaiai-hackathon-2026"
    ADMIN_EMAIL: str = "admin@urimai.ai"
    ADMIN_PASSWORD: str = "admin123"
    OCR_ENABLED: bool = True
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()
