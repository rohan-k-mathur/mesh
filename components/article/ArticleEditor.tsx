"use client";

import React, { useCallback, useEffect, useState } from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import NextImage from "next/image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { createLowlight } from 'lowlight';

import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import katex from "katex";
import { keymap } from "@tiptap/pm/keymap";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import SlashCommand from "./editor/SlashCommand";
import Toolbar from "./editor/Toolbar";
import TemplateSelector from "./editor/TemplateSelector";
import Outline from "./editor/Outline";
import { uploadFileToSupabase } from "@/lib/utils";
import styles from "./article.module.scss";
import Cropper from "react-easy-crop";
import "katex/dist/katex.min.css";
// const lowlight = new Lowlight();
const lowlight = createLowlight();

if (typeof window !== 'undefined') {               // only run in browser
  lowlight.register('js', javascript);
  lowlight.register('ts', typescript);
  lowlight.register('py', python);
  lowlight.register('sh', bash);
}
CodeBlockLowlight.configure({ lowlight });

interface Heading {
  level: number;
  text: string;
  id: string;
  pos: number;
}

const PullQuote = Node.create({
  name: "pullQuote",
  group: "block",
  content: "inline*",
  addAttributes() {
    return { alignment: { default: "left" } };
  },
  parseHTML() {
    return [{ tag: "blockquote.pull-quote" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "blockquote",
      mergeAttributes(HTMLAttributes, {
        class: `pull-quote ${HTMLAttributes.alignment}`,
      }),
      0,
    ];
  },
});

const Callout = Node.create({
  name: "callout",
  group: "block",
  content: "paragraph+",
  addAttributes() {
    return { type: { default: "info" } };
  },
  parseHTML() {
    return [{ tag: "div.callout" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { class: `callout ${HTMLAttributes.type}` }),
      0,
    ];
  },
});

const MathBlock = Node.create({
  name: "mathBlock",
  group: "block",
  atom: true,
  addAttributes() {
    return { latex: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "div[data-type=math-block]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, { "data-type": "math-block" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => (
      <div
        className="math-block"
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(node.attrs.latex || node.textContent, {
            throwOnError: false,
          }),
        }}
      />
    ));
  },
});

const MathInline = Node.create({
  name: "mathInline",
  group: "inline",
  inline: true,
  atom: true,
  addAttributes() {
    return { latex: { default: "" } };
  },
  parseHTML() {
    return [{ tag: "span[data-type=math-inline]" }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, { "data-type": "math-inline" }),
    ];
  },
  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => (
      <span
        className="math-inline"
        dangerouslySetInnerHTML={{
          __html: katex.renderToString(node.attrs.latex || node.textContent, {
            throwOnError: false,
          }),
        }}
      />
    ));
  },
});

const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      caption: { default: "" },
      align: { default: "center" },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      { class: `image align-${HTMLAttributes.align}` },
      ["img", { src: HTMLAttributes.src }],
      ["figcaption", HTMLAttributes.caption],
    ];
  },
});

interface EditorProps {
  articleId: string;
}

export default function ArticleEditor({ articleId }: EditorProps) {
  const [template, setTemplate] = useState("standard");
  const [heroImageKey, setHeroImageKey] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      Link,
      Placeholder.configure({ placeholder: "Write something..." }),
      CodeBlockLowlight.configure({ lowlight }),
      PullQuote,
      Callout,
      MathBlock,
      MathInline,
      SlashCommand,
    ],
    content: "",
    editorProps: {
      handleDrop(view, event) {
        const file = (event as DragEvent).dataTransfer?.files?.[0];
        if (file) {
          event.preventDefault();
          setCropFile(file);
          setCropImage(URL.createObjectURL(file));
          return true;
        }
        return false;
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    const plugin = keymap({
      "Mod-b": () => editor.chain().focus().toggleBold().run(),
      "Mod-i": () => editor.chain().focus().toggleItalic().run(),
    });
    editor.registerPlugin(plugin);
    return () => {
      editor.unregisterPlugin(plugin.key);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return;
    const updateHeadings = () => {
      const seen: Record<string, number> = {};
      const hs: Heading[] = [];
      editor.state.doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const text = node.textContent;
          let id = text
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/(^-|-$)+/g, "");
          if (seen[id]) {
            id = `${id}-${seen[id]}`;
            seen[id] += 1;
          } else {
            seen[id] = 1;
          }
          hs.push({ level: node.attrs.level, text, id, pos });
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, id });
            return true;
          });
        }
      });
      setHeadings(hs);
    };
    editor.on("update", updateHeadings);
    updateHeadings();
    return () => {
      editor.off("update", updateHeadings);
    };
  }, [editor]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/articles/${articleId}`);
      if (res.ok) {
        const data = await res.json();
        if (data.astJson && editor) {
          editor.commands.setContent(data.astJson);
        }
        if (data.template) setTemplate(data.template);
        if (data.heroImageKey) {
          setHeroImageKey(data.heroImageKey);
          setHeroPreview(data.heroImageKey);
        }
      }
    }
    load();
  }, [articleId, editor]);

  const saveDraft = useCallback(async () => {
    if (!editor) return;
    const body = {
      astJson: editor.getJSON(),
      template,
      heroImageKey,
    };
    await fetch(`/api/articles/${articleId}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }, [editor, articleId, template, heroImageKey]);

  useEffect(() => {
    if (!editor) return;
    let timeout: NodeJS.Timeout;
    const handler = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => saveDraft(), 1000);
    };
    editor.on("update", handler);
    return () => {
      editor.off("update", handler);
      clearTimeout(timeout);
    };
  }, [editor, saveDraft]);

  useEffect(() => {
    const timeout = setTimeout(() => saveDraft(), 500);
    return () => clearTimeout(timeout);
  }, [template, heroImageKey, saveDraft]);

  const onHeroUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await fetch(
      `/api/articles/presign?filename=${encodeURIComponent(
        file.name,
      )}&contentType=${encodeURIComponent(file.type)}`,
    );
    const { uploadUrl } = await res.json();
    await fetch(uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
    const publicUrl = uploadUrl.split("?")[0];
    setHeroImageKey(publicUrl);
    setHeroPreview(publicUrl);
    e.target.value = "";
  };

  const insertCroppedImage = async () => {
    if (!cropFile || !croppedArea || !editor) return;
    const image = new Image();
    image.src = cropImage as string;
    await new Promise((res) => (image.onload = res));
    const canvas = document.createElement("canvas");
    canvas.width = croppedArea.width;
    canvas.height = croppedArea.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(
      image,
      croppedArea.x,
      croppedArea.y,
      croppedArea.width,
      croppedArea.height,
      0,
      0,
      croppedArea.width,
      croppedArea.height,
    );
    return new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], cropFile.name, { type: cropFile.type });
        const { fileURL } = await uploadFileToSupabase(file);
        if (fileURL) {
          editor
            .chain()
            .focus()
            .setImage({ src: fileURL, caption: "", align: "center" })
            .run();
        }
        resolve();
      });
    });
  };

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedArea(area);
  }, []);

  const onSelectHeading = (id: string) => {
    const h = headings.find((x) => x.id === id);
    if (!h || !editor) return;
    const dom = editor.view.domAtPos(h.pos).node as HTMLElement;
    dom.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className={`${styles.article} ${styles[template]}`}>
      <TemplateSelector template={template} onChange={setTemplate} />
      <input type="file" onChange={onHeroUpload} />
      {heroPreview && (
        <NextImage
          src={heroPreview}
          alt="hero"
          width={800}
          height={400}
          className={styles.hero}
        />
      )}
      <div className={styles.editorWrapper}>
        <Outline headings={headings} onSelect={onSelectHeading} />
        <EditorContent editor={editor} />
        <Toolbar editor={editor} />
      </div>
      {cropImage && (
        <div className={styles.cropperModal}>
          <Cropper
            image={cropImage}
            crop={crop}
            zoom={zoom}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={onCropComplete}
            aspect={4 / 3}
          />
          <div className={styles.cropActions}>
            <button
              onClick={async () => {
                await insertCroppedImage();
                setCropFile(null);
                setCropImage(null);
              }}
            >
              Insert
            </button>
            <button
              onClick={() => {
                setCropFile(null);
                setCropImage(null);
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
