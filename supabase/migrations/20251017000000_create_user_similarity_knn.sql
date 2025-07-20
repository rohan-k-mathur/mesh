CREATE TABLE IF NOT EXISTS user_similarity_knn (
  user_id      BIGINT    NOT NULL,
  neighbour_id BIGINT    NOT NULL,
  sim          REAL      NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, neighbour_id)
);

CREATE INDEX IF NOT EXISTS user_taste_vectors_ivfflat
  ON user_taste_vectors
  USING ivfflat (taste vector_cosine_ops)
  WITH (lists = 100);
