"use client";

import { useEffect, useState } from "react";
import { nanoid } from "nanoid";
import { useRouter } from "next/navigation";
// import ArticleEditor from "@/components/article/ArticleEditor";
import dynamic from 'next/dynamic';
const ArticleEditor = dynamic(
  () => import('@/components/article/ArticleEditor'),
  { ssr: false }      // ⬅️  disables server-side render for this component
);
export default function NewArticlePage() {
  const [articleId, setArticleId] = useState<string | null>(null);
  const router = useRouter();
  const KEY = "draftArticleId";

  useEffect(() => {
    (async () => {
      const stored = localStorage.getItem(KEY);
      if (stored) {
        const check = await fetch(`/api/articles/${stored}`);
        if (check.ok) {
          setArticleId(stored);
          router.replace(`/article/${stored}/edit`); // edit by ID
          return;
        }
        localStorage.removeItem(KEY); // stale id
      }
      
      const res = await fetch('/api/articles', {          
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          authorId: "anon",
          title: "Untitled",
          slug: nanoid(),
          astJson: { type: "doc", content: [] },
        }),
      });
      const data = await res.json();
      setArticleId(data.id);
      localStorage.setItem(KEY, data.id);

      // localStorage.setItem("draftArticleId", data.id);

        // friendly URL; prevents “undefined” on refresh
        router.replace(`/article/${data.id}/edit`);
      })();
    }, [router]);
  
    if (!articleId) return <div>Loading...</div>;
    return <ArticleEditor articleId={articleId} />;
  }