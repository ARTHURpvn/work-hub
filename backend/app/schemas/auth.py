from pydantic import BaseModel


class LoginRequest(BaseModel):
    password: str
    totp_code: str | None = None


class MeResponse(BaseModel):
    email: str
    totp_enabled: bool
