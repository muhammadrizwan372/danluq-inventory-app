import os
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "Danluq Petro Industries"
    DATABASE_URL: str = os.path.join(
        os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
        "inventory.db",
    )
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 480

    class Config:
        env_file = ".env"


settings = Settings()
