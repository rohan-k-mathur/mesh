import { escapeHtml, escapeJSX, camelToKebab } from "@/lib/utils/escape";
import { CanvasState } from "./canvasStore";
import { ElementRecord } from "./types";


export interface PortfolioExportData {
  text: string;
  images: string[];
  links: string[];
  layout: "grid" | "column" | "free";
  color: string;
  absolutes?: AbsoluteElement[];

  // passthrough (not used by the generator)
  ownerId?: string | number;                     // 👈 add
  meta?: { title?: string; caption?: string };   // 👈 add

  snapshot?: string;          // public URL of PNG
  snapshotWidth?: number;     // optional natural size
  snapshotHeight?: number;
}
export interface AbsoluteElement {
  id: string;
  type: "text" | "image" | "link" | "box" | "video";
  x: number;
  y: number;
  width: number;
  height: number;
  natW?: number;
  natH?: number;
  content?: string;
  src?: string;
  href?: string;
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: number;
  fontFamily?: string;
  fontWeight?: 400 | 500 | 600 | 700;
  italic?: boolean;
}

export function serialize(state: CanvasState): string {
  const { elements, selected, past, future, _dragStart, ...rest } = state as any;
  return JSON.stringify({
    schemaVersion: 1,
    ...rest,
    elements: [...elements.values()],
    selected: [...selected],
  });
}

export function jsonToCanvasState(
  obj: any,
  projectKey?: string,
): CanvasState | null {
  if (!obj || obj.schemaVersion !== 1) {
    if (projectKey && typeof window !== "undefined") {
      localStorage.removeItem(projectKey);
    }
    return null;
  }
  const elements = new Map<string, ElementRecord>();
  if (Array.isArray(obj.elements)) {
    obj.elements.forEach((el: ElementRecord) => elements.set(el.id, el));
  }
  const selected = new Set<string>(Array.isArray(obj.selected) ? obj.selected : []);
  return {
    elements,
    selected,
    past: [],
    future: [],
    layout: obj.layout,
    color: obj.color,
    schemaVersion: obj.schemaVersion,
  };
}
export function generatePortfolioTemplates(
  data: PortfolioExportData,
): { html: string; css: string; tsx?: string } {
  /* ❷ Free‑layout → React branch */
  if (data.layout === "free" && data.absolutes?.length) {
    const bg = data.color || "bg-white";

    /* 📏 overall canvas bounds */
    const canvasWidth  = Math.max(...data.absolutes.map(a => a.x + a.width))  + 20;
    const canvasHeight = Math.max(...data.absolutes.map(a => a.y + a.height)) + 20;

    /* ---------- 1‑A  plain HTML fallback ---------- */
    const itemsHtml = data.absolutes
      .map(a => {
        const styleParts = [
          `position:absolute`,
          `left:${a.x}px`,
          `top:${a.y}px`,
          `width:${a.width}px`,
          `height:${a.height}px`,
        ];
        if (a.type === "image") styleParts.push("object-fit:contain");
        if (a.fontSize) styleParts.push(`font-size:${a.fontSize}px`);
        if (a.lineHeight) styleParts.push(`line-height:${a.lineHeight}`);
        if (a.letterSpacing) styleParts.push(`letter-spacing:${a.letterSpacing}px`);
        if (a.fontFamily) styleParts.push(`font-family:${a.fontFamily}`);
        if (a.fontWeight) styleParts.push(`font-weight:${a.fontWeight}`);
        if (a.italic) styleParts.push("font-style:italic");
        if (a.type === "text") styleParts.push("white-space:pre-wrap");
        const style = `style="${styleParts.join(";")}"`;
        switch (a.type) {
          case "image":
            return `<img ${style} src="${escapeHtml(a.src)}" />`;
          case "video":
            return `<iframe ${style} src="${escapeHtml(a.src)}" allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
          case "link":
            return `<a ${style} href="${escapeHtml(a.href)}" class="break-all underline text-blue-500" target="_blank" rel="noreferrer">${escapeHtml(a.href)}</a>`;
          case "box":
            return `<div ${style} class="bg-gray-200 border" />`;
          default: // "text"
            return `<div ${style} class="text-xs border p-1 overflow-hidden">${escapeHtml(
              a.content,
            )}</div>`;
        }
      })
      .join("\n");

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Portfolio</title>
  <link href="./tailwind.css" rel="stylesheet" />
</head>
<body class="${bg} flex items-center justify-center min-h-screen">
  <div style="position:relative;width:${canvasWidth}px;height:${canvasHeight}px">
    ${itemsHtml}
  </div>
</body>
</html>`;

    /* ---------- 1‑B  React component string (.tsx) ---------- */
    const reactBody = data.absolutes
      .map(a => {
        const styleObj: Record<string, any> = {
          position: "absolute",
          left: a.x,
          top: a.y,
          width: a.width,
          height: a.height,
        };
        if (a.fontSize) styleObj.fontSize = `${a.fontSize}px`;
        if (a.lineHeight) styleObj.lineHeight = a.lineHeight;
        if (a.letterSpacing) styleObj.letterSpacing = `${a.letterSpacing}px`;
        if (a.fontFamily) styleObj.fontFamily = a.fontFamily;
        if (a.fontWeight) styleObj.fontWeight = a.fontWeight;
        if (a.italic) styleObj.fontStyle = "italic";
        if (a.type === "text") styleObj.whiteSpace = "pre-wrap";
        const styleJsx = `{ ${Object.entries(styleObj)
          .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
          .join(", ")} }`;

        switch (a.type) {
          case "image":
            return `<Image src="${escapeJSX(a.src)}" alt="" width={${a.width}} height={${a.height}}
            style={{ position:'absolute',
            left:${a.x}, top:${a.y},
            ${a.width && a.height ? '' : `width:${a.natW ?? 300},height:${a.natH ?? 300},`}
            objectFit:'cover' }} />`;

          case "video":
            return `<iframe src="${escapeJSX(a.src)}" style={${styleJsx}} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />`;

          case "link":
            return `<a href="${escapeJSX(a.href)}" style={${styleJsx}} className="break-all underline text-blue-500" target="_blank" rel="noreferrer">${escapeJSX(
              a.href,
            )}</a>`;
          case "box":
            return `<div style={${styleJsx}} className="bg-gray-200 border" />`;
          default: // "text"
            return `<div style={${styleJsx}} className="text-xs border p-1 overflow-hidden whitespace-pre-wrap">${escapeJSX(
              a.content,
            )}</div>`;
        }
      })
      .join("\n");

    const tsx = `/* auto‑generated */
import Image from "next/image";

export default function PortfolioCanvas() {
  return (
    <div
      className="${bg} flex items-center justify-center min-h-screen"
      style={{ overflow: "auto" }}
    >
      <div style={{
        position: "relative",
        width: ${canvasWidth},
        height: ${canvasHeight},
        }}>
        ${reactBody}
      </div>
    </div>
  );
}
`;

    const css = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
    return { html, css, tsx };
  }
  
  if (data.layout!="free" && data.snapshot) {
    const w = 1000;
    const h = 625;
    const bgClass = data.color || "bg-white";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Portfolio</title>
  <link href="./tailwind.css" rel="stylesheet" />
  <meta property="og:image" content="${data.snapshot}" />
</head>
<body class="${bgClass} flex items-center justify-center min-h-screen">
  <img src="${data.snapshot}" alt="Portfolio snapshot" width="${w}" height="${h}"
       class="max-w-full h-auto shadow-lg rounded" />
</body>
</html>`;

    /* no custom CSS needed, but keep empty shell so downstream code stays same */
    const css = `@tailwind base;\n@tailwind components;\n@tailwind utilities;`;
    return { html, css };
  }


  const bgClass = data.color || "bg-white";

  const textBlock = data.text
    ? `<div class="text-block flex flex-col max-h-[1000px] mb-1 mt-2 break-words">${data.text}</div>`
    : "";

  const absImgs = data.absolutes?.filter(a => a.type === "image") ?? [];
  const images = (absImgs.length ? absImgs : data.images.map(src => ({ src })))
    .map((img, idx) => {
      const src = (img as any).src ?? img;
      const w = (img as any).width;
      const h = (img as any).height;
      const style = w && h
        ? `style="width:${w}px;height:${h}px;object-fit:cover"`
        : "";
      return `<img src="${src}" ${style} class="portfolio-img-frame ${idx === 0 ? "flex flex-col max-h-[3000px] mb-1 mt-2 break-words" : ""}" />`;
    })
    .join("\n");

  const links = data.links
    .map(
      (href) =>
        `<a href="${href}" class="text-blue-500 underline break-all" target="_blank" rel="noreferrer">${href}</a>`
    )
    .join("\n");

  const layoutClass = data.layout === "grid" ? "grid grid-cols-2 gap-2" : "flex flex-col gap-2";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Portfolio</title>
  <link href="./tailwind.css" rel="stylesheet">
</head>
<body>
  <div class="portfolio-container flex flex-col w-[34rem] max-h-[3000px]">
    <div class="${layoutClass} rounded-lg p-4 ${bgClass} mt-4 max-h-[3000px]">
      ${textBlock}
      ${images}
      ${links}
    </div>
  </div>
</body>
</html>`;

  const css = `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n.portfolio-container {\n  display: flex;\n  padding: 50px;\n  width: 34rem;\n}\n\n.portfolio-img-frame {\n  background: transparent;\n  border: 1px solid #1a192b;\n  padding: 0px;\n}\n\n.text-block {\n  width: fit-content;\n  border: .5px solid #000000;\n  border-radius: 2px;\n  font-size: .7rem;\n  line-height: 1;\n  letter-spacing: normal;\n  margin: 0.3rem 0;\n  padding: 0.3rem;\n  max-height: 9.25rem;\n  overflow-y: auto;\n  scroll-behavior: smooth;\n}\n\n.grid {\n  display: grid;\n  grid-template-columns: repeat(2, minmax(0, 1fr));\n  gap: 0.5rem;\n}\n.flex {\n  display: flex;\n}\n`;

   return { html, css };
}


// const reactCode = `import Image from "next/image";
// export default function PortfolioCanvas() {
//   return (
//     <div style={{ position: "relative", width: ${canvasWidth}, height: ${canvasHeight} }}>
//       ${data.absolutes
//         .map(a => {
//           const style = `{ position:"absolute", left:${a.x}, top:${a.y},
//                            width:${a.width}, height:${a.height} }`;
//           switch (a.type) {
//             case "image":
//               return `<Image src="${a.src}" alt="" fill style=${style} />`;
//             case "text":
//               return `<div style=${style} className="text-xs border p-1">${escapeJSX(
//                 a.content || "",
//               )}</div>`;
//             // etc.
//           }
//         })
//         .join("\n")}
//     </div>
//   );
// }`;