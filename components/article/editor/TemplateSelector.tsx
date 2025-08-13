"use client";

import styles from "../article.module.scss";
import { ARTICLE_TEMPLATES } from "../templates";

interface TemplateSelectorProps {
  articleId: string;
  template: string;
  onChange: (t: string) => void;
}

export default function TemplateSelector({ articleId, template, onChange }: TemplateSelectorProps) {
  const handleSelect = async (id: string) => {
    onChange(id);
    await fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({  id }),
    });
  };

  return (
    <div className={styles.templateSelector}>
      {ARTICLE_TEMPLATES.map((t) => (
        <button
          key={t.id}
          onClick={() => handleSelect(t.id)}
          className=" px-2 py-1 rounded-xl bg-white/70 savebutton"
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
