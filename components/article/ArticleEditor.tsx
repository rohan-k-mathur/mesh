"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import Editor from "@/components/article/Editor";
import StarterKit from "@tiptap/starter-kit";
import Image from "@tiptap/extension-image";
import NextImage from "next/image";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import CharacterCount from "@tiptap/extension-character-count";
import { createLowlight } from "lowlight";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import katex from "katex";
import { keymap } from "@tiptap/pm/keymap";
import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import enStrings from "@/public/locales/en/editor.json";
import { useDebouncedCallback } from "use-debounce";
import SlashCommand from "./editor/SlashCommand";
import Toolbar from "./editor/Toolbar";
import TemplateSelector from "./editor/TemplateSelector";
import Outline from "./editor/Outline";
import { uploadFileToSupabase } from "@/lib/utils";
 import styles from "./article.module.css";
 import "../../../globals.css";


import Spinner from "../ui/spinner";
import "katex/dist/katex.min.css";
// const lowlight = new Lowlight();
import dynamic from "next/dynamic";
const Cropper = dynamic(() => import("react-easy-crop"), {
  ssr: false,
  loading: () => <Spinner />,
});

// async function registerLanguage(code: 'js' | 'ts' | 'py' | 'sh') {
//   const lib = await import(`highlight.js/lib/languages/${{
//     js: 'javascript',
//     ts: 'typescript',
//     py: 'python',
//     sh: 'bash',
//   }[code]}`);
//   lowlight.register(code, lib.default);
// }

// const lowlight = createLowlight();

// if (typeof window !== "undefined") {
//   // only run in browser
//   lowlight.register("js", javascript);
//   lowlight.register("ts", typescript);
//   lowlight.register("py", python);
//   lowlight.register("sh", bash);
// }

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
      mergeAttributes(HTMLAttributes, {
        class: `callout ${HTMLAttributes.type}`,
      }),
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
      alt: { default: "" },
      missingAlt: { default: false },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      "figure",
      // { class: `image align-${HTMLAttributes.align}` },
      // ["img", { src: HTMLAttributes.src }],
      {
        class: `image align-${HTMLAttributes.align}${
          HTMLAttributes.missingAlt ? " a11y-error" : ""
        }`,
      },
      ["img", { src: HTMLAttributes.src, alt: HTMLAttributes.alt }],
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
  const [a11yErrors, setA11yErrors] = useState(0);
  const [suggestion, setSuggestion] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const ydoc = useMemo(() => new Y.Doc(), []);
  const provider = useMemo(() => {
    if (typeof window === "undefined") return null;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return new WebsocketProvider(
      `${proto}://${window.location.host}/ws/article/${articleId}`,
      articleId,
      ydoc
    );
  }, [articleId, ydoc]);
  const lowlight = useMemo(() => {
    const ll = createLowlight();
    ll.register("js", javascript);
    ll.register("ts", typescript);
    ll.register("py", python);
    ll.register("sh", bash);
    return ll;
  }, []);

  const userName = useMemo(() => `User${Math.floor(Math.random() * 1000)}`, []);
  const userColor = useMemo(
    () => `#${Math.floor(Math.random() * 0xffffff).toString(16)}`,
    []
  );
  const t = (key: string) =>
    ((window as any)?.i18next?.t?.(`editor:${key}`) as string) ||
    (enStrings as any)[key] ||
    key;

  const editor = useEditor({
    extensions: [
      StarterKit,
      CustomImage,
      Link,
      Placeholder.configure({ placeholder: "Write something…" }),
      CodeBlockLowlight.configure({ lowlight }),
      PullQuote,
      Callout,
      MathBlock,
      CharacterCount.configure({
        limit: 20_000, // optional – character limit
      }),
      MathInline,
      //SlashCommand,
    ],
    //   SlashCommand,
    //   Collaboration.configure({ document: ydoc }),
    //   provider
    //     ? CollaborationCursor.configure({
    //         provider,
    //         user: { name: userName, color: userColor },
    //       })
    //     : null,
    //   CharacterCount,
    // ].filter(Boolean),
    content: "write here...",
    editorProps: {
      attributes: {
        class: "tiptap", // will be merged with 'ProseMirror'
      },
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
    editor.setEditable(!suggestion);
  }, [suggestion, editor]);

  useEffect(() => {
    if (!provider) return; // no cleanup needed

    return () => {
      provider.destroy(); // returns void → OK
    };
  }, [provider]);

  useEffect(() => {
    if (!editor) return; // ✅ one early exit – no cleanup

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
      // ✅ single cleanup function
      editor.off("update", updateHeadings);
    };
  }, [editor]);

  useEffect(() => {
    if (!editor) return; // ✅ one early exit – no cleanup

    if (!articleId) return;
    const controller = new AbortController();

    (async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}`, {
          signal: controller.signal,
        });
        if (!res.ok) return;
        const data = await res.json();
        if (!editor.isDestroyed) {
          editor.commands.setContent(data.astJson);
        }

        // const res = await fetch(`/api/articles/${articleId}`, {
        //   signal: controller.signal,
        // });
        // if (!res.ok) return;
        // const data = await res.json();
        const updated = new Date(data.updatedAt || 0).getTime();

        if (editor && !editor.isDestroyed && data.astJson) {
          editor.commands.setContent(data.astJson);
        }
        // // const data = await res.json();
        // if (!editor?.isDestroyed) {
        //   editor.commands.setContent(data.astJson);
        // }
        // updated = new Date(data.updatedAt || 0).getTime();

        if (data.astJson && editor) {
          editor.commands.setContent(data.astJson);
        }
        if (data.template) setTemplate(data.template);
        if (data.heroImageKey) {
          setHeroImageKey(data.heroImageKey);
          setHeroPreview(data.heroImageKey);
        }

        // ── local-storage restore check ──────────────────────────────────────────
        const local = localStorage.getItem(`article_${articleId}_backup`);
        if (local) {
          const parsed = JSON.parse(local);
          if (parsed.ts > updated && confirm("Restore unsaved changes?")) {
            if (editor && !editor.isDestroyed) {
              editor.commands.setContent(parsed.astJson);
            }
            setTemplate(parsed.template ?? "standard");
            setHeroImageKey(parsed.heroImageKey ?? null);
            setHeroPreview(parsed.heroImageKey ?? null);
          }
        }
      } catch (err) {
        // Ignore the abort that React dev-mode double invoke triggers
        if ((err as DOMException).name !== "AbortError") {
          console.error(err);
        }
      }
    })();

    // 🧹 abort only *after* we’ve handled the promise above
    return () => controller.abort();
  }, [articleId, editor]);
  // const saveDraft = useCallback(async () => {
  //   if (!editor) return;
  //   const body = {
  //     astJson: editor.getJSON(),
  //     template,
  //     heroImageKey,
  //   };

  //   const saveDraft = useCallback(async () => {
  //     /* …your POST logic… */
  //   }, [editor, template, heroImageKey]);

  //   useEffect(() => {
  //     if (!editor) return;

  //     const timeoutRef = { current: 0 };

  //     const handler = () => {
  //       setIsDirty(true);
  //       clearTimeout(timeoutRef.current);

  //       timeoutRef.current = window.setTimeout(async () => {
  //         await saveDraft();
  //         setShowUnsaved(true);
  //         setIsDirty(false);
  //       }, 2_000);            // 2 s “quiet period”
  //     };

  //     editor.on('update', handler);
  //     return () => {
  //       editor.off('update', handler);
  //       clearTimeout(timeoutRef.current);
  //     };
  //   }, [editor, saveDraft]);
  /** POST the current editor state to the backend and stash a local copy */
  const saveDraft = useCallback(async () => {
    if (!editor) return; // TS knows editor may be null

    const payload = {
      astJson: editor.getJSON(),
      template,
      heroImageKey,
    };

    // ── 1) server ──────────────────────────────────────────────────────────────
    await fetch(`/api/articles/${articleId}/draft`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    // ── 2) local backup (timestamped) ──────────────────────────────────────────
    localStorage.setItem(
      `article_${articleId}_backup`,
      JSON.stringify({ ts: Date.now(), ...payload })
    );
  }, [editor, template, heroImageKey, articleId]);
  const saveDraftDebounced = useDebouncedCallback(saveDraft, 1000);

  // useEffect(() => {
  //   if (!editor) return;
  //   editor.on('update', saveDraftDebounced);
  //   return () => editor.off('update', saveDraftDebounced);
  // }, [editor, saveDraftDebounced]);

  // await fetch(`/api/articles/${articleId}/draft`, {
  //   method: "PATCH",
  //   headers: { "Content-Type": "application/json" },
  //   body: JSON.stringify(body),
  // });
  //   try {
  //     await fetch(`/api/articles/${articleId}/draft`, {
  //       method: "PATCH",
  //       headers: { "Content-Type": "application/json" },
  //       body: JSON.stringify(body),
  //     });
  //     setIsDirty(false);
  //     setShowUnsaved(false);
  //   } catch {
  //     setShowUnsaved(true);
  //   }
  // }, [editor, articleId, template, heroImageKey]);

  // useEffect(() => {
  //   if (!editor) return;
  //   let timeout: NodeJS.Timeout;
  //   const handler = () => {
  //     setIsDirty(true);
  //     setShowUnsaved(false);
  //     clearTimeout(timeout);
  //     // timeout = setTimeout(() => saveDraft(), 1000);
  //     timeout = setTimeout(async () => {
  //       setShowUnsaved(true);
  //       await saveDraft();
  //     }, 2000);
  //   };
  //   editor.on("update", saveDraftDebounced);
  //   return () => {
  //     editor.off("update", handler);
  //     clearTimeout(timeout);
  //   };
  // }, [editor, saveDraft]);
  useEffect(() => {
    if (!editor) return; // guard against initial nulls

    let dirty = false;
    let timeout: number | null = null;

    const handler = () => {
      dirty = true; // mark when user changes doc
      if (timeout) clearTimeout(timeout);

      timeout = window.setTimeout(async () => {
        await saveDraft();
        dirty = false;
      }, 2_000); // 2-second quiet period
    };

    editor.on("update", handler);

    // ▶︎ cleanup
    return () => {
      editor.off("update", handler);
      if (timeout) clearTimeout(timeout);
    };
  }, [editor, saveDraft]);

  // useEffect(() => {
  //   setIsDirty(true);
  //   setShowUnsaved(true);
  //   const timeout = setTimeout(() => saveDraft(), 500);
  //   return () => clearTimeout(timeout);
  // }, [template, heroImageKey, saveDraft]);

  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      const backup = {
        content: editor.getJSON(),
        template,
        heroImageKey,
        ts: Date.now(),
      };
      localStorage.setItem(
        `article_${articleId}_backup`,
        JSON.stringify(backup)
      );
    }, 15000);
    return () => clearInterval(interval);
  }, [editor, template, heroImageKey, articleId]);

  const onHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await fetch(
      `/api/articles/presign?filename=${encodeURIComponent(
        file.name
      )}&contentType=${encodeURIComponent(file.type)}`
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
      croppedArea.height
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
            .setImage({ src: fileURL, caption: "", align: "center", alt: "" })
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

  const runA11yCheck = () => {
    if (!editor) return;
    document
      .querySelectorAll(".a11y-error")
      .forEach((el) => el.classList.remove("a11y-error"));
    let last = 0;
    let errors = 0;
    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === "heading") {
        const dom = editor.view.nodeDOM(pos) as HTMLElement;
        const lvl = node.attrs.level;
        if (last && lvl > last + 1) {
          dom.classList.add("a11y-error");
          errors++;
        }
        last = lvl;
      }
      if (node.type.name === "image") {
        const dom = editor.view.nodeDOM(pos) as HTMLElement;
        if (!node.attrs.alt) {
          dom.classList.add("a11y-error");
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              missingAlt: true,
            });
            return true;
          });
          errors++;
        } else {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, {
              ...node.attrs,
              missingAlt: false,
            });
            return true;
          });
        }
      }
    });
    setA11yErrors(errors);
  };
  const words = editor?.storage.characterCount?.words() ?? 0;

  return (
    <div className={styles.page}>
          <div className="flex flex-col gap-2">

    <div className={`${styles.articlepage} ${styles[template]}`}>
        {/* <TemplateSelector template={template} onChange={setTemplate} />
      <input type="file" onChange={onHeroUpload} /> */}
        {showUnsaved && (
          <div className={styles.unsaved}>{t("unsavedChanges")}</div>
        )}
        <div className={styles.controls}>
          <TemplateSelector template={template} onChange={setTemplate} />
          <button onClick={saveDraft}>{t("saveDraft")}</button>
          <button onClick={() => setSuggestion(!suggestion)}>
            {suggestion ? t("suggestionOff") : t("suggestionMode")}
          </button>
          <button onClick={runA11yCheck}>{t("checkAccessibility")}</button>
          <input type="file" onChange={onHeroUpload} />
        </div>
        {heroPreview && (
          <NextImage
            src={heroPreview}
            alt="hero"
            width={800}
            height={400}
            className={styles.hero}
          />
        )}
      <div className="flex gap-4 mt-4">
          <Outline headings={headings} onSelect={onSelectHeading} />
          <Editor             articleId={articleId}/>
                  <Toolbar editor={editor} />       {/* fixed-width column */}

          {/* <EditorContent
            editor={editor}
            className="prose bg-black max-w-none focus:outline-none"
          /> */}
        </div>
        <div className={styles.charCount}>
          <Toolbar editor={editor} />
          {editor?.storage.characterCount.words()} {t("wordCount")} /{" "}
          {editor?.storage.characterCount.characters()} {t("characterCount")}
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
      </div>

    </div>
  );
}
