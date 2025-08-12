/* eslint‑disable max‑lines */
'use client';

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import ImageExt from '@tiptap/extension-image';
import {
  PullQuote as PullQuoteBase,
  Callout as CalloutBase,
  MathBlock as MathBlockBase,
  MathInline as MathInlineBase,
} from '@/lib/tiptap/extensions';

import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Collaboration from '@tiptap/extension-collaboration';
import CollaborationCursor from '@tiptap/extension-collaboration-cursor';
import CharacterCount from '@tiptap/extension-character-count';
import TextStyle from '@tiptap/extension-text-style';
import Underline from '@tiptap/extension-underline';
import Color from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import { createLowlight } from 'lowlight';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import katex from 'katex';
import { keymap } from '@tiptap/pm/keymap';
import { Node, mergeAttributes, type JSONContent, type Extension } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import enStrings from '@/public/locales/en/editor.json';
import { useDebouncedCallback } from 'use-debounce';

import { TextStyleTokens } from '@/lib/tiptap/extensions/text-style-ssr';
import { useEditor, Editor } from '@tiptap/react'

import SlashCommand from './editor/SlashCommand';
import Toolbar from './editor/Toolbar';
import TemplateSelector from './editor/TemplateSelector';
import { uploadFileToSupabase } from '@/lib/utils';
import styles from './article.module.scss';
import Spinner from '../ui/spinner';
import dynamic from 'next/dynamic';
import NextImage from 'next/image';                              // 🆕 missing import
import { useRouter } from "next/navigation";
import 'katex/dist/katex.min.css';

/* -------------------------------------------------------------------------- */
/*  Dynamic imports                                                            */
/* -------------------------------------------------------------------------- */

const Cropper = dynamic(() => import('react-easy-crop'), {
  ssr: false,
  loading: () => <Spinner />,
});

/* -------------------------------------------------------------------------- */
/*  Module augmentation for CharacterCount storage                             */
/* -------------------------------------------------------------------------- */

declare module '@tiptap/core' {
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

interface ArticleEditorProps { articleId: string }


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
      <blockquote className={`pull-quote ${node.attrs.alignment}`}>
        {node.content.map(c => c.text).join(' ')}
      </blockquote>
    ))
  },
})

const Callout = Node.create({
  name: 'callout',
  group: 'block',
  content: 'paragraph+',
  addAttributes() {
    return { type: { default: 'info' } };
  },
  parseHTML() {
    return [{ tag: 'div.callout' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, {
        class: `callout ${HTMLAttributes.type}`,
      }),
      0,
    ];
  },
});

const MathBlock = Node.create({
  name: 'mathBlock',
  group: 'block',
  atom: true,
  addAttributes() {
    return { latex: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'div[data-type=math-block]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math-block' }),
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
  name: 'mathInline',
  group: 'inline',
  inline: true,
  atom: true,
  addAttributes() {
    return { latex: { default: '' } };
  },
  parseHTML() {
    return [{ tag: 'span[data-type=math-inline]' }];
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(HTMLAttributes, { 'data-type': 'math-inline' }),
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
      caption: { default: '' },
      align: { default: 'center' },
      alt: { default: '' },
      missingAlt: { default: false },
    };
  },
  renderHTML({ HTMLAttributes }) {
    return [
      'figure',
      {
        class: `image align-${HTMLAttributes.align}${
          HTMLAttributes.missingAlt ? ' a11y-error' : ''
        }`,
      },
      ['img', { src: HTMLAttributes.src, alt: HTMLAttributes.alt }],
      ['figcaption', HTMLAttributes.caption],
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

  const [template,      setTemplate]      = useState('standard');
  const [heroImageKey,  setHeroImageKey]  = useState<string | null>(null);
  const [heroPreview,   setHeroPreview]   = useState<string | null>(null);
  const [headings,      setHeadings]      = useState<Heading[]>([]);
  const [cropFile,      setCropFile]      = useState<File | null>(null);
  const [cropImage,     setCropImage]     = useState<string | null>(null);
  const [crop,          setCrop]          = useState({ x: 0, y: 0 });
  const [zoom,          setZoom]          = useState(1);
  const [croppedArea,   setCroppedArea]   = useState<any>(null);
  const [a11yErrors,    setA11yErrors]    = useState(0);
  const [suggestion,    setSuggestion]    = useState(false);
  const [isDirty,       setIsDirty]       = useState(false);
  const [showUnsaved,   setShowUnsaved]   = useState(false);
  const [pendingRestore,setPendingRestore]= useState<Backup | null>(null);
  const [counter,       setCounter]       = useState({ words: 0, chars: 0 });
  const [editorRef, setEditorRef] = useState<Editor | null>(null)
  const [initialJson, setInitialJson] = useState<any>()
  const [publishing, setPublishing] = useState(false)

  const [title, setTitle] = useState<string>('Untitled')
  const router = useRouter();

  /* ------------------------------ y‑js / collab --------------------------- */

  const ydoc = useMemo(() => new Y.Doc(), []);

  const provider = useMemo(() => {
    if (!COLLAB_ENABLED || typeof window === 'undefined') return null;
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    return new WebsocketProvider(
      `${proto}://${window.location.host}/ws/article/${articleId}`,
      articleId,
      ydoc,
    );
  }, [articleId, ydoc]);

  /* ------------------------------ lowlight -------------------------------- */

  const lowlight = useMemo(() => {
    const ll = createLowlight();
    ll.register('js', javascript);
    ll.register('ts', typescript);
    ll.register('py', python);
    ll.register('sh', bash);
    return ll;
  }, []);

  /* ---------------------------- i18n helper ------------------------------ */

  const t = (key: string) =>
    ((window as any)?.i18next?.t?.(`editor:${key}`) as string) ||
    (enStrings as any)[key] ||
    key;

  /* ------------------------- editor extensions --------------------------- */

  const userName  = useMemo(() => `User${Math.floor(Math.random() * 1000)}`, []);
  const userColor = useMemo(() => `#${Math.floor(Math.random() * 0xffffff).toString(16)}`, []);

  const extensions = useMemo<Extension[]>(() => {
    return [
      StarterKit,

      TaskList,
      TaskItem,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote', 'listItem'],
        alignments: ['left', 'center', 'right', 'justify'],
      }),
      Underline,
   
      CustomImage,
      Link,
      Placeholder.configure({ placeholder: 'Write something…' }),
      PullQuote,
      Callout,
      MathBlock,
      MathInline,
      TextStyleTokens,
      CharacterCount.configure({ limit: CHAR_LIMIT }),
      SlashCommand,
      COLLAB_ENABLED && provider && Collaboration.configure({ document: ydoc }),
      COLLAB_ENABLED && provider &&
        CollaborationCursor.configure({
          provider,
          user: { name: userName, color: userColor },
        }),
    ].filter(Boolean) as Extension[];          // TS narrow‑down
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
   onCreate: ({ editor }) => setEditorRef(editor),
 })

  /** 3️⃣ autosave once the editor is ready */
  useEffect(() => {
    if (!editorRef) return
    const save = () => {
      const body = {
        astJson: editorRef.getJSON(),
        template,
        heroImageKey,
        title
      }
      fetch(`/api/articles/${articleId}/draft`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
    }
    const id = setInterval(save, 1500)
    return () => clearInterval(id)
  }, [editorRef, articleId, template, heroImageKey])
  /* ---------------------------------------------------------------------- */
  /*  Dirty‑flag + “are you sure you want to leave?” browser dialog          */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    if (isDirty) window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  /* ---------------------------------------------------------------------- */
  /*  Debounced save                                                         */
  /* ---------------------------------------------------------------------- */

  const saveDraftImmediate = useCallback(async () => {
    if (!editor || !articleId) return
    const body = {
      astJson: editor.getJSON(),
      template,
      heroImageKey,
      title,
    }
    await fetch(`/api/articles/${articleId}/draft`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    localStorage.setItem(
      LOCAL_KEY(articleId),
      JSON.stringify({ ts: Date.now(), ...body }),
    )
    setIsDirty(false)
    setShowUnsaved(false)
  }, [editor, articleId, template, heroImageKey, title])

  const saveDraft = useCallback(async () => {
    if (!editor) return
    const body = {
      astJson: editor.getJSON(),
      template,
      heroImageKey,
      title,
    }
    await fetch(`/api/articles/${articleId}/draft`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
  }, [editor, articleId, template, heroImageKey, title])

  useEffect(() => {
    if (!editor) return
    const id = setInterval(saveDraft, 1500)
    return () => clearInterval(id)
  }, [editor, saveDraft])
//   const publishArticle = useCallback(async () => {
//     if (!articleId) return;
// const res = await fetch(`/api/articles/${articleId}/publish`, { method: 'POST' })


//     //localStorage.removeItem('draftArticleId')
//     const { slug } = await res.json()

//     if (res.ok) {
//       const data = await res.json();
//       //localStorage.removeItem(LOCAL_KEY(articleId));
//       //localStorage.removeItem("draftArticleId");
//       //router.push(`/article/${data.slug}`);
//       router.push(`/article/${slug}`)           // open the published page
//       localStorage.removeItem('draftArticleId')

//     }
//   }, [articleId, router]);

const publishArticle = useCallback(async () => {
  if (!articleId || !editor || publishing) return
  setPublishing(true)
  try {
    // ensure db has the latest title/JSON/etc.
    await saveDraftImmediate()

    const res = await fetch(`/api/articles/${articleId}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        astJson: editor.getJSON(),
        template,
        heroImageKey,
        title,
      }),
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => 'Unknown error')
      console.error('Publish failed:', res.status, errText)
      // TODO: toast(errText)
      return
    }

    const { slug } = await res.json()  // ← only read once
    localStorage.removeItem('draftArticleId')
    router.replace(`/article/${slug}`)
  } finally {
    setPublishing(false)
  }
}, [articleId, editor, template, heroImageKey, title, router, publishing, saveDraftImmediate])
  //   if (!editor) return;
  //   const controller = new AbortController();

  //   (async () => {
  //     try {
  //       if (!articleId) return            // never hit the API with undefined

  //       const res = await fetch(`/api/articles/${articleId}`, {
  //         signal: controller.signal,
  //       });
  //       if (!res.ok) return;
  //       const data = await res.json();         // consume body only once
  //       const serverUpdated = new Date(data.updatedAt ?? 0).getTime();

  //       editor.commands.setContent(data.astJson ?? []);
  //       setTemplate(data.template ?? 'standard');
  //       setHeroImageKey(data.heroImageKey ?? null);
  //       setHeroPreview(data.heroImageKey ?? null);

  //       /* … look for a fresher local backup … */
  //       const local = localStorage.getItem(LOCAL_KEY(articleId));
  //       if (local) {
  //         const parsed: Backup = JSON.parse(local);
  //         if (parsed.ts > serverUpdated) {
  //           setPendingRestore(parsed);
  //         }
  //       }
  //     } catch (err) {
  //       if ((err as DOMException).name !== 'AbortError') {
  //         console.error(err);
  //       }
  //     }
  //   })();

  //   return () => controller.abort();
  // }, [articleId, editor]);

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
    editor.on('update', updateCounter);
    return () => editor.off('update', updateCounter);
  }, [editor]);

  /* ---------------------------------------------------------------------- */
  /*  Keyboard shortcuts                                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!editor) return;
    const plugin = keymap({
      'Mod-b': () => editor.chain().focus().toggleBold().run(),
      'Mod-i': () => editor.chain().focus().toggleItalic().run(),
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
        if (node.type.name !== 'heading') return;

        const text = node.textContent;
        let id = text
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)+/g, '');

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
    editor.on('update', updateHeadings);
    return () => editor.off('update', updateHeadings);
  }, [editor]);

  /* ---------------------------------------------------------------------- */
  /*  Dirty‑flag on change + queued save                                     */
  /* ---------------------------------------------------------------------- */

  useEffect(() => {
    if (!editor) return;
    const handler = () => {
      setIsDirty(true);
      setShowUnsaved(true);
      saveDraft();                // 2‑s debounce
    };
    editor.on('update', handler);
    return () => editor.off('update', handler);
  }, [editor, saveDraft]);

  /* also mark dirty when template or hero image changes */
  useEffect(() => {
    setIsDirty(true);
    setShowUnsaved(true);
    saveDraft();
  }, [template, heroImageKey, saveDraft]);

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

    const res = await fetch(
      `/api/articles/presign?filename=${encodeURIComponent(file.name)}&contentType=${encodeURIComponent(file.type)}`,
    );
    const { uploadUrl } = await res.json();

    await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type },
      body: file,
    });

    const publicUrl = uploadUrl.split('?')[0];
    setHeroImageKey(publicUrl);
    setHeroPreview(publicUrl);
    e.target.value = '';
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropFile(file);
    setCropImage(URL.createObjectURL(file));
    e.target.value = '';
  };

  const onCropComplete = useCallback((_: any, area: any) => {
    setCroppedArea(area);
  }, []);

  const insertCroppedImage = async () => {
    if (!cropFile || !croppedArea || !editor) return;
    const img = new Image();
    img.src = cropImage as string;
    await new Promise((res) => (img.onload = res));

    const canvas = document.createElement('canvas');
    canvas.width  = croppedArea.width;
    canvas.height = croppedArea.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(
      img,
      croppedArea.x,     croppedArea.y,
      croppedArea.width, croppedArea.height,
      0,                 0,
      croppedArea.width, croppedArea.height,
    );

    return new Promise<void>((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], cropFile.name, { type: cropFile.type });
        const { fileURL } = await uploadFileToSupabase(file);
        if (fileURL) {
          editor.chain().focus().setImage({
            src: fileURL, caption: '', align: 'center', alt: '',
          }).run();
        }
        resolve();
      });
    });
  };

  const onSelectHeading = (id: string) => {
    const h = headings.find((x) => x.id === id);
    if (!h || !editor) return;
    const dom = editor.view.domAtPos(h.pos).node as HTMLElement;
    dom.scrollIntoView({ behavior: 'smooth' });
  };

  const runA11yCheck = () => {
    if (!editor) return;
    document
      .querySelectorAll('.a11y-error')
      .forEach((el) => el.classList.remove('a11y-error'));

    let last = 0;
    let errors = 0;

    editor.state.doc.descendants((node, pos) => {
      if (node.type.name === 'heading') {
        const dom = editor.view.nodeDOM(pos) as HTMLElement;
        const lvl = node.attrs.level;
        if (last && lvl > last + 1) {
          dom.classList.add('a11y-error');
          errors++;
        }
        last = lvl;
      }

      if (node.type.name === 'image') {
        const dom = editor.view.nodeDOM(pos) as HTMLElement;
        if (!node.attrs.alt) {
          dom.classList.add('a11y-error');
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, missingAlt: true });
            return true;
          });
          errors++;
        } else {
          editor.commands.command(({ tr }) => {
            tr.setNodeMarkup(pos, undefined, { ...node.attrs, missingAlt: false });
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
  if (!editor) return <div>Loading editor…</div>

  return (
    <div className="flex justify-center items-center ">
      <article className={template}>
        {/* Top‑bar ---------------------------------------------------------- */}
        {showUnsaved && (
          <div className="fixed flex left-0 top-0 text-red-600">{t('unsavedChanges')}</div>
        )}

        <div className="flex flex-col ">
       
          
          <div className="flex flex-1 flex-wrap space-x-3 gap-2 justify-center mb-3">
          <button className=" savebutton rounded-xl bg-white/70  p-2  text-xs h-fit ">
            <input  type="file" onChange={onHeroUpload} hidden />
            Upload hero
          </button>
      

          <button
            className="savebutton rounded-xl bg-white/70 p-2 h-fit text-xs"
            onClick={() => setSuggestion(!suggestion)}
          >
            {suggestion ? t('suggestionOff') : t('suggestionMode')}
          </button>
          <button
            className="savebutton rounded-xl bg-white/70 p-2 h-fit text-xs"
            onClick={saveDraftImmediate}
          >
            {t('saveDraft')}
          </button>
          {/* <button
            className="savebutton rounded-xl bg-white p-2 text-xs h-fit"
            onClick={runA11yCheck}
          >
            {t('checkAccessibility')}
          </button> */}
             <button
            className="savebutton rounded-xl bg-white/70 px-4   py-2 items-end justify-end h-fit text-xs"
            onClick={publishArticle}
          >
            Publish
          </button>
          </div>
          <TemplateSelector
            articleId={articleId}
            template={template}
            onChange={setTemplate}
          />
       
        </div>

        {/* Hero image ------------------------------------------------------- */}
        {heroPreview && (
          <NextImage
            src={heroPreview}
            alt="hero"
            width={800}
            height={400}
            className={styles.hero}
          />
        )}

        {/* Editor ----------------------------------------------------------- */}
        <div className="h-full flex flex-col gap-2">
        <input
  className="w-full text-3xl font-semibold bg-transparent outline-none placeholder:text-neutral-400 mb-2"
  placeholder="Title"
  value={title}
  onChange={(e) => setTitle(e.target.value.slice(0, 200))}
  onBlur={saveDraftImmediate}
/>
          <input id="image-upload" type="file" onChange={onImageUpload} hidden />
          <Toolbar editor={editor} />
          <div className="flex-1 overflow-auto">
            {/* If you want a live outline component, pass `headings` + handler */}
            {/* <Outline headings={headings} onSelect={onSelectHeading} /> */}
            <EditorContent editor={editor}  className="tiptap article-body prose max-w-none px-0 py-0" />
          </div>
        </div>

        {/* Footer counter --------------------------------------------------- */}
        <div className="text-xs p-2 tracking-wide">
          <span
            className={`${styles.charCount} ${
              counter.chars > CHAR_LIMIT ? 'text-red-600' : ''
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
