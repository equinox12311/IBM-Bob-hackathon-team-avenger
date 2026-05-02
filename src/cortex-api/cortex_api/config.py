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
    llm_provider: Literal["watsonx", "local", "off"] = "off"

    watsonx_api_key: str = ""
    watsonx_project_id: str = ""
    watsonx_url: str = "https://us-south.ml.cloud.ibm.com"
    watsonx_embed_model: str = "ibm/slate-30m-english-rtrvr"
    watsonx_llm_model: str = "ibm/granite-3-8b-instruct"

    # Local LLM (when LLM_PROVIDER=local) — IBM Granite 2B as GGUF, run via
    # llama-cpp-python. ~1.6GB, ~30 tok/s on a laptop CPU.
    # Download: huggingface-cli download ibm-granite/granite-3.1-2b-instruct-GGUF \
    #   granite-3.1-2b-instruct-Q4_K_M.gguf -d models/
    local_llm_gguf_path: Path = Path("models/granite-3.1-2b-instruct-Q4_K_M.gguf")
    local_llm_n_ctx: int = 4096
    local_llm_n_threads: int = 0  # 0 = auto from CPU count
    local_llm_max_tokens: int = 512


settings = Settings()
