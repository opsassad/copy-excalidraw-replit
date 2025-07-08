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
  onStrokeWidthIncrease: () => void;
  onStrokeWidthDecrease: () => void;
  onEditText?: () => void;
  onDelete?: () => void;
  onNudge?: (dx: number, dy: number) => void;
  onDuplicate?: () => void;
  onGroup?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onSelectAll?: () => void;
  onUngroup?: () => void;
  onFitAll?: () => void;
  onStrokeColor?: () => void;
  onFillColor?: () => void;
  onTransform?: () => void;
  onFlipH?: () => void;
  onFlipV?: () => void;
}

export function useKeyboardShortcuts(options: KeyboardShortcutsOptions) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Nudge with arrow keys
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        if (options.onNudge) {
          e.preventDefault();
          const amount = e.shiftKey ? 10 : 1;
          let dx = 0, dy = 0;
          if (e.key === "ArrowUp") dy = -amount;
          if (e.key === "ArrowDown") dy = amount;
          if (e.key === "ArrowLeft") dx = -amount;
          if (e.key === "ArrowRight") dx = amount;
          options.onNudge(dx, dy);
          return;
        }
      }

      // Styling hotkeys
      if (e.key === 's' && !e.ctrlKey && !e.metaKey && options.onStrokeColor) {
        e.preventDefault();
        options.onStrokeColor();
        return;
      }
      if (e.key === 'g' && !e.ctrlKey && !e.metaKey && options.onFillColor) {
        e.preventDefault();
        options.onFillColor();
        return;
      }
      if (e.key === 'Tab' && options.onTransform) {
        e.preventDefault();
        options.onTransform();
        return;
      }
      if (e.key === 'H' && e.shiftKey && options.onFlipH) {
        e.preventDefault();
        options.onFlipH();
        return;
      }
      if (e.key === 'V' && e.shiftKey && options.onFlipV) {
        e.preventDefault();
        options.onFlipV();
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
        'KeyE': 'eraser',
        'Digit0': 'eraser',
      };

      if (toolShortcuts[e.code]) {
        e.preventDefault();
        options.onToolChange(toolShortcuts[e.code]);
        return;
      }

      // Stroke width change
      if (e.key === '=' || e.key === '+') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          options.onZoomIn();
        } else {
          options.onStrokeWidthIncrease();
        }
        return;
      }
      if (e.key === '-') {
        e.preventDefault();
        if (e.ctrlKey || e.metaKey) {
          options.onZoomOut();
        } else {
          options.onStrokeWidthDecrease();
        }
        return;
      }

      // Special keys
      if (e.key === '?' || e.key === 'F1') {
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
          case '0':
            e.preventDefault();
            options.onZoomReset();
            break;
          case "'":
            e.preventDefault();
            options.onToggleGrid();
            break;
          case 'd':
            e.preventDefault();
            if (options.onDuplicate) options.onDuplicate();
            break;
          case 'g':
            if (e.shiftKey) {
              e.preventDefault();
              if (options.onUngroup) options.onUngroup();
            } else {
              e.preventDefault();
              if (options.onGroup) options.onGroup();
            }
            break;
          case 'a':
            e.preventDefault();
            if (options.onSelectAll) options.onSelectAll();
            break;
          case '1':
            if (e.shiftKey) {
              e.preventDefault();
              if (options.onFitAll) options.onFitAll();
            }
            break;
          case 'c':
            if (options.onToolChange) options.onToolChange('connector');
            break;
        }
      }

      // Additional shortcuts
      if (e.key === 'Enter' && options.onEditText) {
        e.preventDefault();
        options.onEditText();
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && options.onDelete) {
        e.preventDefault();
        options.onDelete();
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
