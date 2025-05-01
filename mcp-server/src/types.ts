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

export interface ProjectGetParams {
  id: string;
}

export interface ProjectGetAllParams {
  // Optional filter parameters could be added here
}

export interface ProjectDeleteParams {
  id: string;
}

export interface ProjectCleanupParams {
  id: string;
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

export interface TaskGetAllParams {
  // Optional filter parameters could be added here
}

export interface TaskGetByProjectParams {
  projectId: string;
}

export interface TaskDeleteParams {
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

export interface ContextGetAllParams {
  // Optional filter parameters could be added here
}

export interface ContextGetByTaskParams {
  taskId: string;
}

export interface ContextDeleteParams {
  id: string;
}

// Tool results
export interface ProjectResult {
  project: Project;
}

export interface ProjectsResult {
  projects: Project[];
}

export interface TaskResult {
  task: Task;
}

export interface TasksResult {
  tasks: Task[];
}

export interface ContextResult {
  context: Context;
}

export interface ContextsResult {
  contexts: Context[];
}

export interface DeleteResult {
  success: boolean;
  message: string;
}

// MCP request and response
export interface MCPRequest {
  tool: string;
  params: any;
}

export interface MCPResponse {
  result: ProjectResult | ProjectsResult | TaskResult | TasksResult | ContextResult | ContextsResult | DeleteResult;
}
