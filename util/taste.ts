import { Client } from "pg";

export async function tasteFallbackCandidates(userId: string, limit = 400): Promise<string[]> {
  const client = new Client({ connectionString: process.env.DIRECT_URL });
  await client.connect();
  try {
    const { rows: vecRows } = await client.query(
      "SELECT taste FROM user_taste_vectors WHERE user_id = $1",
      [userId],
    );
    if (vecRows.length === 0) return [];
    const taste = vecRows[0].taste;
    const { rows: neigh } = await client.query(
      "SELECT user_id FROM user_taste_vectors ORDER BY taste <-> $1::vector LIMIT 200",
      [taste],
    );
    const ids = neigh.map((n) => n.user_id);
    if (ids.length === 0) return [];
    const { rows } = await client.query(
      "SELECT media_id FROM favorite_items WHERE user_id = ANY($1::bigint[]) ORDER BY added_at DESC LIMIT $2",
      [ids, limit],
    );
    return rows.map((r) => r.media_id as string);
  } finally {
    await client.end();
  }
}
