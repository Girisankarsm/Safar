from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    app_name: str = "SafarAI API"
    api_v1_prefix: str = "/api/v1"
    database_url: str = "sqlite:///./safarai.db"
    demo_mode: bool = True
    cors_origins: str = "http://localhost:3000"
    default_city: str = "hyderabad"

    class Config:
        env_file = ".env"


settings = Settings()
