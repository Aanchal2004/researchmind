from __future__ import annotations

from fastapi.testclient import TestClient

from app.core.config import Settings
from app.main import create_app


def test_search_api_works_with_stub_provider() -> None:
    settings = Settings(
        arxiv_enabled=False,
        search_use_stub_provider=True,
    )

    with TestClient(create_app(settings)) as client:
        response = client.post(
            "/api/search",
            json={"query": "diffusion models", "limit": 3},
        )

    assert response.status_code == 200
    payload = response.json()
    assert payload["meta"]["mode"] == "scaffold"
    assert payload["meta"]["result_count"] == 1
    assert payload["meta"]["page"] == 1
    assert payload["meta"]["provider_reports"][0]["source"] == "stub"
    assert payload["results"][0]["paper_id"] == "stub-targetdiff"
    assert payload["synthesis"]["status"] == "completed"
    assert payload["synthesis"]["sources"] == ["stub-targetdiff"]
    assert "[1]" in payload["synthesis"]["summary"]
