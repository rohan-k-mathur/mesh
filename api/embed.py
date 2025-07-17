import os
import json
import asyncio
import time
from typing import Any, List

import asyncpg
import numpy as np
import openai
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel



app = FastAPI()
class EmbedRequest(BaseModel):
    mediaId: str     


async def db():                         # tiny helper
    return await asyncpg.connect(os.environ["DATABASE_URL"])

async def get_db() -> asyncpg.Connection:
    return await asyncpg.connect(os.environ.get("DATABASE_URL"))


def remaining_budget() -> float:
    try:
        return float(os.environ.get("OPENAI_BUDGET_REMAINING", "10"))
    except ValueError:
        return 10.0


# async def create_embedding(text: str) -> List[float]:
#     resp = await asyncio.to_thread(
#         openai.embeddings.create,
#         input=[text],
#         model="text-embedding-3-large",
#     )
#     vec = resp.data[0].embedding
#     arr = np.array(vec, dtype=np.float32).reshape(768, 4)
#     down = arr.mean(axis=1).astype(np.float16)
#     return down.tolist()


async def create_embedding(text: str) -> List[float]:
    resp = await asyncio.to_thread(
        openai.embeddings.create,
        input=[text],
        model="text-embedding-3-large",
    )
    # down-sample 768 → 256 (mean-pool every 3 floats)
    vec = resp.data[0].embedding
    arr = np.array(vec, dtype=np.float32).reshape(256, 3)
    return arr.mean(axis=1).astype(np.float16).tolist()

# class EmbedRequest(BaseModel):
#     mediaId: str


@app.post("/")                          
async def handle(req: EmbedRequest) -> Any:
    media_id = req.mediaId
    conn = await db()
    try:
        row = await conn.fetchrow("""
            SELECT title, description, tags, embedding
            FROM canonical_media
            WHERE id = $1
        """, media_id)

        if not row:
            raise HTTPException(status_code=404, detail="media not found")

        # cache hit
        if row["embedding"]:
            return {"embedding": row["embedding"], "cached": True}

        if float(os.getenv("OPENAI_BUDGET_REMAINING", "10")) < 5.0:
            raise HTTPException(status_code=507, detail="budget exhausted")

        text = " ".join(
            filter(None, [
                row["title"],
                row["description"] or "",
                " ".join((row["tags"] or [])[:3]),
            ])
        )

        t0 = time.perf_counter()
        vec = await create_embedding(text)
        latency_ms = int((time.perf_counter() - t0) * 1000)

        await conn.execute("""
            UPDATE canonical_media SET embedding = $1 WHERE id = $2
        """, vec, media_id)

        print(json.dumps({"mediaId": media_id, "latency_ms": latency_ms}))
        return {"embedding": vec, "cached": False}

    finally:
        await conn.close()

# --- health probe -----------------------------------------------------------
@app.get("/healthz")
async def health():
    return {"status": "ok"}