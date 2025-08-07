import ArticleEditor from "@/components/article/ArticleEditor"
export default function EditArticle({ params }: { params: { slug: string } }) {
    return <ArticleEditor articleId={params.slug} />
  }
  