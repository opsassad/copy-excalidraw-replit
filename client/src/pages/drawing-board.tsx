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
import { toast } from '@/hooks/use-toast';
import { parseMermaidToExcalidraw } from '@excalidraw/mermaid-to-excalidraw';

export default function DrawingBoard() {
  const { sessionId } = useParams();
  const [currentSessionId] = useState(() => sessionId || `session_${Date.now()}`);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [clipboard, setClipboard] = useState<DrawingElementData[] | null>(null);
  const [showMermaidModal, setShowMermaidModal] = useState(false);
  const [mermaidCode, setMermaidCode] = useState('');
  const [mermaidLoading, setMermaidLoading] = useState(false);
  
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

  const handleFitAll = () => {
    if (elements.length === 0) return;
    
    // Calculate bounding box of all elements
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(el => {
      const elMinX = el.x;
      const elMinY = el.y;
      const elMaxX = el.x + (el.width || 0);
      const elMaxY = el.y + (el.height || 0);
      
      if (el.points) {
        el.points.forEach(point => {
          const pointX = el.x + point.x;
          const pointY = el.y + point.y;
          minX = Math.min(minX, pointX);
          minY = Math.min(minY, pointY);
          maxX = Math.max(maxX, pointX);
          maxY = Math.max(maxY, pointY);
        });
      } else {
        minX = Math.min(minX, elMinX);
        minY = Math.min(minY, elMinY);
        maxX = Math.max(maxX, elMaxX);
        maxY = Math.max(maxY, elMaxY);
      }
    });
    
    if (minX === Infinity) return;
    
    // Add some padding
    const padding = 50;
    minX -= padding;
    minY -= padding;
    maxX += padding;
    maxY += padding;
    
    // Calculate center and zoom to fit
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;
    
    // Assume viewport size (this could be improved by getting actual canvas size)
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    const zoomX = viewportWidth / width;
    const zoomY = viewportHeight / height;
    const newZoom = Math.min(zoomX, zoomY, 3); // Cap at 3x zoom
    
    const newPanX = viewportWidth / 2 - centerX * newZoom;
    const newPanY = viewportHeight / 2 - centerY * newZoom;
    
    updateCanvasState({
      zoom: newZoom,
      panX: newPanX,
      panY: newPanY,
    });
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

  // Mermaid import handler
  const handleImportMermaid = async () => {
    setMermaidLoading(true);
    try {
      const result = await parseMermaidToExcalidraw(mermaidCode, {
        themeVariables: {
          fontSize: "16px",
        },
      });
      
      console.log('Mermaid conversion result:', result);
      console.log('Elements:', result.elements);
      if (result.elements && result.elements.length > 0) {
        console.log('First element:', result.elements[0]);
        console.log('Element keys:', Object.keys(result.elements[0]));
      }
      
      const { elements: mermaidElements } = result;
      
      if (!mermaidElements || !Array.isArray(mermaidElements) || mermaidElements.length === 0) {
        toast({ title: 'No elements found', description: 'The Mermaid diagram could not be converted.' });
        setMermaidLoading(false);
        return;
      }

      // Comprehensive conversion with proper text, connections, and styling
      const convertedElements: DrawingElementData[] = [];
      const elementMap = new Map<string, DrawingElementData>();
      
      // First pass: Create all shape elements with text
      mermaidElements.forEach((el: any) => {
        console.log('Converting element:', el);
        
        if (el.type === 'text') {
          // Skip standalone text elements - they should be part of shapes
          return;
        }
        
        const baseElement: DrawingElementData = {
          id: el.id || generateId(),
          type: el.type as any,
          x: el.x || 0,
          y: el.y || 0,
          strokeColor: el.strokeColor || '#1e1e1e',
          fillColor: el.backgroundColor || 'transparent',
          strokeWidth: el.strokeWidth || 2,
          strokeStyle: (el.strokeStyle as any) || 'solid',
          opacity: (el.opacity !== undefined ? el.opacity / 100 : 1),
          rotation: el.angle || 0,
          roughness: el.roughness || 1,
          seed: el.seed || Math.floor(Math.random() * 1000000),
        };

        // Handle shape elements (rectangle, diamond, ellipse)
        if (['rectangle', 'diamond', 'ellipse'].includes(el.type)) {
          baseElement.width = el.width || 120;
          baseElement.height = el.height || 60;
          
          // Extract text content from the element
          if (el.text) {
            baseElement.text = el.text;
            baseElement.fontSize = 14;
            baseElement.fontFamily = 'Virgil';
          }
          
          // Apply custom styling from Mermaid
          if (el.customData && el.customData.style) {
            const style = el.customData.style;
            if (style.fill) {
              baseElement.fillColor = style.fill;
            }
            if (style.stroke) {
              baseElement.strokeColor = style.stroke;
            }
            if (style.strokeWidth) {
              baseElement.strokeWidth = parseInt(style.strokeWidth) || 2;
            }
          }
          
          convertedElements.push(baseElement);
          elementMap.set(baseElement.id, baseElement);
        }
        
        // Handle arrow/line elements
        if (['arrow', 'line'].includes(el.type)) {
          if (el.points && Array.isArray(el.points) && el.points.length >= 2) {
            baseElement.points = el.points.map((p: any) => 
              Array.isArray(p) ? { x: p[0], y: p[1] } : p
            );
            
            // Add arrow label if present
            if (el.text) {
              baseElement.text = el.text;
              baseElement.fontSize = 12;
              baseElement.fontFamily = 'Virgil';
            }
            
            convertedElements.push(baseElement);
            elementMap.set(baseElement.id, baseElement);
          }
        }
      });
      
      // Second pass: Create missing connections based on Mermaid syntax
      // Parse the original Mermaid code to extract connections
      const lines = mermaidCode.split('\n').filter(line => line.trim() && !line.trim().startsWith('style'));
      const connections: Array<{from: string, to: string, label?: string}> = [];
      const nodeNames = new Map<string, string>(); // Map node IDs to display names
      
      // Extract node definitions and their display names
      lines.forEach(line => {
        // Match patterns like: NodeId{Display Name}, NodeId[Display Name], NodeId(Display Name)
        const nodeMatch = line.match(/(\w+)[\{\[\(]([^}\]\)]+)[\}\]\)]/g);
        if (nodeMatch) {
          nodeMatch.forEach(match => {
            const parts = match.match(/(\w+)[\{\[\(]([^}\]\)]+)[\}\]\)]/);
            if (parts) {
              nodeNames.set(parts[1], parts[2]);
            }
          });
        }
        
        // Extract simple node names from connections and declarations
        const simpleNodes = line.match(/\b(\w+)\b/g);
        if (simpleNodes) {
          simpleNodes.forEach(node => {
            if (!nodeNames.has(node) && 
                node !== 'style' && node !== 'fill' && node !== 'stroke' && 
                node !== 'graph' && node !== 'LR' && node !== 'TD' && 
                node.length > 1) { // Avoid single letters
              nodeNames.set(node, node);
            }
          });
        }
      });
      
      lines.forEach(line => {
        // Match various arrow patterns:
        // A --> B
        // A -- Yes --> B  
        // A -- No --> B
        const patterns = [
          /(\w+)\s*--\s*([^-]+?)\s*-->\s*(\w+)/,  // A -- Label --> B
          /(\w+)\s*-->\s*(\w+)/,                   // A --> B
          /(\w+)\s*--\s*(\w+)/                     // A -- B
        ];
        
        for (const pattern of patterns) {
          const match = line.match(pattern);
          if (match) {
            if (pattern.source.includes('[^-]+?')) {
              // Pattern with label
              connections.push({
                from: match[1],
                to: match[3],
                label: match[2].trim()
              });
            } else {
              // Pattern without label
              connections.push({
                from: match[1],
                to: match[2]
              });
            }
            break;
          }
        }
      });
      
      // Create arrow elements for connections that don't exist
      connections.forEach(conn => {
        // Find elements by matching node names
        const fromDisplayName = nodeNames.get(conn.from) || conn.from;
        const toDisplayName = nodeNames.get(conn.to) || conn.to;
        
        const fromElement = convertedElements.find(el => 
          el.text && (
            el.text.toLowerCase().includes(fromDisplayName.toLowerCase()) ||
            el.text.toLowerCase().includes(conn.from.toLowerCase())
          )
        );
        const toElement = convertedElements.find(el => 
          el.text && (
            el.text.toLowerCase().includes(toDisplayName.toLowerCase()) ||
            el.text.toLowerCase().includes(conn.to.toLowerCase())
          )
        );
        
        if (fromElement && toElement) {
          // Calculate connection points from center to center
          const fromCenter = {
            x: fromElement.x + (fromElement.width || 0) / 2,
            y: fromElement.y + (fromElement.height || 0) / 2
          };
          const toCenter = {
            x: toElement.x + (toElement.width || 0) / 2,
            y: toElement.y + (toElement.height || 0) / 2
          };
          
          // Create arrow element with proper relative positioning
          const arrowElement: DrawingElementData = {
            id: generateId(),
            type: 'arrow',
            x: fromCenter.x, // Arrow starts at from center
            y: fromCenter.y,
            points: [
              { x: 0, y: 0 }, // Start point (relative to arrow x,y)
              { x: toCenter.x - fromCenter.x, y: toCenter.y - fromCenter.y } // End point (relative)
            ],
            strokeColor: '#1e1e1e',
            fillColor: 'transparent',
            strokeWidth: 2,
            strokeStyle: 'solid',
            opacity: 1,
            rotation: 0,
            roughness: 1,
            seed: Math.floor(Math.random() * 1000000),
          };
          
          // Add label if present
          if (conn.label && conn.label !== 'undefined') {
            arrowElement.text = conn.label;
            arrowElement.fontSize = 12;
            arrowElement.fontFamily = 'Virgil';
          }
          
          convertedElements.push(arrowElement);
        }
      });
      
      // Fourth pass: Create text elements for shapes that don't have text yet
      const shapesWithoutText = convertedElements.filter(el => 
        ['rectangle', 'diamond', 'ellipse'].includes(el.type) && (!el.text || el.text.trim() === '')
      );
      const availableNodeNames = Array.from(nodeNames.entries());
      
      // Assign node names to shapes in order
      shapesWithoutText.forEach((el, index) => {
        if (index < availableNodeNames.length) {
          const [nodeId, displayName] = availableNodeNames[index];
          el.text = displayName;
          el.fontSize = 14;
          el.fontFamily = 'Virgil';
          console.log(`Assigned text "${displayName}" to ${el.type} element`);
        }
      });
     
      // Fifth pass: Apply custom styling from style directives
      const styleLines = mermaidCode.split('\n').filter(line => line.trim().startsWith('style'));
      styleLines.forEach(styleLine => {
        const styleMatch = styleLine.match(/style\s+(\w+)\s+(.+)/);
        if (styleMatch) {
          const elementName = styleMatch[1];
          const styleProps = styleMatch[2];
          
          // Find the element by name
          const element = convertedElements.find(el => 
            el.text && (
              el.text.toLowerCase() === elementName.toLowerCase() ||
              el.text.toLowerCase().includes(elementName.toLowerCase())
            )
          );
          
          if (element) {
            console.log(`Applying style to element "${element.text}":`, styleProps);
            
            // Parse fill color
            const fillMatch = styleProps.match(/fill:\s*([#\w]+)/i);
            if (fillMatch) {
              element.fillColor = fillMatch[1];
              console.log(`Set fillColor to ${fillMatch[1]} for element "${element.text}"`);
            }
            
            // Parse stroke color
            const strokeMatch = styleProps.match(/stroke:\s*([#\w]+)/i);
            if (strokeMatch) {
              element.strokeColor = strokeMatch[1];
              console.log(`Set strokeColor to ${strokeMatch[1]} for element "${element.text}"`);
            }
            
            // Parse stroke width
            const strokeWidthMatch = styleProps.match(/stroke-width:\s*(\d+)/i);
            if (strokeWidthMatch) {
              element.strokeWidth = parseInt(strokeWidthMatch[1]);
              console.log(`Set strokeWidth to ${strokeWidthMatch[1]} for element "${element.text}"`);
            }
          } else {
            console.log(`Could not find element for style: ${elementName}`);
            console.log('Available elements:', convertedElements.map(el => el.text));
          }
        }
      });

      console.log('Converted elements:', convertedElements);

      // Add all elements to canvas
      convertedElements.forEach(el => addElement(el));
      
      // Center view on imported elements
      if (convertedElements.length > 0) {
        setTimeout(() => {
          handleFitAll();
        }, 100);
      }
      
      toast({ title: 'Mermaid Imported', description: `${convertedElements.length} elements imported successfully.` });
      setShowMermaidModal(false);
      setMermaidCode('');
    } catch (err) {
      console.error('Mermaid import error:', err);
      const message = (err as Error)?.message || String(err);
      toast({ title: 'Import Failed', description: message || 'Could not parse Mermaid diagram.' });
    } finally {
      setMermaidLoading(false);
    }
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
        onImportMermaid={() => setShowMermaidModal(true)}
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

      {/* Mermaid Import Modal */}
      {showMermaidModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 w-full max-w-lg">
            <h2 className="text-lg font-bold mb-2">Import Mermaid Diagram</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Paste your Mermaid diagram code below or try the sample:
            </p>
            <textarea
              className="w-full h-40 p-2 border rounded mb-4 text-sm font-mono"
              placeholder="Paste your Mermaid code here..."
              value={mermaidCode}
              onChange={e => setMermaidCode(e.target.value)}
              disabled={mermaidLoading}
              autoFocus
            />
            <button
              className="mb-4 text-sm text-blue-600 hover:text-blue-700 underline"
              onClick={() => setMermaidCode(`graph LR
    AnyaLogin --> BrowseProjects;
    BrowseProjects --> ViewDetails{View Project Details};
    ViewDetails -- Yes --> Apply;
    ViewDetails -- No --> BrowseProjects;
    Apply --> Updates;
    Updates --> Communicate{Communicate with Organizer};
    Communicate -- Yes --> Accept;
    Communicate -- No --> BrowseProjects;
    Accept --> Work;
 
    style AnyaLogin fill:#f9f,stroke:#333,stroke-width:2px
    style BrowseProjects fill:#ccf,stroke:#333,stroke-width:2px
    style Apply fill:#ccf,stroke:#333,stroke-width:2px
    style Updates fill:#ccf,stroke:#333,stroke-width:2px
    style Accept fill:#ccf,stroke:#333,stroke-width:2px
    style Work fill:#ccf,stroke:#333,stroke-width:2px`)}
              disabled={mermaidLoading}
            >
              Use Sample Diagram
            </button>
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 rounded bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
                onClick={() => setShowMermaidModal(false)}
                disabled={mermaidLoading}
              >Cancel</button>
              <button
                className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
                onClick={handleImportMermaid}
                disabled={mermaidLoading || !mermaidCode.trim()}
              >{mermaidLoading ? 'Importing...' : 'Import'}</button>
            </div>
          </div>
        </div>
      )}

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
