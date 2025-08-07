
import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import { FontFamily } from "@/components/article/extensions/font-family";

import ImageExt from "@tiptap/extension-image";
// import TipTapLink       from '@tiptap/extension-link'
import TextStyle from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Highlight from "@tiptap/extension-highlight";
import TextAlign from "@tiptap/extension-text-align";
import ArticleReader from "@/components/article/ArticleReader"; // your wrapper
import HeroRenderer from "@/components/article/HeroRenderer"; // optional
import { EditorContent } from "@tiptap/react";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import CharacterCount from "@tiptap/extension-character-count";
import Color from "@tiptap/extension-color";
import {
  PullQuote,
  Callout,
  MathBlock,
  MathInline,
  CustomImage,
} from "@/lib/tiptap/extensions";

import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";


export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  /* 1️⃣ fetch the published record */
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
  });
  if (!article) notFound();

  /* 2️⃣ convert TipTap JSON → HTML (use SAME extensions as editor) */
  const html = generateHTML(article.astJson as any, [
      // marks first
  TextStyle,
  Color,
  FontFamily,
  Underline,
  Highlight,

  // nodes
  StarterKit,
  ImageExt,
  CustomImage,
  PullQuote,
  Callout,
  MathBlock,
  MathInline,
  TaskList,
  TaskItem,

  // utilities
  Link,
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
])

  // /* 3️⃣ wrap in the selected template */
  // return (
  // <ArticleReader template={article.template} heroSrc={article.heroImageKey}>
  //     {article.heroImageKey && (
  //       <HeroRenderer src={article.heroImageKey} template={article.template} />
  //     )}

  //     {/* ⬇⬇ dangerous but fine – content is trusted user input */}
  //     <div
  //     className="ProseMirror"
  //     dangerouslySetInnerHTML={{ __html: html }}
  //   />
  // </ArticleReader>
  return (
    <ArticleReader template={article.template} heroSrc={article.heroImageKey}>
    {article.heroImageKey && (
      <HeroRenderer
        src={article.heroImageKey}
        template={article.template}
      />
    )}
  
    {/* TipTap HTML goes here */}
    <div
  className="ProseMirror prose prose-slate lg:prose-lg"
  dangerouslySetInnerHTML={{ __html: html }}
/>
  </ArticleReader>
  );
}
