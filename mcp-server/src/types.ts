// Type definitions for the MCP server

export interface Project {
  id: string;
  name: string;
  description: string;
  status: 'Active' | 'Completed';
  createdAt: string;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  status: 'Pending' | 'In Progress' | 'Done';
  priority: 'Low' | 'Medium' | 'High';
  projectId: string | null;
  createdAt: string;
}

export interface Context {
  id: string;
  name: string;
  description: string;
  taskId: string | null;
  createdAt: string;
}

// Tool parameters
export interface ProjectAddParams {
  name: string;
  description?: string;
}

export interface ProjectEditParams {
  id: string;
  name?: string;
  description?: string;
}

export interface TaskAddParams {
  name: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  projectId?: string;
}

export interface TaskEditParams {
  id: string;
  name?: string;
  description?: string;
  priority?: 'Low' | 'Medium' | 'High';
  projectId?: string | null;
}

export interface TaskGetParams {
  id: string;
}

export interface TaskDoneParams {
  id: string;
}

export interface ContextAddParams {
  name: string;
  description?: string;
  taskId?: string;
}

export interface ContextEditParams {
  id: string;
  name?: string;
  description?: string;
  taskId?: string | null;
}

export interface ContextGetParams {
  id: string;
}

// Tool results
export interface ProjectResult {
  project: Project;
}

export interface TaskResult {
  task: Task;
}

export interface ContextResult {
  context: Context;
}

// MCP request and response
export interface MCPRequest {
  tool: string;
  params: any;
}

export interface MCPResponse {
  result: ProjectResult | TaskResult | ContextResult;
}
