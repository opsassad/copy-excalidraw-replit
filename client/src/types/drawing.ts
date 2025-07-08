export interface Point {
  x: number;
  y: number;
}

export interface DrawingElementData {
  id: string;
  type: 'rectangle' | 'diamond' | 'ellipse' | 'line' | 'arrow' | 'connector' | 'draw' | 'text';
  x: number;
  y: number;
  width?: number;
  height?: number;
  points?: Point[];
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  strokeStyle: 'solid' | 'dashed' | 'dotted';
  opacity: number;
  rotation?: number;
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  align?: 'left' | 'center' | 'right';
  seed?: number;
  sketchy?: boolean;
  sketchyFill?: boolean;
  roughness?: number;
 
  // Connector-specific properties
  startBinding?: {
    elementId: string;
    anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
  endBinding?: {
    elementId: string;
    anchor: 'top' | 'bottom' | 'left' | 'right' | 'center';
  };
  connectorType?: 'straight' | 'curved' | 'orthogonal';
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

export type DrawingTool = 
  | 'select'
  | 'rectangle' 
  | 'diamond'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'connector'
  | 'draw'
  | 'text'
  | 'eraser'
  | 'pan';

export interface ViewportBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}
