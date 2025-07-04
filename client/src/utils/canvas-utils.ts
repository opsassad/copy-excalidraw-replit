import { DrawingElementData, Point, ViewportBounds } from "@/types/drawing";

export function generateId(): string {
  return `element_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export function getElementBounds(element: DrawingElementData): ViewportBounds {
  switch (element.type) {
    case 'rectangle':
    case 'diamond':
    case 'ellipse':
      return {
        minX: element.x,
        minY: element.y,
        maxX: element.x + (element.width || 0),
        maxY: element.y + (element.height || 0),
      };
    case 'line':
    case 'arrow':
    case 'draw':
      if (element.points && element.points.length > 0) {
        const xs = element.points.map(p => p.x);
        const ys = element.points.map(p => p.y);
        return {
          minX: Math.min(...xs),
          minY: Math.min(...ys),
          maxX: Math.max(...xs),
          maxY: Math.max(...ys),
        };
      }
      return { minX: element.x, minY: element.y, maxX: element.x, maxY: element.y };
    case 'text':
      const textWidth = (element.text?.length || 0) * (element.fontSize || 16) * 0.6;
      const textHeight = element.fontSize || 16;
      return {
        minX: element.x,
        minY: element.y,
        maxX: element.x + textWidth,
        maxY: element.y + textHeight,
      };
    default:
      return { minX: element.x, minY: element.y, maxX: element.x, maxY: element.y };
  }
}

export function isPointInElement(point: Point, element: DrawingElementData): boolean {
  const bounds = getElementBounds(element);
  return point.x >= bounds.minX && point.x <= bounds.maxX &&
         point.y >= bounds.minY && point.y <= bounds.maxY;
}

export function isPointInBounds(point: Point, bounds: ViewportBounds): boolean {
  return point.x >= bounds.minX && point.x <= bounds.maxX &&
         point.y >= bounds.minY && point.y <= bounds.maxY;
}

export function snapToGrid(point: Point, gridSize: number = 20): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

export function screenToCanvas(
  screenPoint: Point, 
  canvasState: { zoom: number; panX: number; panY: number }
): Point {
  return {
    x: (screenPoint.x - canvasState.panX) / canvasState.zoom,
    y: (screenPoint.y - canvasState.panY) / canvasState.zoom,
  };
}

export function canvasToScreen(
  canvasPoint: Point, 
  canvasState: { zoom: number; panX: number; panY: number }
): Point {
  return {
    x: canvasPoint.x * canvasState.zoom + canvasState.panX,
    y: canvasPoint.y * canvasState.zoom + canvasState.panY,
  };
}

export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

export function getElementCenter(element: DrawingElementData): Point {
  const bounds = getElementBounds(element);
  return {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
}
