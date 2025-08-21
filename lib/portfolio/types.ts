// portfolio/types.ts
export interface BaseGeometry {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export type ElementKind = 'text' | 'image' | 'video' | 'link' | 'component' | 'box';

// ---- Component allow-list & props map ----
export type ComponentName = 'GalleryCarousel';

export type ComponentPropsMap = {
  GalleryCarousel: {
    urls: string[];
    caption?: string;
    animation?: 'cylinder' | 'cube' | 'portal' | 'towardscreen';
  };
};

export type ComponentElementRecord<C extends ComponentName = ComponentName> =
  BaseGeometry & {
    kind: 'component';
    component: C;
    props: ComponentPropsMap[C];
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
