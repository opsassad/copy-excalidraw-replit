import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { DrawingElementData, CanvasState } from "@/types/drawing";

interface PropertyPanelProps {
  selectedElements: Set<string>;
  canvasState: CanvasState;
  onElementUpdate: (elementId: string, updates: Partial<DrawingElementData>) => void;
  onCanvasStateUpdate: (updates: Partial<CanvasState>) => void;
}

export default function PropertyPanel({
  selectedElements,
  canvasState,
  onElementUpdate,
  onCanvasStateUpdate,
}: PropertyPanelProps) {
  const hasSelection = selectedElements.size > 0;

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
                    <div 
                      className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-blue-500 cursor-pointer"
                      style={{ backgroundColor: '#000000' }}
                    />
                    <Badge variant="outline" className="text-xs">S</Badge>
                  </div>
                </div>

                {/* Fill Color */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Fill</Label>
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded border border-gray-300 dark:border-gray-600 bg-transparent cursor-pointer" />
                    <Badge variant="outline" className="text-xs">G</Badge>
                  </div>
                </div>

                {/* Stroke Width */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Width</Label>
                  <Select defaultValue="medium">
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
                  <Select defaultValue="solid">
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
                    <span className="text-xs text-gray-500">100%</span>
                  </div>
                  <Slider
                    defaultValue={[100]}
                    max={100}
                    min={0}
                    step={1}
                    className="w-full"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Text Properties */}
          {hasSelection && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Text</h3>
              <div className="space-y-3">
                {/* Font Family */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Font</Label>
                  <Select defaultValue="virgil">
                    <SelectTrigger className="w-24 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="virgil">Virgil</SelectItem>
                      <SelectItem value="helvetica">Helvetica</SelectItem>
                      <SelectItem value="cascadia">Cascadia</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Font Size */}
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-gray-600 dark:text-gray-400">Size</Label>
                  <Select defaultValue="medium">
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
