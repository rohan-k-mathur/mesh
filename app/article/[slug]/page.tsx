import { prisma } from "@/lib/prismaclient";
import { notFound } from "next/navigation";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TipTapImage from "@tiptap/extension-image";
import ArticleReader from "@/components/article/ArticleReader";
import HeroRenderer from "@/components/article/HeroRenderer";

export default async function ArticlePage({
  params,
}: {
  params: { slug: string };
}) {
  const article = await prisma.article.findUnique({
    where: { slug: params.slug },
  });
  if (!article) {
    notFound();
  }
  const html = generateHTML(article.astJson as any, [StarterKit, TipTapImage]);
  return (
    <ArticleReader template={article.template}>
      {article.heroImageKey && (
        <HeroRenderer src={article.heroImageKey} template={article.template} />
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </ArticleReader>
  );
}

