"""Application configuration via environment variables."""

from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    """All configuration values with sensible defaults."""

    # --- LLM & Embedding ---
    deepseek_api_key: str = ""
    deepseek_base_url: str = "https://api.deepseek.com/v1"
    openai_api_key: str = ""

    llm_model: str = "deepseek-chat"
    llm_fallback_model: str = "gpt-4o-mini"

    # --- Storage ---
    chroma_persist_dir: str = "./data/chroma"
    metadata_db_path: str = "./data/metadata.db"

    # --- Limits ---
    max_file_size_mb: int = 50
    chunk_size: int = 1000
    chunk_overlap: int = 200
    retrieval_top_k: int = 10
    rerank_top_k: int = 4

    # --- CORS ---
    cors_origins: str = "http://localhost:3000,https://ai-doc-assistant.vercel.app"

    # --- Server ---
    port: int = 8000
    log_level: str = "info"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8", "extra": "allow"}


settings = Settings()
