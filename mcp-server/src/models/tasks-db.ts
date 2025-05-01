import db from '../database';
import { v4 as uuidv4 } from 'uuid';

// Task interface
export interface Task {
  id: string;
  name: string;
  description: string;
  status: string;
  priority: string;
  project_id: string | null;
  created_at?: string;
  updated_at?: string;
}

// Get all tasks
export async function getAllTasks(): Promise<Task[]> {
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
  return stmt.all();
}

// Get a task by ID
export async function getTask(id: string): Promise<Task | null> {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  return stmt.get(id) || null;
}

// Get tasks by project ID
export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const stmt = db.prepare('SELECT * FROM tasks WHERE project_id = ? ORDER BY created_at DESC');
  return stmt.all(projectId);
}

// Add a new task
export async function addTask(
  name: string,
  description: string,
  priority: string,
  projectId: string | null
): Promise<Task> {
  const id = uuidv4();
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    INSERT INTO tasks (id, name, description, status, priority, project_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  stmt.run(id, name, description, 'Pending', priority, projectId, now, now);
  
  return {
    id,
    name,
    description,
    status: 'Pending',
    priority,
    project_id: projectId,
    created_at: now,
    updated_at: now
  };
}

// Update a task
export async function updateTask(
  id: string,
  name: string,
  description: string,
  status: string,
  priority: string,
  projectId: string | null
): Promise<Task | null> {
  const task = await getTask(id);
  
  if (!task) {
    return null;
  }
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE tasks
    SET name = ?, description = ?, status = ?, priority = ?, project_id = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run(name, description, status, priority, projectId, now, id);
  
  return {
    ...task,
    name,
    description,
    status,
    priority,
    project_id: projectId,
    updated_at: now
  };
}

// Delete a task
export async function deleteTask(id: string): Promise<{ success: boolean }> {
  const task = await getTask(id);
  
  if (!task) {
    return { success: false };
  }
  
  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
  
  return { success: true };
}

// Mark a task as done
export async function markTaskDone(id: string): Promise<{ success: boolean }> {
  const task = await getTask(id);
  
  if (!task) {
    return { success: false };
  }
  
  const now = new Date().toISOString();
  
  const stmt = db.prepare(`
    UPDATE tasks
    SET status = ?, updated_at = ?
    WHERE id = ?
  `);
  
  stmt.run('Done', now, id);
  
  return { success: true };
}
