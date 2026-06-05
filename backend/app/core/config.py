from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

_REPO_ROOT = Path(__file__).resolve().parents[3]
_ENV_FILE = _REPO_ROOT / ".env"
if not _ENV_FILE.exists():
    _ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):
    app_name: str = "SafarAI API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = ""
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""
    use_database: bool = False
    demo_mode: bool = True
    cors_origins: str = "http://localhost:3000"
    default_city: str = "chennai"
    app_public_url: str = "http://localhost:3000"
    demo_user_id: str = "a0000000-0000-0000-0000-000000000001"

    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )

    @property
    def database_enabled(self) -> bool:
        return self.use_database and bool(self.database_url)


settings = Settings()
