import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from backend.config import ALLOWED_ORIGINS
from backend.database import engine, Base
from backend.routers import auth, admin, student, quiz, autopsy, results, study, materials
from backend.routers.auth import limiter

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Import models so Base.metadata knows about all tables
    import backend.models.db_models  # noqa: F401
    Base.metadata.create_all(bind=engine)
    yield

app = FastAPI(
    title="Role-Based Academic & QuizGenius AI API",
    description="Unified API featuring Role-Based Access Control (Admin / Student), Local LLM (Ollama), Cloud Groq, RAG Pipeline, and Cognitive Autopsy Engine.",
    version="2.2.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# SlowAPI rate limiting error handler
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS: strictly configured origins (never wildcard "*")
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(student.router)
app.include_router(quiz.router)
app.include_router(autopsy.router)
app.include_router(results.router)
app.include_router(study.router)
app.include_router(materials.router)

@app.get("/", tags=["System"])
async def root():
    return {
        "message": "Role-Based Academic & QuizGenius AI API is operational.",
        "docs_url": "http://localhost:8000/docs",
        "health_url": "http://localhost:8000/health",
        "frontend_url": "http://localhost:3000",
        "routes": {
            "auth": "/auth/login, /auth/refresh, /auth/logout, /auth/me",
            "admin": "/admin/stats, /admin/users, /admin/audit-logs, /admin/config",
            "student": "/student/profile, /student/progress, /student/announcements",
            "quiz": "/api/generate, /api/autopsy"
        }
    }

@app.get("/health", tags=["System"])
async def health_check():
    return {
        "status": "healthy",
        "service": "Role-Based Academic & QuizGenius Backend",
        "version": "2.0.0",
        "allowed_origins": ALLOWED_ORIGINS
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port, reload=False)
