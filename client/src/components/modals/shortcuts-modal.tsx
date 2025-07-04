import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  const shortcutGroups = [
    {
      title: "Tools",
      shortcuts: [
        { name: "Selection", key: "V" },
        { name: "Hand", key: "H" },
        { name: "Rectangle", key: "R" },
        { name: "Diamond", key: "D" },
        { name: "Ellipse", key: "O" },
        { name: "Arrow", key: "A" },
        { name: "Line", key: "L" },
        { name: "Draw", key: "P" },
        { name: "Text", key: "T" },
        { name: "Eraser", key: "E" },
      ],
    },
    {
      title: "Editing",
      shortcuts: [
        { name: "Undo", key: "Ctrl+Z" },
        { name: "Redo", key: "Ctrl+Y" },
        { name: "Copy", key: "Ctrl+C" },
        { name: "Paste", key: "Ctrl+V" },
        { name: "Duplicate", key: "Ctrl+D" },
        { name: "Select All", key: "Ctrl+A" },
        { name: "Group", key: "Ctrl+G" },
        { name: "Ungroup", key: "Ctrl+Shift+G" },
      ],
    },
    {
      title: "View",
      shortcuts: [
        { name: "Zoom In", key: "Ctrl++" },
        { name: "Zoom Out", key: "Ctrl+-" },
        { name: "Reset Zoom", key: "Ctrl+0" },
        { name: "Fit All", key: "Shift+1" },
        { name: "Toggle Grid", key: "Ctrl+'" },
        { name: "Toggle Snap", key: "Alt+S" },
      ],
    },
    {
      title: "Styling",
      shortcuts: [
        { name: "Stroke Color", key: "S" },
        { name: "Fill Color", key: "G" },
        { name: "Transform Shape", key: "Tab" },
        { name: "Flip Horizontal", key: "Shift+H" },
        { name: "Flip Vertical", key: "Shift+V" },
      ],
    },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl">Keyboard Shortcuts</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              className="w-8 h-8 p-0"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
          {shortcutGroups.map((group) => (
            <div key={group.title}>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                {group.title}
              </h3>
              <div className="space-y-2">
                {group.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.name}
                    className="flex items-center justify-between"
                  >
                    <span className="text-sm">{shortcut.name}</span>
                    <Badge variant="outline" className="text-xs font-mono">
                      {shortcut.key}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
