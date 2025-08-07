import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link2,
  Image as ImageIcon,
  Eraser,
} from "lucide-react";
import React from "react";

type Props = { editor: Editor | null };

export default function Toolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (
    icon: React.ReactNode,
    onClick: () => void,
    active = false,
  ) => (
    <button
      onClick={onClick}
      className={`p-1.5 ${active ? "bg-neutral-200" : ""}`}
      type="button"
    >
      {icon}
    </button>
  );

  return (
    <div className="flex flex-wrap items-center gap-1 border rounded-md px-2 py-1 bg-white">
      <select
        onChange={(e) =>
          editor.chain().focus().setFontFamily(e.target.value).run()
        }
        className="text-sm border rounded"
        defaultValue=""
      >
        <option value="" disabled>
          Font
        </option>
        <option value="inherit">Sans Serif</option>
        <option value="Georgia,serif">Serif</option>
        <option value="Mercury,serif">Mercury</option>
      </select>

      {btn(
        <Bold size={16} />,
        () => editor.chain().focus().toggleBold().run(),
        editor.isActive("bold"),
      )}
      {btn(
        <Italic size={16} />,
        () => editor.chain().focus().toggleItalic().run(),
        editor.isActive("italic"),
      )}
      {btn(
        <Underline size={16} />,
        () => editor.chain().focus().toggleUnderline().run(),
        editor.isActive("underline"),
      )}
      {btn(
        <Strikethrough size={16} />,
        () => editor.chain().focus().toggleStrike().run(),
        editor.isActive("strike"),
      )}
      {btn(
        <Code size={16} />,
        () => editor.chain().focus().toggleCode().run(),
        editor.isActive("code"),
      )}

      <input
        type="color"
        onChange={(e) =>
          editor.chain().focus().setColor(e.target.value).run()
        }
        className="h-5 w-5 p-[1px] cursor-pointer"
      />

      {btn(
        <List size={16} />,
        () => editor.chain().focus().toggleBulletList().run(),
        editor.isActive("bulletList"),
      )}
      {btn(
        <ListOrdered size={16} />,
        () => editor.chain().focus().toggleOrderedList().run(),
        editor.isActive("orderedList"),
      )}
      {btn(
        <ListChecks size={16} />,
        () => editor.chain().focus().toggleTaskList().run(),
        editor.isActive("taskList"),
      )}

      {btn(
        <AlignLeft size={16} />,
        () => editor.chain().focus().setTextAlign("left").run(),
        editor.isActive({ textAlign: "left" }),
      )}
      {btn(
        <AlignCenter size={16} />,
        () => editor.chain().focus().setTextAlign("center").run(),
        editor.isActive({ textAlign: "center" }),
      )}
      {btn(
        <AlignRight size={16} />,
        () => editor.chain().focus().setTextAlign("right").run(),
        editor.isActive({ textAlign: "right" }),
      )}

      {btn(
        <Quote size={16} />,
        () => editor.chain().focus().toggleBlockquote().run(),
        editor.isActive("blockquote"),
      )}

      {btn(
        <Link2 size={16} />,
        () => {
          const url = prompt("URL")?.trim();
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
        editor.isActive("link"),
      )}
      {btn(
        <ImageIcon size={16} />,
        () => {
          document
            .querySelector<HTMLInputElement>("#image-upload")?.click();
        },
      )}
      {btn(
        <Eraser size={16} />,
        () => editor.chain().focus().clearNodes().unsetAllMarks().run(),
      )}
    </div>
  );
}
