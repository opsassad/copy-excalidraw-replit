import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Minus, Maximize } from "lucide-react";

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
}

export default function ZoomControls({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
}: ZoomControlsProps) {
  return (
    <div className="zoom-controls">
      <div className="floating-panel px-2 py-1">
        <div className="flex flex-col gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0"
                onClick={onZoomIn}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom In (Ctrl++)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0"
                onClick={onZoomOut}
              >
                <Minus className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Zoom Out (Ctrl+-)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="w-10 h-10 p-0"
                onClick={onZoomReset}
              >
                <Maximize className="w-4 h-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Reset Zoom (Ctrl+0)</p>
            </TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Zoom Level Indicator */}
      <div className="floating-panel px-2 py-1 mt-2">
        <div className="text-xs text-gray-600 dark:text-gray-400 text-center font-mono">
          {Math.round(zoom * 100)}%
        </div>
      </div>
    </div>
  );
}
