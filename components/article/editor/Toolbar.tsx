import { Editor } from "@tiptap/react";
import React, { useRef } from "react";
import {
  Bold, Italic, Underline, Strikethrough, Code,
  List, ListOrdered, ListChecks, Quote,
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Link2, Image as ImageIcon, Eraser,
  Type, ArrowUpDown, ArrowLeftRight, CaseSensitive,
  Highlighter, Pilcrow, ArrowUp, ArrowDown,
} from "lucide-react";

type Props = { editor: Editor | null };

/* --- minimal popover using <details> for icon menus --- */
function IconMenu({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string; // tooltip
  children: React.ReactNode;
}) {
  return (
    <details className="relative group">
      <summary
        title={label}
        className="list-none p-1.5 rounded hover:bg-neutral-100 cursor-pointer select-none"
      >
        <span className="sr-only">{label}</span>
        {icon}
      </summary>
      <div className="absolute z-50 mt-1 min-w-[160px] rounded border bg-white shadow-md">
        {children}
      </div>
    </details>
  );
}

function MenuItem({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "w-full px-3 py-1.5 text-left text-sm",
        active ? "bg-neutral-100" : "hover:bg-neutral-50",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export default function Toolbar({ editor }: Props) {
  if (!editor) return null;

  const btn = (icon: React.ReactNode, onClick: () => void, active = false) => (
    <button
      onClick={onClick}
      type="button"
      className={`p-1.5 rounded ${active ? "bg-neutral-200" : "hover:bg-neutral-100"}`}
    >
      {icon}
    </button>
  );

  // helpers for block attrs
  const activeBlock = () =>
    editor.isActive("heading")
      ? "heading"
      : editor.isActive("listItem")
      ? "listItem"
      : "paragraph";

  const setBlockAttrs = (attrs: Record<string, any>) =>
    editor.chain().focus().updateAttributes(activeBlock(), attrs).run();

  const setULStyle = (list: "disc" | "circle" | "square") =>
    editor.chain().focus().updateAttributes("bulletList", { list }).run();

  const setOLStyle = (
    list:
      | "decimal"
      | "lower-roman"
      | "upper-roman"
      | "lower-alpha"
      | "upper-alpha",
  ) => editor.chain().focus().updateAttributes("orderedList", { list }).run();

  const setOLStart = (n: number) =>
    editor.chain().focus().updateAttributes("orderedList", { start: n }).run();

  // options
  const fontOptions = [
    { label: "System Sans", value: "system" },
    { label: "Founders", value: "founders" },
    { label: "Bugrino", value: "bugrino" },
    { label: "New Edge Test", value: "newedge" },
    { label: "Kolonia", value: "kolonia" },
  ];
  const sizeOptions = ["12", "14", "16", "18", "20", "24", "32", "48"];
  const colorOptions = [
    { label: "Accent", value: "accent" },
    { label: "Muted", value: "muted" },
    { label: "Red", value: "red" },
  ];
  const weightOptions = ["300", "400", "500", "600", "700", "800"];
  const lineHeightOptions = [
    { label: "Tight", value: "tight" },
    { label: "Normal", value: "normal" },
    { label: "Loose", value: "loose" },
  ];
  const letterSpaceOptions = [
    { label: "Tight", value: "tight" },
    { label: "Normal", value: "normal" },
    { label: "Wide", value: "wide" },
  ];
  const transformOptions = [
    { label: "None", value: "none" },
    { label: "UPPERCASE", value: "upper" },
    { label: "lowercase", value: "lower" },
    { label: "Capitalized", value: "caps" },
    { label: "Small Caps", value: "smallcaps" },
  ];
  const highlightOptions = [
    { label: "None", value: "none" },
    { label: "Yellow", value: "yellow" },
    { label: "Blue", value: "blue" },
    { label: "Green", value: "green" },
    { label: "Red", value: "red" },
  ];

  // small numeric input for OL start
  const startRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl px-3 py-3 bg-white/50">

      {/* Font family (compact select) */}
      <select
        className="rounded bg-white/70 lockbutton text-[.8rem] focus:outline-none"
        defaultValue=""
        title="Font family"
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          editor.chain().focus().setTextStyleTokens({ ff: v }).run();
        }}
      >
        <option value="" disabled>Font</option>
        {fontOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Size */}
      <select
        className="rounded bg-white/70 lockbutton text-[.8rem] focus:outline-none"
        defaultValue=""
        title="Font size"
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          v === "unset"
            ? editor.chain().focus().unsetTextStyleTokens(["fs"]).run()
            : editor.chain().focus().setTextStyleTokens({ fs: v }).run();
        }}
      >
        <option value="" disabled>Size</option>
        <option value="unset">Default</option>
        {sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}
      </select>

      {/* Color */}
      <select
        className="rounded bg-white/70 lockbutton text-[.8rem] focus:outline-none"
        defaultValue=""
        title="Text color"
        onChange={(e) => {
          const v = e.target.value;
          if (!v) return;
          v === "unset"
            ? editor.chain().focus().unsetTextStyleTokens(["clr"]).run()
            : editor.chain().focus().setTextStyleTokens({ clr: v }).run();
        }}
      >
        <option value="" disabled>Color</option>
        <option value="unset">Default</option>
        {colorOptions.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>

      {/* ICON MENUS FOR TOKENS — compact, no text labels */}

      {/* Weight */}
      <IconMenu icon={<Type size={16} />} label="Weight">
        <MenuItem onClick={() => editor.chain().focus().unsetTextStyleTokens(["fw"]).run()}>Default</MenuItem>
        {weightOptions.map(w => (
          <MenuItem key={w} onClick={() => editor.chain().focus().setTextStyleTokens({ fw: w as any }).run()}>
            {w}
          </MenuItem>
        ))}
      </IconMenu>

      {/* Line height */}
      <IconMenu icon={<ArrowUpDown size={16} />} label="Line height">
        <MenuItem onClick={() => editor.chain().focus().unsetTextStyleTokens(["lh"]).run()}>Default</MenuItem>
        {lineHeightOptions.map(o => (
          <MenuItem key={o.value} onClick={() => editor.chain().focus().setTextStyleTokens({ lh: o.value as any }).run()}>
            {o.label}
          </MenuItem>
        ))}
      </IconMenu>

      {/* Letter spacing */}
      <IconMenu icon={<ArrowLeftRight size={16} />} label="Letter spacing">
        <MenuItem onClick={() => editor.chain().focus().unsetTextStyleTokens(["ls"]).run()}>Default</MenuItem>
        {letterSpaceOptions.map(o => (
          <MenuItem key={o.value} onClick={() => editor.chain().focus().setTextStyleTokens({ ls: o.value as any }).run()}>
            {o.label}
          </MenuItem>
        ))}
      </IconMenu>

      {/* Transform */}
      <IconMenu icon={<CaseSensitive size={16} />} label="Transform">
        <MenuItem onClick={() => editor.chain().focus().unsetTextStyleTokens(["tt"]).run()}>Default</MenuItem>
        {transformOptions.map(o => (
          <MenuItem key={o.value} onClick={() => editor.chain().focus().setTextStyleTokens({ tt: o.value as any }).run()}>
            {o.label}
          </MenuItem>
        ))}
      </IconMenu>

      {/* Highlight */}
      <IconMenu icon={<Highlighter size={16} />} label="Highlight">
        <MenuItem onClick={() => editor.chain().focus().unsetTextStyleTokens(["bg"]).run()}>None</MenuItem>
        {highlightOptions.filter(h => h.value !== "none").map(o => (
          <MenuItem key={o.value} onClick={() => editor.chain().focus().setTextStyleTokens({ bg: o.value as any }).run()}>
            {o.label}
          </MenuItem>
        ))}
      </IconMenu>

      {/* INLINE MARKS */}
      {btn(<Bold size={16} />, () => editor.chain().focus().toggleBold().run(), editor.isActive("bold"))}
      {btn(<Italic size={16} />, () => editor.chain().focus().toggleItalic().run(), editor.isActive("italic"))}
      {btn(<Underline size={16} />, () => editor.chain().focus().toggleUnderline().run(), editor.isActive("underline"))}
      {btn(<Strikethrough size={16} />, () => editor.chain().focus().toggleStrike().run(), editor.isActive("strike"))}
      {btn(<Code size={16} />, () => editor.chain().focus().toggleCode().run(), editor.isActive("code"))}

      {/* LIST TOGGLES */}
      {btn(<List size={16} />, () => editor.chain().focus().toggleBulletList().run(), editor.isActive("bulletList"))}
      {btn(<ListOrdered size={16} />, () => editor.chain().focus().toggleOrderedList().run(), editor.isActive("orderedList"))}
      {btn(<ListChecks size={16} />, () => editor.chain().focus().toggleTaskList().run(), editor.isActive("taskList"))}

      {/* ALIGN */}
      {btn(<AlignLeft size={16} />, () => editor.chain().focus().setTextAlign("left").run(), editor.isActive({ textAlign: "left" }))}
      {btn(<AlignCenter size={16} />, () => editor.chain().focus().setTextAlign("center").run(), editor.isActive({ textAlign: "center" }))}
      {btn(<AlignRight size={16} />, () => editor.chain().focus().setTextAlign("right").run(), editor.isActive({ textAlign: "right" }))}
      {btn(<AlignJustify size={16} />, () => editor.chain().focus().setTextAlign("justify").run(), editor.isActive({ textAlign: "justify" }))}

      {/* PARAGRAPH BLOCK CONTROLS */}
      <IconMenu icon={<Pilcrow size={16} />} label="Indent">
        <MenuItem onClick={() => setBlockAttrs({ indent: null })}>None</MenuItem>
        <MenuItem onClick={() => setBlockAttrs({ indent: "sm" })}>Small</MenuItem>
        <MenuItem onClick={() => setBlockAttrs({ indent: "md" })}>Medium</MenuItem>
        <MenuItem onClick={() => setBlockAttrs({ indent: "lg" })}>Large</MenuItem>
      </IconMenu>

      <IconMenu icon={<ArrowUp size={16} />} label="Margin top">
        {["0","xs","sm","md","lg"].map(v => (
          <MenuItem key={v} onClick={() => setBlockAttrs({ mt: v === "0" ? "0" : v })}>
            {v}
          </MenuItem>
        ))}
      </IconMenu>

      <IconMenu icon={<ArrowDown size={16} />} label="Margin bottom">
        {["0","xs","sm","md","lg"].map(v => (
          <MenuItem key={v} onClick={() => setBlockAttrs({ mb: v === "0" ? "0" : v })}>
            {v}
          </MenuItem>
        ))}
      </IconMenu>

      {/* LIST STYLE CONTROLS */}
      <IconMenu icon={<List size={16} />} label="Bullet style">
        {(["disc","circle","square"] as const).map(v => (
          <MenuItem key={v} onClick={() => setULStyle(v)}>{v}</MenuItem>
        ))}
      </IconMenu>

      <IconMenu icon={<ListOrdered size={16} />} label="Number style">
        {(["decimal","lower-roman","upper-roman","lower-alpha","upper-alpha"] as const).map(v => (
          <MenuItem key={v} onClick={() => setOLStyle(v)}>{v}</MenuItem>
        ))}
        <div className="px-3 py-2 border-t text-sm flex items-center gap-2">
          <span className="text-neutral-500">Start</span>
          <input
            ref={startRef}
            type="number"
            min={1}
            defaultValue={1}
            className="w-16 rounded border px-2 py-1 text-sm"
            onChange={(e) => {
              const n = parseInt(e.target.value || "1", 10);
              if (Number.isFinite(n)) setOLStart(Math.max(1, n));
            }}
          />
        </div>
      </IconMenu>

      {/* Quote */}
      {btn(<Quote size={16} />, () => editor.chain().focus().toggleBlockquote().run(), editor.isActive("blockquote"))}

      {/* Link / Image */}
      {btn(
        <Link2 size={16} />,
        () => {
          const url = prompt("URL")?.trim();
          if (url) editor.chain().focus().setLink({ href: url }).run();
        },
        editor.isActive("link"),
      )}
      {btn(<ImageIcon size={16} />, () => {
        document.querySelector<HTMLInputElement>("#image-upload")?.click();
      })}

      {/* Clear */}
      {btn(<Eraser size={16} />, () =>
        editor.chain().focus().clearNodes().unsetAllMarks().run()
      )}
      <button
        onClick={() =>
          editor.chain().focus()
            .unsetTextStyleTokens(["ff","fs","clr","fw","lh","ls","tt","bg"])
            .run()
        }
        className="text-[.9rem]"
        type="button"
      >
        Clear tokens
      </button>
    </div>
  );
}
