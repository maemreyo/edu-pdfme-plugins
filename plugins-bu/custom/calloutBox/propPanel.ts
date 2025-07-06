import { PropPanel, PropPanelWidgetProps } from "@pdfme/common";
import type { CalloutBoxSchema, CalloutType } from "./types";
import { EDUCATIONAL_ICONS, CALLOUT_TYPE_CONFIGS } from "./types";

/**
 * Custom widget for selecting icons from the educational icon library
 */
const iconPickerWidget = (arg: PropPanelWidgetProps) => {
  const { rootElement, value, onChange } = arg;
  const schema = value as CalloutBoxSchema;

  // Clear existing content
  rootElement.innerHTML = '';

  // Create container
  const container = document.createElement('div');
  container.style.width = '100%';
  rootElement.appendChild(container);

  // Title
  const title = document.createElement('div');
  title.textContent = 'Select Icon';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '8px';
  title.style.fontSize = '14px';
  container.appendChild(title);

  // Icon grid container
  const iconGrid = document.createElement('div');
  iconGrid.style.display = 'grid';
  iconGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
  iconGrid.style.gap = '8px';
  iconGrid.style.marginBottom = '12px';
  container.appendChild(iconGrid);

  // Render icon options
  Object.entries(EDUCATIONAL_ICONS).forEach(([iconName, iconSvg]) => {
    const iconButton = document.createElement('button');
    iconButton.style.width = '40px';
    iconButton.style.height = '40px';
    iconButton.style.border = schema.icon === iconSvg ? '2px solid #1890ff' : '1px solid #d9d9d9';
    iconButton.style.borderRadius = '4px';
    iconButton.style.backgroundColor = schema.icon === iconSvg ? '#f0f8ff' : '#ffffff';
    iconButton.style.cursor = 'pointer';
    iconButton.style.display = 'flex';
    iconButton.style.alignItems = 'center';
    iconButton.style.justifyContent = 'center';
    iconButton.style.color = schema.icon === iconSvg ? '#1890ff' : '#666';
    iconButton.style.transition = 'all 0.2s';

    // Set icon content
    iconButton.innerHTML = iconSvg;

    // Add hover effects
    iconButton.addEventListener('mouseenter', () => {
      if (schema.icon !== iconSvg) {
        iconButton.style.borderColor = '#40a9ff';
        iconButton.style.backgroundColor = '#f6ffed';
      }
    });

    iconButton.addEventListener('mouseleave', () => {
      if (schema.icon !== iconSvg) {
        iconButton.style.borderColor = '#d9d9d9';
        iconButton.style.backgroundColor = '#ffffff';
      }
    });

    // Handle selection
    iconButton.addEventListener('click', () => {
      onChange({ key: 'icon', value: iconSvg });
    });

    // Tooltip
    iconButton.title = iconName.charAt(0).toUpperCase() + iconName.slice(1);

    iconGrid.appendChild(iconButton);
  });
};

/**
 * Custom widget for callout type quick selection
 */
const calloutTypeWidget = (arg: PropPanelWidgetProps) => {
  const { rootElement, value, onChange } = arg;
  const schema = value as CalloutBoxSchema;

  // Clear existing content
  rootElement.innerHTML = '';

  // Create container
  const container = document.createElement('div');
  container.style.width = '100%';
  rootElement.appendChild(container);

  // Title
  const title = document.createElement('div');
  title.textContent = 'Quick Styles';
  title.style.fontWeight = 'bold';
  title.style.marginBottom = '8px';
  title.style.fontSize = '14px';
  container.appendChild(title);

  // Type buttons container
  const typeContainer = document.createElement('div');
  typeContainer.style.display = 'grid';
  typeContainer.style.gridTemplateColumns = 'repeat(3, 1fr)';
  typeContainer.style.gap = '6px';
  container.appendChild(typeContainer);

  // Render type options
  Object.entries(CALLOUT_TYPE_CONFIGS).forEach(([typeName, config]) => {
    const typeButton = document.createElement('button');
    typeButton.style.padding = '8px 12px';
    typeButton.style.border = schema.calloutType === typeName ? '2px solid #1890ff' : '1px solid #d9d9d9';
    typeButton.style.borderRadius = '4px';
    typeButton.style.backgroundColor = config.backgroundColor || '#f5f5f5';
    typeButton.style.color = config.titleStyle?.fontColor || '#333';
    typeButton.style.cursor = 'pointer';
    typeButton.style.fontSize = '12px';
    typeButton.style.fontWeight = schema.calloutType === typeName ? 'bold' : 'normal';
    typeButton.style.textTransform = 'capitalize';
    typeButton.textContent = typeName;

    typeButton.addEventListener('click', () => {
      // Apply the entire configuration for this type
      onChange([
        { key: 'calloutType', value: typeName },
        { key: 'icon', value: config.icon },
        { key: 'backgroundColor', value: config.backgroundColor },
        { key: 'borderColor', value: config.borderColor },
        { key: 'titleStyle', value: { ...schema.titleStyle, ...config.titleStyle } },
        { key: 'bodyStyle', value: { ...schema.bodyStyle, ...config.bodyStyle } },
      ]);
    });

    typeContainer.appendChild(typeButton);
  });
};

/**
 * Property panel configuration for CalloutBox plugin
 */
export const propPanel: PropPanel<CalloutBoxSchema> = {
  schema: (propPanelProps) => {
    return {
      // Content Management
      title: {
        title: 'Title',
        type: 'string',
        span: 24,
      },

      body: {
        title: 'Content',
        type: 'string',
        format: 'textarea',
        props: {
          autoSize: { minRows: 3, maxRows: 6 },
        },
        span: 24,
      },

      // Quick Style Selection
      '-------quick-styles': { type: 'void', widget: 'Divider' },
      quickStylesTitle: {
        title: 'Quick Styles',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          calloutTypeManager: {
            type: 'object',
            widget: 'calloutTypeManager',
            bind: false,
            span: 24,
          },
        },
      },

      // Icon Management
      '-------icon': { type: 'void', widget: 'Divider' },
      iconTitle: {
        title: 'Icon Selection',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          iconPicker: {
            type: 'object',
            widget: 'iconPicker',
            bind: false,
            span: 24,
          },
        },
      },

      // Background & Border Styling
      '-------appearance': { type: 'void', widget: 'Divider' },
      appearanceTitle: {
        title: 'Background & Border',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          backgroundColor: {
            title: 'Background Color',
            type: 'string',
            widget: 'color',
            span: 12,
          },
          borderColor: {
            title: 'Border Color',
            type: 'string',
            widget: 'color',
            span: 12,
          },
          borderWidth: {
            title: 'Border Width (mm)',
            type: 'number',
            props: { min: 0, max: 5, step: 0.5 },
            span: 12,
          },
          radius: {
            title: 'Corner Radius (mm)',
            type: 'number',
            props: { min: 0, max: 10, step: 0.5 },
            span: 12,
          },
        },
      },

      // Layout Configuration
      '-------layout': { type: 'void', widget: 'Divider' },
      layoutTitle: {
        title: 'Layout & Spacing',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          'layout.padding': {
            title: 'Padding (mm)',
            type: 'number',
            props: { min: 2, max: 20, step: 1 },
            span: 12,
          },
          'layout.iconSize': {
            title: 'Icon Size (mm)',
            type: 'number',
            props: { min: 3, max: 15, step: 0.5 },
            span: 12,
          },
          'layout.spacingAfterIcon': {
            title: 'Icon-Title Spacing (mm)',
            type: 'number',
            props: { min: 1, max: 10, step: 0.5 },
            span: 12,
          },
          'layout.spacingAfterTitle': {
            title: 'Title-Body Spacing (mm)',
            type: 'number',
            props: { min: 2, max: 15, step: 1 },
            span: 12,
          },
        },
      },

      // Title Style
      '-------title-style': { type: 'void', widget: 'Divider' },
      titleStyleTitle: {
        title: 'Title Style',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          'titleStyle.fontSize': {
            title: 'Font Size',
            type: 'number',
            props: { min: 8, max: 24, step: 1 },
            span: 12,
          },
          'titleStyle.fontColor': {
            title: 'Font Color',
            type: 'string',
            widget: 'color',
            span: 12,
          },
          'titleStyle.fontName': {
            title: 'Font Family',
            type: 'string',
            widget: 'select',
            props: {
              options: [
                { label: 'Helvetica', value: 'Helvetica' },
                { label: 'Helvetica Bold', value: 'Helvetica-Bold' },
                { label: 'Times Roman', value: 'Times-Roman' },
                { label: 'Times Bold', value: 'Times-Bold' },
              ],
            },
            span: 24,
          },
        },
      },

      // Body Style
      '-------body-style': { type: 'void', widget: 'Divider' },
      bodyStyleTitle: {
        title: 'Body Style',
        type: 'void',
        widget: 'Card',
        span: 24,
        properties: {
          'bodyStyle.fontSize': {
            title: 'Font Size',
            type: 'number',
            props: { min: 8, max: 20, step: 1 },
            span: 12,
          },
          'bodyStyle.fontColor': {
            title: 'Font Color',
            type: 'string',
            widget: 'color',
            span: 12,
          },
          'bodyStyle.fontName': {
            title: 'Font Family',
            type: 'string',
            widget: 'select',
            props: {
              options: [
                { label: 'Helvetica', value: 'Helvetica' },
                { label: 'Helvetica Bold', value: 'Helvetica-Bold' },
                { label: 'Times Roman', value: 'Times-Roman' },
                { label: 'Times Bold', value: 'Times-Bold' },
              ],
            },
            span: 24,
          },
        },
      },
    };
  },

  widgets: { 
    iconPicker: iconPickerWidget,
    calloutTypeManager: calloutTypeWidget,
  },

  defaultSchema: {
    type: 'calloutBox',
    icon: EDUCATIONAL_ICONS.info,
    title: 'Callout Title',
    body: 'Enter your callout content here. This can be tips, definitions, important notes, or any highlighted information for students.',
    
    backgroundColor: '#f0f8ff',
    borderColor: '#1890ff',
    borderWidth: 1,
    radius: 4,
    
    titleStyle: {
      fontSize: 12,
      fontColor: '#1890ff',
      fontName: 'Helvetica-Bold',
    },
    bodyStyle: {
      fontSize: 10,
      fontColor: '#333333',
      fontName: 'Helvetica',
    },
    
    layout: {
      padding: 8,
      iconSize: 5,
      spacingAfterIcon: 4,
      spacingAfterTitle: 6,
    },
    
    calloutType: 'info' as CalloutType,
    width: 160,
    height: 50,
    position: { x: 0, y: 0 },
    readOnly: false,
  },
};