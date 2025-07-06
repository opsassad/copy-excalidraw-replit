import { useEffect, useState } from "react";
import { useParams } from "wouter";
import DrawingCanvas from "@/components/canvas/drawing-canvas";
import MainToolbar from "@/components/toolbars/main-toolbar";
import SecondaryToolbar from "@/components/toolbars/secondary-toolbar";
import PropertyPanel from "@/components/panels/property-panel";
import ZoomControls from "@/components/controls/zoom-controls";
import CanvasIndicators from "@/components/indicators/canvas-indicators";
import ShortcutsModal from "@/components/modals/shortcuts-modal";
import { useDrawing } from "@/hooks/use-drawing";
import { useKeyboardShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { DrawingElementData } from "@/types/drawing";
import { generateId } from "@/utils/canvas-utils";

export default function DrawingBoard() {
  const { sessionId } = useParams();
  const [currentSessionId] = useState(() => sessionId || `session_${Date.now()}`);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [clipboard, setClipboard] = useState<DrawingElementData[] | null>(null);
  
  const {
    elements,
    canvasState,
    selectedTool,
    selectedElements,
    toolOptions,
    history,
    setSelectedTool,
    addElement,
    updateElement,
    deleteElement,
    updateCanvasState,
    updateToolOptions,
    undo,
    redo,
    selectElements,
    clearSelection,
    exportCanvas,
    toolLock,
    setToolLock,
  } = useDrawing(currentSessionId);

  // Copy selected elements to clipboard
  const handleCopy = () => {
    const copied = elements.filter(el => selectedElements.has(el.id)).map(el => ({ ...el, id: generateId() }));
    setClipboard(copied);
  };

  // Paste clipboard elements at offset
  const handlePaste = () => {
    if (!clipboard) return;
    const offset = 24;
    const newIds: string[] = [];
    clipboard.forEach(el => {
      const newEl = { ...el, id: generateId() };
      if (typeof newEl.x === 'number') newEl.x += offset;
      if (typeof newEl.y === 'number') newEl.y += offset;
      addElement(newEl);
      newIds.push(newEl.id);
    });
    // Select the newly pasted elements
    setTimeout(() => {
      selectElements(newIds);
    }, 100);
  };

  // Duplicate selected elements (same as copy+paste, but immediate)
  const handleDuplicate = () => {
    handleCopy();
    handlePaste();
  };

  // Select all elements
  const handleSelectAll = () => {
    selectElements(elements.map(el => el.id));
  };

  // Group selected elements
  const handleGroup = () => {
    if (selectedElements.size < 2) return;
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    selectedElements.forEach(elementId => {
      updateElement(elementId, { groupId });
    });
  };

  // Ungroup selected elements
  const handleUngroup = () => {
    selectedElements.forEach(elementId => {
      updateElement(elementId, { groupId: undefined });
    });
  };

  // Fit all elements in the viewport
  const handleFitAll = () => {
    if (elements.length === 0) return;
    // Calculate bounding box
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    elements.forEach(el => {
      if (typeof el.x === 'number' && typeof el.y === 'number') {
        const w = el.width || 0;
        const h = el.height || 0;
        minX = Math.min(minX, el.x);
        minY = Math.min(minY, el.y);
        maxX = Math.max(maxX, el.x + w);
        maxY = Math.max(maxY, el.y + h);
      }
      if (el.points && el.points.length > 0) {
        el.points.forEach(p => {
          minX = Math.min(minX, p.x);
          minY = Math.min(minY, p.y);
          maxX = Math.max(maxX, p.x);
          maxY = Math.max(maxY, p.y);
        });
      }
    });
    // Add padding
    const padding = 40;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    // Calculate scale
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const scaleX = viewportWidth / (maxX - minX);
    const scaleY = viewportHeight / (maxY - minY);
    const zoom = Math.min(scaleX, scaleY, 5);
    // Center
    const panX = -minX * zoom + (viewportWidth - (maxX - minX) * zoom) / 2;
    const panY = -minY * zoom + (viewportHeight - (maxY - minY) * zoom) / 2;
    updateCanvasState({ zoom, panX, panY });
  };

  // Styling hotkeys: S (stroke), G (fill)
  const handleStrokeColor = () => {
    // For now, show a toast or log (UI focus for color picker is non-trivial in React)
    // In a real app, you would focus the color picker input or open a color dialog
    window.alert('Press S: Open stroke color picker (not implemented: UI focus)');
  };
  const handleFillColor = () => {
    window.alert('Press G: Open fill color picker (not implemented: UI focus)');
  };

  // Transform/Flip hotkeys
  const handleTransform = () => {
    window.alert('Tab: Transform shape (future: cycle handles, not implemented)');
  };
  const handleFlipH = () => {
    // Flip horizontally: mirror x/points
    selectedElements.forEach(elementId => {
      const el = elements.find(e => e.id === elementId);
      if (!el) return;
      if (el.points && el.points.length > 0) {
        // For lines, arrows, draw
        const centerX = el.points.reduce((sum, p) => sum + p.x, 0) / el.points.length;
        const flipped = el.points.map(p => ({ ...p, x: 2 * centerX - p.x }));
        updateElement(elementId, { points: flipped });
      } else if (typeof el.x === 'number' && typeof el.width === 'number') {
        // For shapes
        updateElement(elementId, { x: el.x + el.width, width: -el.width });
      }
    });
  };
  const handleFlipV = () => {
    selectedElements.forEach(elementId => {
      const el = elements.find(e => e.id === elementId);
      if (!el) return;
      if (el.points && el.points.length > 0) {
        const centerY = el.points.reduce((sum, p) => sum + p.y, 0) / el.points.length;
        const flipped = el.points.map(p => ({ ...p, y: 2 * centerY - p.y }));
        updateElement(elementId, { points: flipped });
      } else if (typeof el.y === 'number' && typeof el.height === 'number') {
        updateElement(elementId, { y: el.y + el.height, height: -el.height });
      }
    });
  };

  useKeyboardShortcuts({
    onToolChange: setSelectedTool,
    onUndo: undo,
    onRedo: redo,
    onShowShortcuts: () => setShowShortcuts(true),
    onZoomIn: () => updateCanvasState({ zoom: Math.min(canvasState.zoom * 1.2, 5) }),
    onZoomOut: () => updateCanvasState({ zoom: Math.max(canvasState.zoom / 1.2, 0.1) }),
    onZoomReset: () => updateCanvasState({ zoom: 1 }),
    onToggleGrid: () => updateCanvasState({ gridEnabled: !canvasState.gridEnabled }),
    onToggleSnap: () => updateCanvasState({ snapEnabled: !canvasState.snapEnabled }),
    onStrokeWidthIncrease: () => {
      selectedElements.forEach(elementId => {
        const element = elements.find(el => el.id === elementId);
        if (element) {
          updateElement(elementId, { strokeWidth: (element.strokeWidth || 1) + 1 });
        }
      });
    },
    onStrokeWidthDecrease: () => {
      selectedElements.forEach(elementId => {
        const element = elements.find(el => el.id === elementId);
        if (element) {
          updateElement(elementId, { strokeWidth: Math.max(1, (element.strokeWidth || 1) - 1) });
        }
      });
    },
    onEditText: () => {
      // Edit selected text element
      const textElement = elements.find(el => el.type === 'text' && selectedElements.has(el.id));
      if (textElement) {
        // Trigger text editing mode - this will be handled by the canvas
      }
    },
    onDelete: () => {
      // Delete selected elements
      selectedElements.forEach(elementId => deleteElement(elementId));
    },
    onCopy: handleCopy,
    onPaste: handlePaste,
    onDuplicate: handleDuplicate,
    onSelectAll: handleSelectAll,
    onGroup: handleGroup,
    onUngroup: handleUngroup,
    onFitAll: handleFitAll,
    onStrokeColor: handleStrokeColor,
    onFillColor: handleFillColor,
    onTransform: handleTransform,
    onFlipH: handleFlipH,
    onFlipV: handleFlipV,
  });

  return (
    <div className="w-full h-screen overflow-hidden bg-background">
      {/* Main Toolbar */}
      <MainToolbar
        selectedTool={selectedTool}
        onToolChange={setSelectedTool}
        canUndo={history.undoStack.length > 0}
        canRedo={history.redoStack.length > 0}
        onUndo={undo}
        onRedo={redo}
        toolLock={toolLock}
        setToolLock={setToolLock}
      />

      {/* Secondary Toolbar */}
      <SecondaryToolbar
        onExport={exportCanvas}
        onShowShortcuts={() => setShowShortcuts(true)}
      />

      {/* Property Panel */}
      <PropertyPanel
        selectedElements={selectedElements}
        elements={elements}
        canvasState={canvasState}
        toolOptions={toolOptions}
        selectedTool={selectedTool}
        onElementUpdate={updateElement}
        onCanvasStateUpdate={updateCanvasState}
        onToolOptionsUpdate={updateToolOptions}
      />

      {/* Drawing Canvas */}
      <DrawingCanvas
        elements={elements}
        canvasState={canvasState}
        selectedTool={selectedTool}
        selectedElements={selectedElements}
        toolOptions={toolOptions}
        onElementAdd={addElement}
        onElementUpdate={updateElement}
        onElementDelete={deleteElement}
        onElementSelect={selectElements}
        onCanvasStateUpdate={updateCanvasState}
        onClearSelection={clearSelection}
        onToolChange={setSelectedTool}
        toolLock={toolLock}
      />

      {/* Zoom Controls */}
      <ZoomControls
        zoom={canvasState.zoom}
        onZoomIn={() => updateCanvasState({ zoom: Math.min(canvasState.zoom * 1.2, 5) })}
        onZoomOut={() => updateCanvasState({ zoom: Math.max(canvasState.zoom / 1.2, 0.1) })}
        onZoomReset={() => updateCanvasState({ zoom: 1 })}
      />

      {/* Canvas Indicators */}
      <CanvasIndicators
        canvasState={canvasState}
        elementCount={elements.length}
        selectedTool={selectedTool}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutsModal
        isOpen={showShortcuts}
        onClose={() => setShowShortcuts(false)}
      />
    </div>
  );
}
