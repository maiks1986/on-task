import { z } from 'zod';
import * as taskModel from '../models/tasks-db';
import { createTool } from './tool-factory';

// Task tools
export const taskTools = [
  createTool('ot_add_task', {
    name: z.string(),
    description: z.string(),
    priority: z.enum(["Low", "Medium", "High"]),
    projectId: z.string().nullable()
  }, async ({ name, description, priority, projectId }) => {
    const task = await taskModel.addTask(name, description, priority, projectId);
    return { 
      content: [{ type: 'text', text: JSON.stringify({ task }) }]
    };
  }),

  createTool('ot_edit_task', {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    status: z.string().optional(),
    priority: z.enum(["Low", "Medium", "High"]).optional(),
    projectId: z.string().nullable().optional()
  }, async ({ id, name, description, status, priority, projectId }) => {
    const task = await taskModel.updateTask(
      id,
      name || '',
      description || '',
      status || 'Pending',
      priority || 'Medium',
      projectId
    );
    return { 
      content: [{ type: 'text', text: JSON.stringify({ task }) }]
    };
  }),

  createTool('ot_get_task', {
    id: z.string()
  }, async ({ id }) => {
    const task = await taskModel.getTask(id);
    return { 
      content: [{ type: 'text', text: JSON.stringify({ task }) }]
    };
  }),

  createTool('ot_get_all_tasks', {}, async () => {
    const tasks = await taskModel.getAllTasks();
    return { 
      content: [{ type: 'text', text: JSON.stringify({ tasks }) }]
    };
  }),

  createTool('ot_get_tasks_by_project', {
    projectId: z.string()
  }, async ({ projectId }) => {
    const tasks = await taskModel.getTasksByProject(projectId);
    return { 
      content: [{ type: 'text', text: JSON.stringify({ tasks }) }]
    };
  }),

  createTool('ot_delete_task', {
    id: z.string()
  }, async ({ id }) => {
    const result = await taskModel.deleteTask(id);
    return { 
      content: [{ type: 'text', text: JSON.stringify(result) }]
    };
  }),

  createTool('ot_mark_task_done', {
    id: z.string()
  }, async ({ id }) => {
    const result = await taskModel.markTaskDone(id);
    return { 
      content: [{ type: 'text', text: JSON.stringify(result) }]
    };
  })
];
