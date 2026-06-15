from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.api.deps import get_container
from app.container import ApplicationContainer

router = APIRouter()


class PaperChatRequest(BaseModel):
    question: str = Field(..., min_length=1, max_length=1000)
    paper_title: str
    paper_abstract: str | None = None
    paper_authors: list[str] = Field(default_factory=list)
    paper_year: int | None = None


class PaperChatResponse(BaseModel):
    answer: str
    model: str


_SYSTEM = (
    "You are ResearchMind, a helpful academic research assistant. "
    "Answer questions about the provided paper using only its title, abstract, "
    "authors, and year. Be concise, factual, and cite the paper in your answer. "
    "If the answer cannot be determined from the provided information, say so clearly."
)


@router.post("/paper-chat", response_model=PaperChatResponse, summary="Ask a question about a paper")
async def paper_chat(
    payload: PaperChatRequest,
    container: ApplicationContainer = Depends(get_container),
) -> PaperChatResponse:
    settings = container.settings

    if settings.llm_provider != "gemini" or not settings.llm_gemini_api_key:
        raise HTTPException(
            status_code=503,
            detail="LLM provider is not configured. Set RESEARCHMIND_LLM_PROVIDER=gemini and provide an API key.",
        )

    from google import genai
    from google.genai import types as genai_types
    import asyncio

    paper_context = (
        f"Title: {payload.paper_title}\n"
        f"Authors: {', '.join(payload.paper_authors) or 'Unknown'}\n"
        f"Year: {payload.paper_year or 'Unknown'}\n"
        f"Abstract: {payload.paper_abstract or 'Not available.'}"
    )

    prompt = f"Paper:\n{paper_context}\n\nQuestion: {payload.question}"

    try:
        client = genai.Client(api_key=settings.llm_gemini_api_key)

        async with asyncio.timeout(settings.llm_request_timeout_seconds):
            response = await asyncio.to_thread(
                client.models.generate_content,
                model=settings.llm_gemini_model,
                contents=prompt,
                config=genai_types.GenerateContentConfig(
                    system_instruction=_SYSTEM,
                    temperature=0.3,
                    max_output_tokens=512,
                ),
            )

        return PaperChatResponse(
            answer=response.text or "No response generated.",
            model=settings.llm_gemini_model,
        )

    except TimeoutError:
        raise HTTPException(status_code=504, detail="LLM request timed out.") from None
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=502, detail=f"LLM request failed: {exc}") from exc
