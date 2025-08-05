import { BubbleMenu, Editor } from "@tiptap/react";
import styles from "../article.module.scss";
import enStrings from "@/public/locales/en/editor.json";

interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;
  const t = (key: string) =>
  ((window as any)?.i18next?.t?.(`editor:${key}`) as string) ||
  (enStrings as any)[key] ||
  key;
  const setLink = () => {
    const url = window.prompt("URL");
    if (url) {
      editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
    }
  };

  return (
    <BubbleMenu editor={editor} tippyOptions={{ duration: 100 }} className={styles.toolbar}>
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={editor.isActive("bold") ? styles.active : ""}
      >
                {t("bold")}

      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? styles.active : ""}
      >
               {t("italic")}

      </button>
      <button onClick={setLink} className={editor.isActive("link") ? styles.active : ""}>
      {t("link")}
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? styles.active : ""}
      >
                {t("h1")}

      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}
      >
                {t("h2")}

      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? styles.active : ""}
      >
          {t("h3")}
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? styles.active : ""}
      >
        {t("quote")}
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? styles.active : ""}
      >
                {t("code")}

      </button>
      {editor.isActive("image") && (
        <>
          <button onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}>
          {t("left")}

          </button>
          <button onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}>
          {t("center")}

          </button>
          <button onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}>
          {t("right")}

          </button>
        </>
      )}
    </BubbleMenu>
  );
}
