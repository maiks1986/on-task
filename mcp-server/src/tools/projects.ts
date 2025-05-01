import { z } from 'zod';
import * as projectModel from '../models/projects-db';
import { createTool } from './tool-factory';

// Project tools
export const projectTools = [
  createTool('ot_add_project', {
    name: z.string(),
    description: z.string()
  }, async ({ name, description }: { name: string, description: string }) => {
    const project = await projectModel.addProject(name, description);
    return {
      content: [{ type: 'text', text: JSON.stringify({ project }) }]
    };
  }),

  createTool('ot_edit_project', {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional()
  }, async ({ id, name, description }: { id: string, name?: string, description?: string }) => {
    const project = await projectModel.updateProject(
      id, 
      name || '', 
      description || ''
    );
    return {
      content: [{ type: 'text', text: JSON.stringify({ project }) }]
    };
  }),

  createTool('ot_get_project', {
    id: z.string()
  }, async ({ id }: { id: string }) => {
    const project = await projectModel.getProject(id);
    return {
      content: [{ type: 'text', text: JSON.stringify({ project }) }]
    };
  }),

  createTool('ot_get_all_projects', {}, async () => {
    const projects = await projectModel.getAllProjects();
    return {
      content: [{ type: 'text', text: JSON.stringify({ projects }) }]
    };
  }),

  createTool('ot_delete_project', {
    id: z.string()
  }, async ({ id }) => {
    return await projectModel.deleteProject(id);
  }),

  createTool('ot_cleanup_project', {
    id: z.string()
  }, async ({ id }) => {
    return await projectModel.cleanupProject(id);
  })
];
