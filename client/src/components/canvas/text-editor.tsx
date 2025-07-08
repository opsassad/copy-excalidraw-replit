import { useRef, useEffect, useState } from "react";
import { DrawingElementData, CanvasState } from "@/types/drawing";

interface TextEditorProps {
  element: DrawingElementData;
  onUpdate: (updates: Partial<DrawingElementData>) => void;
  onFinish: (commit: boolean) => void; // commit=false means cancel
  canvasState: CanvasState;
  autoFocus?: boolean;
}

export default function TextEditor({ element, onUpdate, onFinish, canvasState, autoFocus }: TextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [text, setText] = useState(element.text || "");
  const [align, setAlign] = useState(element.align || "left");
  // TODO: Add formatting state as needed

  // Focus and caret management
  useEffect(() => {
    if (editorRef.current && (isFocused || autoFocus)) {
      editorRef.current.focus();
      // Place caret at end
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      const sel = window.getSelection();
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    // Set initial text only on mount
    if (editorRef.current && editorRef.current.innerText !== text) {
      editorRef.current.innerText = text;
    }
  }, [isFocused, autoFocus, text]);

  // Sync align state with element.align
  useEffect(() => {
    setAlign(element.align || 'left');
  }, [element.align]);

  // Handle input and update
  const handleInput = () => {
    if (!editorRef.current) return;
    const raw = editorRef.current.innerText;
    setText(raw);
    onUpdate({ text: raw });
  };

  // Keyboard shortcuts and finish/cancel
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onFinish(false); // cancel
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onFinish(true); // commit
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b") {
      e.preventDefault();
      // TODO: Apply bold formatting
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "i") {
      e.preventDefault();
      // TODO: Apply italic formatting
    } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
      e.preventDefault();
      // TODO: Apply underline formatting
    }
    // Allow normal text editing
    e.stopPropagation();
  };

  // Toolbar actions (stubbed)
  const applyFormat = (format: 'bold' | 'italic' | 'underline') => {
    // TODO: Implement formatting logic
  };

  // Positioning
  const screenX = element.x * canvasState.zoom + canvasState.panX;
  const screenY = element.y * canvasState.zoom + canvasState.panY;
  const fontSize = (element.fontSize || 16) * canvasState.zoom;
  const getFontFamily = () => {
    switch (element.fontFamily) {
      case 'Virgil': return 'Kalam, cursive';
      case 'Caveat': return 'Caveat, cursive';
      case 'Pacifico': return 'Pacifico, cursive';
      case 'Indie Flower': return 'Indie Flower, cursive';
      case 'Shadows Into Light': return 'Shadows Into Light, cursive';
      case 'Satisfy': return 'Satisfy, cursive';
      case 'Dancing Script': return 'Dancing Script, cursive';
      case 'Gloria Hallelujah': return 'Gloria Hallelujah, cursive';
      case 'Architects Daughter': return 'Architects Daughter, cursive';
      case 'Helvetica': return 'Inter, sans-serif';
      case 'Cascadia': return 'JetBrains Mono, monospace';
      default: return 'Kalam, cursive';
    }
  };

  // Global pointerdown event listener
  useEffect(() => {
    function handleGlobalPointerDown(e: PointerEvent) {
      const isInEditor = editorRef.current && editorRef.current.contains(e.target as Node);
      // Check if the click is inside a floating panel (property panel, dropdown, etc.)
      let node = e.target as HTMLElement | null;
      let isInFloatingPanel = false;
      while (node) {
        if (node.getAttribute && node.getAttribute('data-floating-panel') === 'true') {
          isInFloatingPanel = true;
          break;
        }
        node = node.parentElement;
      }
      if (!isInEditor && !isInFloatingPanel) {
        onFinish(true);
      }
    }
    document.addEventListener('pointerdown', handleGlobalPointerDown, true);
    return () => document.removeEventListener('pointerdown', handleGlobalPointerDown, true);
  }, [onFinish]);

  // Accessibility: aria-label, tabIndex, etc.
  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        minWidth: '1ch',
        zIndex: 1000,
        pointerEvents: 'auto', 
      }}
    >
      {/* Floating Toolbar (stub) */}
      <div
        style={{
          position: 'absolute',
          top: '-40px',
          left: 0,
          display: 'flex',
          gap: '8px',
          background: 'rgba(255,255,255,0.95)',
          borderRadius: '6px',
          padding: '4px 8px',
          alignItems: 'center',
        }}
      >
        <button type="button" aria-label="Bold (Ctrl+B)" onMouseDown={e => { e.preventDefault(); applyFormat('bold'); }}>B</button>
        <button type="button" aria-label="Italic (Ctrl+I)" onMouseDown={e => { e.preventDefault(); applyFormat('italic'); }}>I</button>
        <button type="button" aria-label="Underline (Ctrl+U)" onMouseDown={e => { e.preventDefault(); applyFormat('underline'); }}>U</button>
        {/* TODO: Add color, font, size, align controls */}
      </div>
      {/* WYSIWYG ContentEditable Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        tabIndex={0}
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        onFocus={() => setIsFocused(true)}
        onBlur={() => onFinish(true)}
        style={{
          width: element.width ? `${element.width * canvasState.zoom}px` : 'auto',
          minHeight: `${fontSize * 1.2}px`,
          fontSize: `${fontSize}px`,
          fontFamily: getFontFamily(),
          color: element.color || element.strokeColor,
          opacity: element.opacity,
          lineHeight: 1.2,
          background: 'transparent',
          outline: 'none',
          border: 'none',
          resize: 'both',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: 0,
          textAlign: align,
        }}
        aria-label="Text editor"
      />
    </div>
  );
}
