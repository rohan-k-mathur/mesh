import Image from "next/image";

export interface AbsoluteElement {
  id: string;
  type: "text" | "text-box" | "image" | "link" | "box";
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

export default function CanvasRenderer({
  elements,
  bgClass = "bg-white",
}: {
  elements: AbsoluteElement[];
  bgClass?: string;
}) {
  if (!elements?.length) return null;

  const width = Math.max(...elements.map(e => e.x + e.width)) + 20;
  const height = Math.max(...elements.map(e => e.y + e.height)) + 20;

  return (
    <div
      className={`${bgClass} flex items-center justify-center min-h-screen`}
      style={{ overflow: "auto" }}
    >
      <div
        style={{
          position: "relative",
          width,
          height,
        }}
      >
        {elements.map(el => {
          const base: React.CSSProperties = {
            position: "absolute",
            left: el.x,
            top: el.y,
            width: el.width,
            height: el.height,
          };

          switch (el.type) {
            case "image": {
              const style = { ...base, objectFit: "cover" } as React.CSSProperties;
              return (
                <Image
                  key={el.id}
                  src={el.src!}
                  alt=""
                  width={el.width}
                  height={el.height}
                  style={style}
                />
              );
            }

            case "link": {
              const style = base;
              return (
                <a
                  key={el.id}
                  href={el.href}
                  target="_blank"
                  rel="noreferrer"
                  style={style}
                  className="underline text-blue-500 break-all text-xs p-1"
                >
                  {el.href}
                </a>
              );
            }

            case "box": {
              const style = base;
              return (
                <div key={el.id} style={style} className="bg-gray-200 border" />
              );
            }

            default: {
              const style: React.CSSProperties = {
                ...base,
                fontSize: el.fontSize,
                lineHeight: el.lineHeight,
                letterSpacing: el.letterSpacing,
                fontFamily: el.fontFamily,
                fontWeight: el.fontWeight,
                fontStyle: el.italic ? "italic" : undefined,
                whiteSpace: "pre-wrap",
              };
              return (
                <div
                  key={el.id}
                  style={style}
                  className="text-xs border p-1 overflow-hidden"
                  dangerouslySetInnerHTML={{ __html: el.content ?? "" }}
                />
              );
            }
          }
        })}
      </div>
    </div>
  );
}
