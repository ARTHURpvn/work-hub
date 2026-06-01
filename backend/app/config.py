from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    database_url: str
    app_secret_key: str
    encryption_key: str
    admin_password_hash: str
    totp_secret: str = ""
    session_timeout_minutes: int = 60
    app_env: str = "production"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


settings = Settings()  # type: ignore[call-arg]
