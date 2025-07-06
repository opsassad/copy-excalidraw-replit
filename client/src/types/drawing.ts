export interface Point {
  x: number;
  y: number;
}

export interface DrawingElementData {
  id: string;
  type: 'rectangle' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'draw' | 'text' | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[];
  text?: string;
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  fontSize?: number;
  fontFamily?: 'Virgil' | 'Helvetica' | 'Cascadia' | 'Caveat' | 'Pacifico' | 'Indie Flower' | 'Shadows Into Light' | 'Satisfy' | 'Dancing Script' | 'Gloria Hallelujah' | 'Architects Daughter';
  rotation?: number;
  seed?: number; // for rough.js consistency
  // --- Text-specific ---
  align?: 'left' | 'center' | 'right';
  isBold?: boolean;
  isItalic?: boolean;
  isUnderline?: boolean;
  color?: string; // text color
  formatting?: Array<{ start: number; end: number; style: 'bold' | 'italic' | 'underline' | 'color' | 'font' | 'size'; value?: string | number }>;
  // ---
  sketchy?: boolean;
  roughness?: number;
  sketchyFill?: boolean;
  groupId?: string;
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  gridEnabled: boolean;
  snapEnabled: boolean;
  theme: 'light' | 'dark';
}

export interface DrawingHistory {
  undoStack: DrawingElementData[][];
  redoStack: DrawingElementData[][];
}

export type DrawingTool = 'select' | 'pan' | 'rectangle' | 'diamond' | 'ellipse' | 'arrow' | 'line' | 'draw' | 'text' | 'image' | 'eraser';

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
