import logging

from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerifyMismatchError
import pyotp

from app.config import settings

logger = logging.getLogger(__name__)

_ph = PasswordHasher()


def verify_password(plain: str) -> bool:
    try:
        return _ph.verify(settings.admin_password_hash, plain)
    except VerifyMismatchError:
        return False
    except InvalidHashError:
        logger.error(
            "ADMIN_PASSWORD_HASH ausente ou malformado — verifique o .env. "
            "Hashes Argon2 contêm '$' e são corrompidos se injetados via "
            "env_file do Docker Compose (que interpola variáveis)."
        )
        return False


def totp_required() -> bool:
    return bool(settings.totp_secret)


def verify_totp(code: str) -> bool:
    if not settings.totp_secret:
        return True
    totp = pyotp.TOTP(settings.totp_secret)
    return totp.verify(code, valid_window=1)
