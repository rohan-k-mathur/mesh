// scripts/generateEmbeddings.ts
import 'dotenv/config';
import { prisma }          from '@/lib/prismaclient';
import OpenAI              from 'openai';
import pLimit              from 'p-limit';
import { PCA }             from 'ml-pca';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });
const BATCH  = 100;                // fetch 100 tracks per round
const limit  = pLimit(5);          // 5 parallel OpenAI calls

async function main() {
  // 1. find tracks with no embedding yet
  const missing = await prisma.$queryRaw<
    { id: string; name: string; artists: string }[]
  >`
    SELECT t.id, t.name, a.artists
    FROM   tracks     t
    JOIN   (
        SELECT track_id,
               string_agg(artist_name, ', ') AS artists
        FROM   track_artists
        GROUP  BY track_id
    ) a ON t.id = a.track_id
    WHERE  NOT EXISTS (
      SELECT 1 FROM track_embedding e WHERE e.id = t.id
    )
    LIMIT ${BATCH}
  `;

  if (missing.length === 0) {
    console.log('✓ no missing embeddings');
    return;
  }

  console.log('Embedding', missing.length, 'tracks …');

  /* ------------------------------------------------------------------ */
  // 2. OpenAI embeddings in parallel
  const rawVectors = await Promise.all(
    missing.map(m =>
      limit(async () => {
        const prompt = `${m.name} by ${m.artists}`;
        const { data } = await openai.embeddings.create({
          model: 'text-embedding-3-small',
          input: prompt,
        });
        return data[0].embedding;          // 1536‑d float[]
      })
    )
  );

  /* ------------------------------------------------------------------ */
  // 3. PCA → 512‑d
  const pca = new PCA(rawVectors);
  const reduced = pca.predict(rawVectors, { nComponents: 512 }).to2DArray();

  /* ------------------------------------------------------------------ */
  // 4. bulk‑insert
  await prisma.$transaction(
    missing.map((m, i) =>
      prisma.trackEmbedding.upsert({
        where:  { id: m.id },
        create: { id: m.id, vector: reduced[i] },
        update: { vector: reduced[i] },
      })
    )
  );

  console.log('✓ stored', reduced.length, 'vectors');
}

main().catch(e => { console.error(e); process.exit(1); });
