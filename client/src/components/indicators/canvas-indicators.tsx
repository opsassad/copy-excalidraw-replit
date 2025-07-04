import { CanvasState, DrawingTool } from "@/types/drawing";

interface CanvasIndicatorsProps {
  canvasState: CanvasState;
  elementCount: number;
  selectedTool: DrawingTool;
}

export default function CanvasIndicators({
  canvasState,
  elementCount,
  selectedTool,
}: CanvasIndicatorsProps) {
  const formatCoordinate = (value: number) => Math.round(value);

  return (
    <div className="canvas-indicator">
      <div className="space-y-1">
        <div>x: {formatCoordinate(-canvasState.panX)}, y: {formatCoordinate(-canvasState.panY)}</div>
        <div>Objects: {elementCount}</div>
        <div>Tool: {selectedTool.charAt(0).toUpperCase() + selectedTool.slice(1)}</div>
      </div>
    </div>
  );
}
