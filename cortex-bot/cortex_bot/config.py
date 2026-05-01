"""Environment-driven config for cortex-bot."""

from typing import Literal

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    telegram_bot_token: str = ""
    telegram_allowlist_user_ids: str = ""  # comma-separated ints

    api_base_url: str = "http://api:8080"  # docker-compose service name
    diary_token: str = "replace-me-with-a-long-random-string"

    transcription_provider: Literal["whisper-local", "watsonx-stt"] = "whisper-local"

    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"

    @property
    def allowlist_ids(self) -> set[int]:
        return {
            int(x) for x in self.telegram_allowlist_user_ids.split(",") if x.strip()
        }


settings = Settings()
