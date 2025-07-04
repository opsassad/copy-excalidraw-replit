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

  drawElement(element: DrawingElementData) {
    const options = {
      stroke: element.strokeColor,
      fill: element.fillColor === 'transparent' ? undefined : element.fillColor,
      strokeWidth: element.strokeWidth,
      roughness: 1,
      seed: element.seed || 1,
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
          this.rc.rectangle(
            element.x,
            element.y,
            element.width || 0,
            element.height || 0,
            options
          );
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
            this.rc.polygon(points, options);
          }
          break;

        case 'ellipse':
          if (element.width && element.height) {
            this.rc.ellipse(
              element.x + element.width / 2,
              element.y + element.height / 2,
              element.width,
              element.height,
              options
            );
          }
          break;

        case 'line':
          if (element.points && element.points.length >= 2) {
            for (let i = 0; i < element.points.length - 1; i++) {
              this.rc.line(
                element.points[i].x,
                element.points[i].y,
                element.points[i + 1].x,
                element.points[i + 1].y,
                options
              );
            }
          }
          break;

        case 'arrow':
          if (element.points && element.points.length >= 2) {
            const start = element.points[0];
            const end = element.points[element.points.length - 1];
            
            // Draw line
            this.rc.line(start.x, start.y, end.x, end.y, options);
            
            // Draw arrowhead
            const angle = Math.atan2(end.y - start.y, end.x - start.x);
            const arrowLength = 10;
            const arrowAngle = Math.PI / 6; // 30 degrees
            
            const arrowX1 = end.x - arrowLength * Math.cos(angle - arrowAngle);
            const arrowY1 = end.y - arrowLength * Math.sin(angle - arrowAngle);
            const arrowX2 = end.x - arrowLength * Math.cos(angle + arrowAngle);
            const arrowY2 = end.y - arrowLength * Math.sin(angle + arrowAngle);
            
            this.rc.line(end.x, end.y, arrowX1, arrowY1, options);
            this.rc.line(end.x, end.y, arrowX2, arrowY2, options);
          }
          break;

        case 'draw':
          if (element.points && element.points.length > 1) {
            // For freehand drawing, use a path
            this.ctx.beginPath();
            this.ctx.strokeStyle = element.strokeColor;
            this.ctx.lineWidth = element.strokeWidth;
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
            
            this.ctx.moveTo(element.points[0].x, element.points[0].y);
            for (let i = 1; i < element.points.length; i++) {
              this.ctx.lineTo(element.points[i].x, element.points[i].y);
            }
            this.ctx.stroke();
          }
          break;

        case 'text':
          if (element.text) {
            this.ctx.font = `${element.fontSize || 16}px ${this.getFontFamily(element.fontFamily)}`;
            this.ctx.fillStyle = element.strokeColor;
            this.ctx.textBaseline = 'top';
            
            const lines = element.text.split('\n');
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

  drawElements(elements: DrawingElementData[]) {
    this.clear();
    elements.forEach(element => this.drawElement(element));
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
    this.ctx.strokeStyle = '#007BFF';
    this.ctx.lineWidth = 2;
    this.ctx.setLineDash([5, 5]);
    this.ctx.strokeRect(
      bounds.x - 2,
      bounds.y - 2,
      bounds.width + 4,
      bounds.height + 4
    );
    this.ctx.setLineDash([]);

    // Draw selection handles
    const handleSize = 6;
    this.ctx.fillStyle = '#007BFF';
    
    // Corner handles
    const handles = [
      { x: bounds.x - handleSize / 2, y: bounds.y - handleSize / 2 },
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y - handleSize / 2 },
      { x: bounds.x + bounds.width - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
      { x: bounds.x - handleSize / 2, y: bounds.y + bounds.height - handleSize / 2 },
    ];
    
    handles.forEach(handle => {
      this.ctx.fillRect(handle.x, handle.y, handleSize, handleSize);
    });
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
      case 'text':
        const textWidth = (element.text?.length || 0) * (element.fontSize || 16) * 0.6;
        const textHeight = element.fontSize || 16;
        return {
          x: element.x,
          y: element.y,
          width: textWidth,
          height: textHeight,
        };
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
