import db from '../database';
import { v4 as uuidv4 } from 'uuid';

// Context interface
export interface Context {
  id: string;
  name: string;
  description: string;
  task_id: string | null;
  created_at?: string;
  updated_at?: string;
}

// Get all contexts
export async function getAllContexts(): Promise<Context[]> {
  const stmt = db.prepare('SELECT * FROM contexts ORDER BY created_at DESC');
  return stmt.all();
}

// Get a context by ID
export async function getContext(id: string): Promise<Context | null> {
  const stmt = db.prepare('SELECT * FROM contexts WHERE id = ?');
  return stmt.get(id) || null;
}

// Get contexts by task ID
export async function getContextsByTask(taskId: string): Promise<Context[]> {
  const stmt = db.prepare('SELECT * FROM contexts WHERE task_id = ? ORDER BY created_at DESC');
  return stmt.all(taskId);
}

// Add a new context
export async function addContext(
  name: string,
  description: string,
  taskId: string | null
): Promise<Context> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO contexts (id, name, description, task_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, name, description, taskId, now, now);
  
  return {
    id,
    name,
    description,
    task_id: taskId,
    created_at: now,
    updated_at: now
  };
}

// Update a context
export async function updateContext(
  id: string,
  name: string,
  description: string,
  taskId: string | null
): Promise<Context | null> {
  const context = await getContext(id);
  
  if (!context) {
    return null;
  }
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE contexts
    SET name = ?, description = ?, task_id = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(name, description, taskId, now, id);
  
  return {
    ...context,
    name,
    description,
    task_id: taskId,
    updated_at: now
  };
}

// Delete a context
export async function deleteContext(id: string): Promise<{ success: boolean }> {
  const context = await getContext(id);
  
  if (!context) {
    return { success: false };
  }
  
  const stmt = db.prepare('DELETE FROM contexts WHERE id = ?');
  stmt.run(id);
  
  return { success: true };
}
