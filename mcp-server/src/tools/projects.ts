import { z } from 'zod';
import * as projectModel from '../models/projects-db';
import { createTool } from './tool-factory';
import { createRichResponse, createSuccessResponse, createErrorResponse } from '../utils/format-response';

// Project tools
export const projectTools = [
  createTool('ot_add_project', {
    name: z.string(),
    description: z.string()
  }, async ({ name, description }: { name: string, description: string }) => {
    try {
      const project = await projectModel.addProject(name, description);
      
      // Example usage for the response
      const example = `{
  "name": "Example Project",
  "description": "This is an example project description"
}`;
      
      return createRichResponse({ project }, 'project', true, example);
    } catch (error) {
      return createErrorResponse('Failed to create project', error);
    }
  }),

  createTool('ot_edit_project', {
    id: z.string(),
    name: z.string().optional(),
    description: z.string().optional()
  }, async ({ id, name, description }: { id: string, name?: string, description?: string }) => {
    try {
      const project = await projectModel.updateProject(
        id, 
        name || '', 
        description || ''
      );
      
      // Example usage for the response
      const example = `{
  "id": "${id}",
  "name": "Updated Project Name",
  "description": "Updated project description"
}`;
      
      return createRichResponse({ project }, 'project', true, example);
    } catch (error) {
      return createErrorResponse('Failed to update project', error);
    }
  }),

  createTool('ot_get_project', {
    id: z.string()
  }, async ({ id }: { id: string }) => {
    try {
      const project = await projectModel.getProject(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createRichResponse({ project }, 'project', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get project', error);
    }
  }),

  createTool('ot_get_all_projects', {}, async () => {
    try {
      const projects = await projectModel.getAllProjects();
      
      // Example usage for the response
      const example = `{}`;
      
      return createRichResponse({ projects }, 'projects', true, example);
    } catch (error) {
      return createErrorResponse('Failed to get projects', error);
    }
  }),

  createTool('ot_delete_project', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const result = await projectModel.deleteProject(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createSuccessResponse(`Successfully deleted project with ID: ${id}`, result);
    } catch (error) {
      return createErrorResponse('Failed to delete project', error);
    }
  }),

  createTool('ot_cleanup_project', {
    id: z.string()
  }, async ({ id }) => {
    try {
      const result = await projectModel.cleanupProject(id);
      
      // Example usage for the response
      const example = `{
  "id": "${id}"
}`;
      
      return createSuccessResponse(`Successfully cleaned up project with ID: ${id}`, result);
    } catch (error) {
      return createErrorResponse('Failed to clean up project', error);
    }
  })
];
