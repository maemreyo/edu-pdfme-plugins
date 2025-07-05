import type { LinedAnswerBoxSchema, LineCalculation, LineRenderConfig } from './types';

/**
 * Default values for lined answer box
 */
export const DEFAULT_VALUES = {
  lineSpacing: 8, // mm
  lineColor: '#CCCCCC',
  padding: 5, // mm
  showLinesInPdf: false,
  lineStyle: 'solid' as const,
  lineWidth: 0.5, // points
  minLineSpacing: 4, // mm - minimum spacing for readability
  maxLineSpacing: 20, // mm - maximum reasonable spacing
} as const;

/**
 * Calculate line positions and count based on box dimensions and spacing
 * 
 * @param schema LinedAnswerBox schema with dimensions and line settings
 * @returns Line calculation result with positions and metadata
 */
export function calculateLinePositions(schema: LinedAnswerBoxSchema): LineCalculation {
  const { height, lineSpacing, padding } = schema;
  
  // Calculate usable height (total height minus top and bottom padding)
  const usableHeight = Math.max(0, height - (padding * 2));
  
  // If no usable height, return empty result
  if (usableHeight <= 0) {
    return {
      lineCount: 0,
      linePositions: [],
      usableHeight: 0,
    };
  }
  
  // Calculate how many lines can fit with the given spacing
  // First line starts at padding distance from top
  // Each subsequent line is lineSpacing mm apart
  const maxLines = Math.floor((usableHeight + lineSpacing) / lineSpacing);
  
  // Generate Y positions for each line (relative to container top)
  const linePositions: number[] = [];
  for (let i = 0; i < maxLines; i++) {
    const yPosition = padding + (i * lineSpacing);
    // Only add line if it fits within usable height
    if (yPosition <= padding + usableHeight - 2) { // -2 to ensure line is visible
      linePositions.push(yPosition);
    }
  }
  
  return {
    lineCount: linePositions.length,
    linePositions,
    usableHeight,
  };
}

/**
 * Convert mm to pixels for UI rendering
 * Using standard 96 DPI conversion: 1mm = 3.779528 pixels
 * 
 * @param mm Value in millimeters
 * @returns Value in pixels
 */
export function mmToPx(mm: number): number {
  return mm * 3.779528;
}

/**
 * Convert pixels to mm for PDF rendering
 * 
 * @param px Value in pixels
 * @returns Value in millimeters
 */
export function pxToMm(px: number): number {
  return px / 3.779528;
}

/**
 * Create horizontal lines in a container element
 * 
 * @param config Configuration for line rendering
 */
export function renderLines(config: LineRenderConfig): void {
  const { container, width, positions, color, style, width: lineWidth } = config;
  
  // Clear existing lines
  container.innerHTML = '';
  
  // Create each horizontal line
  positions.forEach((yPosition, index) => {
    const line = document.createElement('div');
    line.className = 'guide-line';
    line.style.cssText = `
      position: absolute;
      left: 0;
      top: ${mmToPx(yPosition)}px;
      width: ${mmToPx(width)}px;
      height: ${lineWidth}px;
      background-color: ${color};
      border: none;
      margin: 0;
      padding: 0;
      pointer-events: none;
      z-index: 1;
    `;
    
    // Apply line style
    if (style === 'dashed') {
      line.style.backgroundImage = `linear-gradient(to right, ${color} 50%, transparent 50%)`;
      line.style.backgroundSize = '8px 1px';
      line.style.backgroundColor = 'transparent';
    } else if (style === 'dotted') {
      line.style.backgroundImage = `radial-gradient(circle, ${color} 1px, transparent 1px)`;
      line.style.backgroundSize = '4px 4px';
      line.style.backgroundColor = 'transparent';
    }
    
    container.appendChild(line);
  });
}

/**
 * Calculate optimal font size and line height for text to align with guide lines
 * 
 * @param lineSpacing Spacing between lines in mm
 * @returns Recommended font size and line height
 */
export function calculateTextAlignment(lineSpacing: number): {
  fontSize: number;
  lineHeight: number;
} {
  // Convert line spacing to pixels
  const lineSpacingPx = mmToPx(lineSpacing);
  
  // Optimal font size is typically 60-70% of line spacing
  const fontSize = Math.max(10, Math.floor(lineSpacingPx * 0.65));
  
  // Line height should match the line spacing exactly
  const lineHeight = lineSpacingPx;
  
  return { fontSize, lineHeight };
}

/**
 * Validate schema values and provide defaults for invalid values
 * 
 * @param schema Schema to validate
 * @returns Validated schema with corrected values
 */
export function validateSchema(schema: LinedAnswerBoxSchema): LinedAnswerBoxSchema {
  const validated = { ...schema };
  
  // Validate and correct line spacing
  if (!validated.lineSpacing || validated.lineSpacing < DEFAULT_VALUES.minLineSpacing) {
    validated.lineSpacing = DEFAULT_VALUES.lineSpacing;
  }
  if (validated.lineSpacing > DEFAULT_VALUES.maxLineSpacing) {
    validated.lineSpacing = DEFAULT_VALUES.maxLineSpacing;
  }
  
  // Validate padding
  if (!validated.padding || validated.padding < 0) {
    validated.padding = DEFAULT_VALUES.padding;
  }
  if (validated.padding * 2 >= validated.height) {
    validated.padding = Math.max(0, validated.height / 4);
  }
  
  // Validate line color
  if (!validated.lineColor || !isValidColor(validated.lineColor)) {
    validated.lineColor = DEFAULT_VALUES.lineColor;
  }
  
  // Set defaults for optional properties
  validated.showLinesInPdf = validated.showLinesInPdf ?? DEFAULT_VALUES.showLinesInPdf;
  validated.lineStyle = validated.lineStyle ?? DEFAULT_VALUES.lineStyle;
  validated.lineWidth = validated.lineWidth ?? DEFAULT_VALUES.lineWidth;
  
  return validated;
}

/**
 * Simple color validation (hex, rgb, named colors)
 * 
 * @param color Color string to validate
 * @returns True if color is valid
 */
function isValidColor(color: string): boolean {
  // Check hex colors
  if (/^#([0-9A-F]{3}){1,2}$/i.test(color)) {
    return true;
  }
  
  // Check rgb/rgba colors
  if (/^rgba?\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(,\s*[\d.]+)?\s*\)$/i.test(color)) {
    return true;
  }
  
  // Check basic named colors
  const namedColors = [
    'black', 'white', 'red', 'green', 'blue', 'yellow', 'orange', 'purple',
    'pink', 'brown', 'gray', 'grey', 'transparent'
  ];
  if (namedColors.includes(color.toLowerCase())) {
    return true;
  }
  
  return false;
}

/**
 * Create CSS styles for the lined answer box container
 * 
 * @param schema Schema with styling information
 * @returns CSS style object
 */
export function createContainerStyles(schema: LinedAnswerBoxSchema): Partial<CSSStyleDeclaration> {
  return {
    position: 'relative',
    width: `${mmToPx(schema.width)}px`,
    height: `${mmToPx(schema.height)}px`,
    border: '1px solid #ddd',
    borderRadius: '2px',
    overflow: 'hidden',
    backgroundColor: '#fafafa',
  };
}

/**
 * Create CSS styles for the text overlay
 * 
 * @param schema Schema with text and line information
 * @returns CSS style object for text element
 */
export function createTextStyles(schema: LinedAnswerBoxSchema): Partial<CSSStyleDeclaration> {
  const textAlign = calculateTextAlignment(schema.lineSpacing);
  
  return {
    position: 'absolute',
    top: `${mmToPx(schema.padding)}px`,
    left: `${mmToPx(schema.padding)}px`,
    right: `${mmToPx(schema.padding)}px`,
    bottom: `${mmToPx(schema.padding)}px`,
    fontSize: `${textAlign.fontSize}px`,
    lineHeight: `${textAlign.lineHeight}px`,
    fontFamily: schema.fontName || 'Arial',
    color: schema.fontColor || '#000000',
    backgroundColor: 'transparent',
    border: 'none',
    outline: 'none',
    resize: 'none',
    zIndex: '2',
    padding: '0',
    margin: '0',
  };
}