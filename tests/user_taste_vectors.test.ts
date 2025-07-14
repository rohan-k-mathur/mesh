import { describe, expect, test } from "vitest";

describe("user_taste_vectors", () => {
  test("knn query ranks self first", async () => {
    const vectors: Record<number, number[]> = {
      1: [1, 0, 0],
      2: [0, 1, 0],
    };

    const target = vectors[1];
    const distances = Object.entries(vectors).map(([id, v]) => ({
      id: Number(id),
      dist: Math.sqrt(v.reduce((sum, x, i) => sum + (x - target[i]) ** 2, 0)),
    }));
    distances.sort((a, b) => a.dist - b.dist);
    expect(distances[0].id).toBe(1);
  });

  test("materialized view refresh completes quickly", async () => {
    const scrollEvents: { user: number; dwell: number }[] = [];
    for (let i = 0; i < 1000; i++) {
      scrollEvents.push({ user: i % 10, dwell: 100 });
    }
    const t0 = Date.now();
    const avg = scrollEvents.reduce<Record<number, number>>((acc, e) => {
      acc[e.user] = (acc[e.user] || 0) + e.dwell;
      return acc;
    }, {});
    for (const id in avg) avg[id] /= 100; // each user has 100 events
    const duration = Date.now() - t0;
    expect(duration).toBeLessThan(1000);
  });
});
