import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./app.db")
# Fix legacy postgres:// URL format commonly provided by Render, Railway, and Supabase
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "quizgenius-role-based-secret-key-2026-very-secure")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "7"))

ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Support comma-separated ALLOWED_ORIGINS from environment
env_origins = os.getenv("ALLOWED_ORIGINS", "")
if env_origins:
    for origin in env_origins.split(","):
        clean_origin = origin.strip().rstrip("/")
        if clean_origin and clean_origin not in ALLOWED_ORIGINS:
            ALLOWED_ORIGINS.append(clean_origin)

deployed_frontend = os.getenv("FRONTEND_URL", "").strip().rstrip("/")
if deployed_frontend and deployed_frontend not in ALLOWED_ORIGINS:
    ALLOWED_ORIGINS.append(deployed_frontend)

