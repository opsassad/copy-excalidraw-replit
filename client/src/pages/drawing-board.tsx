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

export default function DrawingBoard() {
  const { sessionId } = useParams();
  const [currentSessionId] = useState(() => sessionId || `session_${Date.now()}`);
  const [showShortcuts, setShowShortcuts] = useState(false);
  
  const {
    elements,
    canvasState,
    selectedTool,
    selectedElements,
    history,
    setSelectedTool,
    addElement,
    updateElement,
    deleteElement,
    updateCanvasState,
    undo,
    redo,
    selectElements,
    clearSelection,
    exportCanvas,
  } = useDrawing(currentSessionId);

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
        onElementUpdate={updateElement}
        onCanvasStateUpdate={updateCanvasState}
      />

      {/* Drawing Canvas */}
      <DrawingCanvas
        elements={elements}
        canvasState={canvasState}
        selectedTool={selectedTool}
        selectedElements={selectedElements}
        onElementAdd={addElement}
        onElementUpdate={updateElement}
        onElementDelete={deleteElement}
        onElementSelect={selectElements}
        onCanvasStateUpdate={updateCanvasState}
        onClearSelection={clearSelection}
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
