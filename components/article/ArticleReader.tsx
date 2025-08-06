interface ArticleReaderProps {
  template: string;
  children: React.ReactNode;
}

export default function ArticleReader({ template, children }: ArticleReaderProps) {
  return <article className={template}>{children}</article>;
}
