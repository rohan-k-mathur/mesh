/* eslint‑disable max‑lines */
"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import ImageExt from "@tiptap/extension-image";
import {
  PullQuote as PullQuoteBase,
  Callout as CalloutBase,
  MathBlock as MathBlockBase,
  MathInline as MathInlineBase,
} from "@/lib/tiptap/extensions";
import { toast } from "sonner";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import CharacterCount from "@tiptap/extension-character-count";
import { TextStyleTokensLegacy as TextStyle } from "@/lib/tiptap/extensions/text-style-ssr";
import Underline from "@tiptap/extension-underline";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import { SSRTextAlign } from "@/lib/tiptap/extensions/ssr-text-align";
// import TextAlign from '@tiptap/extension-text-align';
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import { createLowlight } from "lowlight";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";

import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import python from "highlight.js/lib/languages/python";
import bash from "highlight.js/lib/languages/bash";
import katex from "katex";
import { keymap } from "@tiptap/pm/keymap";
import {
  Node,
  mergeAttributes,
  type JSONContent,
  type Extension,
} from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import enStrings from "@/public/locales/en/editor.json";
import { useDebouncedCallback } from "use-debounce";
import { BubbleMenu } from "@tiptap/react";
import {
    Scissors,
    Image as ImageIconLucide,
    Trash2,
    Type as TypeIcon,
    FileText,
    AlignLeft,
    AlignCenter,
    AlignRight,
  } from "lucide-react";
import { TextStyleTokens } from "@/lib/tiptap/extensions/text-style-ssr";
import { useEditor, Editor } from "@tiptap/react";

import SlashCommand from "./editor/SlashCommand";
import Toolbar from "./editor/Toolbar";
import TemplateSelector from "./editor/TemplateSelector";
import { uploadFileToSupabase } from "@/lib/utils";
import styles from "./article.module.scss";
import Spinner from "../ui/spinner";
import dynamic from "next/dynamic";
import NextImage from "next/image";
import { useRouter } from "next/navigation";
import { BlockStyleTokens } from "@/lib/tiptap/extensions/block-style-ssr";
import "katex/dist/katex.min.css";
import HomeButton from "../buttons/HomeButton";

/* -------------------------------------------------------------------------- */
/*  Dynamic imports                                                            */
/* -------------------------------------------------------------------------- */

const Cropper = dynamic(() => import("react-easy-crop"), {
  ssr: false,
  loading: () => <Spinner />,
});

/* -------------------------------------------------------------------------- */
/*  Module augmentation for CharacterCount storage                             */
/* -------------------------------------------------------------------------- */

declare module "@tiptap/core" {
  interface Storage {
    characterCount?: {
      words: () => number;
      characters: () => number;
    };
  }
}

/* -------------------------------------------------------------------------- */
/*  Constants                                                                  */
/* -------------------------------------------------------------------------- */

const CHAR_LIMIT = 20_000;
const COLLAB_ENABLED = false; // set to true if you enable websockets

/* -------------------------------------------------------------------------- */
/*  Helper types                                                               */
/* -------------------------------------------------------------------------- */

interface Heading {
  level: number;
  text: string;
  id: string;
  pos: number;
}

type Backup = {
  ts: number;
  content: JSONContent;
  template: string;
  heroImageKey: string | null;
};

const LOCAL_KEY = (id: string) => `article_${id}_backup`;

interface ArticleEditorProps {
  articleId: string;
}

/* -------------------------------------------------------------------------- */
/*  Custom nodes                                                               */
/* -------------------------------------------------------------------------- */

// const PullQuote = Node.create({
//   name: 'pullQuote',
//   group: 'block',
//   content: 'inline*',
//   addAttributes() {
//     return { alignment: { default: 'left' } };
//   },
//   parseHTML() {
//     return [{ tag: 'blockquote.pull-quote' }];
//   },
//   renderHTML({ HTMLAttributes }) {
//     return [
//       'blockquote',
//       mergeAttributes(HTMLAttributes, {
//         class: `pull-quote ${HTMLAttributes.alignment}`,
//       }),
//       0,
//     ];
//   },
// });
const PullQuote = PullQuoteBase.extend({
  addNodeView() {
    return ReactNodeViewRenderer(({ node }) => (
      <NodeViewWrapper
        as="blockquote"
        className={`pull-quote ${node.attrs.alignment || "left"}`}
      >
        <NodeViewContent />
      </NodeViewWrapper>
    ));
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

/*  Image extension with extra a11y metadata  */
const CustomImage = ImageExt.extend({
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

/* -------------------------------------------------------------------------- */
/*  Props                                                                     */
/* -------------------------------------------------------------------------- */

interface EditorProps {
  articleId: string;
}

/* -------------------------------------------------------------------------- */
/*  Component                                                                  */
/* -------------------------------------------------------------------------- */

export default function ArticleEditor({ articleId }: ArticleEditorProps) {
  /* ------------------------------- state ---------------------------------- */

  const [template, setTemplate] = useState("standard");
  const [heroImageKey, setHeroImageKey] = useState<string | null>(null);
  const [heroPreview, setHeroPreview] = useState<string | null>(null);
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [cropImage, setCropImage] = useState<string | null>(null);
  const [replaceSelectedImage, setReplaceSelectedImage] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedArea, setCroppedArea] = useState<any>(null);
  const [a11yErrors, setA11yErrors] = useState(0);
  const [suggestion, setSuggestion] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showUnsaved, setShowUnsaved] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<Backup | null>(null);
  const [counter, setCounter] = useState({ words: 0, chars: 0 });
  // const [editorRef, setEditorRef] = useState<Editor | null>(null)
  const [initialJson, setInitialJson] = useState<any>();
  const [publishing, setPublishing] = useState(false);
  const [revs, setRevs] = useState<{ id: string; createdAt: string }[] | null>(
    null
  );
  const [title, setTitle] = useState<string>("Title");
  const router = useRouter();
  const inflight = useRef<AbortController | null>(null);
  const lastSentHash = useRef<string>("");
  /* ------------------------------ y‑js / collab --------------------------- */

  const ydoc = useMemo(() => new Y.Doc(), []);

  const provider = useMemo(() => {
    if (!COLLAB_ENABLED || typeof window === "undefined") return null;
    const proto = window.location.protocol === "https:" ? "wss" : "ws";
    return new WebsocketProvider(
      `${proto}://${window.location.host}/ws/article/${articleId}`,
      articleId,
      ydoc
    );
  }, [articleId, ydoc]);

  /* ------------------------------ lowlight -------------------------------- */

  const lowlight = useMemo(() => {
    const ll = createLowlight();
    ll.register("js", javascript);
    ll.register("ts", typescript);
    ll.register("py", python);
    ll.register("sh", bash);
    return ll;
  }, []);

  /* ---------------------------- i18n helper ------------------------------ */

  const t = (key: string) =>
    ((window as any)?.i18next?.t?.(`editor:${key}`) as string) ||
    (enStrings as any)[key] ||
    key;

  /* ------------------------- editor extensions --------------------------- */

  const userName = useMemo(() => `User${Math.floor(Math.random() * 1000)}`, []);
  const userColor = useMemo(
    () => `#${Math.floor(Math.random() * 0xffffff).toString(16)}`,
    []
  );

  const extensions = useMemo<Extension[]>(() => {
    return [
      StarterKit,
      CodeBlockLowlight.configure({ lowlight }),
      TaskList,
      TaskItem,
      Highlight,
      SSRTextAlign.configure({
        types: ["heading", "paragraph", "blockquote", "listItem"],
        alignments: ["left", "center", "right", "justify"],
      }),
      Underline,
      TextStyle,
      Color,
      CustomImage,
      Link,
      Placeholder.configure({ placeholder: "Write something…" }),
      PullQuote,
      Callout,
      MathBlock,
      MathInline,
      TextStyleTokens,
      BlockStyleTokens,
      CharacterCount.configure({ limit: CHAR_LIMIT }),
      SlashCommand,
      COLLAB_ENABLED && provider && Collaboration.configure({ document: ydoc }),
      COLLAB_ENABLED &&
        provider &&
        CollaborationCursor.configure({
          provider,
          user: { name: userName, color: userColor },
        }),
    ].filter(Boolean) as Extension[]; // TS narrow‑down
  }, [lowlight, provider, userName, userColor, ydoc]);

  /* ---------------------------- TipTap editor ---------------------------- */

  // const editor = useEditor(
  //   initialJson
  //     ? {
  //         extensions,
  //         content: initialJson,
  //         immediatelyRender: false,
  //         onCreate: ({ editor }) => setEditorRef(editor),
  //       }
  //     : undefined,
  // )
  //  if (initialJson === undefined) return <div>Loading editor…</div>

  const editor = useEditor({
    extensions,
    content: initialJson,
    immediatelyRender: false,
  });

  // ---- Autosave (debounced   dedup   in-flight abort) -------------------
  const makePayload = useCallback(() => {
    if (!editor) return null;
    const payload: any = {
      astJson: editor.getJSON(),
      template,
      heroImageKey,
    };
    const t = (title || "").trim();
    if (t) payload.title = t; // don't send empty or "Untitled"
    return payload;
  }, [editor, template, heroImageKey, title]);

  const saveDraft = useCallback(async () => {
    const payload = makePayload();
    if (!payload) return;
    const hash = JSON.stringify(payload);
    if (hash === lastSentHash.current) return;

    inflight.current?.abort();
    const ac = new AbortController();
    inflight.current = ac;

    try {
      const res = await fetch(`/api/articles/${articleId}/draft`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: ac.signal,
      });
      if (res.ok) {
        lastSentHash.current = hash;
      }
    } catch {
      /* aborted or failed; ignore */
    }
  }, [articleId, makePayload]);

  const debouncedSave = useDebouncedCallback(() => {
    void saveDraft();
  }, 800);
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    if (isDirty) window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  /* ---------------------------------------------------------------------- */
  /*  Debounced save                                                         */
  /* ---------------------------------------------------------------------- */

  const saveDraftImmediate = useCallback(async () => {
    await saveDraft();
    localStorage.setItem(
      LOCAL_KEY(articleId),
      JSON.stringify({ ts: Date.now(), ...(makePayload() || {}) })
    );
    setIsDirty(false);
    setShowUnsaved(false);
  }, [articleId, saveDraft, makePayload]);
  // Hook editor updates -> debounced save
  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      setIsDirty(true);
      setShowUnsaved(true);
      debouncedSave();
    };
    editor.on("update", handler);
    return () => editor.off("update", handler);
  }, [editor, debouncedSave]);

  const publishArticle = useCallback(async () => {
    if (!articleId || !editor || publishing) return;

    setPublishing(true);
    toast.loading("Publishing…", { id: "pub" });
    try {
      // ensure db has the latest title/JSON/etc.
      await saveDraftImmediate();

      const res = await fetch(`/api/articles/${articleId}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          astJson: editor.getJSON(),
          template,
          heroImageKey,
          title,
        }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => "Unknown error");
        console.error("Publish failed:", res.status, errText);
        // TODO: toast(errText)
        return;
      }

      const { slug } = await res.json(); // ← only read once
      toast.success("Published!", { id: "pub" });
      localStorage.removeItem("draftArticleId");
      router.replace(`/article/${slug}`);
    } finally {
      setPublishing(false);
    }
  }, [
    articleId,
    editor,
    template,
    heroImageKey,
    title,
    router,
    publishing,
    saveDraftImmediate,
  ]);

  //restore revisions

  async function openRevisions() {
    const res = await fetch(`/api/articles/${articleId}/revisions`, {
      cache: "no-store",
    });
    if (res.ok) setRevs(await res.json());
  }
  async function saveSnapshot() {
    await saveDraftImmediate();
    await fetch(`/api/articles/${articleId}/revisions`, { method: "POST" });
    toast.success("Snapshot saved");
  }
  async function restoreRevision(revisionId: string) {
    const res = await fetch(`/api/articles/${articleId}/restore`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revisionId }),
    });
    if (res.ok) {
      toast.success("Revision restored");
      // reload current doc into editor
      const fresh = await fetch(`/api/articles/${articleId}`, { cache: "no-store" }).then(r => r.json());
            editor?.commands.setContent(fresh.astJson);
            if (fresh.title) setTitle(fresh.title);
            if (fresh.template) setTemplate(fresh.template);
            if (fresh.heroImageKey !== undefined) {
              setHeroImageKey(fresh.heroImageKey);
              setHeroPreview(fresh.heroImageKey);
            }
            setRevs(null);
    }
  }

  /* ---------------------------------------------------------------------- */
  /*  Live character counter                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!editor) return;

    const updateCounter = () => {
      const store = editor.storage.characterCount!;
      setCounter({ words: store.words(), chars: store.characters() });
    };

    updateCounter();
    editor.on("update", updateCounter);
    return () => editor.off("update", updateCounter);
  }, [editor]);

  /* ---------------------------------------------------------------------- */
  /*  Keyboard shortcuts                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!editor) return;
    const plugin = keymap({
      "Mod-b": () => editor.chain().focus().toggleBold().run(),
      "Mod-i": () => editor.chain().focus().toggleItalic().run(),
    });
    editor.registerPlugin(plugin);
    return () => editor.unregisterPlugin(plugin.key);
  }, [editor]);

  /* ---------------------------------------------------------------------- */
  /*  Suggestion mode toggle                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (editor) editor.setEditable(!suggestion);
  }, [suggestion, editor]);

  /* ---------------------------------------------------------------------- */
  /*  Provider cleanup                                                       */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    return () => provider?.destroy();
  }, [provider]);

  /* ---------------------------------------------------------------------- */
  /*  Outline (headings list)                                                */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!editor) return;

    const updateHeadings = () => {
      const seen: Record<string, number> = {};
      const hs: Heading[] = [];

      editor.state.doc.descendants((node, pos) => {
        if (node.type.name !== "heading") return;

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

        if (node.attrs.id !== id) {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, id });
            return true;
          });
        }
        hs.push({ level: node.attrs.level, text, id, pos });
      });

      setHeadings(hs);
    };

    updateHeadings();
    editor.on("update", updateHeadings);
    return () => editor.off("update", updateHeadings);
  }, [editor]);

  /* ---------------------------------------------------------------------- */
  /*  Dirty‑flag on change + queued save                                     */
  /* ---------------------------------------------------------------------- */
  function goHome() {
    router.push("/");
  }

  /* also mark dirty when template or hero image changes */
  useEffect(() => {
    setIsDirty(true);
    setShowUnsaved(true);
    debouncedSave();
  }, [template, heroImageKey, debouncedSave]);

  /* ---------------------------------------------------------------------- */
  /*  15‑second local backup                                                 */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!editor) return;
    const interval = setInterval(() => {
      const backup: Backup = {
        content: editor.getJSON(),
        template,
        heroImageKey,
        ts: Date.now(),
      };
      localStorage.setItem(LOCAL_KEY(articleId), JSON.stringify(backup));
    }, 15_000);
    return () => clearInterval(interval);
  }, [editor, template, heroImageKey, articleId]);

  /* ---------------------------------------------------------------------- */
  /*  Handlers                                                               */
  /* ---------------------------------------------------------------------- */

  const onHeroUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

        try {
            const { fileURL } = await uploadFileToSupabase(file);
            if (!fileURL) { toast.error("Hero upload failed"); return; }
            setHeroImageKey(fileURL);
            setHeroPreview(fileURL);
            toast.success("Hero image uploaded");
          } finally {
            e.target.value = "";
          }
        };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropImage(URL.createObjectURL(file));
    e.target.value = "";
  };

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedArea(area);
  }, []);

  const insertCroppedImage = async () => {
    if (!cropFile || !croppedArea || !editor) return;
    const img = new Image();
    img.src = cropImage as string;
    await new Promise((res) => (img.onload = res));

    const canvas = document.createElement("canvas");
    canvas.width = croppedArea.width;
    canvas.height = croppedArea.height;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(
      img,
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
          const chain = editor.chain().focus();
                    if (replaceSelectedImage && editor.isActive('image')) {
                      chain.updateAttributes('image', { src: fileURL }).run();
                    } else {
                      chain.setImage({ src: fileURL, caption: "", align: "center", alt: "" }).run();
                    }
                  }
                  setReplaceSelectedImage(false);
                   resolve();
                 });
               });
             };

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

  /* ---------------------------------------------------------------------- */
  /*  Render                                                                 */
  /* ---------------------------------------------------------------------- */
  if (!editor) return <div>Loading editor…</div>;

  return (
    <div className="flex justify-center items-center ">
      {/* bottom-left tab button */}
      <div className="absolute flex left-8 top-8 tracking-wide z-[9000] rounded-xl bg-white/50  px-3 py-2 likebutton">
        <HomeButton />
      </div>
      {/* <button
          onClick={() => goHome()}
          className="fixed flex left-5 top-12 tracking-wide z-[9000] rounded-full bg-white/50  px-4 py-1 likebutton"
        >
          ⇤
  Home
        </button> */}

      <article className={template}>
       

        {/* Editor ----------------------------------------------------------- */}
        <div className="h-full flex flex-col gap-2 p-1 mt-[-1rem]">
          <input
            className="w-1/2 justify-center items-center mx-auto text-center text-2xl titlefield border border-rose-400/30  tracking-wider bg-white/40 rounded-2xl py-[8px]  outline-none placeholder:text-slate-400 mb-3"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value.slice(0, 200))}
            onBlur={saveDraftImmediate}
          />

          {/* Top‑bar ---------------------------------------------------------- */}
          {showUnsaved && (
            <div className="absolute flex right-8 top-8  tracking-wide text-[.75rem] text-red-800">
              {t("unsavedChanges")}
            </div>
          )}

          <div className="flex ">
            <div
              className="flex flex-1 flex-wrap space-x-3 gap-2 justify-center
           mb-3"
            >
              <TemplateSelector
                articleId={articleId}
                template={template}
                onChange={setTemplate}
              />
              {/* Upload hero (native file picker)
              <label htmlFor="hero-upload" className="px-2 py-1 rounded-xl bg-white/50 sendbutton text-[.8rem] text-center cursor-pointer">
                Upload hero
              </label>
              <input id="hero-upload" type="file" accept="image/*" onChange={onHeroUpload} hidden /> */}

              {/* <button
            className="savebutton rounded-xl bg-white/70 p-2 h-fit text-xs"
            onClick={() => setSuggestion(!suggestion)}
          >
            {suggestion ? t('suggestionOff') : t('suggestionMode')}
          </button> */}
              <button
                className=" px-2 py-1 rounded-xl bg-white/50 sendbutton text-[.8rem] text-center"
                onClick={openRevisions}
              >
                Revisions
              </button>

              {revs && (
                <div className="fixed inset-0 bg-black/30 grid place-items-center">
                  <div className="bg-white rounded p-3 w-[360px] max-h-[70vh] overflow-auto">
                    <div className="text-sm font-semibold mb-2">Revisions</div>
                    <ul className="space-y-1">
                      {revs.map((r) => (
                        <li
                          key={r.id}
                          className="flex items-center justify-between"
                        >
                          <span className="text-xs text-neutral-700">
                            {new Date(r.createdAt).toLocaleString()}
                          </span>
                          <button
                            className="text-xs underline"
                            onClick={() => restoreRevision(r.id)}
                          >
                            Restore
                          </button>
                        </li>
                      ))}
                    </ul>
                    <div className="mt-3 text-right">
                      <button
                        className="px-2 py-1 border rounded text-xs"
                        onClick={() => setRevs(null)}
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                className=" px-2 py-1 rounded-xl bg-white/50 sendbutton text-[.8rem] text-center"
                onClick={saveDraftImmediate}
              >
                {t("saveDraft")}
              </button>
              {/* <button
            className="savebutton rounded-xl bg-white p-2 text-xs h-fit"
            onClick={runA11yCheck}
          >
            {t('checkAccessibility')}
          </button> */}
              <button
                className=" px-2 py-1 rounded-xl bg-white/50 sendbutton text-[.8rem] text-center"
                onClick={publishArticle}
              >
                Publish
              </button>
            </div>
          </div>
          <div className=" flex-1 w-full h-full rounded-xl bg-white/50 editor-shadow backdrop-blur-sm">
            <input
              id="image-upload"
              type="file"
              onChange={onImageUpload}
              hidden
            />
            <Toolbar editor={editor} />

 {/* Image bubble toolbar */}
      {editor && (
       <BubbleMenu
         editor={editor}
         shouldShow={({ editor }) => editor.isActive("image")}
         tippyOptions={{ duration: 100, placement: "top" }}
       >
         <div className="flex items-center gap-1 rounded bg-white/90 p-1 shadow">
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Align left"
             onClick={() => editor.chain().focus().updateAttributes("image", { align: "left" }).run()}
           ><AlignLeft size={16} /></button>
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Align center"
             onClick={() => editor.chain().focus().updateAttributes("image", { align: "center" }).run()}
           ><AlignCenter size={16} /></button>
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Align right"
             onClick={() => editor.chain().focus().updateAttributes("image", { align: "right" }).run()}
           ><AlignRight size={16} /></button>
 
           <div className="w-px h-5 bg-neutral-200 mx-1" />
 
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Replace image"
             onClick={() => document.querySelector<HTMLInputElement>("#image-upload")?.click()}
           ><ImageIconLucide size={16} /></button>
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Crop"
             onClick={() => {
               // open cropper with current image src
               const attrs = editor.getAttributes("image");
               if (attrs?.src) {
                 setCropFile(new File([], "crop.png", { type: "image/png" })); // sentinel to trigger upload flow
                 setCropImage(attrs.src);
                 setReplaceSelectedImage(true);
               }
             }}
           ><Scissors size={16} /></button>
 
           <div className="w-px h-5 bg-neutral-200 mx-1" />
 
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Alt text"
             onClick={() => {
               const cur = editor.getAttributes("image")?.alt ?? "";
               const alt = window.prompt("Alt text", cur);
               if (alt !== null) editor.chain().focus().updateAttributes("image", { alt }).run();
             }}
           ><FileText size={16} /></button>
           <button
             className="px-1.5 py-1 rounded hover:bg-neutral-100"
             title="Caption"
             onClick={() => {
               const cur = editor.getAttributes("image")?.caption ?? "";
               const caption = window.prompt("Caption", cur);
               if (caption !== null) editor.chain().focus().updateAttributes("image", { caption }).run();
             }}
           ><TypeIcon size={16} /></button>
 
           <div className="w-px h-5 bg-neutral-200 mx-1" />
 
           <button
             className="px-1.5 py-1 rounded hover:bg-rose-50 text-rose-700"
             title="Delete image"
             onClick={() => editor.chain().focus().deleteSelection().run()}
           ><Trash2 size={16} /></button>
         </div>
       </BubbleMenu>
    )}


            <div className="flex-1 overflow-auto py-2 w-full">
              {/* If you want a live outline component, pass `headings` + handler */}
              {/* <Outline headings={headings} onSelect={onSelectHeading} /> */}
              <EditorContent
                editor={editor}
                className="tiptap article-body prose w-full max-w-none px-2 py-2 mt-1 focus:border-none focus:outline-none focus:ring-none"
              />
               {/* Hero image -------------------------------------------------------
        {heroPreview && (
          <NextImage
            src={heroPreview}
            alt="hero"
            width={800}
            height={400}
            className={styles.hero}
          />
        )} */}
            </div>
          </div>
        </div>
        {/* Footer counter --------------------------------------------------- */}
        <div className="text-xs p-2 text-center tracking-wide">
          <span
            className={`${styles.charCount} ${
              counter.chars > CHAR_LIMIT ? "text-red-600" : ""
            }`}
          >
            {counter.words} words • {counter.chars}/{CHAR_LIMIT}
          </span>
        </div>
      </article>

      {/* Cropper modal ------------------------------------------------------ */}
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
              className="savebutton"
              onClick={async () => {
                await insertCroppedImage();
                setCropFile(null);
                setCropImage(null);
              }}
            >
              Insert
            </button>
            <button
              className="savebutton"
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

      {/* Restore‑from‑local banner ----------------------------------------- */}
      {pendingRestore && (
        <div className="fixed top-0 inset-x-0 bg-indigo-200/20 text-amber-900 p-2 text-sm flex justify-center gap-4 z-50 shadow-sm">
          Unsaved changes found on this device.
          <button
            className="underline"
            onClick={() => {
              if (!editor) return;
              editor.commands.setContent(pendingRestore.content);
              setTemplate(pendingRestore.template);
              setHeroImageKey(pendingRestore.heroImageKey);
              setHeroPreview(pendingRestore.heroImageKey);
              setPendingRestore(null);
              saveDraftImmediate();
            }}
          >
            Restore
          </button>
          <button
            onClick={() => {
              localStorage.removeItem(LOCAL_KEY(articleId));
              setPendingRestore(null);
              setIsDirty(false);
            }}
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
