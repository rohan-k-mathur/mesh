
import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";
import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"
import DeepDivePanel from '@/components/deepdive/DeepDivePanel';
import { getOrCreateDeliberationId } from '@/lib/deepdive/upsert';
import { getCurrentUserId } from "@/lib/serverutils";

import { createLowlight } from "lowlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";

import Highlight from "@tiptap/extension-highlight"
import Underline from "@tiptap/extension-underline"
import { SSRTextAlign } from "@/lib/tiptap/extensions/ssr-text-align"
import { BlockStyleTokens } from "@/lib/tiptap/extensions/block-style-ssr"
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


    // Optional - who owns the upsert (fallback to 'system' if unauth)
    const userId = await getCurrentUserId ().catch(() => null);
    const deliberationId = await getOrCreateDeliberationId(
      'article',
      article.id,
      article.roomId ?? null,
      userId ?? 'system'
    );

  const threadsDb = await prisma.commentThread.findMany({
    where: { articleId: article.id },
    include: { comments: { orderBy: { createdAt: "asc" } } },
    orderBy: { createdAt: "asc" },
  });

    const lowlight = createLowlight();
    lowlight.register("js", javascript);
    lowlight.register("ts", typescript);
    lowlight.register("py", python);
    lowlight.register("sh", bash);
  
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
  // 🔁 Use the same extensions as the editor, but with SSRTextAlign
  const html = generateHTML(article.astJson as any, [
    StarterKit,
    Highlight,
    Underline,
    CodeBlockLowlight.configure({ lowlight }),
    TaskList,
    TaskItem,
    CustomImage,
    PullQuote,
    Callout,
    MathBlock,
    MathInline,
    Link,
    SSRTextAlign,     // ⬅️ use our SSR-safe aligner
    TextStyleTokens,  // ⬅️ your fs/ff/clr tokenizer
    BlockStyleTokens,

  ]);

  
  return (
    <ArticleReaderWithPins
    template={article.template}
    heroSrc={article.heroImageKey}
    html={html}
    threads={threads}
    articleSlug={params.key} 
    title={article.title}     // ⬅️ pass it
    deliberationId={deliberationId}
    />
  );
}
