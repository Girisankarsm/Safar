from pydantic_settings import BaseSettings


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

    class Config:
        env_file = ".env"

    @property
    def database_enabled(self) -> bool:
        return self.use_database and bool(self.database_url)


settings = Settings()
