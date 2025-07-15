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


async def get_db() -> asyncpg.Connection:
    return await asyncpg.connect(os.environ.get("DATABASE_URL"))


def remaining_budget() -> float:
    try:
        return float(os.environ.get("OPENAI_BUDGET_REMAINING", "10"))
    except ValueError:
        return 10.0


async def create_embedding(text: str) -> List[float]:
    resp = await asyncio.to_thread(
        openai.embeddings.create,
        input=[text],
        model="text-embedding-3-large",
    )
    vec = resp.data[0].embedding
    arr = np.array(vec, dtype=np.float32).reshape(768, 4)
    down = arr.mean(axis=1).astype(np.float16)
    return down.tolist()


class EmbedRequest(BaseModel):
    mediaId: str


@app.post("/api/embed")
async def handle(req: EmbedRequest) -> Any:
    media_id = req.mediaId
    db = await get_db()
    try:
        row = await db.fetchrow(
            "SELECT title, description, tags, embedding FROM canonical_media WHERE id=$1",
            media_id,
        )
        if not row:
            raise HTTPException(status_code=404, detail="media not found")

        if row["embedding"] is not None:
            return {"embedding": row["embedding"], "cached": True}

        if remaining_budget() < 5:
            raise HTTPException(status_code=500, detail="budget exhausted")

        text = " ".join(
            filter(
                None,
                [
                    row["title"],
                    row.get("description") or "",
                    " ".join((row.get("tags") or [])[:3]),
                ],
            )
        )
        try:
            start = time.perf_counter()
            vec = await create_embedding(text)
            latency = time.perf_counter() - start
        except openai.RateLimitError as e:
            raise HTTPException(status_code=429, detail="rate limited") from e

        await db.execute(
            "UPDATE canonical_media SET embedding=$1 WHERE id=$2",
            vec,
            media_id,
        )

        print(
            json.dumps(
                {
                    "mediaId": media_id,
                    "cached": False,
                    "latency_ms": int(latency * 1000),
                }
            )
        )
        return {"embedding": vec, "cached": False}
    finally:
        await db.close()
