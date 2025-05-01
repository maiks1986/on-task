import db from '../database';
import { v4 as uuidv4 } from 'uuid';

// Project interface
export interface Project {
  id: string;
  name: string;
  description: string;
  created_at?: string;
  updated_at?: string;
}

// Get all projects
export async function getAllProjects(): Promise<Project[]> {
  const stmt = db.prepare('SELECT * FROM projects ORDER BY created_at DESC');
  return stmt.all() as Project[];
}

// Get a project by ID
export async function getProject(id: string): Promise<Project | null> {
  const stmt = db.prepare('SELECT * FROM projects WHERE id = ?');
  const result = stmt.get(id);
  return result ? result as Project : null;
}

// Add a new project
export async function addProject(name: string, description: string): Promise<Project> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO projects (id, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, name, description, now, now);
  
  return {
    id,
    name,
    description,
    created_at: now,
    updated_at: now
  };
}

// Update a project
export async function updateProject(id: string, name: string, description: string): Promise<Project | null> {
  const project = await getProject(id);
  
  if (!project) {
    return null;
  }
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE projects
    SET name = ?, description = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(name, description, now, id);
  
  return {
    ...project,
    name,
    description,
    updated_at: now
  };
}

// Delete a project
export async function deleteProject(id: string): Promise<{ success: boolean }> {
  const project = await getProject(id);
  
  if (!project) {
    return { success: false };
  }
  
  const stmt = db.prepare('DELETE FROM projects WHERE id = ?');
  stmt.run(id);
  
  return { success: true };
}

// Clean up completed tasks from a project
export async function cleanupProject(id: string): Promise<{ success: boolean }> {
  const project = await getProject(id);
  
  if (!project) {
    return { success: false };
  }
  
  const stmt = db.prepare('DELETE FROM tasks WHERE project_id = ? AND status = ?');
  stmt.run(id, 'Done');
  
  return { success: true };
}
