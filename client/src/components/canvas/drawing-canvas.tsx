import { useRef, useEffect, useState, useCallback } from "react";
import { DrawingElementData, CanvasState, DrawingTool, Point } from "@/types/drawing";
import { RoughCanvas } from "./rough-canvas";
import { generateId, screenToCanvas, snapToGrid, isPointInElement } from "@/utils/canvas-utils";
import TextEditor from "./text-editor";

type ToolOptions = Partial<Omit<DrawingElementData, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'points'>>;

interface DrawingCanvasProps {
  elements: DrawingElementData[];
  canvasState: CanvasState;
  selectedTool: DrawingTool;
  selectedElements: Set<string>;
  toolOptions: ToolOptions;
  onElementAdd: (element: DrawingElementData) => void;
  onElementUpdate: (elementId: string, updates: Partial<DrawingElementData>) => void;
  onElementDelete: (elementId: string) => void;
  onElementSelect: (elementIds: string[]) => void;
  onCanvasStateUpdate: (updates: Partial<CanvasState>) => void;
  onClearSelection: () => void;
  onToolChange?: (tool: DrawingTool) => void;
}

type ResizeAnchor = "tl" | "tm" | "tr" | "ml" | "mr" | "bl" | "bm" | "br";

// Top-level utility function for element bounds
function getElementBounds(element: DrawingElementData, canvasRef: React.RefObject<HTMLCanvasElement>) {
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
    case 'text': {
      // Use a canvas context to measure text width and height
      const fontSize = element.fontSize || 16;
      const fontFamily = element.fontFamily || 'Virgil';
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return { x: element.x, y: element.y, width: element.width || 0, height: element.height || fontSize * 1.2 };
      ctx.save();
      ctx.font = `${fontSize}px ${fontFamily === 'Virgil' ? 'Kalam, cursive' : fontFamily === 'Helvetica' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace'}`;
      const lines = (element.text || '').split('\n');
      let maxWidth = 0;
      let totalHeight = 0;
      const wrapWidth = element.width || 0;
      const lineHeight = fontSize * 1.2;
      if (wrapWidth > 0) {
        // Word wrap
        let wrappedLines: string[] = [];
        for (const line of lines) {
          let currentLine = '';
          for (const word of line.split(' ')) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = ctx.measureText(testLine).width;
            if (testWidth > wrapWidth && currentLine) {
              wrappedLines.push(currentLine);
              currentLine = word;
            } else {
              currentLine = testLine;
            }
          }
          wrappedLines.push(currentLine);
        }
        maxWidth = wrapWidth;
        totalHeight = wrappedLines.length * lineHeight;
      } else {
        for (const line of lines) {
          const w = ctx.measureText(line).width;
          if (w > maxWidth) maxWidth = w;
        }
        totalHeight = lines.length * lineHeight;
      }
      ctx.restore();
      return {
        x: element.x,
        y: element.y,
        width: maxWidth,
        height: totalHeight,
      };
    }
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
}

const isShiftPressed = (e: MouseEvent) => e.shiftKey || (window.event && (window.event as MouseEvent).shiftKey);

const justFinishedEditing = useRef(false);

export default function DrawingCanvas({
  elements,
  canvasState,
  selectedTool,
  selectedElements,
  toolOptions,
  onElementAdd,
  onElementUpdate,
  onElementDelete,
  onElementSelect,
  onCanvasStateUpdate,
  onClearSelection,
  onToolChange,
  toolLock,
}: DrawingCanvasProps & { toolLock: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const roughCanvasRef = useRef<RoughCanvas | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentElement, setCurrentElement] = useState<DrawingElementData | null>(null);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [lastPanPoint, setLastPanPoint] = useState<Point | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ start: Point; end: Point } | null>(null);
  const [draggingElementId, setDraggingElementId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<Point | null>(null);
  const [dragBoxOffset, setDragBoxOffset] = useState<Point | null>(null);
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [resizeAnchor, setResizeAnchor] = useState<ResizeAnchor | null>(null);
  const [resizingStart, setResizingStart] = useState<{ element: DrawingElementData, startPoint: Point } | null>(null);
  const textEditorContainerRef = useRef<HTMLDivElement>(null);

  // State for panning with space or hand tool
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point | null>(null);
  const [panOrigin, setPanOrigin] = useState<{ x: number; y: number } | null>(null);

  // New state for dragging points
  const [draggingPoint, setDraggingPoint] = useState<{ elementId: string; pointIndex: number } | null>(null);

  // Group resize state
  const [groupResizing, setGroupResizing] = useState<{
    anchor: ResizeAnchor;
    startBounds: { x: number; y: number; width: number; height: number };
    startElements: DrawingElementData[];
    startPoint: Point;
  } | null>(null);

  // New state for editing text elements
  const [editingTextElementId, setEditingTextElementId] = useState<string | null>(null);

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
    elements.forEach(element => {
      if (editingTextElementId === element.id) return;
      if (roughCanvasRef.current) {
        roughCanvasRef.current.drawElement(element);
      }
    });

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
  }, [elements, currentElement, selectionBox, selectedElements, canvasState, editingTextElementId]);

  const getMousePosition = useCallback((e: { clientX: number, clientY: number }): Point => {
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
    if (justFinishedEditing.current) {
      justFinishedEditing.current = false;
      return;
    }
    e.preventDefault();
    const point = getMousePosition(e);
    setStartPoint(point);

    if ((isPanning || selectedTool === 'pan') && e.button === 0) {
      setPanStart({ x: e.clientX, y: e.clientY });
      setPanOrigin({ x: canvasState.panX, y: canvasState.panY });
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
        // Start dragging any element
        setDraggingElementId(clickedElement.id);
        setDragOffset({ x: point.x - clickedElement.x, y: point.y - clickedElement.y });
        setDragBoxOffset({ x: point.x - clickedElement.x, y: point.y - clickedElement.y });
        setDraggingType(clickedElement.type);
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
    // Always initialize new text element with empty string
    const newElement = createNewElement(selectedTool, point);
    if (selectedTool === 'text') {
      newElement.text = '';
    }
    setCurrentElement(newElement);

    // If text tool, create new text element, add, and set editingTextElementId
    if (selectedTool === 'text') {
      onElementAdd(newElement);
      setEditingTextElementId(newElement.id);
    }
  }, [selectedTool, elements, selectedElements, getMousePosition, onElementSelect, onClearSelection, onElementDelete, isPanning, canvasState.panX, canvasState.panY, onElementAdd]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
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

    if (draggingElementId && dragOffset) {
      // Dragging any element
      const element = elements.find(el => el.id === draggingElementId);
      if (element) {
        // Calculate delta for movement
        let deltaX = 0, deltaY = 0;
        if (["line", "arrow", "draw"].includes(element.type) && element.points && dragBoxOffset) {
          const newBoxX = point.x - dragBoxOffset.x;
          const newBoxY = point.y - dragBoxOffset.y;
          const oldBounds = getElementBounds(element, canvasRef);
          deltaX = newBoxX - oldBounds.x;
          deltaY = newBoxY - oldBounds.y;
        } else {
          const newX = point.x - dragOffset.x;
          const newY = point.y - dragOffset.y;
          deltaX = newX - element.x;
          deltaY = newY - element.y;
        }
        // Move all selected elements by the same delta
        selectedElements.forEach(id => {
          const el = elements.find(e => e.id === id);
          if (!el) return;
          if (["line", "arrow", "draw"].includes(el.type) && el.points) {
            const newPoints = el.points.map(pt => ({ x: pt.x + deltaX, y: pt.y + deltaY }));
            onElementUpdate(el.id, { points: newPoints });
          } else if (typeof el.x === 'number' && typeof el.y === 'number') {
            onElementUpdate(el.id, { x: el.x + deltaX, y: el.y + deltaY });
          }
        });
      }
      return;
    }

    if (selectionBox) {
      setSelectionBox({ start: selectionBox.start, end: point });
      return;
    }

    if (resizingElementId && resizeAnchor && resizingStart) {
      const { element: originalElement, startPoint: resizeStartPoint } = resizingStart;
      const point = getMousePosition(e);
      const dx = point.x - resizeStartPoint.x;
      const dy = point.y - resizeStartPoint.y;

      let newX = originalElement.x;
      let newY = originalElement.y;
      let newWidth = originalElement.width || 0;
      let newHeight = originalElement.height || 0;

      if (resizeAnchor.includes("r")) newWidth += dx;
      if (resizeAnchor.includes("l")) {
        newWidth -= dx;
        newX += dx;
      }
      if (resizeAnchor.includes("b")) newHeight += dy;
      if (resizeAnchor.includes("t")) {
        newHeight -= dy;
        newY += dy;
      }

      // Prevent negative dimensions
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);

      // If resizing a text element, scale fontSize proportionally
      const element = elements.find(el => el.id === resizingElementId);
      if (element && element.type === 'text') {
        const oldHeight = element.height || 1;
        let scale = newHeight / oldHeight;
        // If proportional scaling (shift), use width as well
        if (isShiftPressed(e)) {
          const oldWidth = element.width || 1;
          const scaleW = newWidth / oldWidth;
          scale = Math.max(scale, scaleW);
        }
        const newFontSize = Math.max(8, Math.round((element.fontSize || 16) * scale));
        onElementUpdate(resizingElementId, { x: newX, y: newY, width: newWidth, height: newHeight, fontSize: newFontSize });
      } else {
        onElementUpdate(resizingElementId, { x: newX, y: newY, width: newWidth, height: newHeight });
      }
      return;
    }

    if (isDrawing && currentElement && startPoint) {
      const updatedElement = updateElementWithPoint(currentElement, point, startPoint);
      setCurrentElement(updatedElement);
    }
  }, [selectedTool, lastPanPoint, selectionBox, isDrawing, currentElement, startPoint, canvasState, getMousePosition, onCanvasStateUpdate, draggingElementId, dragOffset, elements, onElementUpdate, resizingElementId, resizeAnchor, resizingStart, selectedElements, isShiftPressed]);

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const point = getMousePosition(e);

    if (selectedTool === 'pan') {
      setLastPanPoint(null);
      return;
    }

    if (draggingElementId) {
      setDraggingElementId(null);
      setDragOffset(null);
      setDraggingType(null);
      return;
    }

    if (selectionBox) {
      // Select elements within selection box
      const selectedIds = elements
        .filter(el => {
          const elementBounds = getElementBounds(el, canvasRef);
          return isRectangleIntersecting(selectionBox.start, point, elementBounds);
        })
        .map(el => el.id);
      
      onElementSelect(selectedIds);
      setSelectionBox(null);
      return;
    }

    if (resizingElementId) {
      setResizingElementId(null);
      setResizeAnchor(null);
      setResizingStart(null);
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

      // Auto-switch to selection tool if not locked and not text
      if (!toolLock && finalElement.type !== 'text' && onToolChange) {
        onToolChange('select');
      }
    }

    setStartPoint(null);
  }, [selectedTool, selectionBox, isDrawing, currentElement, elements, canvasState, startPoint, getMousePosition, onElementSelect, onElementAdd, onClearSelection, resizingElementId, toolLock, onToolChange]);

  // Mouse wheel for panning (not zoom)
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const deltaX = e.deltaX;
    const deltaY = e.deltaY;
    onCanvasStateUpdate({
      panX: canvasState.panX - deltaX,
      panY: canvasState.panY - deltaY,
    });
  }, [canvasState.panX, canvasState.panY, onCanvasStateUpdate]);

  const createNewElement = (tool: DrawingTool, point: Point): DrawingElementData => {
    const baseElement: DrawingElementData = {
      id: generateId(),
      type: tool as any,
      x: point.x,
      y: point.y,
      strokeColor: toolOptions.strokeColor || '#000000',
      fillColor: toolOptions.fillColor || 'transparent',
      strokeWidth: toolOptions.strokeWidth || 2,
      strokeStyle: toolOptions.strokeStyle || 'solid',
      opacity: toolOptions.opacity || 1,
      seed: Math.floor(Math.random() * 1000),
      sketchy: toolOptions.sketchy || false,
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
          text: '', 
          fontSize: toolOptions.fontSize || 16, 
          fontFamily: toolOptions.fontFamily || 'Virgil',
          strokeColor: toolOptions.strokeColor || '#000000'
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
      case 'text':
        return element; // Text position doesn't change during creation
      default:
        return element;
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

  const handleMouseUpRef = useRef(handleMouseUp);
  handleMouseUpRef.current = handleMouseUp;
  const handleMouseMoveRef = useRef(handleMouseMove);
  handleMouseMoveRef.current = handleMouseMove;

  useEffect(() => {
    const onMouseUp = (e: MouseEvent) => handleMouseUpRef.current(e);
    const onMouseMove = (e: MouseEvent) => handleMouseMoveRef.current(e);

    const isInteracting = isDrawing || lastPanPoint !== null || selectionBox !== null || resizingElementId !== null || draggingElementId !== null;

    if (isInteracting) {
      window.addEventListener('mouseup', onMouseUp);
      window.addEventListener('mousemove', onMouseMove);
    }

    return () => {
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, [isDrawing, lastPanPoint, selectionBox, resizingElementId, draggingElementId]);

  // Keyboard event handler for zoom and pan shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Zoom in
      if ((e.ctrlKey || e.metaKey) && (e.key === '+' || e.key === '=')) {
        e.preventDefault();
        const newZoom = Math.min(5, canvasState.zoom * 1.1);
        onCanvasStateUpdate({ zoom: newZoom });
      }
      // Zoom out
      if ((e.ctrlKey || e.metaKey) && (e.key === '-' || e.key === '_')) {
        e.preventDefault();
        const newZoom = Math.max(0.1, canvasState.zoom * 0.9);
        onCanvasStateUpdate({ zoom: newZoom });
      }
      // Reset zoom
      if ((e.ctrlKey || e.metaKey) && e.key === '0') {
        e.preventDefault();
        onCanvasStateUpdate({ zoom: 1 });
      }
      // Zoom to fit all (Shift+1)
      if (e.shiftKey && e.key === '1') {
        e.preventDefault();
        // TODO: Implement zoom to fit all elements
      }
      // Zoom to selection (Shift+2)
      if (e.shiftKey && e.key === '2') {
        e.preventDefault();
        // TODO: Implement zoom to selection
      }
      // Hand tool (H)
      if ((e.key === 'h' || e.key === 'H') && onToolChange) {
        onToolChange('pan');
      }
      // Selection tool (V)
      if ((e.key === 'v' || e.key === 'V') && onToolChange) {
        onToolChange('select');
      }
      // Space for temporary pan
      if (e.code === 'Space') {
        setIsPanning(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsPanning(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [canvasState.zoom, onCanvasStateUpdate, onToolChange]);

  useEffect(() => {
    if (!panStart) return;
    const handleMouseMove = (e: MouseEvent) => {
      if (!panStart || !panOrigin) return;
      const dx = e.clientX - panStart.x;
      const dy = e.clientY - panStart.y;
      onCanvasStateUpdate({
        panX: panOrigin.x + dx,
        panY: panOrigin.y + dy,
      });
    };
    const handleMouseUp = () => {
      setPanStart(null);
      setPanOrigin(null);
    };
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [panStart, panOrigin, onCanvasStateUpdate]);

  // Reset dragBoxOffset on mouse up
  useEffect(() => {
    if (!draggingElementId) setDragBoxOffset(null);
  }, [draggingElementId]);

  const handlePointMouseDown = (elementId: string, pointIndex: number) => (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraggingPoint({ elementId, pointIndex });
  };

  useEffect(() => {
    if (!draggingPoint) return;
    const handleMove = (e: MouseEvent) => {
      const point = getMousePosition(e);
      const element = elements.find(el => el.id === draggingPoint.elementId);
      if (element && element.points) {
        const newPoints = element.points.map((pt, idx) => idx === draggingPoint.pointIndex ? point : pt);
        onElementUpdate(element.id, { points: newPoints });
      }
    };
    const handleUp = () => setDraggingPoint(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [draggingPoint, elements, getMousePosition, onElementUpdate]);

  // Helper: Get group bounding box for selected elements
  function getGroupBounds(selectedElements: Set<string>, elements: DrawingElementData[], canvasRef: React.RefObject<HTMLCanvasElement>) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      if (selectedElements.has(el.id)) {
        const bounds = getElementBounds(el, canvasRef);
        minX = Math.min(minX, bounds.x);
        minY = Math.min(minY, bounds.y);
        maxX = Math.max(maxX, bounds.x + (bounds.width || 0));
        maxY = Math.max(maxY, bounds.y + (bounds.height || 0));
      }
    });
    return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
  }

  // Group resize mouse down
  const handleGroupResizeMouseDown = (e: React.MouseEvent, anchor: ResizeAnchor, groupBounds: any) => {
    e.stopPropagation();
    setGroupResizing({
      anchor,
      startBounds: groupBounds,
      startElements: elements.filter(el => selectedElements.has(el.id)).map(el => ({ ...el })),
      startPoint: getMousePosition(e),
    });
  };

  // Group resize mouse move/up
  useEffect(() => {
    if (!groupResizing) return;
    const handleMove = (e: MouseEvent) => {
      const point = getMousePosition(e);
      const { anchor, startBounds, startElements, startPoint } = groupResizing;
      let dx = point.x - startPoint.x;
      let dy = point.y - startPoint.y;
      let newWidth = startBounds.width;
      let newHeight = startBounds.height;
      let newX = startBounds.x;
      let newY = startBounds.y;
      if (anchor.includes('r')) newWidth += dx;
      if (anchor.includes('l')) { newWidth -= dx; newX += dx; }
      if (anchor.includes('b')) newHeight += dy;
      if (anchor.includes('t')) { newHeight -= dy; newY += dy; }
      newWidth = Math.max(10, newWidth);
      newHeight = Math.max(10, newHeight);
      let scaleX = newWidth / startBounds.width;
      let scaleY = newHeight / startBounds.height;
      if (e.shiftKey) {
        const propScale = getProportionalScale(scaleX, scaleY);
        scaleX = propScale;
        scaleY = propScale;
        // Adjust newWidth/newHeight to keep the box proportional
        newWidth = startBounds.width * scaleX;
        newHeight = startBounds.height * scaleY;
      }
      startElements.forEach(el => {
        const bounds = getElementBounds(el, canvasRef);
        const relX = (bounds.x - startBounds.x) / startBounds.width;
        const relY = (bounds.y - startBounds.y) / startBounds.height;
        if (["rectangle", "diamond", "ellipse", "text"].includes(el.type)) {
          const newElX = newX + relX * newWidth;
          const newElY = newY + relY * newHeight;
          const newElWidth = (el.width || bounds.width) * scaleX;
          const newElHeight = (el.height || bounds.height) * scaleY;
          if (el.type === 'text') {
            const oldFontSize = el.fontSize || 16;
            const newFontSize = Math.max(8, Math.round(oldFontSize * scaleY));
            onElementUpdate(el.id, { x: newElX, y: newElY, width: newElWidth, height: newElHeight, fontSize: newFontSize });
          } else {
            onElementUpdate(el.id, { x: newElX, y: newElY, width: newElWidth, height: newElHeight });
          }
        } else if (el.points) {
          const newPoints = el.points.map(pt => ({
            x: newX + ((pt.x - startBounds.x) * scaleX),
            y: newY + ((pt.y - startBounds.y) * scaleY),
          }));
          onElementUpdate(el.id, { points: newPoints });
        }
      });
    };
    const handleUp = () => setGroupResizing(null);
    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };
  }, [groupResizing, getMousePosition, onElementUpdate, canvasRef]);

  const getProportionalScale = (scaleX: number, scaleY: number) => {
    // Use the larger scale for both axes (like Excalidraw)
    return Math.max(scaleX, scaleY);
  };

  return (
    <div 
      className={`canvas-container w-full h-screen relative overflow-hidden ${!canvasState.gridEnabled ? 'grid-hidden' : ''} ${getCursorStyle()}`}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        onMouseDown={handleMouseDown}
        onWheel={handleWheel}
      />
      
      {/* Resize handles for selected elements */}
      {elements.map(element => {
        if (editingTextElementId === element.id) return null;
        if (
          selectedElements.has(element.id) &&
          ['rectangle', 'diamond', 'ellipse', 'text', 'line', 'arrow', 'draw'].includes(element.type)
        ) {
          const bounds = getElementBounds(element, canvasRef);
          const zoom = canvasState.zoom;
          const panX = canvasState.panX;
          const panY = canvasState.panY;

          const handleResizeMouseDown = (e: React.MouseEvent, anchor: ResizeAnchor) => {
            e.stopPropagation();
            setResizeAnchor(anchor);
            setResizingElementId(element.id);
            setResizingStart({ element, startPoint: getMousePosition(e) });
          };

          const handleMoveMouseDown = (e: React.MouseEvent) => {
            e.stopPropagation();
            setDraggingElementId(element.id);
            if (["line", "arrow", "draw"].includes(element.type)) {
              // For lines/arrows/draw, use bounding box
              const mouse = getMousePosition(e);
              setDragOffset({ x: mouse.x, y: mouse.y });
              setDragBoxOffset({ x: mouse.x - bounds.x, y: mouse.y - bounds.y });
            } else {
              setDragOffset({ x: getMousePosition(e).x - element.x, y: getMousePosition(e).y - element.y });
              setDragBoxOffset(null);
            }
            setDraggingType(element.type);
          };

          const anchors: { name: ResizeAnchor; cursor: string; style: React.CSSProperties }[] = [
            { name: 'tl', cursor: 'nwse-resize', style: { left: -4, top: -4 } },
            { name: 'tm', cursor: 'ns-resize', style: { left: '50%', top: -4, transform: 'translateX(-50%)' } },
            { name: 'tr', cursor: 'nesw-resize', style: { right: -4, top: -4 } },
            { name: 'ml', cursor: 'ew-resize', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
            { name: 'mr', cursor: 'ew-resize', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } },
            { name: 'bl', cursor: 'nesw-resize', style: { left: -4, bottom: -4 } },
            { name: 'bm', cursor: 'ns-resize', style: { left: '50%', bottom: -4, transform: 'translateX(-50%)' } },
            { name: 'br', cursor: 'nwse-resize', style: { right: -4, bottom: -4 } },
          ];

          // Point handles for line, arrow, draw
          if (["line", "arrow", "draw"].includes(element.type) && element.points) {
            return (
              <>
                <div
                  key={element.id + '-selection'}
                  style={{
                    position: 'absolute',
                    transform: `translate(${bounds.x * zoom + panX}px, ${bounds.y * zoom + panY}px)`,
                    width: `${bounds.width * zoom}px`,
                    height: `${bounds.height * zoom}px`,
                    pointerEvents: 'none',
                    zIndex: 50,
                  }}
                >
                  <div
                    style={{ width: '100%', height: '100%', cursor: 'move', pointerEvents: 'auto' }}
                    onMouseDown={handleMoveMouseDown}
                  />
                </div>
                {/* Point handles */}
                {Array.isArray(element.points) && element.points.map((pt, idx) => {
                  const handleX = (pt.x * zoom + panX) - 6;
                  const handleY = (pt.y * zoom + panY) - 6;
                  return (
                    <div
                      key={element.id + '-pt-' + idx}
                      onMouseDown={handlePointMouseDown(element.id, idx)}
                      style={{
                        position: 'absolute',
                        left: handleX,
                        top: handleY,
                        width: 12,
                        height: 12,
                        background: '#fff',
                        border: '2px solid #007BFF',
                        borderRadius: '50%',
                        cursor: 'pointer',
                        zIndex: 100,
                        pointerEvents: 'auto',
                      }}
                    />
                  );
                })}
              </>
            );
          }

          // Resize handles for rectangle, diamond, ellipse, text
          if (["rectangle", "diamond", "ellipse", "text"].includes(element.type)) {
            return (
              <div
                key={element.id + '-selection'}
                style={{
                  position: 'absolute',
                  transform: `translate(${bounds.x * zoom + panX}px, ${bounds.y * zoom + panY}px)`,
                  width: `${bounds.width * zoom}px`,
                  height: `${bounds.height * zoom}px`,
                  pointerEvents: 'none',
                  zIndex: 50,
                }}
              >
                <div
                  style={{ width: '100%', height: '100%', cursor: 'move', pointerEvents: 'auto' }}
                  onMouseDown={e => {
                    e.stopPropagation();
                    setDraggingElementId(element.id);
                    setDragOffset({ x: getMousePosition(e).x - element.x, y: getMousePosition(e).y - element.y });
                    setDragBoxOffset(null);
                    setDraggingType(element.type);
                  }}
                  onDoubleClick={() => setEditingTextElementId(element.id)}
                />
                {anchors.map(anchor => (
                  <div
                    key={anchor.name}
                    onMouseDown={e => handleResizeMouseDown(e, anchor.name)}
                    style={{
                      position: 'absolute',
                      width: '8px',
                      height: '8px',
                      border: '1px solid #fff',
                      background: '#007BFF',
                      pointerEvents: 'auto',
                      cursor: anchor.cursor,
                      ...anchor.style
                    }}
                  />
                ))}
              </div>
            );
          }
          return null;
        }
        return null;
      })}
      {/* Group selection bounding box and handles */}
      {selectedElements.size > 1 && (() => {
        const groupBounds = getGroupBounds(selectedElements, elements, canvasRef);
        const zoom = canvasState.zoom;
        const panX = canvasState.panX;
        const panY = canvasState.panY;
        const anchors: { name: ResizeAnchor; cursor: string; style: React.CSSProperties }[] = [
          { name: 'tl', cursor: 'nwse-resize', style: { left: -4, top: -4 } },
          { name: 'tm', cursor: 'ns-resize', style: { left: '50%', top: -4, transform: 'translateX(-50%)' } },
          { name: 'tr', cursor: 'nesw-resize', style: { right: -4, top: -4 } },
          { name: 'ml', cursor: 'ew-resize', style: { left: -4, top: '50%', transform: 'translateY(-50%)' } },
          { name: 'mr', cursor: 'ew-resize', style: { right: -4, top: '50%', transform: 'translateY(-50%)' } },
          { name: 'bl', cursor: 'nesw-resize', style: { left: -4, bottom: -4 } },
          { name: 'bm', cursor: 'ns-resize', style: { left: '50%', bottom: -4, transform: 'translateX(-50%)' } },
          { name: 'br', cursor: 'nwse-resize', style: { right: -4, bottom: -4 } },
        ];
        return (
          <div
            key="group-selection"
            style={{
              position: 'absolute',
              transform: `translate(${groupBounds.x * zoom + panX}px, ${groupBounds.y * zoom + panY}px)`,
              width: `${groupBounds.width * zoom}px`,
              height: `${groupBounds.height * zoom}px`,
              pointerEvents: 'none',
              zIndex: 100,
              border: '1px dashed #7c3aed',
            }}
          >
            {anchors.map(anchor => (
              <div
                key={anchor.name}
                onMouseDown={e => handleGroupResizeMouseDown(e, anchor.name, groupBounds)}
                style={{
                  position: 'absolute',
                  width: '10px',
                  height: '10px',
                  background: '#fff',
                  border: '2px solid #7c3aed',
                  borderRadius: '2px',
                  pointerEvents: 'auto',
                  cursor: anchor.cursor,
                  ...anchor.style
                }}
              />
            ))}
          </div>
        );
      })()}
      {/* Render <TextEditor> when editingTextElementId is set, passing element, onUpdate, onFinish, canvasState */}
      {editingTextElementId && (() => {
        const editingElement = elements.find(el => el.id === editingTextElementId);
        if (!editingElement) return null;
        const isNew = !editingElement.text;
        let originalText = editingElement.text;
        return (
          <TextEditor
            element={editingElement}
            onUpdate={(updates) => {
              onElementUpdate(editingTextElementId, updates);
            }}
            onFinish={(commit) => {
              const el = elements.find(el => el.id === editingTextElementId);
              if (!el) return setEditingTextElementId(null);
              const text = el.text || '';
              if (!commit) {
                if (isNew) {
                  onElementDelete(editingTextElementId);
                } else {
                  onElementUpdate(editingTextElementId, { text: originalText });
                }
                setEditingTextElementId(null);
                return;
              }
              if (text.trim() === '') {
                onElementDelete(editingTextElementId);
                setEditingTextElementId(null);
                return;
              }
              // Measure text size
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.font = `${el.fontSize || 16}px ${el.fontFamily || 'Virgil'}`;
                const lines = text.split('\n');
                let maxWidth = 0;
                lines.forEach(line => {
                  const w = ctx.measureText(line).width;
                  if (w > maxWidth) maxWidth = w;
                });
                const lineHeight = (el.fontSize || 16) * 1.2;
                const totalHeight = lines.length * lineHeight;
                onElementUpdate(editingTextElementId, { width: maxWidth, height: totalHeight });
              }
              setEditingTextElementId(null);
              justFinishedEditing.current = true;
            }}
            canvasState={canvasState}
            autoFocus={isNew}
          />
        );
      })()}
    </div>
  );
}
