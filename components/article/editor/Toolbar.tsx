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
  // Toolbar.tsx (only the changed parts)
const fontOptions = [
  { label: 'System Sans',   value: 'system'  },
  { label: 'Founders',      value: 'founders'},
  { label: 'Bugrino',       value: 'bugrino' },
  { label: 'New Edge Test', value: 'newedge' },
  { label: 'Kolonia',       value: 'kolonia' },
]

const sizeOptions = ['12','14','16','18','20','24','32','48']

const colorOptions = [
  { label: 'Accent', value: 'accent' },
  { label: 'Muted',  value: 'muted'  },
  { label: 'Red',    value: 'red'    },
]


  return (
    <div className="flex flex-wrap items-center gap-2  rounded-xl px-3 py-3 bg-white/50">

<select
  className=" rounded-md bg-white/70 lockbutton text-[.8rem] focus:outline-none"
  defaultValue=""
  onChange={(e) => {
    const v = e.target.value
    if (!v) return
    editor!.chain().focus().setMark('textStyle', { ff: v }).run()
  }}
>
  <option value="" disabled>Font</option>
  <option value="system">System Sans</option>
  <option value="founders">Founders</option>
  <option value="bugrino">Bugrino</option>
  <option value="newedge">New Edge Test</option>
  <option value="kolonia">Kolonia</option>
</select>
<select
  className=" rounded-md bg-white/70 lockbutton text-[.8rem] focus:outline-none"
  defaultValue=""
  onChange={(e) => {
    const v = e.target.value
    if (!v) return
    if (v === 'unset') {
      editor!.chain().focus().setMark('textStyle', { fs: null }).run()
    } else {
      editor!.chain().focus().setMark('textStyle', { fs: v }).run()
    }
  }}
>
  <option value="" disabled>Size</option>
  <option value="unset">Default</option>
  <option value="12">12</option>
  <option value="14">14</option>
  <option value="16">16</option>
  <option value="18">18</option>
  <option value="20">20</option>
  <option value="24">24</option>
  <option value="32">32</option>
  <option value="48">48</option>
</select>

<select
  className=" rounded-md bg-white/70 text-[.8rem] lockbutton focus:outline-none"
  defaultValue=""
  onChange={(e) => {
    const v = e.target.value
    if (!v) return
    editor!.chain().focus().setMark('textStyle', { clr: v }).run()
  }}
>
  <option value="" disabled>Color</option>
  {colorOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
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
      <button
  onClick={() =>
    editor!.chain().focus().setMark('textStyle', { ff: null, fs: null, clr: null }).run()
  }
  className="text-[.9rem]"
  type="button"
>
  Clear
</button>
    </div>
    
  );
}
