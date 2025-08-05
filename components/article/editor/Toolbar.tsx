import { BubbleMenu, Editor } from "@tiptap/react";
import styles from "../article.module.scss";

interface ToolbarProps {
  editor: Editor | null;
}

export default function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

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
        B
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={editor.isActive("italic") ? styles.active : ""}
      >
        I
      </button>
      <button onClick={setLink} className={editor.isActive("link") ? styles.active : ""}>
        Link
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        className={editor.isActive("heading", { level: 1 }) ? styles.active : ""}
      >
        H1
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        className={editor.isActive("heading", { level: 2 }) ? styles.active : ""}
      >
        H2
      </button>
      <button
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        className={editor.isActive("heading", { level: 3 }) ? styles.active : ""}
      >
        H3
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={editor.isActive("blockquote") ? styles.active : ""}
      >
        Quote
      </button>
      <button
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={editor.isActive("codeBlock") ? styles.active : ""}
      >
        Code
      </button>
      {editor.isActive("image") && (
        <>
          <button onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}>
            Left
          </button>
          <button onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}>
            Center
          </button>
          <button onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}>
            Right
          </button>
        </>
      )}
    </BubbleMenu>
  );
}
