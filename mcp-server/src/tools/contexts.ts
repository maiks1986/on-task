import { z } from 'zod';
import * as contextModel from '../models/contexts-db';
import { createTool } from './tool-factory';
import { createRichResponse, createSuccessResponse, createErrorResponse } from '../utils/format-response';

// Context tools
export const contextTools = [
  createTool('ot_add_context', {
    name: z.string(),
    description: z.string(),
    taskId: z.string().nullable()
  }, async ({ name, description, taskId }) => {
    try {
      const context = await contextModel.addContext(name, description, taskId);
      
      // Example usage for the response
      const example = `{
  "name": "Example Context",
  "description": "This is an example context description",
  "taskId": "task-id-here"
}`;
      
      return createRichResponse({ context }, 'context', true, example);
    } catch (error) {
      return createErrorResponse('Failed to create context', error);
    }
  }),

  createTool('ot_edit_context', {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    taskId: z.string().nullable().optional()
  }, async ({ id, name, description, taskId }) => {
    try {
      const context = await contextModel.updateContext(
        id,
        name || '',
        description || '',
        taskId
      );
      
      // Example usage for the response
      const example = `{
  "id": "${id}",
  "name": "Updated Context Name",
  "description": "Updated context description",
  "taskId": "task-id-here"
}`;
      
      return createRichResponse({ context }, 'context', true, example);
    } catch (error) {
      return createErrorResponse('Failed to update context', error);
    }
  }),

  createTool('ot_get_context', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const context = await contextModel.getContext(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createRichResponse({ context }, 'context', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get context', error);
    }
  }),

  createTool('ot_get_all_contexts', {}, async () => {
    try {
      const contexts = await contextModel.getAllContexts();
      
      // Example usage for the response
      const example = `{}`;
      
      return createRichResponse({ contexts }, 'contexts', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get contexts', error);
    }
  }),

  createTool('ot_get_contexts_by_task', {
    taskId: z.string()
  }, async ({ taskId }) => {
    try {
      const contexts = await contextModel.getContextsByTask(taskId);
      
      // Example usage for the response
      const example = `{
  "taskId": "${taskId}"
}`;
      
      return createRichResponse({ contexts }, 'contexts', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get contexts for task', error);
    }
  }),

  createTool('ot_delete_context', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const result = await contextModel.deleteContext(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createSuccessResponse(`Successfully deleted context with ID: ${id}`, result);
    } catch (error) {
      return createErrorResponse('Failed to delete context', error);
    }
  })
];
