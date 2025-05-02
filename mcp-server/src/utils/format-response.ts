/**
 * Utility functions for formatting MCP tool responses
 * 
 * This module provides helper functions to create nicely formatted
 * responses for MCP tools, including rich text formatting, examples,
 * and structured data visualization.
 */

/**
 * Format a project object into a nicely structured text representation
 */
export function formatProject(project: any) {
  if (!project) return 'Project not found';
  
  return `
Project: ${project.name}
ID: ${project.id}
Description: ${project.description}
Created: ${new Date(project.created_at).toLocaleString()}
Updated: ${new Date(project.updated_at).toLocaleString()}
  `.trim();
}

/**
 * Format a list of projects into a nicely structured text representation
 */
export function formatProjects(projects: any[]) {
  if (!projects || projects.length === 0) return 'No projects found';
  
  return `
Found ${projects.length} projects:

${projects.map((project, index) => `
${index + 1}. ${project.name} (ID: ${project.id})
   Description: ${project.description}
   Created: ${new Date(project.created_at).toLocaleString()}
`).join('')}
  `.trim();
}

/**
 * Format a task object into a nicely structured text representation
 */
export function formatTask(task: any) {
  if (!task) return 'Task not found';
  
  return `
Task: ${task.name}
ID: ${task.id}
Status: ${task.status}
Priority: ${task.priority}
Description: ${task.description}
Project ID: ${task.project_id}
Created: ${new Date(task.created_at).toLocaleString()}
Updated: ${new Date(task.updated_at).toLocaleString()}
  `.trim();
}

/**
 * Format a list of tasks into a nicely structured text representation
 */
export function formatTasks(tasks: any[]) {
  if (!tasks || tasks.length === 0) return 'No tasks found';
  
  return `
Found ${tasks.length} tasks:

${tasks.map((task, index) => `
${index + 1}. ${task.name} (ID: ${task.id})
   Status: ${task.status}
   Priority: ${task.priority}
   Description: ${task.description}
   Project ID: ${task.project_id}
`).join('')}
  `.trim();
}

/**
 * Format a context object into a nicely structured text representation
 */
export function formatContext(context: any) {
  if (!context) return 'Context not found';
  
  return `
Context: ${context.name}
ID: ${context.id}
Task ID: ${context.task_id}
Description: ${context.description}
Created: ${new Date(context.created_at).toLocaleString()}
Updated: ${new Date(context.updated_at).toLocaleString()}
  `.trim();
}

/**
 * Format a list of contexts into a nicely structured text representation
 */
export function formatContexts(contexts: any[]) {
  if (!contexts || contexts.length === 0) return 'No contexts found';
  
  return `
Found ${contexts.length} contexts:

${contexts.map((context, index) => `
${index + 1}. ${context.name} (ID: ${context.id})
   Task ID: ${context.task_id}
   Description: ${context.description}
`).join('')}
  `.trim();
}

/**
 * Create a rich MCP response with formatted text and optional example
 */
export function createRichResponse(data: any, type: 'project' | 'projects' | 'task' | 'tasks' | 'context' | 'contexts', includeRaw = true, example?: string) {
  // Format the data based on the type
  let formattedText = '';
  
  switch (type) {
    case 'project':
      formattedText = formatProject(data.project);
      break;
    case 'projects':
      formattedText = formatProjects(data.projects);
      break;
    case 'task':
      formattedText = formatTask(data.task);
      break;
    case 'tasks':
      formattedText = formatTasks(data.tasks);
      break;
    case 'context':
      formattedText = formatContext(data.context);
      break;
    case 'contexts':
      formattedText = formatContexts(data.contexts);
      break;
    default:
      formattedText = JSON.stringify(data, null, 2);
  }
  
  // Create the content array
  const content: any[] = [
    { type: 'text', text: formattedText }
  ];
  
  // Add example if provided
  if (example) {
    content.push({ 
      type: 'text', 
      text: `\n\nExample usage:\n\`\`\`json\n${example}\n\`\`\`` 
    });
  }
  
  // Add raw data if requested
  if (includeRaw) {
    content.push({ 
      type: 'resource', 
      resource: {
        uri: `resource://ontask/${type}/data`,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }
    });
  }
  
  return {
    content,
    isError: false
  };
}

/**
 * Create a success response
 */
export function createSuccessResponse(message: string, data?: any) {
  const content: any[] = [
    { type: 'text', text: message }
  ];
  
  if (data) {
    content.push({ 
      type: 'resource', 
      resource: {
        uri: `resource://ontask/success/data`,
        mimeType: 'application/json',
        text: JSON.stringify(data, null, 2)
      }
    });
  }
  
  return {
    content,
    isError: false
  };
}

/**
 * Create an error response
 */
export function createErrorResponse(message: string, error?: any) {
  const content: any[] = [
    { type: 'text', text: `Error: ${message}` }
  ];
  
  if (error) {
    content.push({ 
      type: 'resource', 
      resource: {
        uri: `resource://ontask/error/details`,
        mimeType: 'application/json',
        text: JSON.stringify(error, null, 2)
      }
    });
  }
  
  return {
    content,
    isError: true
  };
}
