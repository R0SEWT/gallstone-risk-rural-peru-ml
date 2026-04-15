FROM python:3.12-slim

RUN useradd -m -u 1000 user
USER user

ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_COMPILE_BYTECODE=1 \
    UV_LINK_MODE=copy

WORKDIR $HOME/app

COPY --from=ghcr.io/astral-sh/uv:0.7.13 /uv /uvx /bin/

COPY --chown=user pyproject.toml ./
RUN uv sync --no-dev

COPY --chown=user app ./app
COPY --chown=user models ./models

ENV PATH="$HOME/app/.venv/bin:$PATH"

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
