import type { 
  CalloutBlockOptions, 
  CalloutBlockResult,
  CalloutType
} from './calloutTypes';
import { 
  generateCalloutIds, 
  calculateCalloutLayout, 
  getCalloutPreset,
  validateCalloutOptions,
  calculateCalloutDimensions,
  optimizeForLongContent,
  createPresetCallout
} from './calloutHelpers';

/**
 * Create a Callout Block using composition of existing pdfme plugins
 * 
 * This function demonstrates advanced programmatic layout by precisely positioning
 * multiple elements (rectangle, SVG, and text schemas) to create a cohesive
 * informational block.
 * 
 * Architecture:
 * - Layer 1: Background rectangle (visual foundation)
 * - Layer 2: Icon SVG (visual identifier)
 * - Layer 3: Title text (highlighted heading)
 * - Layer 4: Content text (main information)
 * 
 * @param options Configuration for the callout block
 * @returns Object containing schemas array and metadata
 * 
 * @example
 * ```typescript
 * const tipCallout = createCalloutBlock({
 *   position: { x: 20, y: 50 },
 *   type: 'tip',
 *   title: 'Study Technique',
 *   content: 'Use spaced repetition to improve long-term memory retention.',
 *   width: 160
 * });
 * 
 * // Add to pdfme template
 * const newSchemas = [...template.schemas, ...tipCallout.schemas];
 * designer.updateTemplate({ ...template, schemas: newSchemas });
 * ```
 */
export function createCalloutBlock(options: CalloutBlockOptions): CalloutBlockResult {
  // Validate input options
  validateCalloutOptions(options);
  
  // Optimize layout for long content
  const optimizedOptions = optimizeForLongContent(options);
  
  // Generate unique IDs for all elements
  const ids = generateCalloutIds(optimizedOptions.customIds);
  
  // Calculate precise layout positions
  const layout = calculateCalloutLayout(optimizedOptions);
  
  // Get preset styling or use custom
  const preset = optimizedOptions.type 
    ? getCalloutPreset(optimizedOptions.type, optimizedOptions.style)
    : {
        backgroundColor: optimizedOptions.style?.backgroundColor || '#F8FAFC',
        borderColor: optimizedOptions.style?.borderColor || '#64748B',
        titleColor: optimizedOptions.style?.titleColor || '#334155',
        contentColor: optimizedOptions.style?.contentColor || '#1E293B',
        iconColor: optimizedOptions.style?.iconColor || '#64748B',
        iconSvg: optimizedOptions.customIcon || '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/></svg>',
        title: 'Info',
      };
  
  // Build schema array with precise positioning
  const schemas: any[] = [];
  
  // === SCHEMA 1: Background Rectangle ===
  schemas.push({
    id: ids.backgroundId,
    type: "rectangle",
    position: { 
      x: layout.background.x, 
      y: layout.background.y 
    },
    width: layout.background.width,
    height: layout.background.height,
    color: preset.backgroundColor,
    borderColor: preset.borderColor,
    borderWidth: layout.constants.borderWidth,
    radius: layout.constants.borderRadius,
    groupId: ids.groupId,
  });
  
  // === SCHEMA 2: Icon SVG ===
  schemas.push({
    id: ids.iconId,
    type: "svg",
    position: { 
      x: layout.icon.x, 
      y: layout.icon.y 
    },
    width: layout.icon.width,
    height: layout.icon.height,
    content: preset.iconSvg,
    groupId: ids.groupId,
  });
  
  // === SCHEMA 3: Title Text ===
  schemas.push({
    id: ids.titleId,
    type: "text",
    position: { 
      x: layout.title.x, 
      y: layout.title.y 
    },
    width: layout.title.width,
    height: layout.title.height,
    content: optimizedOptions.title,
    fontSize: 11,
    fontName: "Helvetica-Bold",
    fontColor: preset.titleColor,
    verticalAlignment: "middle",
    groupId: ids.groupId,
  });
  
  // === SCHEMA 4: Content Text ===
  schemas.push({
    id: ids.contentId,
    type: "text",
    position: { 
      x: layout.content.x, 
      y: layout.content.y 
    },
    width: layout.content.width,
    height: layout.content.height,
    content: optimizedOptions.content,
    fontSize: 10,
    fontName: "Helvetica",
    fontColor: preset.contentColor,
    verticalAlignment: "top",
    groupId: ids.groupId,
  });
  
  // Calculate final dimensions
  const dimensions = calculateCalloutDimensions(layout);
  
  return {
    schemas,
    groupId: ids.groupId,
    dimensions,
    layout,
  };
}

/**
 * Create preset callout blocks for common educational scenarios
 * 
 * @param type Preset callout type
 * @param position Where to place the callout
 * @param content Main content text
 * @param customTitle Optional custom title
 * @returns Complete callout block ready to use
 */
export function createPresetCalloutBlock(
  type: CalloutType,
  position: { x: number; y: number },
  content: string,
  customTitle?: string
): CalloutBlockResult {
  const options = createPresetCallout(type, position, content, customTitle);
  return createCalloutBlock(options);
}

/**
 * Create educational callout blocks with subject-specific presets
 * 
 * @param subject Educational subject
 * @param position Position for the callout
 * @returns Subject-specific callout block
 */
export function createSubjectCallout(
  subject: 'math' | 'science' | 'history' | 'language',
  position: { x: number; y: number }
): CalloutBlockResult {
  const subjectCallouts = {
    math: {
      type: 'tip' as CalloutType,
      title: 'Mẹo Toán học',
      content: 'Hãy luôn kiểm tra lại phép tính và đơn vị đo lường trong bài toán.'
    },
    science: {
      type: 'definition' as CalloutType,
      title: 'Khái niệm Khoa học',
      content: 'Phương pháp khoa học bao gồm: quan sát, giả thuyết, thí nghiệm, và kết luận.'
    },
    history: {
      type: 'important' as CalloutType,
      title: 'Sự kiện Lịch sử',
      content: 'Hãy ghi nhớ mốc thời gian và nguyên nhân-hệ quả của các sự kiện lịch sử.'
    },
    language: {
      type: 'example' as CalloutType,
      title: 'Ví dụ Ngôn ngữ',
      content: 'Sử dụng từ vựng phong phú và cấu trúc câu đa dạng để làm bài viết sinh động hơn.'
    }
  };
  
  const preset = subjectCallouts[subject];
  return createCalloutBlock({
    position,
    type: preset.type,
    title: preset.title,
    content: preset.content,
    width: 170,
  });
}

/**
 * Create a series of callout blocks for a complete lesson section
 * 
 * @param startPosition Starting position for the first callout
 * @param lesson Lesson configuration
 * @returns Array of callout blocks with proper spacing
 */
export function createLessonCallouts(
  startPosition: { x: number; y: number },
  lesson: {
    objective?: string;
    keyPoints: string[];
    examples?: string[];
    warnings?: string[];
  }
): CalloutBlockResult[] {
  const callouts: CalloutBlockResult[] = [];
  let currentY = startPosition.y;
  const spacing = 15; // Space between callouts
  const width = 160;
  
  // Lesson objective
  if (lesson.objective) {
    const objectiveCallout = createCalloutBlock({
      position: { x: startPosition.x, y: currentY },
      type: 'important',
      title: 'Mục tiêu bài học',
      content: lesson.objective,
      width,
    });
    callouts.push(objectiveCallout);
    currentY += objectiveCallout.dimensions.height + spacing;
  }
  
  // Key points
  lesson.keyPoints.forEach((point, index) => {
    const keyPointCallout = createCalloutBlock({
      position: { x: startPosition.x, y: currentY },
      type: 'note',
      title: `Điểm quan trọng ${index + 1}`,
      content: point,
      width,
    });
    callouts.push(keyPointCallout);
    currentY += keyPointCallout.dimensions.height + spacing;
  });
  
  // Examples
  if (lesson.examples) {
    lesson.examples.forEach((example, index) => {
      const exampleCallout = createCalloutBlock({
        position: { x: startPosition.x, y: currentY },
        type: 'example',
        title: `Ví dụ ${index + 1}`,
        content: example,
        width,
      });
      callouts.push(exampleCallout);
      currentY += exampleCallout.dimensions.height + spacing;
    });
  }
  
  // Warnings
  if (lesson.warnings) {
    lesson.warnings.forEach((warning, index) => {
      const warningCallout = createCalloutBlock({
        position: { x: startPosition.x, y: currentY },
        type: 'warning',
        title: `Lưu ý quan trọng`,
        content: warning,
        width,
      });
      callouts.push(warningCallout);
      currentY += warningCallout.dimensions.height + spacing;
    });
  }
  
  return callouts;
}

/**
 * Find all callout blocks in a template by groupId pattern
 * 
 * @param schemas Array of existing schemas
 * @returns Array of group IDs that appear to be callout blocks
 */
export function findCalloutBlocks(schemas: any[]): string[] {
  const groupIds = new Set<string>();
  
  schemas.forEach(schema => {
    if (schema.groupId && schema.groupId.includes('callout_group_')) {
      groupIds.add(schema.groupId);
    }
  });
  
  return Array.from(groupIds);
}

/**
 * Remove a callout block from template by groupId
 * 
 * @param schemas Current template schemas
 * @param groupId Group ID of the callout to remove
 * @returns New schemas array without the specified callout
 */
export function removeCalloutBlock(schemas: any[], groupId: string): any[] {
  return schemas.filter(schema => schema.groupId !== groupId);
}

/**
 * Update callout content while preserving layout and styling
 * 
 * @param schemas Current template schemas
 * @param groupId Group ID of the callout to update
 * @param newContent New content for the callout
 * @returns Updated schemas array
 */
export function updateCalloutContent(
  schemas: any[], 
  groupId: string, 
  newContent: { title?: string; content?: string }
): any[] {
  return schemas.map(schema => {
    if (schema.groupId === groupId) {
      if (schema.id.includes('_title_') && newContent.title) {
        return { ...schema, content: newContent.title };
      }
      if (schema.id.includes('_content_') && newContent.content) {
        return { ...schema, content: newContent.content };
      }
    }
    return schema;
  });
}