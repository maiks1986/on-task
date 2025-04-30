import * as vscode from 'vscode';

/**
 * Format a date string for display
 * @param dateString Date string to format
 * @returns Formatted date string
 */
export function formatDate(dateString: string): string {
  if (!dateString) {
    return '';
  }
  
  const date = new Date(dateString);
  return date.toLocaleString();
}

/**
 * Show an error message and log to console
 * @param message Error message to display
 * @param error Error object
 */
export function showError(message: string, error?: any): void {
  console.error(message, error);
  vscode.window.showErrorMessage(message);
}

/**
 * Validate if a string is not empty
 * @param value String to validate
 * @param fieldName Name of the field for error message
 * @returns True if valid, false otherwise
 */
export function validateRequired(value: string | undefined, fieldName: string): boolean {
  if (!value || value.trim() === '') {
    vscode.window.showErrorMessage(`${fieldName} is required.`);
    return false;
  }
  return true;
}

/**
 * Get the extension's configuration
 * @param section Configuration section
 * @returns Configuration value
 */
export function getConfiguration<T>(section: string): T | undefined {
  return vscode.workspace.getConfiguration('on-task').get<T>(section);
}

/**
 * Update the extension's configuration
 * @param section Configuration section
 * @param value New value
 * @param global Whether to update globally
 */
export async function updateConfiguration(section: string, value: any, global = true): Promise<void> {
  await vscode.workspace.getConfiguration('on-task').update(section, value, global);
}

/**
 * Get the current workspace folder path
 * @returns Workspace folder path or undefined
 */
export function getWorkspacePath(): string | undefined {
  const workspaceFolders = vscode.workspace.workspaceFolders;
  if (!workspaceFolders || workspaceFolders.length === 0) {
    return undefined;
  }
  return workspaceFolders[0].uri.fsPath;
}

/**
 * Create a quick pick item from an object
 * @param item Source object
 * @param labelProperty Property to use as label
 * @param descriptionProperty Property to use as description
 * @returns QuickPickItem
 */
export function createQuickPickItem<T>(
  item: T, 
  labelProperty: keyof T, 
  descriptionProperty?: keyof T
): vscode.QuickPickItem & { sourceItem: T } {
  return {
    label: String(item[labelProperty]),
    description: descriptionProperty ? String(item[descriptionProperty]) : '',
    sourceItem: item
  };
}
