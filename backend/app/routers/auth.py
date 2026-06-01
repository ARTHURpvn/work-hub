from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException, Request, status
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import settings
from app.deps import get_current_user
from app.schemas.auth import LoginRequest, MeResponse
from app.services.auth_service import totp_required, verify_password, verify_totp

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", status_code=status.HTTP_200_OK)
@limiter.limit("10/minute")
async def login(request: Request, body: LoginRequest) -> dict[str, str | bool]:
    if not verify_password(body.password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Credenciais inválidas")

    if totp_required():
        if not body.totp_code:
            return {"totp_required": True}
        if not verify_totp(body.totp_code):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Código TOTP inválido")

    expires_at = datetime.now(tz=timezone.utc) + timedelta(minutes=settings.session_timeout_minutes)
    request.session["user_id"] = "admin"
    request.session["expires_at"] = expires_at.isoformat()

    return {"ok": True}


@router.post("/logout", status_code=status.HTTP_200_OK)
async def logout(request: Request) -> dict[str, bool]:
    request.session.clear()
    return {"ok": True}


@router.get("/me", response_model=MeResponse)
async def me(_user: str = Depends(get_current_user)) -> MeResponse:
    return MeResponse(email="admin", totp_enabled=totp_required())
