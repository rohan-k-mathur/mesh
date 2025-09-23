Below is a **developer checklist** you can follow every time you introduce a new canvas element
(e.g. YouTube/Vimeo embed, audio player, sticker, code block, …).

It reflects everything that has been built so far **and** answers the follow‑up
question: *“which extra files must change when you add a brand‑new canvas
element (e.g. an embedded video)?”*

---

# ✧ How to add a new canvas element to the Site Builder

The Site Builder lives in three distinct layers:

| Layer                    | Purpose                                                                                                | Key files                                                                                                                                  |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| **Authoring UI**         | Drag, resize, style.                                                                                   | `app/portfolio/builder/page.tsx`                                                                                                           |
| **Shared library**       | TypeScript types, presets & helpers used by *both* the builder and the public viewer/exporter.         | `lib/portfolio/*.ts`, `lib/components/CanvasRenderer.tsx`                                                                                  |
| **Publishing / viewing** | ① Export route that stores JSON + snapshot.<br>② Public `[slug]` page & `<PortfolioCard>` in the feed. | `api/portfolio/export.ts` (backend)<br>`app/portfolio/[slug]/page.tsx` (frontend)<br>`components/cards/PortfolioCard.tsx` (feed thumbnail) |

Any new element (let’s call it **`video`**) must be wired through **all three
layers**.  There are *no* other places in the repo that need touching.

---

## 1  Authoring layer – `app/portfolio/builder/page.tsx`

1. **Extend the union**

   ```ts
   type BuilderElement["type"]  // previously "text" | "image" | "link" | "box"
     = "text" | "image" | "link" | "box" | "video";          // + video
   ```

2. **Default object when dragging from the sidebar**

   ```ts
   // inside handleDragEnd → fromSidebar branch
   {
     id: nanoid(),
     type: "video",
     src: "",
     x, y,
     width: 480,   // sensible default
     height: 270,
   }
   ```

3. **Sidebar button**

   ```tsx
   <DraggableItem id="video" fromSidebar>
     Video
     <Image src="/assets/video.svg" … />
   </DraggableItem>
   ```

4. **Canvas rendering / interaction**

   *Add a new case where images are currently handled.*

   ```tsx
   {el.type === "video" && (
     <div className="p-1 border border-transparent">
       {el.src ? (
         <iframe
           src={el.src}
           width={el.width}
           height={el.height}
           className="pointer-events-none"   // so resize/drag works
           allow="autoplay; encrypted-media"
           allowFullScreen
         />
       ) : (
         <input
           placeholder="https://www.youtube.com/embed/…"
           …onChange={e => setElements(…)}
         />
       )}
       {cornerHandles}    // same <div className="resize-handle …"/>
     </div>
   )}
   ```

   *No change to the generic resize helpers – they already use
   `target.kind === "image" | "text"`, so add `"video"`.*

   ```ts
   type ResizeTarget = { id: string; kind: "text" | "image" | "video" };
   ```

---

## 2  Shared library layer (`lib/portfolio`)

### 2.1 `templates.ts`

```ts
export interface BuilderElement {
  id: string;
  type: "text" | "image" | "link" | "box" | "video";  // + video
  // image/video
  src?: string;
  width?: number;
  height?: number;
  // …
}
```

Add demo objects in the starter templates if you wish.

### 2.2 `export.ts`

*Both* the runtime helper `buildAbsoluteExport()` (inside the Builder page) and
the formal `AbsoluteElement` type live here.

```ts
export type AbsoluteElement =
  | { type: "video"; src: string; x: number; y: number; width: number; height: number; id: string }
  | /* existing cases */;
```

The HTML/React‑string generators already have a `switch` – add the
`case "video":`.

*No server‑side code changes are needed here.*

---

## 3  Publishing / viewing layer

### 3.1 `api/portfolio/export.ts`

**Usually unchanged.**

Only touch this file if:

* You need to **strip active iframes** when taking the PNG snapshot (HTML2Canvas
  cannot capture them).  Typical fix:

  ```ts
  // just before html2canvas()
  const restore: (() => void)[] = [];
  node.querySelectorAll("iframe").forEach((f) => {
    const ph = document.createElement("div");
    ph.style.width  = f.style.width;
    ph.style.height = f.style.height;
    ph.style.background = "#000";
    f.replaceWith(ph);
    restore.push(() => ph.replaceWith(f));
  });
  const bitmap = await html2canvas(node, { … });
  restore.forEach(fn => fn());
  ```

* You want to validate `/ sanitize` the incoming video URLs.

Otherwise exporting remains the same because the payload is opaque JSON.

### 3.2 Public viewer – `app/portfolio/[slug]/page.tsx`

Add a render branch identical to what you put in the builder but without the
resize handles:

```tsx
case "video":
  return (
    <iframe
      key={abs.id}
      src={abs.src}
      style={{
        position: "absolute",
        left: abs.x,
        top:  abs.y,
        width: abs.width,
        height: abs.height,
      }}
      allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
      allowFullScreen
    />
  );
```

### 3.3 Feed card – `components/cards/PortfolioCard.tsx`

If you rely solely on the PNG snapshot there is **nothing to do**. If you show
an icon when no snapshot exists, add a `video` fallback icon.

---

## 4  Other files in the list

| File                                                  | Needs a change?                                                                                   | Reason                                   |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| **`components/forms/CreateFeedPost.tsx`**             | **No**                                                                                            | It posts whatever JSON is produced.      |
| **`lib/actions/realtimepost.actions.ts`**             | **No**                                                                                            | Payload remains `{ snapshot, pageUrl }`. |
| **`components/modals/PortfolioSiteBuilderModal.tsx`** | **No**                                                                                            | It simply mounts the Builder page.       |
| **`lib/components/CanvasRenderer.tsx`**               | **Yes** **if** you use it for static previews (e.g. inside a modal). Add the same `video` branch. |                                          |

---

## 5  Quick check‑list for future element types

1. **Authoring UI**
   \* Sidebar button → default object → render branch → resize target kind.\*

2. **Shared library**
   \* Type extension + (optional) default template item.\*

3. **Public viewer**
   \* Render branch.\*

4. **(Optional)** export route tweaks for snapshot or validation.

That’s it. The rest of the application (Supabase storage, feed actions, modals)
is *element‑agnostic* and keeps working automatically.

---

> **Pro‑tip**
> Keep this doc up‑to‑date as the single source of truth; it prevents drift when
> someone else on the team adds *audio*, *GIF stickers*, or any other fun block
> six months from now.

