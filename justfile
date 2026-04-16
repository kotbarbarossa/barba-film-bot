set shell := ["bash", "-cu"]
set dotenv-load := true

default:
    @just --list

# --- API ---

api:
    uv run uvicorn app.api.main:app --host $API_HOST --port $API_PORT --reload

api-prod:
    uv run uvicorn app.api.main:app --host $API_HOST --port $API_PORT

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
