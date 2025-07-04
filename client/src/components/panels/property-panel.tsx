import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ColorPicker } from "@/components/ui/color-picker";
import { DrawingElementData, CanvasState } from "@/types/drawing";

interface PropertyPanelProps {
  selectedElements: Set<string>;
  elements: DrawingElementData[];
  canvasState: CanvasState;
  onElementUpdate: (elementId: string, updates: Partial<DrawingElementData>) => void;
  onCanvasStateUpdate: (updates: Partial<CanvasState>) => void;
}

export default function PropertyPanel({
  selectedElements,
  elements,
  canvasState,
  onElementUpdate,
  onCanvasStateUpdate,
}: PropertyPanelProps) {
  const hasSelection = selectedElements.size > 0;
  
  // Get the selected element data
  const selectedElementsData = (elements || []).filter(el => selectedElements.has(el.id));
  const firstElement = selectedElementsData[0];
  const isTextElement = firstElement?.type === 'text';
  
  const handleStrokeWidthChange = (value: string) => {
    const strokeWidth = value === 'thin' ? 1 : value === 'medium' ? 2 : value === 'bold' ? 4 : 6;
    selectedElementsData.forEach(el => onElementUpdate(el.id, { strokeWidth }));
  };
  
  const handleStrokeStyleChange = (value: string) => {
    const strokeStyle = value as 'solid' | 'dashed' | 'dotted';
    selectedElementsData.forEach(el => onElementUpdate(el.id, { strokeStyle }));
  };
  
  const handleOpacityChange = (value: number[]) => {
    const opacity = value[0] / 100;
    selectedElementsData.forEach(el => onElementUpdate(el.id, { opacity }));
  };
  
  const handleFontFamilyChange = (value: string) => {
    const fontFamily = value as 'Virgil' | 'Helvetica' | 'Cascadia';
    selectedElementsData.forEach(el => {
      if (el.type === 'text') {
        onElementUpdate(el.id, { fontFamily });
      }
    });
  };
  
  const handleFontSizeChange = (value: string) => {
    const fontSize = value === 'small' ? 12 : value === 'medium' ? 16 : value === 'large' ? 24 : 32;
    selectedElementsData.forEach(el => {
      if (el.type === 'text') {
        onElementUpdate(el.id, { fontSize });
      }
    });
  };
  
  const handleStrokeColorChange = (color: string) => {
    selectedElementsData.forEach(el => onElementUpdate(el.id, { strokeColor: color }));
  };
  
  const handleFillColorChange = (color: string) => {
    selectedElementsData.forEach(el => onElementUpdate(el.id, { fillColor: color }));
  };

  return (
    <div className="property-panel">
      <div className="floating-panel px-4 py-3">
        <div className="space-y-4">
          {/* Shape Properties */}
          {hasSelection && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Shape</h3>
              <div className="space-y-3">
                {/* Stroke Color */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Stroke</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={firstElement?.strokeColor || '#000000'}
                      onChange={handleStrokeColorChange}
                    />
                    <Badge variant="outline" className="text-xs">S</Badge>
                  </div>
                </div>

                {/* Fill Color */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Fill</Label>
                  <div className="flex items-center gap-2">
                    <ColorPicker
                      color={firstElement?.fillColor || 'transparent'}
                      onChange={handleFillColorChange}
                    />
                    <Badge variant="outline" className="text-xs">G</Badge>
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Width</Label>
                  <Select 
                    value={firstElement ? (firstElement.strokeWidth <= 1 ? 'thin' : firstElement.strokeWidth <= 2 ? 'medium' : firstElement.strokeWidth <= 4 ? 'bold' : 'extra-bold') : 'medium'}
                    onValueChange={handleStrokeWidthChange}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="thin">Thin</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="bold">Bold</SelectItem>
                      <SelectItem value="extra-bold">Extra Bold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Stroke Style */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Style</Label>
                  <Select 
                    value={firstElement?.strokeStyle || 'solid'}
                    onValueChange={handleStrokeStyleChange}
                  >
                    <SelectTrigger className="w-20 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solid">Solid</SelectItem>
                      <SelectItem value="dashed">Dashed</SelectItem>
                      <SelectItem value="dotted">Dotted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs text-gray-600 dark:text-gray-400">Opacity</Label>
                    <span className="text-xs text-gray-500">{Math.round((firstElement?.opacity || 1) * 100)}%</span>
                  </div>
                  <Slider
                    value={[Math.round((firstElement?.opacity || 1) * 100)]}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                    onValueChange={handleOpacityChange}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Properties */}
          {hasSelection && isTextElement && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text</h3>
              <div className="space-y-3">
                {/* Font Family */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Font</Label>
                  <Select 
                    value={firstElement?.fontFamily || 'Virgil'}
                    onValueChange={handleFontFamilyChange}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Virgil">Virgil</SelectItem>
                      <SelectItem value="Helvetica">Helvetica</SelectItem>
                      <SelectItem value="Cascadia">Cascadia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Size</Label>
                  <Select 
                    value={firstElement ? ((firstElement.fontSize || 16) <= 12 ? 'small' : (firstElement.fontSize || 16) <= 16 ? 'medium' : (firstElement.fontSize || 16) <= 24 ? 'large' : 'extra-large') : 'medium'}
                    onValueChange={handleFontSizeChange}
                  >
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                      <SelectItem value="extra-large">Extra Large</SelectItem>
                    </SelectContent>
                  </Select>
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
