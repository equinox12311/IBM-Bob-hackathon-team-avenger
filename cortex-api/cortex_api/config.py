"""Environment-driven configuration for cortex-api."""

from pathlib import Path
from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    host: str = "0.0.0.0"
    port: int = 8080
    reload: bool = False

    diary_token: str = "replace-me-with-a-long-random-string"
    diary_db_path: Path = Path("data/diary.db")

    embeddings_provider: Literal["watsonx", "local"] = "local"

    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_embed_model: str = "ibm/slate-30m-english-rtrvr"


settings = Settings()
