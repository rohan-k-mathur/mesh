"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
// import ArticleEditor from "@/components/article/ArticleEditor";
import dynamic from 'next/dynamic';
const ArticleEditor = dynamic(
  () => import('@/components/article/ArticleEditor'),
  { ssr: false }      // ⬅️  disables server-side render for this component
);
export default function NewArticlePage() {
  const [articleId, setArticleId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      const stored = localStorage.getItem("draftArticleId");
      if (stored) {
        setArticleId(stored);
        return;
      }
      const slug = nanoid();
      const res = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: "anon",
          title: "Untitled",
          slug,
          astJson: { type: "doc", content: [] },
        }),
      });
      const data = await res.json();
      setArticleId(data.id);
      localStorage.setItem("draftArticleId", data.id);

        // friendly URL; prevents “undefined” on refresh
  router.replace(`/article/${data.id}/edit`)
  return
    }
    init();
  }, []);

  if (!articleId) return <div>Loading...</div>;

  return <ArticleEditor articleId={articleId} />;
}
