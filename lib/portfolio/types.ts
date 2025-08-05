export interface BaseGeometry {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

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

export type ElementRecord =
  | TextBoxRecord
  | ImageRecord
  | VideoRecord
  | LinkRecord;
