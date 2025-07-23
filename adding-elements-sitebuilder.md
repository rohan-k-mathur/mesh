Below is a **developer checklist** you can follow every time you introduce a new canvas element
(e.g. YouTube/Vimeo embed, audio player, sticker, code block, …).


---

## 0. Plan: do you need *all* infrastructure?

| Feature                                         | Action                                                                                                                    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| Movable (drag anywhere)                         | *Nothing extra*—all elements already sit inside `<CanvasItem>` / `<SortableCanvasItem>` that the DnD‑kit wrappers handle. |
| Resizable by the four corner handles            | Add the element’s *kind* to the `ResizeTarget` union and make sure `handleResizeStart` can locate it (see step 6).        |
| Inline editing (click to edit text / URL, etc.) | Add a field to the element object to store the value and put an editable control in the renderer (step 7).                |
| Needs upload (images, audio)                    | Create an upload helper (like `uploadFileToSupabase`) and call it from the renderer’s `<input type=file>` handler.        |
| Needs remote data (YouTube iframe)              | Probably *no upload*; just store a `src` or `videoId`.                                                                    |

---

## 1. Update the **type definitions**

```ts
// ---- page.tsx (top of file) ----
type ElementType = "text" | "image" | "link" | "video";  // NEW

interface VideoElement {
  id: string;
  type: "video";
  src: string;       // e.g. https://www.youtube.com/embed/abc
  x?: number;        // only for free‑layout
  y?: number;
  width: number;
  height: number;
}

type Element = BuilderElement | VideoElement;
```

*If you keep a central `lib/portfolio/templates.ts`, update the exported
`BuilderElement` union there instead; the idea is the same.*

---

## 2. Add a **sidebar button** so users can drag it in

```tsx
{/* left‑hand sidebar */}
<DraggableItem id="video" fromSidebar>
  Video
  <Image src="/assets/video.svg" width={24} height={24} alt="" />
</DraggableItem>
```

---

## 3. Generate a default object when it is dropped

```ts
// ---- handleDragEnd inside PortfolioBuilder ----
if (active.data.current?.fromSidebar) {
  /* ... */
  setElements(els => [
    ...els,
    template === ""
      ? defaultObjectFor(active.id as ElementType, x, y)
      : defaultObjectFor(active.id as ElementType)
  ]);
}

function defaultObjectFor(kind: ElementType, x = 0, y = 0): Element {
  switch (kind) {
    case "video":
      return {
        id: nanoid(),
        type: "video",
        src: "",               // user chooses later
        x,
        y,
        width: 320,
        height: 180,
      };
    /* existing cases … */
  }
}
```

---

## 4. If the element should **participate in templates**

Add a stub entry to any template definitions:

```ts
elements: [
  { type: "video", src: "", width: 320, height: 180 }, // etc.
]
```

Template instances are created without free‑layout coordinates, so `x/y`
are omitted.

---

## 5. Extend the **resize infrastructure** (optional)

If you want videos to resize with the generic handles:

```ts
type ResizeTarget = { id: string; kind: "text" | "image" | "video" };
```

Inside `handleResizeStart` locate the object:

```ts
const obj =
  target.kind === "text"
    ? boxes.find(b => b.id === target.id)!
    : elements.find(el => el.id === target.id)!;   // now includes video
```

No other changes are needed—`onMove` already mutates `width/height`.

---

## 6. Create the **renderer**

Add a block in both render paths (free layout and template/grid) right after
the *image* case:

```tsx
case "video":
  return (
    <div className="p-1 border border-transparent">
      {/* video wrapper needed for resize handles */}
      <div className="relative inline-block">
        {el.src ? (
          <iframe
            src={el.src}
            width={el.width}
            height={el.height}
            className="pointer-events-none select-none"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <input
            className="border p-1 text-xs"
            placeholder="https://www.youtube.com/embed/ID"
            onPointerDown={e => e.stopPropagation()}
            onChange={e =>
              setElements(els =>
                els.map(it =>
                  it.id === el.id ? { ...it, src: e.target.value } : it
                )
              )
            }
          />
        )}

        {/* if resizable */}
        {["nw","ne","sw","se"].map(corner => (
          <div
            key={corner}
            onPointerDown={e =>
              proxyResizeStart(e, { id: el.id, kind: "video" }, corner)
            }
            className={`resize-handle handle-${corner}`}
          />
        ))}
      </div>
    </div>
  );
```

---

## 7. Prevent drag‑vs‑resize conflicts

* All resize handles must have the class `resize-handle`.
  The existing `handleBoxPointerDown` (for text) and the generic pointer‑down
  on images already ignore drags that start on such elements—so your video
  will too.

* Inside the editor controls (`<input>` above) call `e.stopPropagation()` on
  *pointer* **and** *mouse* events to prevent the wrapper from thinking it
  should drag.

---

## 8. Persist the element when exporting / publishing

### 8 a `buildAbsoluteExport()`

```ts
// append after absoluteElems
const absoluteVideos = elements
  .filter(e => e.type === "video")
  .map(e => ({
    id: e.id,
    type: "video",
    x: e.x ?? 0,
    y: e.y ?? 0,
    width: e.width,
    height: e.height,
    src: e.src,
  }));
return [...absoluteElems, ...absoluteText, ...absoluteVideos];
```

### 8 b If you save a **flat string representation** (`serialize()`),

append the video URLs or IDs similarly (often not needed).

---

## 9. Handle the element on the **published page**

Whatever consumes the `absolute[]` array must recognise `"video"` and render
an `<iframe>` (or `<video>` tag) at the saved coordinates / size.

---

## 10. CSS (optional)

If the resize squares overlap the iframe content, add

```css
iframe { pointer-events: none; }
```

so you can’t accidentally click the YouTube player while resizing/moving.
When you later implement *play* in preview mode, you can override that rule.

---

## 11. Update **eslint / tests / storybook** (if any)

Search for hard‑coded enum lists (`"image" | "text" | "link"`) in other files
and add `"video"`.

---

## 12. Checklist for every new element

| Step | File / Section                        | What to do                           |
| ---- | ------------------------------------- | ------------------------------------ |
| 1    | Types section                         | Add union literal and interface      |
| 2    | Sidebar JSX                           | Add `<DraggableItem>`                |
| 3    | `defaultObjectFor()`                  | Return sensible defaults             |
| 4    | Templates (optional)                  | Add stub object                      |
| 5    | `ResizeTarget` union + lookup logic   | Include new kind                     |
| 6    | Renderer (both free & template paths) | Implement visual + editing + handles |
| 7    | `buildAbsoluteExport` / `serialize`   | Persist data                         |
| 8    | Public‑page renderer                  | Display when published               |
| 9    | Assets / upload helper (if necessary) | Copy the image logic                 |
| 10   | Styling                               | Make sure resize handles are visible |

Follow the table row‑by‑row and you will not miss anything.

---

### Tips & Common Pitfalls

* **Don’t put React hooks inside callbacks** (we fixed that earlier).
* Use **`onPointerDown`** (not `onMouseDown`) everywhere so touch devices work.
* Remember to call `e.stopPropagation()` in any control that lives *inside*
  the draggable box (links, inputs, buttons).
* When an element does not move, check that its wrapper has the class
  `cursor-move` and is **not** entirely covered by an input/iframe that
  captures the events.
* Keep the *single source of truth* for width/height in React state—*never*
  read from `getBoundingClientRect()` when exporting; just use the saved
  numbers.

You can now add as many element kinds as you like by repeating the steps.
