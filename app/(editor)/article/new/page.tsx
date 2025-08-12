// "use client";

// import { useEffect, useState } from "react";
// import { nanoid } from "nanoid";
// import { useRouter } from "next/navigation";
// // import ArticleEditor from "@/components/article/ArticleEditor";
// import dynamic from 'next/dynamic';
// const ArticleEditor = dynamic(
//   () => import('@/components/article/ArticleEditor'),
//   { ssr: false }      // ⬅️  disables server-side render for this component
// );
// export default function NewArticlePage() {
//   const [articleId, setArticleId] = useState<string | null>(null);
//   const router = useRouter();
//   const KEY = "draftArticleId";

//   useEffect(() => {
//     (async () => {
//       const stored = localStorage.getItem(KEY);
//       if (stored) {
//         const check = await fetch(`/api/articles/${stored}`);
//         if (check.ok) {
//           setArticleId(stored);
//           router.replace(`/article/by-id/${stored}/edit`); // edit by ID
//           return;
//         }
//         localStorage.removeItem(KEY); // stale id
//       }
      
//       const res = await fetch('/api/articles', {          
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           authorId: "anon",
//           title: "Untitled",
//           slug: nanoid(),
//           astJson: { type: "doc", content: [] },
//         }),
//       });
//       const data = await res.json();
//       setArticleId(data.id);
//       localStorage.setItem(KEY, data.id);

//       // localStorage.setItem("draftArticleId", data.id);

//         // friendly URL; prevents “undefined” on refresh
//         router.replace(`/article/by-id/${data.id}/edit`);
//       })();
//     }, [router]);
  
//     if (!articleId) return <div>Loading...</div>;
//     return <ArticleEditor articleId={articleId} />;
//   }
// app/(editor)/article/new/page.tsx
'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function NewArticlePage() {
  const router = useRouter()
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true;

    (async () => {
      const KEY = 'draftArticleId'

      try {
        // 1) Reuse an existing local draft id if it still exists server-side
        const existing = localStorage.getItem(KEY)
        if (existing) {
          const check = await fetch(`/api/articles/${existing}`, { cache: 'no-store' })
          if (check.ok) {
            router.replace(`/article/by-id/${existing}/edit`)
            return
          }
          localStorage.removeItem(KEY) // stale id
        }

        // 2) Create a fresh draft (no body needed)
        const res = await fetch('/api/articles', { method: 'POST' })
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        if (!res.ok) throw new Error(await res.text())
        const { id } = await res.json()

        localStorage.setItem(KEY, id)
        router.replace(`/article/by-id/${id}/edit`)
      } catch (err) {
        console.error('Failed to create draft:', err)
        router.replace('/profile/articles')
      }
    })()
  }, [router])

  return <div className="p-6 text-sm text-neutral-600">Creating draft…</div>
}
