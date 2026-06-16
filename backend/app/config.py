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
    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5"
    skills_dir: str = "/skills"
    agents_dir: str = "/agents"
    commands_dir: str = "/commands"
    plugins_dir: str = "/plugins"
    desktop_skills_dir: str = "/desktop-skills"
    claude_stats_path: str = "/claude-stats.json"

    @property
    def is_development(self) -> bool:
        return self.app_env == "development"


settings = Settings()  # type: ignore[call-arg]
