import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "AI-Powered Placement Intelligence and Skill Readiness Platform"
    API_V1_STR: str = "/api"
    
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "sih_super_secret_jwt_key_2026_placement_intelligence_platform_key")
    JWT_ALGORITHM: str = "HS256"
    JWT_ACCESS_TOKEN_EXPIRE_MINUTES: int = int(os.getenv("JWT_ACCESS_TOKEN_EXPIRE_MINUTES", "1440"))
    
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
    SUPABASE_PUBLISHABLE_KEY: str = os.getenv("SUPABASE_PUBLISHABLE_KEY", "")
    SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "sqlite:///./sih_placement.db")
    
    PLACEMENT_ADMIN_ID: str = os.getenv("PLACEMENT_ADMIN_ID", "admin")
    PLACEMENT_ADMIN_PASSWORD: str = os.getenv("PLACEMENT_ADMIN_PASSWORD", "placement123")

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
