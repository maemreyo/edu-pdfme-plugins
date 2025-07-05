import type { 
  CalloutBlockOptions, 
  CalloutLayout, 
  ElementRect, 
  LayoutConstants,
  CalloutType,
  CalloutPreset
} from './calloutTypes';
import { CALLOUT_PRESETS, DEFAULT_LAYOUT } from './calloutTypes';
import { getIcon, type IconName } from './calloutIcons';

/**
 * Generate unique IDs for a callout block
 * 
 * @param customIds Optional custom ID overrides
 * @returns Object containing unique IDs for all callout elements
 */
export function generateCalloutIds(customIds?: {
  groupId?: string;
  backgroundId?: string;
  iconId?: string;
  titleId?: string;
  contentId?: string;
}) {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000);
  
  return {
    groupId: customIds?.groupId || `callout_group_${timestamp}_${random}`,
    backgroundId: customIds?.backgroundId || `callout_bg_${timestamp}_${random}`,
    iconId: customIds?.iconId || `callout_icon_${timestamp}_${random}`,
    titleId: customIds?.titleId || `callout_title_${timestamp}_${random}`,
    contentId: customIds?.contentId || `callout_content_${timestamp}_${random}`,
  };
}

/**
 * Calculate precise layout positions for all callout elements
 * This is the core positioning engine with pixel-perfect calculations
 * 
 * @param options Callout configuration options
 * @returns Complete layout with positions for all elements
 */
export function calculateCalloutLayout(options: CalloutBlockOptions): CalloutLayout {
  const { position, width = 180, height, title, content } = options;
  
  // Merge layout constants
  const constants: LayoutConstants = {
    ...DEFAULT_LAYOUT,
    ...options.layout,
  };
  
  // Calculate content text height based on content length
  const estimatedContentHeight = estimateTextHeight(content, width - (constants.padding * 2), 10);
  
  // Calculate total height if not provided
  const totalHeight = height || calculateAutoHeight(constants, estimatedContentHeight);
  
  // === LAYER 1: Background Rectangle ===
  const background: ElementRect = {
    x: position.x,
    y: position.y,
    width: width,
    height: totalHeight,
  };
  
  // === LAYER 2: Icon ===
  const icon: ElementRect = {
    x: position.x + constants.padding,
    y: position.y + constants.padding,
    width: constants.iconSize,
    height: constants.iconSize,
  };
  
  // === LAYER 3: Title Text ===
  const title: ElementRect = {
    x: icon.x + icon.width + constants.iconTitleGap,
    y: icon.y,
    width: width - constants.padding - icon.width - constants.iconTitleGap - constants.padding,
    height: constants.titleHeight,
  };
  
  // === LAYER 4: Content Text ===
  const contentY = icon.y + Math.max(icon.height, title.height) + constants.titleContentGap;
  const contentElement: ElementRect = {
    x: position.x + constants.padding,
    y: contentY,
    width: width - (constants.padding * 2),
    height: totalHeight - contentY + position.y - constants.padding,
  };
  
  return {
    background,
    icon,
    title,
    content: contentElement,
    constants,
  };
}

/**
 * Calculate auto height based on content and layout constants
 * 
 * @param constants Layout constants
 * @param contentHeight Estimated content text height
 * @returns Calculated total height
 */
function calculateAutoHeight(constants: LayoutConstants, contentHeight: number): number {
  const headerHeight = Math.max(constants.iconSize, constants.titleHeight);
  const totalHeight = 
    constants.padding + // Top padding
    headerHeight + // Icon/title area
    constants.titleContentGap + // Gap between title and content
    contentHeight + // Content text
    constants.padding; // Bottom padding
    
  return Math.max(totalHeight, 30); // Minimum height
}

/**
 * Estimate text height based on content length and width
 * Simple heuristic for layout calculations
 * 
 * @param text Text content
 * @param width Available width
 * @param fontSize Font size in points
 * @returns Estimated height in mm
 */
function estimateTextHeight(text: string, width: number, fontSize: number): number {
  if (!text || text.trim() === '') return 10; // Default minimum
  
  // Rough estimation: ~8-10 characters per mm width, ~4mm per line
  const charsPerLine = Math.floor(width / (fontSize * 0.6));
  const estimatedLines = Math.ceil(text.length / charsPerLine);
  const lineHeight = fontSize * 1.4 * 0.352778; // Convert pt to mm
  
  return Math.max(estimatedLines * lineHeight, 10);
}

/**
 * Get preset configuration for a callout type
 * 
 * @param type Callout type
 * @param customStyle Optional style overrides
 * @returns Complete preset configuration
 */
export function getCalloutPreset(
  type: CalloutType,
  customStyle?: CalloutBlockOptions['style']
): CalloutPreset & { iconSvg: string } {
  const preset = CALLOUT_PRESETS[type];
  
  if (!preset) {
    console.warn(`Unknown callout type: ${type}, using 'note' as fallback`);
    return getCalloutPreset('note', customStyle);
  }
  
  // Apply custom style overrides
  const finalPreset = {
    ...preset,
    backgroundColor: customStyle?.backgroundColor || preset.backgroundColor,
    borderColor: customStyle?.borderColor || preset.borderColor,
    titleColor: customStyle?.titleColor || preset.titleColor,
    contentColor: customStyle?.contentColor || preset.contentColor,
    iconColor: customStyle?.iconColor || preset.iconColor,
  };
  
  // Get the actual SVG icon
  const iconSvg = getIcon(preset.icon as IconName, finalPreset.iconColor);
  
  return {
    ...finalPreset,
    iconSvg,
  };
}

/**
 * Validate callout options and provide helpful error messages
 * 
 * @param options Callout configuration to validate
 * @throws Error if options are invalid
 */
export function validateCalloutOptions(options: CalloutBlockOptions): void {
  if (!options.position) {
    throw new Error('Position is required for callout block');
  }
  
  if (typeof options.position.x !== 'number' || typeof options.position.y !== 'number') {
    throw new Error('Position must have numeric x and y coordinates');
  }
  
  if (!options.title || options.title.trim() === '') {
    throw new Error('Title is required and cannot be empty');
  }
  
  if (!options.content || options.content.trim() === '') {
    throw new Error('Content is required and cannot be empty');
  }
  
  if (options.width && options.width < 50) {
    throw new Error('Callout width must be at least 50 units');
  }
  
  if (options.height && options.height < 20) {
    throw new Error('Callout height must be at least 20 units');
  }
  
  if (options.type && !CALLOUT_PRESETS[options.type]) {
    console.warn(`Unknown callout type: ${options.type}, will use 'note' as fallback`);
  }
}

/**
 * Calculate the total dimensions of the callout block
 * 
 * @param layout Callout layout with all element positions
 * @returns Total width and height of the callout
 */
export function calculateCalloutDimensions(layout: CalloutLayout): { width: number; height: number } {
  return {
    width: layout.background.width,
    height: layout.background.height,
  };
}

/**
 * Convert callout type to user-friendly display name
 * 
 * @param type Callout type
 * @returns Display name in Vietnamese
 */
export function getTypeDisplayName(type: CalloutType): string {
  const displayNames: Record<CalloutType, string> = {
    tip: 'Mẹo hay',
    warning: 'Lưu ý',
    definition: 'Định nghĩa',
    note: 'Ghi chú',
    important: 'Quan trọng',
    example: 'Ví dụ',
  };
  
  return displayNames[type] || type;
}

/**
 * Create CSS styles for callout preview (for UI components)
 * 
 * @param preset Callout preset configuration
 * @param layout Layout information
 * @returns CSS style object
 */
export function createCalloutPreviewStyles(
  preset: CalloutPreset,
  layout: CalloutLayout
): Record<string, string> {
  return {
    backgroundColor: preset.backgroundColor,
    borderColor: preset.borderColor,
    borderWidth: `${layout.constants.borderWidth}px`,
    borderStyle: 'solid',
    borderRadius: `${layout.constants.borderRadius}px`,
    padding: `${layout.constants.padding}mm`,
    width: `${layout.background.width}mm`,
    minHeight: `${layout.background.height}mm`,
  };
}

/**
 * Optimize callout layout for long content
 * Adjusts spacing and sizing for better readability
 * 
 * @param options Original callout options
 * @returns Optimized options
 */
export function optimizeForLongContent(options: CalloutBlockOptions): CalloutBlockOptions {
  const contentLength = options.content.length;
  
  // For long content (>200 chars), adjust layout
  if (contentLength > 200) {
    return {
      ...options,
      width: Math.max(options.width || 180, 200), // Increase width
      layout: {
        ...options.layout,
        padding: Math.max(options.layout?.padding || DEFAULT_LAYOUT.padding, 6),
        titleContentGap: Math.max(options.layout?.titleContentGap || DEFAULT_LAYOUT.titleContentGap, 6),
      },
    };
  }
  
  return options;
}

/**
 * Create callout options from preset type (quick creation helper)
 * 
 * @param type Callout type
 * @param position Position where to place the callout
 * @param content Content text
 * @param customTitle Optional custom title (uses preset default if not provided)
 * @returns Complete callout options ready to use
 */
export function createPresetCallout(
  type: CalloutType,
  position: { x: number; y: number },
  content: string,
  customTitle?: string
): CalloutBlockOptions {
  const preset = CALLOUT_PRESETS[type];
  
  return {
    position,
    type,
    title: customTitle || preset.title,
    content,
    width: 160, // Standard width
  };
}