from datetime import datetime, timezone

from fastapi import HTTPException, Request, status


def get_current_user(request: Request) -> str:
    user_id: str | None = request.session.get("user_id")
    expires_at: str | None = request.session.get("expires_at")

    if not user_id or not expires_at:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Não autenticado")

    if datetime.fromisoformat(expires_at) < datetime.now(tz=timezone.utc):
        request.session.clear()
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Sessão expirada")

    return user_id
