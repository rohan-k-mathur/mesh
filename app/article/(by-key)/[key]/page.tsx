
import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";
import { generateHTML } from "@tiptap/html"
import StarterKit from "@tiptap/starter-kit"

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
// ✅ SSR-safe align: uses data-attr + class, fully typed for TipTap
// const SSRTextAlign = TextAlign.extend({
//   addGlobalAttributes() {
//     return [
//       {
//         types: ["heading", "paragraph", "blockquote", "listItem"],
//         attributes: {
//           textAlign: {
//             default: null,
//             renderHTML: (attributes) => {
//               const align = attributes.textAlign;
//               if (!align) return {};
//               return {
//                 "data-align": align,   // e.g. data-align="center"
//                 class: `ta-${align}`,  // e.g. ta-center
//               };
//             },
//             parseHTML: (element) => {
//               // read from data-attr, then class, then fallback to inline style if present
//               const data = element.getAttribute("data-align");
//               if (data) return data;
//               const cls = element.getAttribute("class") || "";
//               const m = cls.match(/\bta-(left|right|center|justify)\b/);
//               if (m) return m[1];
//               // final fallback: inline style (if some old content still has it)
//               // @ts-ignore - style may be undefined on non-HTMLElement nodes in types, runtime it's fine
//               return element.style?.textAlign || null;
//             },
//           },
//         },
//       },
//     ];
//   },
// });

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
  // 🔁 Use the same extensions as the editor, but with SSRTextAlign
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
    />
  );
}
