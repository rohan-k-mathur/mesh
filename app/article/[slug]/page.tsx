import { prisma } from "@/lib/prismaclient";
import styles from "@/components/article/article.module.scss";
import { notFound } from "next/navigation";
import { generateHTML } from "@tiptap/html";
import StarterKit from "@tiptap/starter-kit";
import TipTapImage from "@tiptap/extension-image";
import Image from "next/image";

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
    <div className={`${styles.article} ${styles[article.template as "standard" | "feature" | "interview"]}`}>
      {article.heroImageKey && (
        <Image
          src={article.heroImageKey}
          alt="hero"
          width={800}
          height={400}
          className={styles.hero}
        />
      )}
      <div dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
