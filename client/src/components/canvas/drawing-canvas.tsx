import { useRef, useEffect, useState, useCallback } from "react";
import { DrawingElementData, CanvasState, DrawingTool, Point } from "@/types/drawing";
import { RoughCanvas } from "./rough-canvas";
import { generateId, screenToCanvas, snapToGrid, isPointInElement } from "@/utils/canvas-utils";

interface DrawingCanvasProps {
  elements: DrawingElementData[];
  canvasState: CanvasState;
  selectedTool: DrawingTool;
  selectedElements: Set<string>;
  onElementAdd: (element: DrawingElementData) => void;
  onElementUpdate: (elementId: string, updates: Partial<DrawingElementData>) => void;
  onElementDelete: (elementId: string) => void;
  onElementSelect: (elementIds: string[]) => void;
  onCanvasStateUpdate: (updates: Partial<CanvasState>) => void;
  onClearSelection: () => void;
}

export default function DrawingCanvas({
  elements,
  canvasState,
  selectedTool,
  selectedElements,
  onElementAdd,
  onElementUpdate,
  onElementDelete,
  onElementSelect,
  onCanvasStateUpdate,
  onClearSelection,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roughCanvasRef = useRef<RoughCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElementData | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);

  // Initialize canvas and rough.js
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * window.devicePixelRatio;
      canvas.height = rect.height * window.devicePixelRatio;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;
      
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    roughCanvasRef.current = new RoughCanvas(canvas);

    return () => window.removeEventListener('resize', resizeCanvas);
  }, []);

  // Redraw canvas when elements or state change
  useEffect(() => {
    if (!roughCanvasRef.current) return;

    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    // Clear and apply transformations
    ctx.save();
    ctx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
    ctx.translate(canvasState.panX, canvasState.panY);
    ctx.scale(canvasState.zoom, canvasState.zoom);

    // Draw elements
    roughCanvasRef.current.drawElements(elements);

    // Draw current element being created
    if (currentElement) {
      roughCanvasRef.current.drawElement(currentElement);
    }

    // Draw selection box
    if (selectionBox) {
      roughCanvasRef.current.drawSelectionBox(selectionBox.start, selectionBox.end);
    }

    // Draw selected elements
    elements.forEach(element => {
      if (selectedElements.has(element.id)) {
        roughCanvasRef.current!.drawElementSelection(element);
      }
    });

    ctx.restore();
  }, [elements, currentElement, selectionBox, selectedElements, canvasState]);

  const getMousePosition = useCallback((e: React.MouseEvent): Point => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const clientPoint = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };

    return screenToCanvas(clientPoint, canvasState);
  }, [canvasState]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const point = getMousePosition(e);
    setStartPoint(point);

    if (selectedTool === 'pan') {
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (selectedTool === 'select') {
      // Check if clicking on existing element
      const clickedElement = elements.find(el => isPointInElement(point, el));
      
      if (clickedElement) {
        if (!selectedElements.has(clickedElement.id)) {
          if (e.shiftKey) {
            onElementSelect([...Array.from(selectedElements), clickedElement.id]);
          } else {
            onElementSelect([clickedElement.id]);
          }
        }
      } else {
        // Start selection box
        setSelectionBox({ start: point, end: point });
        onClearSelection();
      }
      return;
    }

    if (selectedTool === 'eraser') {
      const elementToDelete = elements.find(el => isPointInElement(point, el));
      if (elementToDelete) {
        onElementDelete(elementToDelete.id);
      }
      return;
    }

    // Start drawing new element
    setIsDrawing(true);
    const newElement = createNewElement(selectedTool, point);
    setCurrentElement(newElement);
  }, [selectedTool, elements, selectedElements, getMousePosition, onElementSelect, onClearSelection, onElementDelete]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const point = getMousePosition(e);

    if (selectedTool === 'pan' && lastPanPoint) {
      const deltaX = e.clientX - lastPanPoint.x;
      const deltaY = e.clientY - lastPanPoint.y;
      onCanvasStateUpdate({
        panX: canvasState.panX + deltaX,
        panY: canvasState.panY + deltaY,
      });
      setLastPanPoint({ x: e.clientX, y: e.clientY });
      return;
    }

    if (selectionBox) {
      setSelectionBox({ start: selectionBox.start, end: point });
      return;
    }

    if (isDrawing && currentElement && startPoint) {
      const updatedElement = updateElementWithPoint(currentElement, point, startPoint);
      setCurrentElement(updatedElement);
    }
  }, [selectedTool, lastPanPoint, selectionBox, isDrawing, currentElement, startPoint, canvasState, getMousePosition, onCanvasStateUpdate]);

  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    const point = getMousePosition(e);

    if (selectedTool === 'pan') {
      setLastPanPoint(null);
      return;
    }

    if (selectionBox) {
      // Select elements within selection box
      const selectedIds = elements
        .filter(el => {
          const elementBounds = getElementBounds(el);
          return isRectangleIntersecting(selectionBox.start, selectionBox.end, elementBounds);
        })
        .map(el => el.id);
      
      onElementSelect(selectedIds);
      setSelectionBox(null);
      return;
    }

    if (isDrawing && currentElement) {
      let finalElement = currentElement;
      
      if (canvasState.snapEnabled) {
        const snappedPoint = snapToGrid(point);
        finalElement = updateElementWithPoint(currentElement, snappedPoint, startPoint!);
      }

      onElementAdd(finalElement);
      setCurrentElement(null);
      setIsDrawing(false);
    }

    setStartPoint(null);
  }, [selectedTool, selectionBox, isDrawing, currentElement, elements, canvasState, startPoint, getMousePosition, onElementSelect, onElementAdd]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(0.1, Math.min(5, canvasState.zoom * zoomFactor));
    
    onCanvasStateUpdate({ zoom: newZoom });
  }, [canvasState.zoom, onCanvasStateUpdate]);

  const createNewElement = (tool: DrawingTool, point: Point): DrawingElementData => {
    const baseElement: DrawingElementData = {
      id: generateId(),
      type: tool as any,
      x: point.x,
      y: point.y,
      strokeColor: '#000000',
      fillColor: 'transparent',
      strokeWidth: 2,
      strokeStyle: 'solid',
      opacity: 1,
      seed: Math.floor(Math.random() * 1000),
    };

    switch (tool) {
      case 'rectangle':
      case 'diamond':
      case 'ellipse':
        return { ...baseElement, width: 0, height: 0 };
      case 'line':
      case 'arrow':
        return { ...baseElement, points: [point, point] };
      case 'draw':
        return { ...baseElement, points: [point] };
      case 'text':
        return { 
          ...baseElement, 
          text: 'Text', 
          fontSize: 16, 
          fontFamily: 'Virgil',
          strokeColor: '#000000'
        };
      default:
        return baseElement;
    }
  };

  const updateElementWithPoint = (element: DrawingElementData, point: Point, startPoint: Point): DrawingElementData => {
    switch (element.type) {
      case 'rectangle':
      case 'diamond':
      case 'ellipse':
        return {
          ...element,
          width: Math.abs(point.x - startPoint.x),
          height: Math.abs(point.y - startPoint.y),
          x: Math.min(point.x, startPoint.x),
          y: Math.min(point.y, startPoint.y),
        };
      case 'line':
      case 'arrow':
        return {
          ...element,
          points: [startPoint, point],
        };
      case 'draw':
        return {
          ...element,
          points: [...(element.points || []), point],
        };
      default:
        return element;
    }
  };

  const getElementBounds = (element: DrawingElementData) => {
    switch (element.type) {
      case 'rectangle':
      case 'diamond':
      case 'ellipse':
        return {
          x: element.x,
          y: element.y,
          width: element.width || 0,
          height: element.height || 0,
        };
      default:
        if (element.points && element.points.length > 0) {
          const xs = element.points.map(p => p.x);
          const ys = element.points.map(p => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);
          return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
        }
        return { x: element.x, y: element.y, width: 0, height: 0 };
    }
  };

  const isRectangleIntersecting = (start: Point, end: Point, bounds: any) => {
    const selectionMinX = Math.min(start.x, end.x);
    const selectionMinY = Math.min(start.y, end.y);
    const selectionMaxX = Math.max(start.x, end.x);
    const selectionMaxY = Math.max(start.y, end.y);

    return !(bounds.x + bounds.width < selectionMinX ||
             bounds.x > selectionMaxX ||
             bounds.y + bounds.height < selectionMinY ||
             bounds.y > selectionMaxY);
  };

  const getCursorStyle = () => {
    switch (selectedTool) {
      case 'pan':
        return lastPanPoint ? 'cursor-grabbing' : 'cursor-grab';
      case 'text':
        return 'cursor-text';
      default:
        return 'cursor-crosshair';
    }
  };

  return (
    <div 
      className={`canvas-container w-full h-screen relative overflow-hidden ${!canvasState.gridEnabled ? 'grid-hidden' : ''} ${getCursorStyle()}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      />
    </div>
  );
}
