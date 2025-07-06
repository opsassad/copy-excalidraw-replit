import { useState, useEffect, useRef } from "react";
import { DrawingElementData } from "@/types/drawing";

interface TextEditorProps {
  element: DrawingElementData;
  onUpdate: (updates: Partial<DrawingElementData>) => void;
  onFinish: () => void;
  canvasState: { zoom: number; panX: number; panY: number };
}

export default function TextEditor({ element, onUpdate, onFinish, canvasState }: TextEditorProps) {
  const [text, setText] = useState(element.text || '');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      // Auto-resize on mount
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      // Check for overflow
      setIsOverflowing(textareaRef.current.scrollHeight > textareaRef.current.offsetHeight + 1);
    }
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
      // Check for overflow
      setIsOverflowing(textareaRef.current.scrollHeight > textareaRef.current.offsetHeight + 1);
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onFinish();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      onFinish();
    }
    // Allow normal text editing
    e.stopPropagation();
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);
    onUpdate({ text: newText });
  };

  const handleBlur = () => {
    // On finish, update the element's height to fit the content
    if (textareaRef.current) {
      const lineHeight = (element.fontSize || 16) * 1.2 * canvasState.zoom;
      const lines = text.split('\n').length;
      const newHeight = Math.max(textareaRef.current.scrollHeight / canvasState.zoom, lines * lineHeight);
      onUpdate({ height: newHeight });
    }
    onFinish();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  // Calculate position on screen
  const screenX = element.x * canvasState.zoom + canvasState.panX;
  const screenY = element.y * canvasState.zoom + canvasState.panY;
  const fontSize = (element.fontSize || 16) * canvasState.zoom;

  const getFontFamily = () => {
    switch (element.fontFamily) {
      case 'Virgil':
        return 'Kalam, cursive';
      case 'Helvetica':
        return 'Inter, sans-serif';
      case 'Cascadia':
        return 'JetBrains Mono, monospace';
      default:
        return 'Kalam, cursive';
    }
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: `${screenX}px`,
        top: `${screenY}px`,
        width: element.width ? `${element.width * canvasState.zoom}px` : 'auto',
        minWidth: '1ch',
        zIndex: 1000,
        pointerEvents: 'auto',
      }}
    >
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onMouseDown={handleMouseDown}
        className="border-none outline-none resize-none bg-transparent text-current overflow-auto scrollbar-hide"
        style={{
          width: '100%',
          fontSize: `${fontSize}px`,
          fontFamily: getFontFamily(),
          color: element.strokeColor,
          opacity: element.opacity,
          lineHeight: 1.2,
          minHeight: `${fontSize * 1.2}px`,
          maxHeight: element.height ? `${element.height * canvasState.zoom}px` : undefined,
          height: 'auto',
          background: 'transparent',
          resize: 'none',
        }}
        placeholder="Type text..."
        autoComplete="off"
        spellCheck={false}
      />
      {/* Fade overlay for overflow */}
      {isOverflowing && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: '24px',
            pointerEvents: 'none',
            background: 'linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.8) 100%)',
          }}
        />
      )}
    </div>
  );
}