import { z } from 'zod';
import * as contextModel from '../models/contexts-db';
import { createTool } from './tool-factory';

// Context tools
export const contextTools = [
  createTool('ot_add_context', {
    name: z.string(),
    description: z.string(),
    taskId: z.string().nullable()
  }, async ({ name, description, taskId }) => {
    const context = await contextModel.addContext(name, description, taskId);
    return { 
      content: [{ type: 'text', text: JSON.stringify({ context }) }]
    };
  }),

  createTool('ot_edit_context', {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional(),
    taskId: z.string().nullable().optional()
  }, async ({ id, name, description, taskId }) => {
    const context = await contextModel.updateContext(
      id,
      name || '',
      description || '',
      taskId
    );
    return { 
      content: [{ type: 'text', text: JSON.stringify({ context }) }]
    };
  }),

  createTool('ot_get_context', {
    id: z.string()
  }, async ({ id }) => {
    const context = await contextModel.getContext(id);
    return { 
      content: [{ type: 'text', text: JSON.stringify({ context }) }]
    };
  }),

  createTool('ot_get_all_contexts', {}, async () => {
    const contexts = await contextModel.getAllContexts();
    return { 
      content: [{ type: 'text', text: JSON.stringify({ contexts }) }]
    };
  }),

  createTool('ot_get_contexts_by_task', {
    taskId: z.string()
  }, async ({ taskId }) => {
    const contexts = await contextModel.getContextsByTask(taskId);
    return { 
      content: [{ type: 'text', text: JSON.stringify({ contexts }) }]
    };
  }),

  createTool('ot_delete_context', {
    id: z.string()
  }, async ({ id }) => {
    const result = await contextModel.deleteContext(id);
    return { 
      content: [{ type: 'text', text: JSON.stringify(result) }]
    };
  })
];
