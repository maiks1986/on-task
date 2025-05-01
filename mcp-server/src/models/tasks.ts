import { v4 as uuidv4 } from 'uuid';
import { Task } from '../types';
import { readTasks, writeTasks, readContexts, writeContexts } from '../data/storage';

// Task operations
export async function getAllTasks(): Promise<Task[]> {
  return readTasks();
}

export async function getTask(id: string): Promise<Task | undefined> {
  const tasks = readTasks();
  return tasks.find(t => t.id === id);
}

export async function getTasksByProject(projectId: string): Promise<Task[]> {
  const tasks = readTasks();
  return tasks.filter(t => t.projectId === projectId);
}

export async function addTask(
  name: string, 
  description: string = '', 
  priority: 'Low' | 'Medium' | 'High' = 'Medium', 
  projectId: string | null = null
): Promise<Task> {
  const tasks = readTasks();
  const task: Task = {
    id: uuidv4(),
    name,
    description,
    status: 'Pending',
    priority,
    projectId,
    createdAt: new Date().toISOString()
  };
  
  tasks.push(task);
  writeTasks(tasks);
  
  return task;
}

export async function updateTask(
  id: string, 
  name: string, 
  description: string, 
  priority: 'Low' | 'Medium' | 'High', 
  projectId: string | null
): Promise<Task | null> {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    return null;
  }
  
  tasks[index].name = name;
  tasks[index].description = description;
  tasks[index].priority = priority;
  tasks[index].projectId = projectId;
  
  writeTasks(tasks);
  
  return tasks[index];
}

export async function deleteTask(id: string): Promise<{ success: boolean, message: string }> {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Task not found' };
  }
  
  // Delete associated contexts
  const contexts = readContexts();
  const updatedContexts = contexts.filter(c => c.taskId !== id);
  writeContexts(updatedContexts);
  
  // Delete the task
  tasks.splice(index, 1);
  writeTasks(tasks);
  
  return { success: true, message: 'Task deleted' };
}

export async function markTaskDone(id: string): Promise<{ success: boolean, message: string }> {
  const tasks = readTasks();
  const index = tasks.findIndex(t => t.id === id);
  
  if (index === -1) {
    return { success: false, message: 'Task not found' };
  }
  
  tasks[index].status = 'Done';
  writeTasks(tasks);
  
  return { success: true, message: 'Task marked as done' };
}
