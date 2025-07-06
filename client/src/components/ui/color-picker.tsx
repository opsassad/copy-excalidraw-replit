import { useState } from "react";
import { Button } from "./button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";

interface ColorPickerProps {
  color: string;
  onChange: (color: string) => void;
  className?: string;
}

// Modern notebook color palette
const MODERN_COLORS = [
  // Neutrals
  '#1a1a1a', // Black
  '#ffffff', // White
  '#f5f6fa', // Gray 1 (light bg)
  '#d1d5db', // Gray 2 (border)
  '#6b7280', // Gray 3 (secondary text)
  // Primary/Accent
  '#2563eb', // Blue
  '#60a5fa', // Light Blue
  '#22c55e', // Green
  '#bbf7d0', // Light Green
  '#fde047', // Yellow
  '#fb923c', // Orange
  '#ef4444', // Red
  '#f472b6', // Pink
  '#a78bfa', // Purple
  '#2dd4bf', // Teal
  '#a16207', // Brown
  // Pastels
  '#dbeafe', // Pastel Blue
  '#d1fae5', // Pastel Green
  '#fef9c3', // Pastel Yellow
  '#fce7f3', // Pastel Pink
  '#ede9fe', // Pastel Purple
  // Highlighter (Google Keep style)
  '#fff475', // Highlighter yellow
];

export function ColorPicker({ color, onChange, className }: ColorPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={`w-8 h-8 p-0 border-2 ${className}`}
          style={{ backgroundColor: color }}
        >
          <span className="sr-only">Pick color</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3">
        <div className="space-y-3">
          {/* Color Input */}
          <div className="flex items-center space-x-2">
            <input
              type="color"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="w-12 h-8 border border-gray-300 rounded cursor-pointer"
            />
            <input
              type="text"
              value={color}
              onChange={(e) => onChange(e.target.value)}
              className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded"
              placeholder="#000000"
            />
          </div>
          
          {/* Preset Colors */}
          <div className="grid grid-cols-5 gap-2">
            {MODERN_COLORS.map((presetColor) => (
              <button
                key={presetColor}
                className="w-8 h-8 border-2 border-gray-300 rounded cursor-pointer hover:scale-110 transition-transform"
                style={{ backgroundColor: presetColor }}
                onClick={() => {
                  onChange(presetColor);
                  setIsOpen(false);
                }}
              />
            ))}
          </div>
          
          {/* Transparent Option */}
          <button
            className="w-full h-8 border-2 border-gray-300 rounded cursor-pointer hover:bg-gray-100 transition-colors bg-white"
            style={{
              backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
              backgroundSize: '8px 8px',
              backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
            }}
            onClick={() => {
              onChange('transparent');
              setIsOpen(false);
            }}
          >
            <span className="text-xs font-medium text-gray-600">Transparent</span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}