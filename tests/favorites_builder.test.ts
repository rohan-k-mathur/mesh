import { project } from "@/jobs/favorites_builder";

test("projection returns 256 dims", () => {
  const pca = Array.from({ length: 256 }, (_, i) => {
    const row = Array(768).fill(0);
    row[i] = 1;
    return row;
  });
  const emb = Array(768).fill(0);
  emb[0] = 1;
  const vec = project(emb, pca);
  expect(vec).toHaveLength(256);
  expect(vec[0]).toBe(1);
});
