import { RadioButtonState } from "./types";

/**
 * Global EventTarget instance for inter-radio communication
 * This acts as an event bus allowing radio buttons in the same group
 * to communicate with each other across independent schema instances
 */
export const eventEmitter = new EventTarget();

/**
 * Global state storage for all radio button instances
 * Key: schema.name (unique identifier for each radio button)
 * Value: RadioButtonState containing current value and onChange callback
 */
export const radioButtonStates = new Map<string, RadioButtonState>();

/**
 * Global storage for event listeners to prevent memory leaks
 * Key: schema.name 
 * Value: The event listener function for cleanup purposes
 */
export const eventListeners = new Map<string, EventListener>();

/**
 * Creates an event handler for radio group communication
 * This handler listens for events from other radio buttons in the same group
 * and automatically deselects the current button if another one is selected
 * 
 * @param schemaName - The unique name of the current radio button schema
 * @returns Event handler function for group communication
 */
export const createGroupEventHandler = (schemaName: string): EventListener => {
  return (event: Event) => {
    const customEvent = event as CustomEvent<string>;
    const selectedSchemaName = customEvent.detail;
    
    // If another radio button in the group was selected
    if (selectedSchemaName !== schemaName) {
      const radioButtonState = radioButtonStates.get(schemaName);
      if (!radioButtonState) return;
      
      // If this radio button is currently selected, deselect it
      if (radioButtonState.value === "true") {
        radioButtonState.onChange({ key: "content", value: "false" });
      }
    }
  };
};

/**
 * Registers a radio button with the global state management system
 * Handles cleanup of existing listeners to prevent memory leaks
 * 
 * @param schemaName - Unique identifier for the radio button
 * @param groupName - Group name for radio button communication
 * @param state - Current state and onChange callback
 */
export const registerRadioButton = (
  schemaName: string,
  groupName: string,
  state: RadioButtonState
): void => {
  // Store the current state
  radioButtonStates.set(schemaName, state);
  
  // Clean up any existing event listener to prevent memory leaks
  const oldListener = eventListeners.get(schemaName);
  if (oldListener) {
    eventEmitter.removeEventListener(`group-${groupName}`, oldListener);
  }
  
  // Create and register new event listener
  const handleGroupEvent = createGroupEventHandler(schemaName);
  eventListeners.set(schemaName, handleGroupEvent);
  eventEmitter.addEventListener(`group-${groupName}`, handleGroupEvent);
};

/**
 * Handles radio button selection logic
 * Only allows selection if the button is not already selected
 * Dispatches event to notify other buttons in the group
 * 
 * @param schemaName - Unique identifier for the radio button
 * @param groupName - Group name for event broadcasting  
 * @param currentValue - Current value of the radio button
 * @param onChange - Callback to update the radio button state
 */
export const handleRadioSelection = (
  schemaName: string,
  groupName: string,
  currentValue: string,
  onChange: (arg: { key: string; value: string }) => void
): void => {
  // Only allow selection if not already selected
  if (currentValue !== "true") {
    // Update the current radio button to selected
    onChange({ key: "content", value: "true" });
    
    // Update the global state
    radioButtonStates.set(schemaName, { value: "true", onChange });
    
    // Notify other radio buttons in the same group
    eventEmitter.dispatchEvent(
      new CustomEvent(`group-${groupName}`, { detail: schemaName })
    );
  }
};

/**
 * Cleanup function to remove radio button from global state
 * Should be called when a radio button component is unmounted
 * 
 * @param schemaName - Unique identifier for the radio button
 * @param groupName - Group name for event cleanup
 */
export const unregisterRadioButton = (
  schemaName: string,
  groupName: string
): void => {
  // Remove from state storage
  radioButtonStates.delete(schemaName);
  
  // Remove event listener
  const listener = eventListeners.get(schemaName);
  if (listener) {
    eventEmitter.removeEventListener(`group-${groupName}`, listener);
    eventListeners.delete(schemaName);
  }
};