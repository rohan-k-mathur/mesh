import os
import sys
import json
import logging
from pathlib import Path
from typing import Any, List

import psycopg2
import openai
from jsonschema import validate, ValidationError

ACTIVE_USER_SQL = """
  SELECT user_id
  FROM users
  WHERE last_login > now() - interval '30 days';
"""

BUDGET_PER_RUN = 0.005  # dollars / user
SCHEMA_PATH = Path(__file__).resolve().parent.parent / "config" / "trait_schema.json"
with open(SCHEMA_PATH) as f:
    TRAIT_SCHEMA = json.load(f)

PROMPT_SYSTEM = "You analyze user favorites and return traits JSON"

logger = logging.getLogger(__name__)

class TraitError(Exception):
    pass


class DB:
    def __init__(self) -> None:
        self.conn = psycopg2.connect(os.environ.get("DATABASE_URL"))

    def fetch(self, query: str) -> List[Any]:
        with self.conn.cursor() as cur:
            cur.execute(query)
            return [row[0] for row in cur.fetchall()]

    def execute(self, query: str, params: tuple) -> None:
        with self.conn.cursor() as cur:
            cur.execute(query, params)
        self.conn.commit()


db = DB()


def weekly_budget() -> float:
    return float(os.environ.get("OPENAI_WEEKLY_BUDGET", "100"))


def projected_cost(n_users: int) -> float:
    return n_users * BUDGET_PER_RUN


def fetch_top_favs(uid: Any, limit: int = 15) -> List[str]:
    sql = (
        "SELECT media_title FROM favorite_item WHERE user_id = %s "
        "ORDER BY added_at DESC LIMIT %s"
    )
    with db.conn.cursor() as cur:
        cur.execute(sql, (uid, limit))
        return [r[0] for r in cur.fetchall()]


def build_prompt(favs: List[str]) -> str:
    joined = "\n".join(favs)
    return f"User favorites:\n{joined}\nReturn JSON traits."


def validate_json(data: dict) -> bool:
    try:
        validate(data, TRAIT_SCHEMA)
        return True
    except ValidationError:
        return False


def upsert_traits(uid: Any, traits: dict) -> None:
    db.execute(
        """
        INSERT INTO user_taste_vectors (user_id, traits)
        VALUES (%s, %s::jsonb)
        ON CONFLICT (user_id) DO UPDATE SET traits = EXCLUDED.traits;
        """,
        (uid, json.dumps(traits)),
    )


def record_cost(uid: Any, tokens: int) -> None:
    db.execute(
        "INSERT INTO openai_costs(date, job, user_id, tokens) VALUES (CURRENT_DATE, 'trait_inference', %s, %s)",
        (uid, tokens),
    )


def process_user(uid: Any) -> int:
    favs = fetch_top_favs(uid, 15)
    prompt = build_prompt(favs)
    for _ in range(3):
        resp = openai.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": PROMPT_SYSTEM},
                {"role": "user", "content": prompt},
            ],
            response_format={"type": "json_object"},
        )
        try:
            traits = json.loads(resp.choices[0].message.content)
        except json.JSONDecodeError:
            continue
        if validate_json(traits):
            upsert_traits(uid, traits)
            record_cost(uid, resp.usage.total_tokens)
            return resp.usage.total_tokens
    raise TraitError("Trait generation failed")


def main() -> None:
    users = db.fetch(ACTIVE_USER_SQL)
    est_cost = projected_cost(len(users))
    if est_cost > 0.8 * weekly_budget():
        sys.exit("Would exceed budget")

    for uid in users:
        try:
            process_user(uid)
        except TraitError:
            logger.error("Trait generation failed after retries", extra={"uid": uid})


if __name__ == "__main__":
    main()
