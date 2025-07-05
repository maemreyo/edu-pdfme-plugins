/**
 * SVG icon library for callout blocks
 * All icons are designed to fit in a 24x24 viewBox for consistency
 */

export type IconName = 
  | 'lightbulb' 
  | 'alertTriangle' 
  | 'book' 
  | 'info' 
  | 'exclamation' 
  | 'clipboard'
  | 'star'
  | 'checkCircle'
  | 'questionMark'
  | 'target';

/**
 * Collection of educational-focused SVG icons
 */
export const CALLOUT_ICONS: Record<IconName, string> = {
  // Lightbulb icon for tips and ideas
  lightbulb: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 21H15M12 3C8.686 3 6 5.686 6 9C6 10.84 6.84 12.46 8.16 13.5C8.58 13.83 9 14.33 9 15V18C9 18.55 9.45 19 10 19H14C14.55 19 15 18.55 15 18V15C15 14.33 15.42 13.83 15.84 13.5C17.16 12.46 18 10.84 18 9C18 5.686 15.314 3 12 3Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Alert triangle for warnings
  alertTriangle: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18C1.64 18.37 1.87 18.83 2.3 18.83H21.7C22.13 18.83 22.36 18.37 22.18 18L13.71 3.86C13.53 3.49 13.05 3.49 12.87 3.86L10.29 3.86Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 9V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Book icon for definitions and educational content
  book: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M4 19.5C4 20.881 5.119 22 6.5 22H18C19.105 22 20 21.105 20 20V4C20 2.895 19.105 2 18 2H6.5C5.119 2 4 3.119 4 4.5V19.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M4 19.5C4 18.119 5.119 17 6.5 17H20" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 7H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 11H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Info circle for general information
  info: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <path d="M12 16V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 8H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Exclamation for important notices
  exclamation: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 16H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Clipboard for examples and exercises
  clipboard: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M16 4H18C19.105 4 20 4.895 20 6V20C20 21.105 19.105 22 18 22H6C4.895 22 4 21.105 4 20V6C4 4.895 4.895 4 6 4H8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 12H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M8 16H16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Star for highlighting key points
  star: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <polygon points="12,2 15,9 22,9 17,14 19,21 12,17 5,21 7,14 2,9 9,9" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Check circle for completed items or correct answers
  checkCircle: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M22 11.08V12C21.998 13.633 21.504 15.233 20.57 16.608C19.636 17.983 18.304 19.074 16.747 19.747C15.19 20.42 13.472 20.647 11.799 20.403C10.126 20.159 8.566 19.454 7.289 18.364C6.012 17.274 5.072 15.842 4.573 14.237C4.074 12.632 4.036 10.918 4.464 9.293C4.892 7.668 5.767 6.196 6.984 5.043C8.201 3.89 9.712 3.101 11.348 2.76" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="22,4 12,14.01 9,11.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Question mark for help and hints
  questionMark: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <path d="M9.09 9C9.325 8.348 9.78 7.798 10.376 7.438C10.972 7.078 11.673 6.929 12.361 7.015C13.049 7.101 13.684 7.415 14.155 7.903C14.626 8.391 14.903 9.021 14.938 9.688C14.973 10.355 14.764 11.013 14.345 11.545C13.926 12.077 13.326 12.444 12.66 12.577L12 13.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <path d="M12 17H12.01" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,

  // Target for objectives and goals
  target: `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="6" stroke="currentColor" stroke-width="2"/>
    <circle cx="12" cy="12" r="2" stroke="currentColor" stroke-width="2"/>
  </svg>`,
};

/**
 * Get SVG icon by name with color customization
 * 
 * @param iconName Name of the icon to retrieve
 * @param color Color to apply to the icon (CSS color value)
 * @returns SVG string with applied color
 */
export function getIcon(iconName: IconName, color: string = 'currentColor'): string {
  const baseSvg = CALLOUT_ICONS[iconName];
  if (!baseSvg) {
    console.warn(`Icon "${iconName}" not found, using default info icon`);
    return CALLOUT_ICONS.info;
  }
  
  // Replace currentColor with the specified color
  return baseSvg.replace(/currentColor/g, color);
}

/**
 * Get all available icon names
 */
export function getAvailableIcons(): IconName[] {
  return Object.keys(CALLOUT_ICONS) as IconName[];
}

/**
 * Create a custom icon from SVG path data
 * 
 * @param pathData SVG path data
 * @param color Icon color
 * @param viewBox Custom viewBox (default: "0 0 24 24")
 * @returns Complete SVG string
 */
export function createCustomIcon(
  pathData: string,
  color: string = 'currentColor',
  viewBox: string = '0 0 24 24'
): string {
  return `<svg viewBox="${viewBox}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${pathData}" stroke="${color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}

/**
 * Validate if a string is a valid SVG
 * 
 * @param svgString String to validate
 * @returns True if valid SVG
 */
export function isValidSvg(svgString: string): boolean {
  try {
    if (!svgString || typeof svgString !== 'string') {
      return false;
    }
    
    return svgString.includes('<svg') && svgString.includes('</svg>');
  } catch {
    return false;
  }
}

/**
 * Educational icon collections for quick access
 */
export const ICON_COLLECTIONS = {
  /** Icons for different callout types */
  calloutTypes: ['lightbulb', 'alertTriangle', 'book', 'info', 'exclamation', 'clipboard'] as IconName[],
  
  /** Icons for feedback and assessment */
  feedback: ['checkCircle', 'exclamation', 'questionMark', 'star'] as IconName[],
  
  /** Icons for learning objectives */
  objectives: ['target', 'star', 'checkCircle', 'book'] as IconName[],
  
  /** All available icons */
  all: getAvailableIcons(),
};