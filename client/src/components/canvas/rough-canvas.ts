import rough from 'roughjs';
import { DrawingElementData, Point } from "@/types/drawing";

export class RoughCanvas {
  private rc: any;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.rc = rough.canvas(canvas);
  }

  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawElement(element: DrawingElementData, editingTextElementId?: string) {
    const options = {
      stroke: element.strokeColor,
      fill: element.fillColor === 'transparent' ? undefined : element.fillColor,
      strokeWidth: element.strokeWidth,
      roughness: element.roughness !== undefined ? element.roughness : 1,
      seed: element.seed || 1,
      ...(element.sketchyFill ? { fillStyle: 'hachure' } : {}),
    };

    // Apply opacity
    this.ctx.globalAlpha = element.opacity;

    // Apply stroke style
    if (element.strokeStyle === 'dashed') {
      this.ctx.setLineDash([5, 5]);
    } else if (element.strokeStyle === 'dotted') {
      this.ctx.setLineDash([2, 3]);
    } else {
      this.ctx.setLineDash([]);
    }

    try {
      switch (element.type) {
        case 'rectangle':
          if (element.sketchy) {
            // Sketchy outline, fill depends on sketchyFill
            if (element.sketchyFill) {
              this.rc.rectangle(
                element.x,
                element.y,
                element.width || 0,
                element.height || 0,
                options
              );
            } else {
              // Solid fill, sketchy outline
              if (element.fillColor && element.fillColor !== 'transparent') {
                this.ctx.save();
                this.ctx.globalAlpha = element.opacity;
                this.ctx.fillStyle = element.fillColor;
                this.ctx.fillRect(element.x, element.y, element.width || 0, element.height || 0);
                this.ctx.restore();
              }
              // Draw sketchy outline only
              this.rc.rectangle(
                element.x,
                element.y,
                element.width || 0,
                element.height || 0,
                { ...options, fill: undefined }
              );
            }
          } else {
            this.ctx.save();
            this.ctx.globalAlpha = element.opacity;
            this.ctx.strokeStyle = element.strokeColor;
            this.ctx.lineWidth = element.strokeWidth;
            this.ctx.setLineDash([]);
            this.ctx.fillStyle = element.fillColor === 'transparent' ? 'rgba(0,0,0,0)' : element.fillColor;
            if (element.fillColor && element.fillColor !== 'transparent') {
              this.ctx.fillRect(element.x, element.y, element.width || 0, element.height || 0);
            }
            this.ctx.strokeRect(element.x, element.y, element.width || 0, element.height || 0);
            this.ctx.restore();
          }
          break;

        case 'diamond':
          if (element.width && element.height) {
            const centerX = element.x + element.width / 2;
            const centerY = element.y + element.height / 2;
            const points: [number, number][] = [
              [centerX, element.y], // top
              [element.x + element.width, centerY], // right
              [centerX, element.y + element.height], // bottom
              [element.x, centerY], // left
            ];
            if (element.sketchy) {
              if (element.sketchyFill) {
                this.rc.polygon(points, options);
              } else {
                // Solid fill, sketchy outline
                if (element.fillColor && element.fillColor !== 'transparent') {
                  this.ctx.save();
                  this.ctx.globalAlpha = element.opacity;
                  this.ctx.beginPath();
                  this.ctx.moveTo(points[0][0], points[0][1]);
                  for (let i = 1; i < points.length; i++) {
                    this.ctx.lineTo(points[i][0], points[i][1]);
                  }
                  this.ctx.closePath();
                  this.ctx.fillStyle = element.fillColor;
                  this.ctx.fill();
                  this.ctx.restore();
                }
                // Draw sketchy outline only
                this.rc.polygon(points, { ...options, fill: undefined });
              }
            } else {
              this.ctx.save();
              this.ctx.globalAlpha = element.opacity;
              this.ctx.strokeStyle = element.strokeColor;
              this.ctx.lineWidth = element.strokeWidth;
              this.ctx.setLineDash([]);
              this.ctx.beginPath();
              this.ctx.moveTo(points[0][0], points[0][1]);
              for (let i = 1; i < points.length; i++) {
                this.ctx.lineTo(points[i][0], points[i][1]);
              }
              this.ctx.closePath();
              if (element.fillColor && element.fillColor !== 'transparent') {
                this.ctx.fillStyle = element.fillColor;
                this.ctx.fill();
              }
              this.ctx.stroke();
              this.ctx.restore();
            }
          }
          break;

        case 'ellipse':
          if (element.width && element.height) {
            if (element.sketchy) {
              if (element.sketchyFill) {
                this.rc.ellipse(
                  element.x + element.width / 2,
                  element.y + element.height / 2,
                  element.width,
                  element.height,
                  options
                );
              } else {
                // Solid fill, sketchy outline
                this.ctx.save();
                this.ctx.globalAlpha = element.opacity;
                this.ctx.beginPath();
                this.ctx.ellipse(
                  element.x + (element.width / 2),
                  element.y + (element.height / 2),
                  (element.width / 2),
                  (element.height / 2),
                  0, 0, 2 * Math.PI
                );
                if (element.fillColor && element.fillColor !== 'transparent') {
                  this.ctx.fillStyle = element.fillColor;
                  this.ctx.fill();
                }
                this.ctx.restore();
                // Draw sketchy outline only
                this.rc.ellipse(
                  element.x + element.width / 2,
                  element.y + element.height / 2,
                  element.width,
                  element.height,
                  { ...options, fill: undefined }
                );
              }
            } else {
              this.ctx.save();
              this.ctx.globalAlpha = element.opacity;
              this.ctx.strokeStyle = element.strokeColor;
              this.ctx.lineWidth = element.strokeWidth;
              this.ctx.setLineDash([]);
              this.ctx.beginPath();
              this.ctx.ellipse(
                element.x + (element.width / 2),
                element.y + (element.height / 2),
                (element.width / 2),
                (element.height / 2),
                0, 0, 2 * Math.PI
              );
              if (element.fillColor && element.fillColor !== 'transparent') {
                this.ctx.fillStyle = element.fillColor;
                this.ctx.fill();
              }
              this.ctx.stroke();
              this.ctx.restore();
            }
          }
          break;

        case 'line':
          if (element.points && element.points.length >= 2) {
            if (element.sketchy) {
              // Excalidraw-style: draw multiple jittered lines for thickness
              const numLines = Math.max(2, Math.floor(element.strokeWidth));
              const baseWidth = 1.5; // px per line
              for (let n = 0; n < numLines; n++) {
                const offset = (n - (numLines - 1) / 2) * baseWidth;
                for (let i = 0; i < element.points.length - 1; i++) {
                  // Add a small random jitter for each line
                  const jitter = (Math.random() - 0.5) * 0.7 * (element.roughness !== undefined ? element.roughness : 1);
                  this.rc.line(
                    element.points[i].x,
                    element.points[i].y + offset + jitter,
                    element.points[i + 1].x,
                    element.points[i + 1].y + offset + jitter,
                    { ...options, strokeWidth: baseWidth }
                  );
                }
              }
            } else {
              this.ctx.save();
              this.ctx.globalAlpha = element.opacity;
              this.ctx.strokeStyle = element.strokeColor;
              this.ctx.lineWidth = element.strokeWidth;
              this.ctx.setLineDash([]);
              this.ctx.beginPath();
              this.ctx.moveTo(element.points[0].x, element.points[0].y);
              for (let i = 1; i < element.points.length; i++) {
                this.ctx.lineTo(element.points[i].x, element.points[i].y);
              }
              this.ctx.stroke();
              this.ctx.restore();
            }
          }
          break;

        case 'arrow':
          if (element.points && element.points.length >= 2) {
            const start = element.points[0];
            const end = element.points[element.points.length - 1];
            if (element.sketchy) {
              // Excalidraw-style: draw multiple jittered lines for thickness
              const numLines = Math.max(2, Math.floor(element.strokeWidth));
              const baseWidth = 1.5; // px per line
              for (let n = 0; n < numLines; n++) {
                const offset = (n - (numLines - 1) / 2) * baseWidth;
                // Add a small random jitter for each line
                const jitter = (Math.random() - 0.5) * 0.7 * (element.roughness !== undefined ? element.roughness : 1);
                this.rc.line(
                  start.x,
                  start.y + offset + jitter,
                  end.x,
                  end.y + offset + jitter,
                  { ...options, strokeWidth: baseWidth }
                );
                // Draw arrowhead for each line
                const angle = Math.atan2(end.y - start.y, end.x - start.x);
                const arrowLength = 10;
                const arrowAngle = Math.PI / 6; // 30 degrees
                const arrowX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
                const arrowY1 = end.y - arrowLength * Math.sin(angle - arrowAngle) + offset + jitter;
                const arrowX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
                const arrowY2 = end.y - arrowLength * Math.sin(angle + arrowAngle) + offset + jitter;
                this.rc.line(end.x, end.y + offset + jitter, arrowX1, arrowY1, { ...options, strokeWidth: baseWidth });
                this.rc.line(end.x, end.y + offset + jitter, arrowX2, arrowY2, { ...options, strokeWidth: baseWidth });
              }
            } else {
              this.ctx.save();
              this.ctx.globalAlpha = element.opacity;
              this.ctx.strokeStyle = element.strokeColor;
              this.ctx.lineWidth = element.strokeWidth;
              this.ctx.setLineDash([]);
              this.ctx.beginPath();
              this.ctx.moveTo(start.x, start.y);
              this.ctx.lineTo(end.x, end.y);
              this.ctx.stroke();
              // Draw arrowhead
              const angle = Math.atan2(end.y - start.y, end.x - start.x);
              const arrowLength = 10;
              const arrowAngle = Math.PI / 6; // 30 degrees
              const arrowX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
              const arrowY1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
              const arrowX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
              const arrowY2 = end.y - arrowLength * Math.sin(angle + arrowAngle);
              this.ctx.beginPath();
              this.ctx.moveTo(end.x, end.y);
              this.ctx.lineTo(arrowX1, arrowY1);
              this.ctx.moveTo(end.x, end.y);
              this.ctx.lineTo(arrowX2, arrowY2);
              this.ctx.stroke();
              this.ctx.restore();
            }
          }
          break;

        case 'draw':
          if (element.points && element.points.length > 1) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = element.strokeColor;
            this.ctx.lineWidth = element.strokeWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';

            if (element.points.length < 3) {
              this.ctx.moveTo(element.points[0].x, element.points[0].y);
              for (let i = 1; i < element.points.length; i++) {
                this.ctx.lineTo(element.points[i].x, element.points[i].y);
              }
            } else {
              this.ctx.moveTo(element.points[0].x, element.points[0].y);
              for (var i = 1; i < element.points.length - 2; i++) {
                var c = (element.points[i].x + element.points[i + 1].x) / 2;
                var d = (element.points[i].y + element.points[i + 1].y) / 2;
                this.ctx.quadraticCurveTo(element.points[i].x, element.points[i].y, c, d);
              }
              // For the last 2 points
              this.ctx.quadraticCurveTo(
                element.points[i].x,
                element.points[i].y,
                element.points[i + 1].x,
                element.points[i + 1].y
              );
            }
            this.ctx.stroke();
          }
          break;

        case 'text':
          if (editingTextElementId && element.id === editingTextElementId) {
            // Don't render text on canvas while editing
            break;
          }
          this.ctx.font = `${element.fontSize || 16}px ${this.getFontFamily(element.fontFamily)}`;
          this.ctx.fillStyle = element.strokeColor;
          this.ctx.textBaseline = 'top';
          const textContent = element.text || '';
          if (textContent || !element.text) {
            // Show placeholder if empty
            const displayText = textContent || (element.text === '' ? 'Type text...' : textContent);
            this.ctx.globalAlpha = textContent ? element.opacity : element.opacity * 0.5;
            const lines = displayText.split('\n');
            const lineHeight = (element.fontSize || 16) * 1.2;
            lines.forEach((line, index) => {
              this.ctx.fillText(line, element.x, element.y + index * lineHeight);
            });
          }
          break;
      }
    } catch (error) {
      console.error('Error drawing element:', error);
    }

    // Reset context state
    this.ctx.globalAlpha = 1;
    this.ctx.setLineDash([]);
  }

  drawElements(elements: DrawingElementData[], editingTextElementId?: string) {
    this.clear();
    elements.forEach(element => this.drawElement(element, editingTextElementId));
  }

  drawSelectionBox(startPoint: Point, endPoint: Point) {
    this.ctx.strokeStyle = '#007BFF';
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      Math.min(startPoint.x, endPoint.x),
      Math.min(startPoint.y, endPoint.y),
      Math.abs(endPoint.x - startPoint.x),
      Math.abs(endPoint.y - startPoint.y)
    );
    this.ctx.setLineDash([]);
  }

  drawElementSelection(element: DrawingElementData) {
    const bounds = this.getElementBounds(element);

    // Draw selection outline
    this.ctx.strokeStyle = "#007BFF";
    this.ctx.lineWidth = 1;
    this.ctx.setLineDash([4, 4]);
    this.ctx.strokeRect(
      bounds.x - 2,
      bounds.y - 2,
      bounds.width + 4,
      bounds.height + 4
    );
    this.ctx.setLineDash([]);
  }

  private getFontFamily(fontFamily?: string): string {
    switch (fontFamily) {
      case 'Virgil':
        return 'Kalam, cursive';
      case 'Helvetica':
        return 'Inter, sans-serif';
      case 'Cascadia':
        return 'JetBrains Mono, monospace';
      default:
        return 'Kalam, cursive';
    }
  }

  private getElementBounds(element: DrawingElementData) {
    switch (element.type) {
      case 'rectangle':
      case 'diamond':
      case 'ellipse':
        return {
          x: element.x,
          y: element.y,
          width: element.width || 0,
          height: element.height || 0,
        };
      case 'text': {
        // Use the same logic as drawing-canvas.tsx for accurate bounds
        const fontSize = element.fontSize || 16;
        const fontFamily = element.fontFamily || 'Virgil';
        // Create a temporary canvas for measurement
        const tempCanvas = document.createElement('canvas');
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return { x: element.x, y: element.y, width: element.width || 0, height: element.height || fontSize * 1.2 };
        ctx.save();
        ctx.font = `${fontSize}px ${fontFamily === 'Virgil' ? 'Kalam, cursive' : fontFamily === 'Helvetica' ? 'Inter, sans-serif' : 'JetBrains Mono, monospace'}`;
        const lines = (element.text || '').split('\n');
        let maxWidth = 0;
        let totalHeight = 0;
        const wrapWidth = element.width || 0;
        const lineHeight = fontSize * 1.2;
        if (wrapWidth > 0) {
          // Word wrap
          let wrappedLines: string[] = [];
          for (const line of lines) {
            let currentLine = '';
            for (const word of line.split(' ')) {
              const testLine = currentLine ? currentLine + ' ' + word : word;
              const testWidth = ctx.measureText(testLine).width;
              if (testWidth > wrapWidth && currentLine) {
                wrappedLines.push(currentLine);
                currentLine = word;
              } else {
                currentLine = testLine;
              }
            }
            wrappedLines.push(currentLine);
          }
          maxWidth = wrapWidth;
          totalHeight = wrappedLines.length * lineHeight;
        } else {
          for (const line of lines) {
            const w = ctx.measureText(line).width;
            if (w > maxWidth) maxWidth = w;
          }
          totalHeight = lines.length * lineHeight;
        }
        ctx.restore();
        return {
          x: element.x,
          y: element.y,
          width: maxWidth,
          height: totalHeight,
        };
      }
      default:
        if (element.points && element.points.length > 0) {
          const xs = element.points.map(p => p.x);
          const ys = element.points.map(p => p.y);
          const minX = Math.min(...xs);
          const minY = Math.min(...ys);
          const maxX = Math.max(...xs);
          const maxY = Math.max(...ys);
          return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY,
          };
        }
        return { x: element.x, y: element.y, width: 0, height: 0 };
    }
  }
}
