from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.routers import auth, calendario, dashboard, projetos, skills, tarefas, vps

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="workhub API", version="0.1.0")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    SessionMiddleware,
    secret_key=settings.app_secret_key,
    session_cookie="session",
    https_only=not settings.is_development,
    same_site="lax",
    max_age=settings.session_timeout_minutes * 60,
)

if settings.is_development:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(projetos.router, prefix="/api/v1/projetos", tags=["projetos"])
app.include_router(tarefas.router, prefix="/api/v1/tarefas", tags=["tarefas"])
app.include_router(vps.router, prefix="/api/v1/vps", tags=["vps"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(calendario.router, prefix="/api/v1/calendario", tags=["calendario"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
