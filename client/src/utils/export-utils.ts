import { DrawingElementData } from "@/types/drawing";

export async function exportToPNG(
  canvas: HTMLCanvasElement,
  filename: string = 'drawing.png'
): Promise<void> {
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch (error) {
    console.error('Failed to export PNG:', error);
    throw new Error('Failed to export as PNG');
  }
}

export async function exportToSVG(
  elements: DrawingElementData[],
  filename: string = 'drawing.svg'
): Promise<void> {
  try {
    // Calculate bounds
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    elements.forEach(element => {
      if (element.type === 'rectangle' || element.type === 'diamond' || element.type === 'ellipse') {
        minX = Math.min(minX, element.x);
        minY = Math.min(minY, element.y);
        maxX = Math.max(maxX, element.x + (element.width || 0));
        maxY = Math.max(maxY, element.y + (element.height || 0));
      } else if (element.points) {
        element.points.forEach(point => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
      }
    });

    const width = maxX - minX + 40; // Add padding
    const height = maxY - minY + 40;

    let svgContent = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
    
    elements.forEach(element => {
      const offsetX = -minX + 20;
      const offsetY = -minY + 20;
      
      switch (element.type) {
        case 'rectangle':
          svgContent += `<rect x="${element.x + offsetX}" y="${element.y + offsetY}" 
            width="${element.width}" height="${element.height}" 
            fill="${element.fillColor === 'transparent' ? 'none' : element.fillColor}" 
            stroke="${element.strokeColor}" 
            stroke-width="${element.strokeWidth}" 
            opacity="${element.opacity}" />`;
          break;
        case 'ellipse':
          const rx = (element.width || 0) / 2;
          const ry = (element.height || 0) / 2;
          const cx = element.x + rx + offsetX;
          const cy = element.y + ry + offsetY;
          svgContent += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" 
            fill="${element.fillColor === 'transparent' ? 'none' : element.fillColor}" 
            stroke="${element.strokeColor}" 
            stroke-width="${element.strokeWidth}" 
            opacity="${element.opacity}" />`;
          break;
        case 'line':
        case 'arrow':
        case 'draw':
          if (element.points && element.points.length > 1) {
            const pathData = element.points
              .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x + offsetX} ${point.y + offsetY}`)
              .join(' ');
            svgContent += `<path d="${pathData}" 
              fill="none" 
              stroke="${element.strokeColor}" 
              stroke-width="${element.strokeWidth}" 
              opacity="${element.opacity}" />`;
          }
          break;
        case 'text':
          svgContent += `<text x="${element.x + offsetX}" y="${element.y + offsetY}" 
            font-family="${element.fontFamily || 'Virgil'}" 
            font-size="${element.fontSize || 16}" 
            fill="${element.strokeColor}" 
            opacity="${element.opacity}">${element.text || ''}</text>`;
          break;
      }
    });
    
    svgContent += '</svg>';

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export SVG:', error);
    throw new Error('Failed to export as SVG');
  }
}

export async function exportToJSON(
  elements: DrawingElementData[],
  filename: string = 'drawing.json'
): Promise<void> {
  try {
    const data = {
      type: 'excalidraw',
      version: 2,
      source: 'excalidraw-clone',
      elements: elements,
      appState: {
        viewBackgroundColor: '#ffffff',
        currentItemStrokeColor: '#000000',
        currentItemBackgroundColor: 'transparent',
        currentItemFillStyle: 'hachure',
        currentItemStrokeWidth: 1,
        currentItemRoughness: 1,
        currentItemOpacity: 100,
      },
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.download = filename;
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export JSON:', error);
    throw new Error('Failed to export as JSON');
  }
}
