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
  AlignJustify,
  Link2,
  Image as ImageIcon,
  Eraser,
} from "lucide-react";
import React from "react";
import '@/lib/tiptap/extensions/font-family'
import '@/lib/tiptap/extensions/font-size'

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
  className="text-sm border rounded"
  defaultValue=""
  onChange={(e) =>
    editor!.chain().focus().setMark('textStyle', { fontFamily: e.target.value }).run()
  }
>
  <option value="" disabled>Font</option>
  <option value="inherit">System Sans</option>
  <option value="'Founders', sans-serif">Founders</option>
  <option value="'Bugrino', serif">Bugrino</option>
  <option value="'New Edge Test', serif">New Edge Test</option>
  <option value="'Kolonia', serif">Kolonia</option>
</select>

      <select
  className="text-sm border rounded"
  defaultValue=""
  onChange={(e) => {
    const v = e.target.value
    if (!v) return
    if (v === 'unset') editor.chain().focus().unsetFontSize().run()
    else editor.chain().focus().setFontSize(v).run()
  }}
>
  <option value="" disabled>Size</option>
  <option value="unset">Default</option>
  <option value="12px">12</option>
  <option value="14px">14</option>
  <option value="16px">16</option>
  <option value="18px">18</option>
  <option value="20px">20</option>
  <option value="24px">24</option>
  <option value="32px">32</option>
  <option value="48px">48</option>
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
  <AlignJustify size={16} />,
  () => editor.chain().focus().setTextAlign("justify").run(),
  editor.isActive({ textAlign: "justify" }),
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
