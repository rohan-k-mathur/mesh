
import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";
import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"

import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import TextAlign from "@tiptap/extension-text-align"
import Link from "@tiptap/extension-link"
import ArticleReaderWithPins from "@/components/article/ArticleReaderWithPins"
import {
  PullQuote,
  Callout,
  MathBlock,
  MathInline,
  CustomImage,
} from "@/lib/tiptap/extensions"

import TaskList from "@tiptap/extension-task-list"
import TaskItem from "@tiptap/extension-task-item"
import { TextStyleTokens } from "@/lib/tiptap/extensions/text-style-ssr";

export default async function ArticlePage({
  params,
}: { params: { key: string } }) {
  const key = params.key;
  const where = /^[0-9a-f-]{36}$/i.test(key) ? { id: key } : { slug: key };
  const article = await prisma.article.findUnique({ where });
  if (!article) notFound();



  const threadsDb = await prisma.commentThread.findMany({
    where: { articleId: article.id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });


  const threads = threadsDb.map(t => ({
    id: t.id,
    articleId: t.articleId,
    anchor: t.anchor as any,
    resolved: t.resolved,
    createdBy: t.createdBy,
    createdAt: t.createdAt.toISOString(),
    comments: t.comments.map(c => ({
      id: c.id,
      threadId: c.threadId,
      body: c.body,
      createdBy: c.createdBy,
      createdAt: c.createdAt.toISOString(),
      upvotes: c.upvotes,
      downvotes: c.downvotes,
    })),
  }));
  /* 2️⃣ convert TipTap JSON → HTML (use SAME extensions as editor) */
  const html = generateHTML(article.astJson as any, [
    StarterKit,
    
    Highlight,
    Underline,
   
    TaskList,
    TaskItem,
    CustomImage,
    PullQuote,
    Callout,
    MathBlock,
    MathInline,
    Link,
    TextAlign.configure({
      types: ["heading", "paragraph", "blockquote", "listItem"],
      alignments: ["left", "center", "right", "justify"],
    }),
    TextStyleTokens, // ⬅️ last
  ])
  
  return (
    <ArticleReaderWithPins
    template={article.template}
    heroSrc={article.heroImageKey}
    html={html}
    threads={threads}
    articleSlug={params.key} 
    />
  );
}
