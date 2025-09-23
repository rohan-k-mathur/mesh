Below is a **hands‑on build script** for the Urban Bazaar UI that matches your
“write‑CSS‑in‑globals + Tailwind classes” workflow (no Figma, Storybook, or
token engine).  Follow it top‑to‑bottom; each step compiles with a running dev
server and needs only one person.

---

## 0 · Folder cheatsheet

```
app/
 └─ swapmeet/
     ├─ market/[x]/[y]/page.tsx  ← section page
     ├─ components/
     │    ├─ NavArrow.tsx
     │    ├─ StallCard.tsx
     │    ├─ Minimap.tsx
     │    ├─ TeleportButton.tsx
     │    ├─ StallSheet.tsx      ← detail overlay
     │    ├─ OfferLadder.tsx
     │    └─ AuctionRing.tsx
     └─ dashboard/stalls/page.tsx
globals.css                       ← add UBZ utilities
```

---

## 1 · Add one‑off Urban Bazaar utilities to **globals.css**

```css
/* === Urban Bazaar palette + shadows === */
:root {
  --ubz-bg:       #F5F3F1;
  --ubz-card:     #FFFFFF;
  --ubz-street:   #3B3B3B;
  --ubz-brand:    #E94C40;
  --ubz-accent:   #1599A3;
  --ubz-shadow-1: -3px 3px 7px rgba(222,199,204,.53), 3px 3px 7px rgba(0,0,0,.15);
  --ubz-shadow-h: -2px 2px 4px rgba(222,199,204,.53), .5px 1px 4px rgba(0,0,0,.15);
}

/* re‑usable helpers */
.ubz-card   { background: var(--ubz-card); box-shadow: var(--ubz-shadow-1); }
.ubz-card-h:hover { box-shadow: var(--ubz-shadow-h); }
.ubz-ring   { outline: 3px solid var(--ubz-brand); border-radius: 9999px; }
.ubz-pulse  { animation: ubzPulse 1.2s infinite; }
@keyframes ubzPulse { 0%{opacity:.7} 50%{opacity:0;} 100%{opacity:.7} }
```

No Tailwind plugin needed—you’ll mix these classes with inline utilities.

---

## 2 · **Section page** `/market/[x]/[y]`

### 2.1 scaffold layout

```tsx
// app/swapmeet/market/[x]/[y]/page.tsx
import { NavArrow } from "@/app/swapmeet/components/NavArrow";
import { Minimap } from "@/app/swapmeet/components/Minimap";
import { TeleportButton } from "@/app/swapmeet/components/TeleportButton";
import { getSection } from "swapmeet-api";

export default async function SectionPage({ params }) {
  const x = Number(params.x), y = Number(params.y);
  const { stalls } = await getSection(x, y);

  return (
    <main className="relative h-dvh bg-[var(--ubz-bg)]">
      {/* controls */}
      <NavArrow dir="N" x={x} y={y} />
      <NavArrow dir="E" x={x} y={y} />
      <NavArrow dir="S" x={x} y={y} />
      <NavArrow dir="W" x={x} y={y} />
      <TeleportButton />

      <Minimap cx={x} cy={y} />

      {/* 3×3 grid */}
      <div className="absolute inset-0 grid grid-cols-3 gap-[3%] p-[clamp(16px,4vw,40px)]">
        {stalls.map(s => (
          <StallCard key={s.id} stall={s} />
        ))}
      </div>
    </main>
  );
}
```

### 2.2 NavArrow component

```tsx
// NavArrow.tsx
"use client";
import { useRouter } from "next/navigation";

const vec = { N:[0,1], S:[0,-1], E:[1,0], W:[-1,0] } as const;

export function NavArrow({ dir, x, y }:{dir:"N"|"S"|"E"|"W",x:number,y:number}) {
  const router = useRouter();
  const [dx,dy] = vec[dir];
  return (
    <button
      onClick={()=>router.push(`/swapmeet/market/${x+dx}/${y+dy}`)}
      className="
        fixed z-20 text-white/80 bg-[var(--ubz-street)]
        w-10 h-10 rounded-full grid place-content-center
        hover:bg-[var(--ubz-brand)] transition-transform 
        hover:scale-105"
      style={{
        top: dir==="N"&&"10px",
        bottom: dir==="S"&&"10px",
        left: dir==="W"&&"10px",
        right: dir==="E"&&"10px",
      }}
    >
      {dir}
    </button>
  );
}
```

*(Replace text with an SVG arrow later.)*

### 2.3 StallCard component

```tsx
// StallCard.tsx
"use client";
import Link from "next/link";

export function StallCard({ stall }:{stall:any}) {
  return (
    <Link href={`/swapmeet/stall/${stall.id}`} className="ubz-card ubz-card-h group rounded-lg overflow-hidden">
      <div className="relative aspect-square">
        <img src={stall.img} alt={stall.name} className="object-cover w-full h-full group-hover:scale-105 transition-transform"/>
        {stall.live && <span className="ubz-ring ubz-pulse absolute top-1 right-1 w-3 h-3"></span>}
      </div>
      <div className="p-2">
        <p className="font-headline text-sm">{stall.name}</p>
        <span className="text-xs bg-white/60 px-1 rounded">{stall.visitors}👥</span>
      </div>
    </Link>
  );
}
```

---

## 3 · **Minimap**

```tsx
// Minimap.tsx
"use client";
import useSWR from "swr";
import { useEffect, useRef } from "react";

export function Minimap({cx,cy}:{cx:number;cy:number}) {
  const {data}=useSWR(`/swapmeet/api/heatmap?x0=${cx-5}&x1=${cx+5}&y0=${cy-5}&y1=${cy+5}`,u=>fetch(u).then(r=>r.json()),{refreshInterval:3000});
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(()=>{
    if(!canvas.current||!data) return;
    const ctx=canvas.current.getContext("2d")!;
    ctx.clearRect(0,0,200,200);
    data.forEach(({x,y,visitors}:{x:number,y:number,visitors:number})=>{
      const relX = x-cx+5, relY = cy-y+5; // invert y
      const alpha = Math.min(visitors/20,1);
      ctx.fillStyle = `hsla(${120-alpha*120} 80% 50% / ${0.2+alpha*0.8})`;
      ctx.fillRect(relX*18, relY*18, 16, 16);
    });
    // current pos outline
    ctx.strokeStyle="#000";ctx.lineWidth=2;
    ctx.strokeRect(5*18,5*18,16,16);
  },[data,cx,cy]);

  return <canvas ref={canvas} width={200} height={200} className="absolute bottom-4 right-4 bg-white/70 rounded shadow"/>;
}
```

---

## 4 · **TeleportButton**

```tsx
// TeleportButton.tsx
"use client";
import { useRouter } from "next/navigation";

export function TeleportButton(){
  const router=useRouter();
  const jump=async()=>{
    const sec=await fetch("/swapmeet/api/heatmap?busy=true").then(r=>r.json());
    router.push(`/swapmeet/market/${sec.x}/${sec.y}`);
  };
  return(
    <button onClick={jump}
      className="fixed bottom-4 left-4 w-12 h-12 rounded-full bg-[var(--ubz-brand)] text-white text-xl
                 animate-spin-slow hover:animate-none">
      🎲
    </button>
  );
}
```

Add to `globals.css`:

```css
@keyframes spin-slow{0%{transform:rotate(0)}100%{transform:rotate(360deg)}}
.animate-spin-slow{animation:spin-slow 3s linear infinite}
```

---

## 5 · **Stall Detail Overlay** (quick MVP)

Using shadcn/ui `Sheet` (already part of Mesh):

```tsx
// StallSheet.tsx
"use client";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export default function StallSheet({open,onOpenChange,stall}:{open:boolean,onOpenChange:any,stall:any}){
  return(
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="!h-[90vh] rounded-t-lg">
        <header className="flex items-center gap-2">
          <img src={stall.avatar} className="w-8 h-8 rounded-full"/>
          <h2 className="font-headline">{stall.name}</h2>
          {/* Follow btn etc */}
        </header>
        <div className="relative mt-2">
          {/* video placeholder */}
          <video src={stall.liveSrc} className="w-full aspect-video bg-black" autoPlay muted />
          {/* item grid overlay */}
          {/* ... */}
        </div>
        {/* Chat + Offer widgets here */}
      </SheetContent>
    </Sheet>
  );
}
```

Open it from `StallCard` with client state.

---

## 6 · **Seller Dashboard**

Your existing TanStack table works—style tweak:

```tsx
<table className="w-full text-sm">
  <thead className="bg-[var(--ubz-street)] text-white">
```

New‑stall button:

```tsx
<Button className="bg-[var(--ubz-brand)] text-white shadow-ubz1 fixed top-4 right-4">+ New Stall</Button>
```

---

## 7 · **Responsive tweaks**

Add to **globals.css** at the bottom:

```css
@media (max-width:767px){
  .section-grid{grid-template-columns:1fr!important}
}
@media (min-width:768px) and (max-width:1279px){
  .section-grid{grid-template-columns:repeat(2,1fr)!important}
}
```

Then change grid div:

```jsx
<div className="absolute inset-0 section-grid gap-[3%] p-[clamp(16px,4vw,40px)]">
```

---

## 8 · **Keyboard tooltips**

Minimal:

```html
<div className="fixed bottom-2 right-1/2 translate-x-1/2 text-xs text-[var(--ubz-street)]">
  ← ↑ ↓ → or WASD to move
</div>
```

Hide with CSS `@media (max-width: 600px){ .kbdTip{display:none} }`.

---

## 9 · **Build order in Git**

| PR     | Contains                                                       |
| ------ | -------------------------------------------------------------- |
| **#1** | globals.css additions, NavArrow, Minimap, Section page tweaks. |
| **#2** | StallCard, TeleportButton + png fallback.                      |
| **#3** | StallSheet overlay basics.                                     |
| **#4** | Dashboard button style, responsive grid CSS.                   |
| **#5** | Refinement: hover video preview, offer ladder, chat gradient.  |

Each PR is compile‑ready; no migrations.

---

### Done

This gives you a **visually coherent Urban Bazaar UI** with the same lean
workflow you’re already using—inline Tailwind, a handful of custom classes,
and zero design‑system overhead.  Ship PR #1 and we’ll iterate on micro‑details
(like SVG icons and motion timing) next.


Look & Feel Boards

| A. Urban Bazaar                                                          | B. Neo‑Pixel                                                                 | C. Warm Minimal                                                         |
| ------------------------------------------------------------------------ | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| **Palette**: Deep charcoal, brick red, neon‑sign teal, kraft‑paper tan.  | **Palette**: Midnight canvas, cyber‑cyan, magenta accents, white grid lines. | **Palette**: E‑ink black, cream background, muted accent pastels.       |
| **Type**: *Lausanne* for headings (municipal poster vibe), *Inter* body. | **Type**: *Space Grotesk* headings, *IBM Plex Mono* body.                    | **Type**: *Satoshi* headings, *Source Sans 3* body.                     |
| **Imagery**: Photo‑treated stalls with semitone halftone overlay.        | **Imagery**: 32‑px pixel‑art stall icons; low‑fi item sprites.               | **Imagery**: High‑res photos; rounded‑corner cards; lots of whitespace. |
| **Motion**: Parallax street‑lamp glow on hover; item cards “swing” in.   | **Motion**: Snap grid; 80 ms pixel‑step transitions; LED blink when live.    | **Motion**: Gentle fade & scale; springy carton effect on drag.         |
| **Edge**: Appeals to streetwear & vinyl crowd.                           | **Edge**: Gamer / hacker aesthetic; Twitch‑adjacent.                         | **Edge**: Etsy‑like; easy on older shoppers.                            |


- CHOOSING URBANBAZAAR LOOK

- 3 · Key Screen Frames
3.1 Section Page (/market/x/y)
Navigation Chrome

Edge‑hover ∠ arrows, WASD tooltip.

Minimap bottom‑right; squares pulse heat‑map gradient (HSL: hue → traffic).

Stall Grid (3×3)

Card width 30 % viewport, gap 3 %.

Live seller badge: pulsating ring + avatar.

Visitor count chip (ghost white bg, 60 % opacity).

Teleport Button

Floating “dice” button (roll animation) bottom‑left; on click fade‑out → quick zoom‑in to new section.

3.2 Stall Detail Overlay
Region	UI Elements	Notes
Header bar	Stall avatar, name, Follow btn, rating.	Slide‑down entry.
Media pane	Live video at 16 : 9; items grid floats in over video when mouse idle.	Smooth freeze‑frame fallback if stream drops.
Chat panel	Right 25 % width; message bubbles with soft gradient tail.	Cursor‑linked high‑light when user hovers same item.
Offer widget	Sticky footer bar: price field, “Make Offer” CTA, live haggling ladder.	Color shifts (red ↔ green) based on last price move.

3.3 Seller Dashboard
TanStack Table with shaded row hover.

“New Stall” button floats top‑right with + icon.

Form modal: vertical stepper—Details → Images → Location → Review.

4 · Component Library Cheat‑Sheet
Component	States & Vars	Micro‑interaction
Nav Arrow	idle · hover · press	Arrow grows 5 %, emits faint ripple outward.
Stall Card	idle · seller‑live · sold‑out	On hover, card lifts 6 px, video preview auto‑plays (muted).
Heat‑map square	low → high traffic (opacity 0.2–1)	Glucose ripple every 15 s if top‑10 traffic.
Offer Ladder Row	mine · others	My offers outlined; others filled. Accept pulse 1× when seller acts.
Auction Timer Ring	>10 s green; 10‑5 s amber; <5 s red	SVG dash‑array countdown; last 3 s shake sub‑1 px.

5 · Layout & Responsiveness
Breakpoint	Layout shift
≥ 1280 px	Section grid 3×3; sidebar chat visible.
768–1279 px	Section grid 3×2; chat collapses to drawer.
≤ 767 px	Single‑column stall list, swipe left/right to navigate sections; floating joystick for WASD.

Global gutter = clamp(16px, 4vw, 40px) to keep comfortable on ultrawide.

1 · Design Tokens (Urban Bazaar Skins)
Token group	Value	Usage
--ubz-bg-canvas	#F5F3F1	Overall section page backdrop
--ubz-bg-card	#FFFFFF	Stall thumbnail & chat bubbles
--ubz-text-main	#1A1A1A	Default foreground
--ubz-brand-500	#E94C40	CTA buttons, live badge ring
--ubz-brand-600	#C53B31	Hover / active
--ubz-accent-rail	#1599A3	Minimap arrow & link hovers
--ubz-street-gray	#3B3B3B	Nav arrows, grid lines
--ubz-radius-sm	4px	Card corners
--ubz-radius-lg	12px	Modal, video pane
--ubz-shadow-1	0 1px 3px rgba(0,0,0,.15)	Card hover
--ubz-shadow-2	0 4px 8px rgba(0,0,0,.20)	Modal

3 · Primitive Components
Component	Key classes	Tailwind utilities	Radix / shadcn base
NavArrow	w-10 h-10 rounded-full bg-ubz-street text-white/80 hover:bg-ubz-brand-500 transition-transform	hover:scale-105 ripple via pseudo after.	Plain button
StallCard	bg-ubz-card rounded-lg shadow-ubz1 hover:shadow-ubz2	group-hover:-translate-y-1	Card from shadcn
LiveBadge	absolute -top-2 -right-2 ring-4 ring-ubz-brand-500 animate-pulse	Tailwind animate-ping	Radix Badge
ChatBubble	bg-ubz-card shadow-ubz1 rounded-lg px-3 py-2	prose prose-sm max-w-xs	Custom
OfferLadderRow	grid grid-cols-[1fr_60px]	conditional text-green-600 or text-red-600

4 · Page Layouts
4.1 Section Page
tsx
Copy
<div className="relative h-dvh bg-ubz-bg">
  <GridNavControls />
  <Minimap className="absolute bottom-4 right-4" />
  <div className="grid grid-cols-3 gap-4 p-6">
    {stalls.map(s => <StallCard key={s.id} stall={s} />)}
  </div>
</div>
Grid adjusts to 2 × 3 on md and 1 × 3 on sm via Tailwind md:grid-cols-2 sm:grid-cols-1.

4.2 Stall Overlay
Use shadcn Sheet component; override width:

tsx
Copy
<Sheet open={open} onOpenChange={setOpen} side="bottom" className="!h-[90vh] rounded-t-lg">
  {/* video + item grid */}
</Sheet>
5 · Motion & Micro‑Interactions
Trigger	Tailwind	Additional JS
StallCard hover	transition-shadow transition-transform duration-150 ease-out	—
Live badge	animate-ping (utility)	toggle class via presence WS.
Section change	wrap page with framer-motion AnimatePresence, fade grid in/out.	—
Offer accept	Add animate-bounce to row, remove after 600 ms.	Use setTimeout.

Respect prefers-reduced-motion: Tailwind’s motion utilities already do.

6 · Assets & Icons
Lucide icons already in Mesh → reuse (lucide-react).

Import GripVertical, Compass, Bolt.

Emoji: install @twemoji/api; replace native emoji in chat messages.
