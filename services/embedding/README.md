# Embedding Service

This microservice exposes user-interest embeddings via REST and gRPC.

## Development

```bash
cd services/embedding
poetry install
uvicorn main:app --reload
```

## Docker

```bash
docker-compose up --build
```

## Tests

```bash
pytest
```
