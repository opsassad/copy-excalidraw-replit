import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DrawingTool } from "@/types/drawing";
import {
  MousePointer,
  Hand,
  Square,
  Diamond,
  Circle,
  ArrowRight,
  Minus,
  Pencil,
  Type,
  Image,
  Eraser,
  Undo,
  Redo,
  Lock,
  Unlock,
} from "lucide-react";

interface MainToolbarProps {
  selectedTool: DrawingTool;
  onToolChange: (tool: DrawingTool) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  toolLock: boolean;
  setToolLock: (lock: boolean) => void;
}

export default function MainToolbar({
  selectedTool,
  onToolChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  toolLock,
  setToolLock,
}: MainToolbarProps) {
  const tools = [
    { id: 'select', icon: MousePointer, label: 'Selection Tool', shortcut: 'V' },
    { id: 'pan', icon: Hand, label: 'Hand Tool', shortcut: 'H' },
  ];

  const shapeTools = [
    { id: 'rectangle', icon: Square, label: 'Rectangle', shortcut: 'R' },
    { id: 'diamond', icon: Diamond, label: 'Diamond', shortcut: 'D' },
    { id: 'ellipse', icon: Circle, label: 'Ellipse', shortcut: 'O' },
  ];

  const drawingTools = [
    { id: 'arrow', icon: ArrowRight, label: 'Arrow', shortcut: 'A' },
    { id: 'line', icon: Minus, label: 'Line', shortcut: 'L' },
    { id: 'draw', icon: Pencil, label: 'Draw', shortcut: 'P' },
  ];

  const utilityTools = [
    { id: 'text', icon: Type, label: 'Text', shortcut: 'T' },
    { id: 'image', icon: Image, label: 'Image', shortcut: '9' },
    { id: 'eraser', icon: Eraser, label: 'Eraser', shortcut: 'E' },
  ];

  const ToolButton = ({ tool, isActive, onClick }: { 
    tool: { id: string; icon: any; label: string; shortcut: string };
    isActive: boolean;
    onClick: () => void;
  }) => {
    const Icon = tool.icon;
    
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant={isActive ? "default" : "ghost"}
            size="sm"
            className={`w-10 h-10 p-0 ${isActive ? 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400' : ''}`}
            onClick={onClick}
          >
            <Icon className="w-4 h-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>{tool.label} ({tool.shortcut})</p>
        </TooltipContent>
      </Tooltip>
    );
  };

  return (
    <div className="main-toolbar">
      <div className="floating-panel px-3 py-2">
        <div className="flex items-center gap-1">
          {/* Selection Tools */}
          <div className="flex items-center gap-1">
            {tools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={selectedTool === tool.id}
                onClick={() => onToolChange(tool.id as DrawingTool)}
              />
            ))}
          </div>

          {/* Tool Lock Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={toolLock ? "default" : "ghost"}
                size="sm"
                className={`w-10 h-10 p-0 ${toolLock ? 'text-yellow-600 dark:text-yellow-400' : ''}`}
                aria-pressed={toolLock}
                aria-label={toolLock ? "Unlock tool" : "Lock tool"}
                onClick={() => setToolLock(!toolLock)}
                style={{ marginLeft: 4, marginRight: 4 }}
              >
                {toolLock ? (
                  <Lock className="w-5 h-5" />
                ) : (
                  <Unlock className="w-5 h-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{toolLock ? "Tool lock enabled (click to unlock)" : "Tool lock disabled (click to lock)"}</p>
            </TooltipContent>
          </Tooltip>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Shape Tools */}
          <div className="flex items-center gap-1">
            {shapeTools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={selectedTool === tool.id}
                onClick={() => onToolChange(tool.id as DrawingTool)}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Drawing Tools */}
          <div className="flex items-center gap-1">
            {drawingTools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={selectedTool === tool.id}
                onClick={() => onToolChange(tool.id as DrawingTool)}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Utility Tools */}
          <div className="flex items-center gap-1">
            {utilityTools.map((tool) => (
              <ToolButton
                key={tool.id}
                tool={tool}
                isActive={selectedTool === tool.id}
                onClick={() => onToolChange(tool.id as DrawingTool)}
              />
            ))}
          </div>

          <Separator orientation="vertical" className="h-6 mx-2" />

          {/* Undo/Redo */}
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0"
                  onClick={onUndo}
                  disabled={!canUndo}
                >
                  <Undo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Undo (Ctrl+Z)</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-10 h-10 p-0"
                  onClick={onRedo}
                  disabled={!canRedo}
                >
                  <Redo className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Redo (Ctrl+Y)</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </div>
    </div>
  );
}
