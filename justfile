set shell := ["bash", "-cu"]
set dotenv-load := true

default:
    @just --list

# --- API ---

api:
    uv run uvicorn app.api.main:app --host $API_HOST --port $API_PORT --reload

api-prod:
    uv run uvicorn app.api.main:app --host $API_HOST --port $API_PORT

# --- Bot ---

bot:
    uv run python -m app.bot.main

worker:
    uv run arq app.worker.main.WorkerSettings

# --- Scripts ---

backfill-original-fields:
    uv run python scripts/backfill_original_fields.py

replace-posters-with-tmdb:
    uv run python scripts/replace_posters_with_tmdb.py

# --- Database ---

migrate message:
    uv run alembic revision --autogenerate -m "{{message}}"

db-upgrade:
    uv run alembic upgrade head

db-downgrade:
    uv run alembic downgrade -1

# --- Code quality ---

lint:
    uv run ruff check .

format:
    uv run ruff format .

# --- Tests ---

test:
    uv run pytest
