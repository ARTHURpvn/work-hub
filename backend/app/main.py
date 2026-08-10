from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from starlette.middleware.sessions import SessionMiddleware

from app.config import settings
from app.routers import auth, commands, config, dashboard, donos, ferramentas, hooks, mcp_servers, mcp_store, plugins, projetos, rotinas, skills, subagents, tarefas, uso, vps

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
app.include_router(donos.router, prefix="/api/v1/donos", tags=["donos"])
app.include_router(ferramentas.router, prefix="/api/v1/ferramentas", tags=["ferramentas"])
app.include_router(dashboard.router, prefix="/api/v1/dashboard", tags=["dashboard"])
app.include_router(skills.router, prefix="/api/v1/skills", tags=["skills"])
app.include_router(plugins.router, prefix="/api/v1/plugins", tags=["plugins"])
app.include_router(subagents.router, prefix="/api/v1/subagents", tags=["subagents"])
app.include_router(mcp_servers.router, prefix="/api/v1/mcp-servers", tags=["mcp"])
app.include_router(mcp_store.router, prefix="/api/v1/mcp-store", tags=["mcp-store"])
app.include_router(hooks.router, prefix="/api/v1/hooks", tags=["hooks"])
app.include_router(commands.router, prefix="/api/v1/commands", tags=["commands"])
app.include_router(config.router, prefix="/api/v1/config", tags=["config"])
app.include_router(rotinas.router, prefix="/api/v1/rotinas", tags=["rotinas"])
app.include_router(uso.router, prefix="/api/v1/uso", tags=["uso"])


@app.get("/api/v1/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}
