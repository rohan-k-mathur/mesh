export interface RunOptions {
  userId?: string;
  since?: string;
}

export interface RunResult {
  favoritesProcessed: number;
  embeddingsRequested: number;
  tokensUsed: number;
  usersUpdated: number;
}

let pcaCache: number[][] | null = null;

async function loadPcaMatrix(): Promise<number[][]> {
  if (pcaCache) return pcaCache;
  const url = process.env.PCA_MATRIX_URL;
  if (url) {
    const res = await fetch(url);
    pcaCache = (await res.json()) as number[][];
  } else {
    // identity fallback
    pcaCache = Array.from({ length: 256 }, (_, i) => {
      const row = Array(768).fill(0);
      if (i < 768) row[i] = 1;
      return row;
    });
  }
  return pcaCache;
}

export function project(emb: number[], pca: number[][]): number[] {
  const out = new Array(pca.length).fill(0);
  for (let i = 0; i < pca.length; i++) {
    let sum = 0;
    const row = pca[i];
    for (let j = 0; j < emb.length; j++) sum += row[j] * emb[j];
    out[i] = sum;
  }
  return out;
}

export async function run(opts: RunOptions = {}): Promise<RunResult> {
  const prisma = (await import("@/lib/prismaclient")).prisma;
  const since = opts.since ? new Date(opts.since) : new Date(0);
  const favorites = await prisma.favoriteItem.findMany({
    where: {
      addedAt: { gt: since },
      ...(opts.userId ? { userId: BigInt(opts.userId) } : {}),
    },
    include: { media: true },
    orderBy: { addedAt: "desc" },
  });

  let embeddingsRequested = 0;
  let tokensUsed = 0;

  for (const fav of favorites) {
    if (!fav.media.embedding || fav.media.embedding.length === 0) {
      const res = await fetch(
        process.env.EMBEDDING_URL || "http://localhost:3000/api/embed",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId: fav.mediaId }),
        },
      );
      const body = await res.json();
      embeddingsRequested++;
      tokensUsed += body?.usage?.total_tokens ?? 0;
    }
  }

  const pca = await loadPcaMatrix();
  const byUser: Record<string, number[][]> = {};
  for (const fav of favorites) {
    if (!fav.media.embedding) continue;
    const uid = String(fav.userId);
    byUser[uid] = byUser[uid] || [];
    byUser[uid].push(fav.media.embedding as unknown as number[]);
  }

  const usersUpdated = Object.keys(byUser).length;
  for (const uid of Object.keys(byUser)) {
    const embs = byUser[uid].slice(0, 1000);
    const vec = new Array(pca.length).fill(0);
    for (const e of embs) {
      const proj = project(e, pca);
      for (let i = 0; i < proj.length; i++) vec[i] += proj[i];
    }
    for (let i = 0; i < vec.length; i++) vec[i] /= embs.length;
    await prisma.$executeRaw`INSERT INTO user_taste_vectors (user_id, taste, updated_at) VALUES (${BigInt(
      uid,
    )}, ${vec}::vector, NOW()) ON CONFLICT (user_id) DO UPDATE SET taste = ${vec}::vector, updated_at = NOW()`;
  }

  return {
    favoritesProcessed: favorites.length,
    embeddingsRequested,
    tokensUsed,
    usersUpdated,
  };
}
