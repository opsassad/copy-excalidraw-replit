import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { DrawingElementData, CanvasState } from "@/types/drawing";
import { Button } from "@/components/ui/button";

// Add ToolType for stricter type safety
import type { DrawingTool } from "@/types/drawing";
type ToolType = DrawingTool;

type ToolOptions = Partial<Omit<DrawingElementData, 'id' | 'type' | 'x' | 'y' | 'width' | 'height' | 'points'>> & { type?: ToolType };

interface PropertyPanelProps {
  selectedElements: Set<string>;
  elements: DrawingElementData[];
  canvasState: CanvasState;
  toolOptions: ToolOptions;
  selectedTool: ToolType;
  onElementUpdate: (elementId: string, updates: Partial<DrawingElementData>) => void;
  onCanvasStateUpdate: (updates: Partial<CanvasState>) => void;
  onToolOptionsUpdate: (updates: Partial<ToolOptions>) => void;
}

export default function PropertyPanel({
  selectedElements,
  elements,
  canvasState,
  toolOptions,
  selectedTool,
  onElementUpdate,
  onCanvasStateUpdate,
  onToolOptionsUpdate,
}: PropertyPanelProps) {
  const hasSelection = selectedElements.size > 0;
  
  // Get the selected element data or use tool options
  const selectedElementsData = (elements || []).filter(el => selectedElements.has(el.id));
  const displayData = hasSelection ? selectedElementsData[0] : toolOptions;

  const handleStrokeWidthChange = (value: number[]) => {
    const strokeWidth = value[0];
    if (hasSelection) {
      selectedElementsData.forEach(el => onElementUpdate(el.id, { strokeWidth }));
    } else {
      onToolOptionsUpdate({ strokeWidth });
    }
  };
  
  const handleStrokeStyleChange = (value: string) => {
    const strokeStyle = value as 'solid' | 'dashed' | 'dotted';
    if (hasSelection) {
      selectedElementsData.forEach(el => onElementUpdate(el.id, { strokeStyle }));
    } else {
      onToolOptionsUpdate({ strokeStyle });
    }
  };
  
  const handleOpacityChange = (value: number[]) => {
    const opacity = value[0] / 100;
    if (hasSelection) {
      selectedElementsData.forEach(el => onElementUpdate(el.id, { opacity }));
    } else {
      onToolOptionsUpdate({ opacity });
    }
  };
  
  const handleFontFamilyChange = (value: string) => {
    const fontFamily = value as 'Virgil' | 'Helvetica' | 'Cascadia';
    if (hasSelection) {
      selectedElementsData.forEach(el => {
        if (el.type === 'text') {
          onElementUpdate(el.id, { fontFamily });
        }
      });
    } else {
      onToolOptionsUpdate({ fontFamily });
    }
  };
  
  const handleFontSizeChange = (value: string) => {
    const fontSize = value === 'small' ? 12 : value === 'medium' ? 16 : value === 'large' ? 24 : 32;
    if (hasSelection) {
      selectedElementsData.forEach(el => {
        if (el.type === 'text') {
          onElementUpdate(el.id, { fontSize });
        }
      });
    } else {
      onToolOptionsUpdate({ fontSize });
    }
  };
  
  const handleStrokeColorChange = (color: string) => {
    if (hasSelection) {
      selectedElementsData.forEach(el => onElementUpdate(el.id, { strokeColor: color }));
    } else {
      onToolOptionsUpdate({ strokeColor: color });
    }
  };
  
  const handleFillColorChange = (color: string) => {
    if (hasSelection) {
      selectedElementsData.forEach(el => onElementUpdate(el.id, { fillColor: color }));
    } else {
      onToolOptionsUpdate({ fillColor: color });
    }
  };

  // Only show shape controls if shape tool is active or a shape element is selected
  const shapeTypes = ['rectangle', 'ellipse', 'diamond', 'line', 'arrow', 'draw'];
  const showShapeControls = (!hasSelection && shapeTypes.includes(selectedTool)) || (hasSelection && displayData && typeof displayData.type === 'string' && shapeTypes.includes(displayData.type));

  // Show connector controls if connector tool is active or a connector element is selected
  const showConnectorControls = (!hasSelection && selectedTool === 'connector') || (hasSelection && displayData && displayData.type === 'connector');

  // Show text controls if a text element is selected or the text tool is active
  const isTextElement = (hasSelection && selectedElementsData[0]?.type === 'text') || (!hasSelection && toolOptions.type === 'text');
  const showTextControls = (!hasSelection && selectedTool === 'text') || (hasSelection && isTextElement);

  const handleConnectorTypeChange = (value: string) => {
    const connectorType = value as 'straight' | 'curved' | 'orthogonal';
    if (hasSelection) {
      selectedElementsData.forEach(el => {
        if (el.type === 'connector') {
          onElementUpdate(el.id, { connectorType });
        }
      });
    } else {
      onToolOptionsUpdate({ connectorType });
    }
  };

  return (
    <div className="property-panel" data-floating-panel="true">
      <div className="floating-panel px-4 py-3">
        <div className="space-y-4">
          {/* Shape Controls Only */}
          {showShapeControls && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shape</h3>
              <div className="space-y-3">
                {/* Stroke Color */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Stroke</Label>
                  <ColorPicker
                    color={displayData?.strokeColor || '#000000'}
                    onChange={handleStrokeColorChange}
                  />
                </div>
                {/* Fill Color (only for rectangle, ellipse, diamond) */}
                {['rectangle', 'ellipse', 'diamond'].includes(displayData?.type || '') && (
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Fill</Label>
                    <ColorPicker
                      color={displayData?.fillColor || 'transparent'}
                      onChange={handleFillColorChange}
                    />
                  </div>
                )}
                {/* Stroke Width */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Width</Label>
                    <span className="text-xs text-gray-500">{displayData?.strokeWidth || 0}px</span>
                  </div>
                  <Slider
                    value={[displayData?.strokeWidth || 0]}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                    onValueChange={handleStrokeWidthChange}
                  />
                </div>
                {/* Sketchy Toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Sketchy</Label>
                  <Switch
                    checked={displayData?.sketchy || false}
                    onCheckedChange={(checked) => {
                      if (hasSelection) {
                        selectedElementsData.forEach(el => onElementUpdate(el.id, { sketchy: checked }));
                      } else {
                        onToolOptionsUpdate({ sketchy: checked });
                      }
                    }}
                  />
                </div>
                {/* Sketchy Fill Toggle (only for rectangle, ellipse, diamond) */}
                {['rectangle', 'ellipse', 'diamond'].includes(displayData?.type || '') && (
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Sketchy Fill</Label>
                    <Switch
                      checked={displayData?.sketchyFill || false}
                      onCheckedChange={(checked) => {
                        if (hasSelection) {
                          selectedElementsData.forEach(el => onElementUpdate(el.id, { sketchyFill: checked }));
                        } else {
                          onToolOptionsUpdate({ sketchyFill: checked });
                        }
                      }}
                    />
                  </div>
                )}
                {/* Roughness Slider (only if Sketchy is enabled) */}
                {displayData?.sketchy && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-gray-600 dark:text-gray-400">Roughness</Label>
                      <span className="text-xs text-gray-500">{displayData?.roughness !== undefined ? displayData.roughness : 1}</span>
                    </div>
                    <Slider
                      value={[displayData?.roughness !== undefined ? displayData.roughness : 1]}
                      max={5}
                      min={0}
                      step={0.1}
                      className="w-full"
                      onValueChange={(value) => {
                        if (hasSelection) {
                          selectedElementsData.forEach(el => onElementUpdate(el.id, { roughness: value[0] }));
                        } else {
                          onToolOptionsUpdate({ roughness: value[0] });
                        }
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Connector Controls */}
          {showConnectorControls && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Connector</h3>
              <div className="space-y-3">
                {/* Stroke Color */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Stroke</Label>
                  <ColorPicker
                    color={displayData?.strokeColor || '#000000'}
                    onChange={handleStrokeColorChange}
                  />
                </div>
                {/* Stroke Width */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Width</Label>
                    <span className="text-xs text-gray-500">{displayData?.strokeWidth || 0}px</span>
                  </div>
                  <Slider
                    value={[displayData?.strokeWidth || 0]}
                    max={50}
                    min={1}
                    step={1}
                    className="w-full"
                    onValueChange={handleStrokeWidthChange}
                  />
                </div>
                {/* Connector Type */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Type</Label>
                  <Select
                    value={(displayData as any)?.connectorType || 'straight'}
                    onValueChange={handleConnectorTypeChange}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="straight">Straight</SelectItem>
                      <SelectItem value="curved">Curved</SelectItem>
                      <SelectItem value="orthogonal">Orthogonal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Connection Status */}
                {hasSelection && (displayData as any)?.startBinding && (
                  <div className="text-xs text-green-600 dark:text-green-400">
                    ✓ Connected to shapes
                  </div>
                )}
                {hasSelection && !(displayData as any)?.startBinding && !(displayData as any)?.endBinding && (
                  <div className="text-xs text-yellow-600 dark:text-yellow-400">
                    ⚠ Not connected to shapes
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Text Controls */}
          {showTextControls && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text</h3>
              <div className="space-y-3">
                {/* Text Color */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Color</Label>
                  <ColorPicker
                    color={displayData?.color || displayData?.strokeColor || '#000000'}
                    onChange={color => {
                      if (hasSelection) {
                        selectedElementsData.forEach(el => onElementUpdate(el.id, { color }));
                      } else {
                        onToolOptionsUpdate({ color });
                      }
                    }}
                  />
                </div>
                {/* Font Family */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Font</Label>
                  <Select
                    value={displayData?.fontFamily || 'Virgil'}
                    onValueChange={fontFamily => {
                      if (hasSelection) {
                        selectedElementsData.forEach(el => onElementUpdate(el.id, { fontFamily: fontFamily as any }));
                      } else {
                        onToolOptionsUpdate({ fontFamily: fontFamily as any });
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Virgil">Virgil (Kalam)</SelectItem>
                      <SelectItem value="Caveat">Caveat</SelectItem>
                      <SelectItem value="Pacifico">Pacifico</SelectItem>
                      <SelectItem value="Indie Flower">Indie Flower</SelectItem>
                      <SelectItem value="Shadows Into Light">Shadows Into Light</SelectItem>
                      <SelectItem value="Satisfy">Satisfy</SelectItem>
                      <SelectItem value="Dancing Script">Dancing Script</SelectItem>
                      <SelectItem value="Gloria Hallelujah">Gloria Hallelujah</SelectItem>
                      <SelectItem value="Architects Daughter">Architects Daughter</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Cascadia">Cascadia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Size</Label>
                  <Select
                    value={String(displayData?.fontSize || 16)}
                    onValueChange={fontSize => {
                      const size = Number(fontSize);
                      if (hasSelection) {
                        selectedElementsData.forEach(el => onElementUpdate(el.id, { fontSize: size }));
                      } else {
                        onToolOptionsUpdate({ fontSize: size });
                      }
                    }}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="12">Small</SelectItem>
                      <SelectItem value="16">Medium</SelectItem>
                      <SelectItem value="24">Large</SelectItem>
                      <SelectItem value="32">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {/* Alignment */}
                <div className="flex items-center gap-2">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Align</Label>
                  <Button size="icon" variant={displayData?.align === 'left' ? 'default' : 'ghost'} onClick={() => {
                    if (hasSelection) {
                      selectedElementsData.forEach(el => onElementUpdate(el.id, { align: 'left' }));
                    } else {
                      onToolOptionsUpdate({ align: 'left' });
                    }
                  }}>L</Button>
                  <Button size="icon" variant={displayData?.align === 'center' ? 'default' : 'ghost'} onClick={() => {
                    if (hasSelection) {
                      selectedElementsData.forEach(el => onElementUpdate(el.id, { align: 'center' }));
                    } else {
                      onToolOptionsUpdate({ align: 'center' });
                    }
                  }}>C</Button>
                  <Button size="icon" variant={displayData?.align === 'right' ? 'default' : 'ghost'} onClick={() => {
                    if (hasSelection) {
                      selectedElementsData.forEach(el => onElementUpdate(el.id, { align: 'right' }));
                    } else {
                      onToolOptionsUpdate({ align: 'right' });
                    }
                  }}>R</Button>
                </div>
              </div>
            </div>
          )}
          {/* Canvas Properties */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Canvas</h3>
            <div className="space-y-3">
              {/* Grid */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Grid</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={canvasState.gridEnabled}
                    onCheckedChange={(checked) => onCanvasStateUpdate({ gridEnabled: checked })}
                  />
                  <Badge variant="outline" className="text-xs">Ctrl+'</Badge>
                </div>
              </div>
              {/* Snap */}
              <div className="flex items-center justify-between">
                <Label className="text-xs text-gray-600 dark:text-gray-400">Snap</Label>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={canvasState.snapEnabled}
                    onCheckedChange={(checked) => onCanvasStateUpdate({ snapEnabled: checked })}
                  />
                  <Badge variant="outline" className="text-xs">Alt+S</Badge>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
