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

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, []);

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
    <textarea
      ref={textareaRef}
      value={text}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      onMouseDown={handleMouseDown}
      className="absolute border-none outline-none resize-none bg-transparent text-current overflow-hidden"
      style={{
        left: `${screenX}px`,
        top: `${screenY}px`,
        fontSize: `${fontSize}px`,
        fontFamily: getFontFamily(),
        color: element.strokeColor,
        opacity: element.opacity,
        lineHeight: 1.2,
        minWidth: '1ch',
        minHeight: `${fontSize * 1.2}px`,
        zIndex: 1000,
      }}
      placeholder="Type text..."
      autoComplete="off"
      spellCheck={false}
    />
  );
}