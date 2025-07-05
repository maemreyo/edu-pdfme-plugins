/**
 * USAGE EXAMPLES: Callout Block Composition
 * 
 * This file demonstrates how to integrate callout blocks into
 * educational documents and UI applications using pdfme composition.
 */

import { 
  createCalloutBlock, 
  createPresetCalloutBlock,
  createSubjectCallout,
  createLessonCallouts,
  findCalloutBlocks,
  removeCalloutBlock,
  updateCalloutContent,
  type CalloutType,
  type CalloutBlockOptions 
} from '../utils/blockComposers';

// ============================================================================
// EXAMPLE 1: Basic Callout Usage in Educational Content
// ============================================================================

/**
 * Create different types of callouts for a math lesson
 */
function createMathLessonCallouts() {
  const position = { x: 20, y: 30 };
  const spacing = 20;
  let currentY = position.y;
  
  const callouts = [];
  
  // Definition callout
  callouts.push(createCalloutBlock({
    position: { x: position.x, y: currentY },
    type: 'definition',
    title: 'Định nghĩa: Phân số',
    content: 'Phân số là một số được biểu diễn dưới dạng a/b, trong đó a là tử số và b là mẫu số (b ≠ 0).',
    width: 160
  }));
  currentY += 70;
  
  // Tip callout
  callouts.push(createCalloutBlock({
    position: { x: position.x, y: currentY },
    type: 'tip',
    title: 'Mẹo tính toán',
    content: 'Khi cộng hai phân số, hãy quy đồng mẫu số trước khi thực hiện phép cộng.',
    width: 160
  }));
  currentY += 60;
  
  // Warning callout
  callouts.push(createCalloutBlock({
    position: { x: position.x, y: currentY },
    type: 'warning',
    title: 'Lưu ý quan trọng',
    content: 'Mẫu số của phân số không bao giờ được bằng 0. Điều này sẽ làm cho phân số không có nghĩa.',
    width: 160
  }));
  currentY += 65;
  
  // Example callout
  callouts.push(createCalloutBlock({
    position: { x: position.x, y: currentY },
    type: 'example',
    title: 'Ví dụ thực tế',
    content: 'Nếu bạn ăn 3/8 chiếc bánh pizza và bạn bè ăn 2/8, tổng cộng các bạn đã ăn 5/8 chiếc pizza.',
    width: 160
  }));
  
  return callouts;
}

// ============================================================================
// EXAMPLE 2: Creating Complete Lesson Templates
// ============================================================================

/**
 * Create a complete science lesson with multiple callout types
 */
function createScienceLessonTemplate() {
  const template = {
    basePdf: { width: 210, height: 297 }, // A4 size
    schemas: [] as any[]
  };
  
  // Lesson title
  template.schemas.push({
    id: 'lesson_title',
    type: 'text',
    position: { x: 20, y: 15 },
    width: 170,
    height: 12,
    content: 'Bài học: Chu trình nước trong tự nhiên',
    fontSize: 16,
    fontName: 'Helvetica-Bold',
    textAlignment: 'center'
  });
  
  // Create lesson callouts using the helper function
  const lessonCallouts = createLessonCallouts(
    { x: 20, y: 40 },
    {
      objective: 'Hiểu được quá trình tuần hoàn của nước trong tự nhiên và các yếu tố ảnh hưởng.',
      keyPoints: [
        'Nước bay hơi từ đại dương, sông, hồ tạo thành hơi nước.',
        'Hơi nước ngưng tụ thành mây trong khí quyển.',
        'Mưa, tuyết rơi xuống bổ sung nước cho đất liền.'
      ],
      examples: [
        'Khi phơi quần áo, nước trong vải bay hơi vào không khí.',
        'Sương mai xuất hiện khi hơi nước ngưng tụ vào ban đêm.'
      ],
      warnings: [
        'Ô nhiễm có thể làm gián đoạn chu trình nước tự nhiên.',
        'Biến đổi khí hậu ảnh hưởng đến lượng mưa và bay hơi.'
      ]
    }
  );
  
  // Add all callout schemas to template
  lessonCallouts.forEach(callout => {
    template.schemas.push(...callout.schemas);
  });
  
  return template;
}

// ============================================================================
// EXAMPLE 3: Subject-Specific Callouts
// ============================================================================

/**
 * Create subject-specific callouts for different academic areas
 */
function createSubjectSpecificCallouts() {
  const subjects = ['math', 'science', 'history', 'language'] as const;
  const startPosition = { x: 25, y: 30 };
  const columns = 2;
  const columnWidth = 85;
  const rowHeight = 80;
  
  return subjects.map((subject, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    
    return createSubjectCallout(subject, {
      x: startPosition.x + (column * columnWidth),
      y: startPosition.y + (row * rowHeight)
    });
  });
}

// ============================================================================
// EXAMPLE 4: UI Integration Functions
// ============================================================================

/**
 * Function to add callout via UI button click
 * (For integration with Docubrand interface)
 */
function handleAddCallout(
  designer: any,
  clickPosition: { x: number; y: number },
  calloutType: CalloutType = 'note'
) {
  try {
    const callout = createPresetCalloutBlock(
      calloutType,
      clickPosition,
      'Nhập nội dung callout tại đây...',
      undefined // Use preset title
    );

    // Get current template
    const currentTemplate = designer.getTemplate();
    
    // Add new schemas to template
    const newTemplate = {
      ...currentTemplate,
      schemas: [...currentTemplate.schemas, ...callout.schemas]
    };
    
    // Update the designer
    designer.updateTemplate(newTemplate);
    
    console.log(`Added ${calloutType} callout with group ID: ${callout.groupId}`);
    return callout.groupId;
    
  } catch (error) {
    console.error('Failed to add callout:', error);
    alert('Error adding callout: ' + error.message);
    return null;
  }
}

/**
 * Batch create multiple callouts for lesson planning
 */
function createLessonPlan(
  designer: any,
  lessonData: {
    title: string;
    sections: Array<{
      type: CalloutType;
      title: string;
      content: string;
    }>;
  }
) {
  const template = designer.getTemplate();
  let currentY = 40; // Start below title
  const leftMargin = 20;
  const sectionSpacing = 15;
  
  // Add lesson title
  const titleSchema = {
    id: `lesson_title_${Date.now()}`,
    type: 'text',
    position: { x: leftMargin, y: 15 },
    width: 170,
    height: 15,
    content: lessonData.title,
    fontSize: 14,
    fontName: 'Helvetica-Bold',
    textAlignment: 'center'
  };
  
  const newSchemas = [titleSchema];
  
  // Add each section as a callout
  lessonData.sections.forEach((section, index) => {
    const callout = createCalloutBlock({
      position: { x: leftMargin, y: currentY },
      type: section.type,
      title: section.title,
      content: section.content,
      width: 160
    });
    
    newSchemas.push(...callout.schemas);
    currentY += callout.dimensions.height + sectionSpacing;
  });
  
  // Update template
  designer.updateTemplate({
    ...template,
    schemas: [...template.schemas, ...newSchemas]
  });
  
  console.log(`Created lesson plan with ${lessonData.sections.length} sections`);
}

// ============================================================================
// EXAMPLE 5: React Component Integration
// ============================================================================

/**
 * React component for callout configuration dialog
 */
/*
interface CalloutDialogProps {
  onAddCallout: (config: CalloutBlockOptions) => void;
  onCancel: () => void;
}

export const CalloutDialog: React.FC<CalloutDialogProps> = ({
  onAddCallout,
  onCancel
}) => {
  const [config, setConfig] = useState<Partial<CalloutBlockOptions>>({
    type: 'note',
    title: '',
    content: '',
    width: 160
  });

  const calloutTypes: { value: CalloutType; label: string; description: string }[] = [
    { value: 'tip', label: 'Mẹo hay', description: 'Chia sẻ mẹo học tập hữu ích' },
    { value: 'warning', label: 'Lưu ý', description: 'Cảnh báo về lỗi thường gặp' },
    { value: 'definition', label: 'Định nghĩa', description: 'Giải thích khái niệm quan trọng' },
    { value: 'note', label: 'Ghi chú', description: 'Thông tin bổ sung' },
    { value: 'important', label: 'Quan trọng', description: 'Điểm cần nhấn mạnh' },
    { value: 'example', label: 'Ví dụ', description: 'Minh họa cụ thể' }
  ];

  const handleSubmit = () => {
    if (!config.title?.trim()) {
      alert('Vui lòng nhập tiêu đề');
      return;
    }
    
    if (!config.content?.trim()) {
      alert('Vui lòng nhập nội dung');
      return;
    }

    onAddCallout(config as CalloutBlockOptions);
  };

  return (
    <div className="dialog">
      <h3>Thêm Callout Block</h3>
      
      <div className="form-group">
        <label>Loại Callout:</label>
        <select 
          value={config.type}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            type: e.target.value as CalloutType
          }))}
        >
          {calloutTypes.map(type => (
            <option key={type.value} value={type.value}>
              {type.label} - {type.description}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Tiêu đề:</label>
        <input
          type="text"
          value={config.title || ''}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            title: e.target.value
          }))}
          placeholder="Nhập tiêu đề..."
        />
      </div>

      <div className="form-group">
        <label>Nội dung:</label>
        <textarea
          value={config.content || ''}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            content: e.target.value
          }))}
          placeholder="Nhập nội dung chi tiết..."
          rows={4}
        />
      </div>

      <div className="form-group">
        <label>Chiều rộng (mm):</label>
        <input
          type="number"
          value={config.width || 160}
          onChange={(e) => setConfig(prev => ({
            ...prev,
            width: Number(e.target.value)
          }))}
          min="80"
          max="200"
        />
      </div>

      <div className="dialog-actions">
        <button onClick={handleSubmit}>Thêm Callout</button>
        <button onClick={onCancel}>Hủy</button>
      </div>
    </div>
  );
};
*/

// ============================================================================
// EXAMPLE 6: Advanced Template Management
// ============================================================================

/**
 * Organize callouts in a multi-column layout
 */
function createMultiColumnCalloutLayout() {
  const template = {
    basePdf: { width: 210, height: 297 },
    schemas: [] as any[]
  };
  
  const leftColumn = { x: 15, y: 30, width: 85 };
  const rightColumn = { x: 110, y: 30, width: 85 };
  
  // Left column - definitions and concepts
  const leftCallouts = [
    { type: 'definition' as CalloutType, title: 'Khái niệm 1', content: 'Định nghĩa chi tiết về khái niệm đầu tiên...' },
    { type: 'definition' as CalloutType, title: 'Khái niệm 2', content: 'Định nghĩa chi tiết về khái niệm thứ hai...' }
  ];
  
  // Right column - tips and examples
  const rightCallouts = [
    { type: 'tip' as CalloutType, title: 'Mẹo học', content: 'Cách ghi nhớ hiệu quả các khái niệm này...' },
    { type: 'example' as CalloutType, title: 'Ví dụ áp dụng', content: 'Ví dụ cụ thể về cách sử dụng trong thực tế...' }
  ];
  
  let leftY = leftColumn.y;
  let rightY = rightColumn.y;
  
  // Add left column callouts
  leftCallouts.forEach(calloutData => {
    const callout = createCalloutBlock({
      position: { x: leftColumn.x, y: leftY },
      type: calloutData.type,
      title: calloutData.title,
      content: calloutData.content,
      width: leftColumn.width
    });
    template.schemas.push(...callout.schemas);
    leftY += callout.dimensions.height + 15;
  });
  
  // Add right column callouts
  rightCallouts.forEach(calloutData => {
    const callout = createCalloutBlock({
      position: { x: rightColumn.x, y: rightY },
      type: calloutData.type,
      title: calloutData.title,
      content: calloutData.content,
      width: rightColumn.width
    });
    template.schemas.push(...callout.schemas);
    rightY += callout.dimensions.height + 15;
  });
  
  return template;
}

/**
 * Update existing callouts in a template
 */
function updateCalloutInTemplate(
  designer: any,
  groupId: string,
  newContent: { title?: string; content?: string }
) {
  const currentTemplate = designer.getTemplate();
  const updatedSchemas = updateCalloutContent(
    currentTemplate.schemas,
    groupId,
    newContent
  );
  
  designer.updateTemplate({
    ...currentTemplate,
    schemas: updatedSchemas
  });
  
  console.log(`Updated callout ${groupId}:`, newContent);
}

/**
 * Clear all callouts from template
 */
function clearAllCallouts(designer: any) {
  const currentTemplate = designer.getTemplate();
  const calloutGroupIds = findCalloutBlocks(currentTemplate.schemas);
  
  let updatedSchemas = currentTemplate.schemas;
  calloutGroupIds.forEach(groupId => {
    updatedSchemas = removeCalloutBlock(updatedSchemas, groupId);
  });
  
  designer.updateTemplate({
    ...currentTemplate,
    schemas: updatedSchemas
  });
  
  console.log(`Removed ${calloutGroupIds.length} callout blocks`);
}

// ============================================================================
// EXPORT ALL EXAMPLES
// ============================================================================

export {
  createMathLessonCallouts,
  createScienceLessonTemplate,
  createSubjectSpecificCallouts,
  handleAddCallout,
  createLessonPlan,
  createMultiColumnCalloutLayout,
  updateCalloutInTemplate,
  clearAllCallouts
};