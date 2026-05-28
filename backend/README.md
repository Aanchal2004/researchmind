# ResearchMind Backend

FastAPI backend foundation for the ResearchMind frontend workspace.

## Run locally

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
copy .env.example .env
pip install -e .[dev]
uvicorn app.main:app --reload
```

The backend uses `RESEARCHMIND_`-prefixed environment variables to avoid
collisions with machine-level variables like `DEBUG`.

If you run the frontend on `127.0.0.1:3000`, make sure that origin is included
in `RESEARCHMIND_ALLOWED_ORIGINS` so browser requests to the API are not blocked
by CORS.

## Structure

```text
backend/
  app/
    api/          # HTTP routes and dependency wiring
    core/         # settings and logging
    providers/    # source adapters and future MCP wrappers
    schemas/      # request/response models
    services/     # async business logic
    container.py  # app-scoped dependency container
    main.py       # FastAPI app factory
```

The current `/api/search` route is intentionally scaffolded and runs through an
async service plus pluggable providers. The first live source is `arXiv`, and
the optional stub provider is still available for offline smoke testing.
