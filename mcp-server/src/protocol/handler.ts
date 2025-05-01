import {
  ProjectAddParams, ProjectEditParams, ProjectGetParams, ProjectGetAllParams, ProjectDeleteParams, ProjectCleanupParams,
  TaskAddParams, TaskEditParams, TaskGetParams, TaskGetAllParams, TaskGetByProjectParams, TaskDeleteParams, TaskDoneParams,
  ContextAddParams, ContextEditParams, ContextGetParams, ContextGetAllParams, ContextGetByTaskParams, ContextDeleteParams,
  ProjectResult, ProjectsResult, TaskResult, TasksResult, ContextResult, ContextsResult, DeleteResult
} from '../types';

import * as projectModel from '../models/projects';
import * as taskModel from '../models/tasks';
import * as contextModel from '../models/contexts';

// JSON-RPC types
export interface JsonRpcRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
  };
}

// MCP Tool handlers
export async function handleMcpRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
  try {
    // Standard JSON-RPC response format
    const response: JsonRpcResponse = {
      jsonrpc: '2.0',
      id: request.id
    };

    // Special case for initialize
    if (request.method === 'initialize') {
      response.result = {
        serverInfo: {
          name: "on-task-mcp-server",
          version: "0.1.0"
        },
        capabilities: {
          tools: {
            all: true
          }
        }
      };
      return response;
    }

    // Special case for tools/list or mcp/listTools
    if (request.method === 'tools/list' || request.method === 'mcp/listTools') {
      response.result = {
        tools: [
          { name: 'ot_add_project', description: 'Add a new project' },
          { name: 'ot_edit_project', description: 'Edit an existing project' },
          { name: 'ot_get_project', description: 'Get a project by ID' },
          { name: 'ot_get_all_projects', description: 'Get all projects' },
          { name: 'ot_delete_project', description: 'Delete a project' },
          { name: 'ot_cleanup_project', description: 'Remove completed tasks from a project' },
          { name: 'ot_add_task', description: 'Add a new task' },
          { name: 'ot_edit_task', description: 'Edit an existing task' },
          { name: 'ot_get_task', description: 'Get a task by ID' },
          { name: 'ot_get_all_tasks', description: 'Get all tasks' },
          { name: 'ot_get_tasks_by_project', description: 'Get tasks by project ID' },
          { name: 'ot_delete_task', description: 'Delete a task' },
          { name: 'ot_mark_task_done', description: 'Mark a task as done' },
          { name: 'ot_add_context', description: 'Add context to a task' },
          { name: 'ot_edit_context', description: 'Edit context' },
          { name: 'ot_get_context', description: 'Get context by ID' },
          { name: 'ot_get_all_contexts', description: 'Get all contexts' },
          { name: 'ot_get_contexts_by_task', description: 'Get contexts by task ID' },
          { name: 'ot_delete_context', description: 'Delete context' }
        ]
      };
      return response;
    }

    // Handle tool calls
    if (request.method === 'mcp/tools') {
      const toolName = request.params?.tool;
      const toolParams = request.params?.params || {};

      switch (toolName) {
        // Project operations
        case 'ot_add_project': {
          const params = toolParams as ProjectAddParams;
          const project = await projectModel.addProject(params.name, params.description);
          response.result = { project };
          break;
        }
        case 'ot_edit_project': {
          const params = toolParams as ProjectEditParams;
          const project = await projectModel.updateProject(params.id, params.name || '', params.description || '');
          if (project) {
            response.result = { project };
          } else {
            response.error = { code: 404, message: 'Project not found' };
          }
          break;
        }
        case 'ot_get_project': {
          const params = toolParams as ProjectGetParams;
          const project = await projectModel.getProject(params.id);
          if (project) {
            response.result = { project };
          } else {
            response.error = { code: 404, message: 'Project not found' };
          }
          break;
        }
        case 'ot_get_all_projects': {
          const projects = await projectModel.getAllProjects();
          response.result = { projects };
          break;
        }
        case 'ot_delete_project': {
          const params = toolParams as ProjectDeleteParams;
          const result = await projectModel.deleteProject(params.id);
          response.result = result;
          break;
        }
        case 'ot_cleanup_project': {
          const params = toolParams as ProjectCleanupParams;
          const result = await projectModel.cleanupProject(params.id);
          response.result = result;
          break;
        }

        // Task operations
        case 'ot_add_task': {
          const params = toolParams as TaskAddParams;
          const task = await taskModel.addTask(
            params.name,
            params.description,
            params.priority as 'Low' | 'Medium' | 'High',
            params.projectId
          );
          response.result = { task };
          break;
        }
        case 'ot_edit_task': {
          const params = toolParams as TaskEditParams;
          const task = await taskModel.updateTask(
            params.id,
            params.name || '',
            params.description || '',
            params.priority as 'Low' | 'Medium' | 'High' || 'Medium',
            params.projectId || null
          );
          if (task) {
            response.result = { task };
          } else {
            response.error = { code: 404, message: 'Task not found' };
          }
          break;
        }
        case 'ot_get_task': {
          const params = toolParams as TaskGetParams;
          const task = await taskModel.getTask(params.id);
          if (task) {
            response.result = { task };
          } else {
            response.error = { code: 404, message: 'Task not found' };
          }
          break;
        }
        case 'ot_get_all_tasks': {
          const tasks = await taskModel.getAllTasks();
          response.result = { tasks };
          break;
        }
        case 'ot_get_tasks_by_project': {
          const params = toolParams as TaskGetByProjectParams;
          const tasks = await taskModel.getTasksByProject(params.projectId);
          response.result = { tasks };
          break;
        }
        case 'ot_delete_task': {
          const params = toolParams as TaskDeleteParams;
          const result = await taskModel.deleteTask(params.id);
          response.result = result;
          break;
        }
        case 'ot_mark_task_done': {
          const params = toolParams as TaskDoneParams;
          const result = await taskModel.markTaskDone(params.id);
          response.result = result;
          break;
        }

        // Context operations
        case 'ot_add_context': {
          const params = toolParams as ContextAddParams;
          const context = await contextModel.addContext(
            params.name,
            params.description,
            params.taskId
          );
          response.result = { context };
          break;
        }
        case 'ot_edit_context': {
          const params = toolParams as ContextEditParams;
          const context = await contextModel.updateContext(
            params.id,
            params.name || '',
            params.description || '',
            params.taskId || null
          );
          if (context) {
            response.result = { context };
          } else {
            response.error = { code: 404, message: 'Context not found' };
          }
          break;
        }
        case 'ot_get_context': {
          const params = toolParams as ContextGetParams;
          const context = await contextModel.getContext(params.id);
          if (context) {
            response.result = { context };
          } else {
            response.error = { code: 404, message: 'Context not found' };
          }
          break;
        }
        case 'ot_get_all_contexts': {
          const contexts = await contextModel.getAllContexts();
          response.result = { contexts };
          break;
        }
        case 'ot_get_contexts_by_task': {
          const params = toolParams as ContextGetByTaskParams;
          const contexts = await contextModel.getContextsByTask(params.taskId);
          response.result = { contexts };
          break;
        }
        case 'ot_delete_context': {
          const params = toolParams as ContextDeleteParams;
          const result = await contextModel.deleteContext(params.id);
          response.result = result;
          break;
        }
        default:
          response.error = { code: 404, message: `Unknown tool: ${toolName}` };
      }

      return response;
    }

    // Unknown method
    response.error = { code: 404, message: `Unknown method: ${request.method}` };
    return response;
  } catch (error: any) {
    console.error('Error handling MCP request:', error);
    return {
      jsonrpc: '2.0',
      id: request.id,
      error: {
        code: 500,
        message: error.message || 'Internal server error'
      }
    };
  }
}
