import { PropPanel, PropPanelWidgetProps } from "@pdfme/common";
import { propPanel as textPropPanel } from "../text/propPanel";
import { Select, SelectSchemaForUI, AddOptionsWidgetProps } from "./types";
import { 
  validateOptions, 
  getSelectUIStyles, 
  applyStylesToElement,
  sanitizeOptions,
  generateUniqueId 
} from "./helper";

/**
 * Property panel configuration for Select plugin
 * 
 * Extends the text plugin's property panel with select-specific options management.
 * Provides a sophisticated interface for configuring dropdown options with:
 * - Dynamic options list management
 * - Real-time validation and feedback
 * - Drag-and-drop reordering (future enhancement)
 * - Bulk import/export capabilities (future enhancement)
 * 
 * Architecture:
 * - Inherits all text formatting options (font, color, alignment, etc.)
 * - Adds custom options management widget
 * - Provides type-safe schema generation
 * - Maintains consistency with text plugin patterns
 */
export const propPanel: PropPanel<Select> = {
  /**
   * Schema generation function for the property panel
   * 
   * Creates the form configuration by extending text plugin schema
   * and adding select-specific option management capabilities.
   */
  schema: (propPanelProps: Omit<PropPanelWidgetProps, "rootElement">) => {
    // Ensure text propPanel schema is a function (type safety)
    if (typeof textPropPanel.schema !== "function") {
      throw new Error("Text propPanel schema must be a function for select plugin inheritance");
    }

    // Get base text schema configuration
    const baseTextSchema = textPropPanel.schema(propPanelProps);

    // Create enhanced schema with select-specific additions
    return {
      ...baseTextSchema,
      
      // Add visual separator
      "-------": { 
        type: "void", 
        widget: "Divider",
        span: 24,
      },

      // Options management section
      optionsContainer: {
        title: propPanelProps.i18n("schemas.select.options"),
        type: "string",
        widget: "Card",
        span: 24,
        description: "Manage the available options for this dropdown selection",
        properties: {
          options: {
            widget: "addOptions",
            span: 24,
            // Pass configuration to the widget
            props: {
              maxOptions: 50,
              minOptions: 1,
              allowEmptyOptions: false,
            }
          }
        },
      },

      // Additional select-specific configurations
      selectBehavior: {
        title: "Selection Behavior",
        type: "string", 
        widget: "Card",
        span: 24,
        properties: {
          allowEmpty: {
            title: "Allow Empty Selection",
            type: "boolean",
            widget: "switch",
            default: false,
            description: "Whether to allow no selection (empty value)",
            span: 12,
          },
          autoSelect: {
            title: "Auto-select First Option",
            type: "boolean", 
            widget: "switch",
            default: true,
            description: "Automatically select the first option when options change",
            span: 12,
          }
        }
      }
    };
  },

  /**
   * Custom widgets registry
   * 
   * Extends text plugin widgets with select-specific functionality.
   * The addOptions widget provides the core options management interface.
   */
  widgets: {
    // Inherit all text plugin widgets
    ...(textPropPanel.widgets || {}),
    
    // Add our custom options management widget
    addOptions: createAddOptionsWidget,
  },

  /**
   * Default schema values for new Select instances
   * 
   * Inherits text defaults and adds select-specific properties.
   * Ensures new select elements are immediately functional.
   */
  defaultSchema: {
    // Inherit all text default properties
    ...(textPropPanel.defaultSchema || {}),
    
    // Override/add select-specific defaults
    type: "select",
    content: "option1", // Default selected value
    options: ["option1", "option2"], // Default options array
    allowEmpty: false,
    autoSelect: true,
  },
};

/**
 * Creates the addOptions custom widget for options management
 * 
 * This widget provides a sophisticated interface for managing dropdown options:
 * - Add new options with validation
 * - Edit existing options inline
 * - Remove options with confirmation
 * - Real-time validation feedback
 * - Automatic schema updates
 * 
 * @param props - Widget properties including schema and change handlers
 */
function createAddOptionsWidget(props: AddOptionsWidgetProps): void {
  const { rootElement, changeSchemas, activeSchema, i18n } = props;

  // Type-safe schema access
  const selectSchema = activeSchema as SelectSchemaForUI;
  
  // Initialize widget state
  const state = initializeWidgetState(selectSchema);
  
  // Apply widget container styling
  setupWidgetContainer(rootElement);
  
  // Create widget UI components
  const { inputContainer, optionsList } = createWidgetComponents(rootElement, i18n);
  
  // Setup event handlers and render initial state
  setupEventHandlers(inputContainer, state, updateSchema);
  renderOptionsList(optionsList, state, updateSchema);

  /**
   * Updates the schema with current options state
   * Includes validation and error handling
   */
  function updateSchema(): void {
    try {
      const validation = validateOptions(state.currentOptions, {
        maxOptions: props.config?.maxOptions,
        minOptions: props.config?.minOptions,
        allowEmptyOptions: props.config?.allowEmptyOptions,
      });

      // Show validation warnings if any
      if (validation.warnings && validation.warnings.length > 0) {
        console.warn('Options validation warnings:', validation.warnings);
      }

      // Only update if validation passes
      if (validation.isValid && validation.sanitizedOptions) {
        const updatedOptions = validation.sanitizedOptions;
        
        changeSchemas([
          { 
            key: "options", 
            value: updatedOptions, 
            schemaId: activeSchema.id 
          },
          {
            key: "content",
            value: updatedOptions[0] || "",
            schemaId: activeSchema.id,
          },
        ]);
        
        // Update local state
        state.currentOptions = updatedOptions;
      } else {
        // Show validation errors
        displayValidationErrors(validation.errors);
      }
    } catch (error) {
      console.error('Error updating select options schema:', error);
      displayValidationErrors(['An unexpected error occurred while updating options']);
    }
  }
}

/**
 * Initializes the widget state from current schema
 */
function initializeWidgetState(selectSchema: SelectSchemaForUI) {
  return {
    currentOptions: sanitizeOptions(selectSchema.options || []),
    isEditing: false,
    editingIndex: -1,
    tempValue: '',
  };
}

/**
 * Sets up the main widget container with proper styling
 */
function setupWidgetContainer(rootElement: HTMLElement): void {
  const styles = getSelectUIStyles();
  
  applyStylesToElement(rootElement, {
    width: "100%",
    padding: "12px",
    border: "1px solid #e0e0e0",
    borderRadius: "6px",
    backgroundColor: "#fafafa",
  });
}

/**
 * Creates the main UI components for the widget
 */
function createWidgetComponents(rootElement: HTMLElement, i18n: any) {
  // Input container for adding new options
  const inputContainer = document.createElement("div");
  const styles = getSelectUIStyles();
  applyStylesToElement(inputContainer, styles.container);

  // Text input for new options
  const input = document.createElement("input");
  input.type = "text";
  input.placeholder = i18n("schemas.select.optionPlaceholder") || "Enter new option...";
  input.id = generateUniqueId('option-input');
  applyStylesToElement(input, styles.input);

  // Add button
  const addButton = document.createElement("button");
  addButton.textContent = "+";
  addButton.type = "button";
  addButton.setAttribute('aria-label', 'Add option');
  applyStylesToElement(addButton, {
    ...styles.button,
    width: "32px",
    height: "32px",
    backgroundColor: "#007bff",
    color: "white",
  });

  inputContainer.appendChild(input);
  inputContainer.appendChild(addButton);

  // Options list container
  const optionsList = document.createElement("ul");
  applyStylesToElement(optionsList, styles.list);

  rootElement.appendChild(inputContainer);
  rootElement.appendChild(optionsList);

  return { inputContainer, optionsList, input, addButton };
}

/**
 * Sets up event handlers for the widget components
 */
function setupEventHandlers(
  inputContainer: HTMLElement, 
  state: any, 
  updateSchema: () => void
): void {
  const input = inputContainer.querySelector('input') as HTMLInputElement;
  const addButton = inputContainer.querySelector('button') as HTMLButtonElement;

  // Add option on button click
  addButton.addEventListener("click", () => {
    addNewOption(input, state, updateSchema);
  });

  // Add option on Enter key
  input.addEventListener("keypress", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      addNewOption(input, state, updateSchema);
    }
  });
}

/**
 * Adds a new option to the list with validation
 */
function addNewOption(
  input: HTMLInputElement, 
  state: any, 
  updateSchema: () => void
): void {
  const newValue = input.value.trim();
  
  if (!newValue) {
    input.focus();
    return;
  }

  // Check for duplicates
  if (state.currentOptions.includes(newValue)) {
    alert('This option already exists');
    input.select();
    return;
  }

  // Add to state and update
  state.currentOptions.push(newValue);
  updateSchema();
  
  // Clear input and refocus
  input.value = "";
  input.focus();
}

/**
 * Renders the current options list with edit/delete controls
 */
function renderOptionsList(
  optionsList: HTMLElement, 
  state: any, 
  updateSchema: () => void
): void {
  optionsList.innerHTML = "";

  state.currentOptions.forEach((option: string, index: number) => {
    const li = createOptionListItem(option, index, state, updateSchema);
    optionsList.appendChild(li);
  });
}

/**
 * Creates a single option list item with controls
 */
function createOptionListItem(
  option: string, 
  index: number, 
  state: any, 
  updateSchema: () => void
): HTMLLIElement {
  const li = document.createElement("li");
  const styles = getSelectUIStyles();
  
  applyStylesToElement(li, {
    display: "flex",
    alignItems: "center",
    padding: "8px",
    marginBottom: "4px",
    backgroundColor: "#fff",
    border: "1px solid #e0e0e0",
    borderRadius: "4px",
    gap: "8px",
  });

  // Option input (editable)
  const optionInput = document.createElement("input");
  optionInput.type = "text";
  optionInput.value = option;
  applyStylesToElement(optionInput, {
    ...styles.input,
    marginRight: "0",
    flex: "1",
  });

  // Edit change handler
  optionInput.addEventListener("change", () => {
    const newValue = optionInput.value.trim();
    if (newValue && newValue !== option) {
      state.currentOptions[index] = newValue;
      updateSchema();
    }
  });

  // Remove button
  const removeButton = document.createElement("button");
  removeButton.textContent = "×";
  removeButton.type = "button";
  removeButton.setAttribute('aria-label', `Remove option: ${option}`);
  applyStylesToElement(removeButton, {
    ...styles.button,
    width: "24px",
    height: "24px",
    backgroundColor: "#dc3545",
    color: "white",
    fontSize: "16px",
    lineHeight: "1",
  });

  removeButton.addEventListener("click", () => {
    if (confirm(`Remove option "${option}"?`)) {
      state.currentOptions.splice(index, 1);
      updateSchema();
    }
  });

  li.appendChild(optionInput);
  li.appendChild(removeButton);

  return li;
}

/**
 * Displays validation errors to the user
 */
function displayValidationErrors(errors: string[]): void {
  if (errors.length > 0) {
    const errorMessage = `Options validation failed:\n${errors.join('\n')}`;
    alert(errorMessage); // TODO: Replace with better UI feedback
    console.error('Select options validation errors:', errors);
  }
}