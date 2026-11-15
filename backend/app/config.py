from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import List


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./navigen.db"
    SECRET_KEY: str = "dev-secret-key-please-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 120
    ALLOWED_ORIGINS: str = "http://localhost:3000,http://127.0.0.1:3000"

    # External API keys — all optional, app uses fallback data without them
    OPENWEATHER_API_KEY: str = ""
    GOOGLE_PLACES_API_KEY: str = ""
    GEOAPIFY_API_KEY: str = ""
    TOMTOM_API_KEY: str = ""      # traffic
    ORS_API_KEY: str = ""         # routing distance

    @property
    def allowed_origins_list(self) -> List[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",") if o.strip()]


settings = Settings()
