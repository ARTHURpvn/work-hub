import os

from cryptography.fernet import Fernet

os.environ.setdefault("DATABASE_URL", "postgresql+asyncpg://test:test@localhost/test")
os.environ.setdefault("APP_SECRET_KEY", "test-secret-key-for-testing-only")
# Fernet exige uma chave de 32 bytes em base64 url-safe — gerada dinamicamente para os testes.
os.environ.setdefault("ENCRYPTION_KEY", Fernet.generate_key().decode())
os.environ.setdefault("ADMIN_PASSWORD_HASH", "$argon2id$v=19$m=65536,t=3,p=4$test$test")
