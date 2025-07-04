import { useEffect } from "react";
import { DrawingTool } from "@/types/drawing";

interface KeyboardShortcutsOptions {
  onToolChange: (tool: DrawingTool) => void;
  onUndo: () => void;
  onRedo: () => void;
  onShowShortcuts: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Tool shortcuts
      const toolShortcuts: Record<string, DrawingTool> = {
        'KeyV': 'select',
        'Digit1': 'select',
        'KeyH': 'pan',
        'KeyR': 'rectangle',
        'Digit2': 'rectangle',
        'KeyD': 'diamond',
        'Digit3': 'diamond',
        'KeyO': 'ellipse',
        'Digit4': 'ellipse',
        'KeyA': 'arrow',
        'Digit5': 'arrow',
        'KeyL': 'line',
        'Digit6': 'line',
        'KeyP': 'draw',
        'Digit7': 'draw',
        'KeyT': 'text',
        'Digit8': 'text',
        'Digit9': 'image',
        'KeyE': 'eraser',
        'Digit0': 'eraser',
      };

      if (toolShortcuts[e.code]) {
        e.preventDefault();
        options.onToolChange(toolShortcuts[e.code]);
        return;
      }

      // Special keys
      if (e.key === '?') {
        e.preventDefault();
        options.onShowShortcuts();
        return;
      }

      // Ctrl/Cmd combinations
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              options.onRedo();
            } else {
              options.onUndo();
            }
            break;
          case 'y':
            e.preventDefault();
            options.onRedo();
            break;
          case '=':
          case '+':
            e.preventDefault();
            options.onZoomIn();
            break;
          case '-':
            e.preventDefault();
            options.onZoomOut();
            break;
          case '0':
            e.preventDefault();
            options.onZoomReset();
            break;
          case "'":
            e.preventDefault();
            options.onToggleGrid();
            break;
        }
      }

      // Alt combinations
      if (e.altKey) {
        switch (e.key) {
          case 's':
          case 'S':
            e.preventDefault();
            options.onToggleSnap();
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [options]);
}
