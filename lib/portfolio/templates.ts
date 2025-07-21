export interface BuilderElement {
  id: string;
  type: "text" | "image" | "box" | "link";
  content?: string;
  src?: string;
  href?: string;
  x?: number;
  y?: number;
}

export interface PortfolioTemplate {
  name: string;
  layout: "column" | "grid";
  color: string;
  elements: BuilderElement[];
}

export const templates: PortfolioTemplate[] = [
  {
    name: "Simple Column",
    layout: "column",
    color: "bg-white",
    elements: [
      { id: "t1", type: "text", content: "Your text here" },
      { id: "i1", type: "image", src: "" },
      { id: "l1", type: "link", href: "https://example.com" },
    ],
  },
  {
    name: "Gallery Grid",
    layout: "grid",
    color: "bg-gray-200",
    elements: [
      { id: "i2", type: "image", src: "" },
      { id: "i3", type: "image", src: "" },
      { id: "i4", type: "image", src: "" },
    ],
  },
];
