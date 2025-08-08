ALTER TYPE "feed_post_type" ADD VALUE IF NOT EXISTS 'LIBRARY';

CREATE TABLE "stacks" (
  "id" TEXT PRIMARY KEY,
  "owner_id" BIGINT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "is_public" BOOLEAN DEFAULT false,
  "order" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  "parent_id" TEXT,
  CONSTRAINT "stacks_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "stacks_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "stacks"("id") ON DELETE SET NULL
);

CREATE TABLE "library_posts" (
  "id" TEXT PRIMARY KEY,
  "uploader_id" BIGINT NOT NULL,
  "stack_id" TEXT,
  "title" TEXT,
  "page_count" INTEGER NOT NULL,
  "file_url" TEXT NOT NULL,
  "thumb_urls" TEXT[] NOT NULL DEFAULT '{}'::TEXT[],
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "library_posts_uploader_id_fkey" FOREIGN KEY ("uploader_id") REFERENCES "users"("id") ON DELETE CASCADE,
  CONSTRAINT "library_posts_stack_id_fkey" FOREIGN KEY ("stack_id") REFERENCES "stacks"("id") ON DELETE SET NULL
);

CREATE INDEX "library_posts_uploader_id_idx" ON "library_posts" ("uploader_id");
CREATE INDEX "library_posts_stack_id_idx" ON "library_posts" ("stack_id");

CREATE TABLE "annotations" (
  "id" TEXT PRIMARY KEY,
  "post_id" TEXT NOT NULL,
  "page" INTEGER NOT NULL,
  "rect" JSONB NOT NULL,
  "text" TEXT NOT NULL,
  "author_id" BIGINT NOT NULL,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT "annotations_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "library_posts"("id") ON DELETE CASCADE,
  CONSTRAINT "annotations_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "users"("id") ON DELETE CASCADE
);

CREATE INDEX "annotations_post_id_idx" ON "annotations" ("post_id");

ALTER TABLE "feed_posts" ADD COLUMN "library_post_id" TEXT;
ALTER TABLE "feed_posts" ADD COLUMN "stack_id" TEXT;
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_library_post_id_fkey" FOREIGN KEY ("library_post_id") REFERENCES "library_posts"("id") ON DELETE SET NULL;
ALTER TABLE "feed_posts" ADD CONSTRAINT "feed_posts_stack_id_fkey" FOREIGN KEY ("stack_id") REFERENCES "stacks"("id") ON DELETE SET NULL;
CREATE INDEX "feed_posts_library_post_id_idx" ON "feed_posts" ("library_post_id");
CREATE INDEX "feed_posts_stack_id_idx" ON "feed_posts" ("stack_id");
