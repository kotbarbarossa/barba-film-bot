# barba-film-bot

A Telegram bot for tracking movies. Users add films to their personal list, browse by genre/decade/status, rate and share them. Movie metadata is fetched asynchronously via Groq (LLM) and TMDB.

## Architecture

Three long-running processes share one codebase:

| Service | Entry point | Description |
|---------|------------|-------------|
| `bot` | `app/bot/main.py` | Telegram bot (aiogram 3, polling) |
| `api` | `app/api/main.py` | FastAPI REST API |
| `worker` | `app/worker/main.py` | ARQ background worker (movie processing) |

**Storage:** PostgreSQL (main DB) · Redis (FSM storage + ARQ queue)

## Tech Stack

- Python 3.13, [uv](https://docs.astral.sh/uv/)
- FastAPI + uvicorn
- aiogram 3.x
- SQLAlchemy 2.0 async + asyncpg
- Alembic
- ARQ (async job queue)
- Pydantic v2 + pydantic-settings
- Sentry (error monitoring)
- Ruff (linter/formatter)

## Environment Variables

Copy the table below into a `.env` file at the project root and fill in the values.

| Variable | Default | Description |
|----------|---------|-------------|
| `ENVIRONMENT` | `local` | `local` / `dev` / `stage` / `prod` |
| `API_HOST` | `0.0.0.0` | uvicorn bind host |
| `API_PORT` | `8000` | uvicorn bind port |
| `DATABASE_HOST` | `localhost` | PostgreSQL host |
| `DATABASE_PORT` | `5432` | PostgreSQL port |
| `DATABASE_USER` | `postgres` | PostgreSQL user |
| `DATABASE_PASSWORD` | `postgres` | PostgreSQL password |
| `DATABASE_NAME` | `postgres` | PostgreSQL database name |
| `REDIS_HOST` | `localhost` | Redis host |
| `REDIS_PORT` | `6379` | Redis port |
| `REDIS_DB` | `0` | Redis database index |
| `BOT_TOKEN` | — | Telegram bot token (from @BotFather) |
| `GROQ_API_KEY` | — | Groq API key |
| `TMDB_API_KEY` | — | TMDB API key |
| `SENTRY_DSN` | `""` | Sentry DSN (leave empty to disable) |

## Local Development

**Requirements:** Python 3.13, [uv](https://docs.astral.sh/uv/), [just](https://github.com/casey/just), PostgreSQL, Redis.

```bash
# Install dependencies
uv sync

# Apply migrations
just db-upgrade

# Run services (each in a separate terminal)
just api
just bot
just worker
```

Available `just` commands:

```
just api          # start API (with reload)
just bot          # start Telegram bot
just worker       # start ARQ worker
just migrate msg  # autogenerate migration
just db-upgrade   # apply all migrations
just db-downgrade # roll back one migration
just lint         # ruff check
just format       # ruff format
just test         # pytest
```

## Production (Docker)

All services are built from a single `Dockerfile`. `docker-compose.yml` runs postgres, redis, a one-off `migrate` container, and the three app services.

```bash
# Build image locally (for testing)
docker build -t barba-film-bot:latest .

# Start everything (image must be available as APP_IMAGE or built locally)
APP_IMAGE=barba-film-bot:latest docker compose up -d
```

Migrations run automatically via the `migrate` service before `api`, `bot`, and `worker` start.

## CI/CD (GitLab → AWS EC2)

The pipeline defined in `.gitlab-ci.yml` has three stages:

1. **lint** — `ruff check` (runs on `main`, `dev`, and MRs)
2. **build** — builds the Docker image and pushes it to the GitLab Container Registry (runs on `main`)
3. **deploy** — copies `docker-compose.yml` to the server and restarts services via SSH (runs on `main`)

### Required GitLab CI/CD variables

Set these in **Settings → CI/CD → Variables** (mark sensitive ones as _Protected_ and _Masked_):

| Variable | Description |
|----------|-------------|
| `SSH_PRIVATE_KEY` | EC2 SSH private key (PEM format) |
| `DEPLOY_HOST` | EC2 public IP or hostname |
| `DEPLOY_USER` | SSH user (`ubuntu` for Ubuntu AMIs, `ec2-user` for Amazon Linux) |
| `DEPLOY_DIR` | Absolute path to the project directory on the server (e.g. `/home/ubuntu/barba-film-bot`) |

### First-time server setup

```bash
# On the EC2 instance
mkdir -p ~/barba-film-bot
cd ~/barba-film-bot

# Create .env with production values
cp /path/to/.env.template .env
nano .env
```

After the first successful pipeline run the server will have the latest image running.
