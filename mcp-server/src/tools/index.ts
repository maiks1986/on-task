import { projectTools } from './projects';
import { taskTools } from './tasks';
import { contextTools } from './contexts';

// Export all tools
export const allTools = [
  ...projectTools,
  ...taskTools,
  ...contextTools
];
