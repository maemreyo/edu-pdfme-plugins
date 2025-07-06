import type { Schema } from "@pdfme/common";
import type { TextSchema } from "../../base/text/types";

/**
 * Predefined callout types with default styling
 */
export type CalloutType = 'info' | 'tip' | 'warning' | 'definition' | 'note';

/**
 * Layout configuration for the callout box
 */
export interface CalloutLayout {
  /** Padding around the entire content area in mm */
  padding: number;
  /** Size of the icon in mm */
  iconSize: number;
  /** Horizontal spacing between icon and title in mm */
  spacingAfterIcon: number;
  /** Vertical spacing between title and body content in mm */
  spacingAfterTitle: number;
}

/**
 * Schema interface for CalloutBox plugin
 * Self-contained plugin that manages entire callout block internally
 */
export interface CalloutBoxSchema extends Schema {
  // Core content
  /** SVG string for the icon */
  icon: string;
  /** Title/header text */
  title: string;
  /** Main body content */
  body: string;

  // Visual styling for the container
  /** Background color of the callout box */
  backgroundColor: string;
  /** Border color */
  borderColor: string;
  /** Border width in mm */
  borderWidth: number;
  /** Border radius for rounded corners in mm */
  radius: number;

  // Text styling
  /** Style configuration for the title text */
  titleStyle: Partial<TextSchema>;
  /** Style configuration for body text */
  bodyStyle: Partial<TextSchema>;

  // Layout configuration
  /** Layout and spacing settings */
  layout: CalloutLayout;

  // Optional callout type for quick styling
  /** Predefined callout type for quick setup */
  calloutType?: CalloutType;
}

/**
 * Predefined icon library for educational content
 */
export const EDUCATIONAL_ICONS = {
  // Info and tips
  lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 21h6"/>
    <path d="M12 17v4"/>
    <circle cx="12" cy="9" r="7"/>
    <path d="M12 2v7"/>
  </svg>`,
  
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="16" x2="12" y2="12"/>
    <line x1="12" y1="8" x2="12.01" y2="8"/>
  </svg>`,

  // Warnings and alerts
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
    <line x1="12" y1="9" x2="12" y2="13"/>
    <line x1="12" y1="17" x2="12.01" y2="17"/>
  </svg>`,

  warning: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>`,

  // Educational
  book: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M4 19.5A2.5 2.5 0 016.5 17H20"/>
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z"/>
  </svg>`,

  bookmark: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M19 21l-7-5-7 5V5a2 2 0 012-2h10a2 2 0 012 2z"/>
  </svg>`,

  // Science and tools
  atom: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <circle cx="12" cy="12" r="1"/>
    <path d="M20.2 20.2c2.04-2.03.02-7.36-4.5-11.9-4.54-4.52-9.87-6.54-11.9-4.5-2.04 2.03-.02 7.36 4.5 11.9 4.54 4.52 9.87 6.54 11.9 4.5z"/>
    <path d="M15.7 15.7c4.52-4.54 6.54-9.87 4.5-11.9-2.03-2.04-7.36-.02-11.9 4.5-4.52 4.54-6.54 9.87-4.5 11.9 2.03 2.04 7.36.02 11.9-4.5z"/>
  </svg>`,

  beaker: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <path d="M9 2v6l-4 7c-.5 1.5.5 3 2 3h10c1.5 0 2.5-1.5 2-3l-4-7V2"/>
    <path d="M9 2h6"/>
  </svg>`,
};

/**
 * Predefined callout type configurations
 */
export const CALLOUT_TYPE_CONFIGS: Record<CalloutType, Partial<CalloutBoxSchema>> = {
  info: {
    icon: EDUCATIONAL_ICONS.info,
    backgroundColor: '#e6f7ff',
    borderColor: '#91d5ff',
    titleStyle: { fontColor: '#0050b3', fontName: 'Helvetica-Bold' },
    bodyStyle: { fontColor: '#003a8c' },
  },
  
  tip: {
    icon: EDUCATIONAL_ICONS.lightbulb,
    backgroundColor: '#f6ffed',
    borderColor: '#b7eb8f',
    titleStyle: { fontColor: '#389e0d', fontName: 'Helvetica-Bold' },
    bodyStyle: { fontColor: '#237804' },
  },
  
  warning: {
    icon: EDUCATIONAL_ICONS.alert,
    backgroundColor: '#fff7e6',
    borderColor: '#ffd591',
    titleStyle: { fontColor: '#d46b08', fontName: 'Helvetica-Bold' },
    bodyStyle: { fontColor: '#ad4e00' },
  },
  
  definition: {
    icon: EDUCATIONAL_ICONS.book,
    backgroundColor: '#f9f0ff',
    borderColor: '#d3adf7',
    titleStyle: { fontColor: '#531dab', fontName: 'Helvetica-Bold' },
    bodyStyle: { fontColor: '#391085' },
  },
  
  note: {
    icon: EDUCATIONAL_ICONS.bookmark,
    backgroundColor: '#f0f5ff',
    borderColor: '#adc6ff',
    titleStyle: { fontColor: '#1d39c4', fontName: 'Helvetica-Bold' },
    bodyStyle: { fontColor: '#10239e' },
  },
};

/**
 * Default values for new callout boxes
 */
export const DEFAULT_CALLOUT_BOX: Partial<CalloutBoxSchema> = {
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
  
  calloutType: 'info',
};