// portfolio/types.ts
export interface BaseGeometry {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ElementKind = 'text' | 'image' | 'video' | 'link' | 'component' | 'box';
export type ComponentName = 'GalleryCarousel' | 'Repeater';


export type ComponentElement = {
  id: string;
  kind: "component";
  component: ComponentName;
  props: any;
  blockId?: string; // ← provenance
  x: number; y: number; width: number; height: number;
};

// Data source for Repeaters
export type DataSource =
  | { kind: 'static'; value: any[] }
  | { kind: 'url'; href: string }
  | { kind: 'supabase'; table: string; filter?: Record<string, any>; fields?: string[]; limit?: number };

// Minimal field mapping for GalleryCarousel (Phase 1)
export type GalleryMap = {
  urls?: string;     // dot-path in each row that resolves to string[] or string
  caption?: string;  // dot-path that resolves to string
};


// Component props map (handy for CanvasRenderer typing)
export type ComponentPropsMap = {
  GalleryCarousel: { urls: string[]; caption?: string; animation?: 'cylinder'|'cube'|'portal'|'towardscreen'; embed?: boolean; unoptimized?: boolean; sizes?: string };
  Repeater: RepeaterProps;
};

// Component element
export interface ComponentElementRecord {
  id: string;
  kind: 'component';
  component: ComponentName;
  // keep as loose record, but most code can import ComponentPropsMap for safety
  props: Record<string, unknown>;
  blockId?: string; // ← provenance
  x: number; y: number; width: number; height: number;
}

// Repeater props
export type RepeaterProps = {
  of: 'GalleryCarousel';            // (Phase 1) we target the gallery
  source: DataSource;
  map?: GalleryMap;
  layout?: 'grid' | 'column';       // how repeated items are arranged
  limit?: number;
};

export type TextBoxRecord = BaseGeometry & {
  kind: "text";
  content: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing?: number;
  fontFamily?: string;
  fontWeight?: 400 | 500 | 600 | 700;
  italic?: boolean;
};

export type ImageRecord = BaseGeometry & {
  kind: "image";
  src: string;
  natW?: number;
  natH?: number;
};

export type VideoRecord = BaseGeometry & {
  kind: "video";
  src: string;
};

export type LinkRecord = BaseGeometry & {
  kind: "link";
  href: string;
};

export type BoxRecord = BaseGeometry & {
  kind: "box";
};

export type ElementRecord =
  | TextBoxRecord
  | ImageRecord
  | VideoRecord
  | LinkRecord
  | ComponentElementRecord
  | BoxRecord;
