"""Health check endpoint."""

from fastapi import APIRouter
from config import settings

router = APIRouter(tags=["health"])


def _key_ok(key: str) -> bool:
    if not key or not key.strip():
        return False
    lowered = key.strip().lower()
    return "your-" not in lowered and "sk-your" not in lowered


@router.get("/api/health")
async def health_check():
    llm_ok = _key_ok(settings.deepseek_api_key) or _key_ok(settings.openai_api_key)
    status = "ok" if llm_ok else "degraded"
    return {
        "status": status,
        "service": "ai-doc-assistant",
        "llm_configured": llm_ok,
        "model": settings.llm_model,
    }
