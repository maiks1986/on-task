import { z } from 'zod';
import * as taskModel from '../models/tasks-db';
import { createTool } from './tool-factory';
import { createRichResponse, createSuccessResponse, createErrorResponse } from '../utils/format-response';

// Task tools
export const taskTools = [
  createTool('ot_add_task', {
    name: z.string(),
    description: z.string(),
    priority: z.enum(["Low", "Medium", "High"]),
    projectId: z.string().nullable()
  }, async ({ name, description, priority, projectId }) => {
    try {
      const task = await taskModel.addTask(name, description, priority, projectId);
      
      // Example usage for the response
      const example = `{
  "name": "Example Task",
  "description": "This is an example task description",
  "priority": "Medium",
  "projectId": "project-id-here"
}`;
      
      return createRichResponse({ task }, 'task', true, example);
    } catch (error) {
      return createErrorResponse('Failed to create task', error);
    }
  }),

  createTool('ot_edit_task', {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
    projectId: z.string().nullable().optional()
  }, async ({ id, name, description, status, priority, projectId }) => {
    try {
      const task = await taskModel.updateTask(
        id,
        name || '',
        description || '',
        status || 'Pending',
        priority || 'Medium',
        projectId
      );
      
      // Example usage for the response
      const example = `{
  "id": "${id}",
  "name": "Updated Task Name",
  "description": "Updated task description",
  "status": "In Progress",
  "priority": "High",
  "projectId": "project-id-here"
}`;
      
      return createRichResponse({ task }, 'task', true, example);
    } catch (error) {
      return createErrorResponse('Failed to update task', error);
    }
  }),

  createTool('ot_get_task', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const task = await taskModel.getTask(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createRichResponse({ task }, 'task', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get task', error);
    }
  }),

  createTool('ot_get_all_tasks', {}, async () => {
    try {
      const tasks = await taskModel.getAllTasks();
      
      // Example usage for the response
      const example = `{}`;
      
      return createRichResponse({ tasks }, 'tasks', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get tasks', error);
    }
  }),

  createTool('ot_get_tasks_by_project', {
    projectId: z.string()
  }, async ({ projectId }) => {
    try {
      const tasks = await taskModel.getTasksByProject(projectId);
      
      // Example usage for the response
      const example = `{
  "projectId": "${projectId}"
}`;
      
      return createRichResponse({ tasks }, 'tasks', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get tasks for project', error);
    }
  }),

  createTool('ot_delete_task', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const result = await taskModel.deleteTask(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createSuccessResponse(`Successfully deleted task with ID: ${id}`, result);
    } catch (error) {
      return createErrorResponse('Failed to delete task', error);
    }
  }),

  createTool('ot_mark_task_done', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const result = await taskModel.markTaskDone(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createSuccessResponse(`Successfully marked task with ID: ${id} as done`, result);
    } catch (error) {
      return createErrorResponse('Failed to mark task as done', error);
    }
  })
];
