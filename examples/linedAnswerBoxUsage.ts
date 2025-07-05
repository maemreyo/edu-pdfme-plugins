/**
 * USAGE EXAMPLES: Lined Answer Box Plugin
 * 
 * This file demonstrates how to use the LinedAnswerBox plugin
 * in various educational scenarios and UI integrations.
 */

import type { LinedAnswerBoxSchema } from '../plugins/custom/linedAnswerBox';

// ============================================================================
// EXAMPLE 1: Basic Usage - Essay Question
// ============================================================================

/**
 * Create a basic essay answer box for a literature question
 */
function createEssayAnswerBox(): LinedAnswerBoxSchema {
  return {
    id: 'essay_q1',
    type: 'linedAnswerBox',
    position: { x: 20, y: 50 },
    width: 160,  // Wide box for essay writing
    height: 80,  // Tall box for multiple paragraphs
    
    // Line settings
    lineSpacing: 8,     // 8mm between lines (standard notebook spacing)
    lineColor: '#CCCCCC', // Light gray lines
    padding: 6,         // Comfortable padding
    lineStyle: 'solid',
    lineWidth: 0.5,
    
    // Text settings
    fontSize: 10,
    fontName: 'Helvetica',
    fontColor: '#000000',
    
    // PDF output
    showLinesInPdf: false, // Clean PDF output without guide lines
    
    // Content (will be filled by students)
    content: '',
    
    // Standard properties
    readOnly: false,
    required: true,
  };
}

// ============================================================================
// EXAMPLE 2: Short Answer Questions with Different Line Spacings
// ============================================================================

/**
 * Create multiple short answer boxes with different line spacings
 * for different grade levels
 */
function createGradeLevelAnswerBoxes() {
  const basePosition = { x: 20, y: 30 };
  const questionHeight = 40;
  const questionSpacing = 50;
  
  return [
    // Elementary (larger line spacing for bigger handwriting)
    {
      id: 'elementary_answer',
      type: 'linedAnswerBox',
      position: { ...basePosition, y: basePosition.y },
      width: 120,
      height: questionHeight,
      lineSpacing: 12,  // Larger spacing for young students
      lineColor: '#B0B0B0',
      padding: 8,
      fontSize: 12,
      content: '',
    },
    
    // Middle School (standard spacing)
    {
      id: 'middle_answer',
      type: 'linedAnswerBox', 
      position: { ...basePosition, y: basePosition.y + questionSpacing },
      width: 120,
      height: questionHeight,
      lineSpacing: 8,   // Standard notebook spacing
      lineColor: '#CCCCCC',
      padding: 6,
      fontSize: 10,
      content: '',
    },
    
    // High School (compact spacing)
    {
      id: 'high_answer',
      type: 'linedAnswerBox',
      position: { ...basePosition, y: basePosition.y + (questionSpacing * 2) },
      width: 120,
      height: questionHeight,
      lineSpacing: 6,   // Tighter spacing for mature writing
      lineColor: '#DDDDDD',
      padding: 4,
      fontSize: 9,
      content: '',
    },
  ];
}

// ============================================================================
// EXAMPLE 3: Exam Template with Mixed Question Types
// ============================================================================

/**
 * Create a complete exam template mixing lined answer boxes
 * with other question types
 */
function createExamTemplate() {
  const template = {
    basePdf: { width: 210, height: 297 }, // A4 size
    schemas: [] as any[],
  };
  
  let currentY = 25;
  const leftMargin = 20;
  const rightMargin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - leftMargin - rightMargin;
  
  // Title
  template.schemas.push({
    id: 'exam_title',
    type: 'text',
    position: { x: leftMargin, y: currentY },
    width: contentWidth,
    height: 15,
    content: 'Literature Exam - Short Answers',
    fontSize: 16,
    fontName: 'Helvetica-Bold',
    textAlignment: 'center',
  });
  currentY += 25;
  
  // Question 1 with lined answer box
  template.schemas.push({
    id: 'q1_text',
    type: 'text',
    position: { x: leftMargin, y: currentY },
    width: contentWidth,
    height: 12,
    content: '1. Describe the main theme of the novel in 3-4 sentences.',
    fontSize: 11,
    fontName: 'Helvetica-Bold',
  });
  currentY += 18;
  
  template.schemas.push({
    id: 'q1_answer',
    type: 'linedAnswerBox',
    position: { x: leftMargin, y: currentY },
    width: contentWidth,
    height: 35,
    lineSpacing: 7,
    lineColor: '#CCCCCC',
    padding: 5,
    fontSize: 10,
    content: '',
  });
  currentY += 45;
  
  // Question 2 with different styling
  template.schemas.push({
    id: 'q2_text',
    type: 'text',
    position: { x: leftMargin, y: currentY },
    width: contentWidth,
    height: 12,
    content: '2. Analyze the character development of the protagonist.',
    fontSize: 11,
    fontName: 'Helvetica-Bold',
  });
  currentY += 18;
  
  template.schemas.push({
    id: 'q2_answer',
    type: 'linedAnswerBox',
    position: { x: leftMargin, y: currentY },
    width: contentWidth,
    height: 50,  // Larger box for analysis
    lineSpacing: 8,
    lineColor: '#BBBBBB',
    padding: 6,
    fontSize: 10,
    lineStyle: 'dashed',  // Different line style
    content: '',
  });
  
  return template;
}

// ============================================================================
// EXAMPLE 4: UI Integration Functions
// ============================================================================

/**
 * Function to add lined answer box via UI button click
 * (For integration with Docubrand interface)
 */
function handleAddLinedAnswerBox(
  designer: any,
  clickPosition: { x: number; y: number },
  options?: {
    width?: number;
    height?: number;
    lineSpacing?: number;
    preset?: 'elementary' | 'middle' | 'high' | 'essay';
  }
) {
  // Preset configurations
  const presets = {
    elementary: { lineSpacing: 12, fontSize: 12, height: 40 },
    middle: { lineSpacing: 8, fontSize: 10, height: 35 },
    high: { lineSpacing: 6, fontSize: 9, height: 30 },
    essay: { lineSpacing: 8, fontSize: 10, height: 80 },
  };
  
  const preset = options?.preset ? presets[options.preset] : presets.middle;
  
  const answerBox: LinedAnswerBoxSchema = {
    id: `lined_box_${Date.now()}`,
    type: 'linedAnswerBox',
    position: clickPosition,
    width: options?.width || 120,
    height: options?.height || preset.height,
    lineSpacing: options?.lineSpacing || preset.lineSpacing,
    lineColor: '#CCCCCC',
    padding: 5,
    lineStyle: 'solid',
    lineWidth: 0.5,
    fontSize: preset.fontSize,
    fontName: 'Helvetica',
    fontColor: '#000000',
    showLinesInPdf: false,
    content: '',
    readOnly: false,
  };
  
  // Add to template
  const currentTemplate = designer.getTemplate();
  const newTemplate = {
    ...currentTemplate,
    schemas: [...currentTemplate.schemas, answerBox],
  };
  
  designer.updateTemplate(newTemplate);
  
  console.log(`Added lined answer box (${options?.preset || 'standard'}) at`, clickPosition);
}

// ============================================================================
// EXAMPLE 5: React Component Integration
// ============================================================================

/**
 * React component for lined answer box configuration dialog
 */
/*
interface LinedAnswerBoxDialogProps {
  onAddBox: (config: Partial<LinedAnswerBoxSchema>) => void;
  onCancel: () => void;
}

export const LinedAnswerBoxDialog: React.FC<LinedAnswerBoxDialogProps> = ({
  onAddBox,
  onCancel
}) => {
  const [config, setConfig] = useState({
    width: 120,
    height: 40,
    lineSpacing: 8,
    lineColor: '#CCCCCC',
    padding: 5,
    showLinesInPdf: false,
  });

  const presets = [
    { label: 'Elementary', lineSpacing: 12, height: 45 },
    { label: 'Middle School', lineSpacing: 8, height: 35 },
    { label: 'High School', lineSpacing: 6, height: 30 },
    { label: 'Essay', lineSpacing: 8, height: 80 },
  ];

  return (
    <div className="dialog">
      <h3>Add Lined Answer Box</h3>
      
      <div className="form-group">
        <label>Preset:</label>
        <select onChange={(e) => {
          const preset = presets.find(p => p.label === e.target.value);
          if (preset) {
            setConfig(prev => ({
              ...prev,
              lineSpacing: preset.lineSpacing,
              height: preset.height
            }));
          }
        }}>
          {presets.map(preset => (
            <option key={preset.label} value={preset.label}>
              {preset.label}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Width (mm):</label>
          <input
            type="number"
            value={config.width}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              width: Number(e.target.value)
            }))}
            min="50"
            max="200"
          />
        </div>
        
        <div className="form-group">
          <label>Height (mm):</label>
          <input
            type="number"
            value={config.height}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              height: Number(e.target.value)
            }))}
            min="20"
            max="150"
          />
        </div>
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Line Spacing (mm):</label>
          <input
            type="number"
            value={config.lineSpacing}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              lineSpacing: Number(e.target.value)
            }))}
            min="4"
            max="20"
            step="0.5"
          />
        </div>
        
        <div className="form-group">
          <label>Line Color:</label>
          <input
            type="color"
            value={config.lineColor}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              lineColor: e.target.value
            }))}
          />
        </div>
      </div>

      <div className="form-group">
        <label>
          <input
            type="checkbox"
            checked={config.showLinesInPdf}
            onChange={(e) => setConfig(prev => ({
              ...prev,
              showLinesInPdf: e.target.checked
            }))}
          />
          Show lines in PDF output
        </label>
      </div>

      <div className="dialog-actions">
        <button onClick={() => onAddBox(config)}>Add Answer Box</button>
        <button onClick={onCancel}>Cancel</button>
      </div>
    </div>
  );
};
*/

// ============================================================================
// EXAMPLE 6: Advanced Features - Dynamic Line Adjustment
// ============================================================================

/**
 * Utility function to automatically adjust line spacing based on content length
 */
function createAdaptiveAnswerBox(
  position: { x: number; y: number },
  expectedWordCount: number
): LinedAnswerBoxSchema {
  // Estimate required height based on word count
  // Assuming ~8-10 words per line, ~6-8mm line spacing
  const wordsPerLine = 8;
  const estimatedLines = Math.ceil(expectedWordCount / wordsPerLine);
  const baseHeight = Math.max(30, estimatedLines * 8 + 10); // +10 for padding
  
  return {
    id: `adaptive_box_${Date.now()}`,
    type: 'linedAnswerBox',
    position,
    width: 140,
    height: Math.min(baseHeight, 100), // Cap at reasonable height
    lineSpacing: expectedWordCount > 50 ? 6 : 8, // Tighter lines for longer answers
    lineColor: '#CCCCCC',
    padding: 5,
    fontSize: expectedWordCount > 50 ? 9 : 10,
    content: '',
  };
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export {
  createEssayAnswerBox,
  createGradeLevelAnswerBoxes,
  createExamTemplate,
  handleAddLinedAnswerBox,
  createAdaptiveAnswerBox,
};